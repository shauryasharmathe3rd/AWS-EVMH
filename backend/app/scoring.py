import os
import yaml
import math
from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from shapely import to_geojson, wkb
from app.models import Ward, Leak, Facility

# Load configuration
CONFIG_PATH = os.environ.get("CONFIG_PATH", "/app/config.yaml")
if not os.path.exists(CONFIG_PATH):
    CONFIG_PATH = "config.yaml"

config_data: Dict[str, Any] = {}
if os.path.exists(CONFIG_PATH):
    with open(CONFIG_PATH, "r") as f:
        config_data = yaml.safe_load(f) or {}

def calculate_priority_score(
    leak_size_lpm: float,
    affected_pop: int,
    vuln_score: float,
    heat_risk_score: float
) -> Dict[str, float]:
    """
    priority = leak_size_lpm * ln(1 + affected_population) * (1 + vulnerability_score) * (1 + heat_risk)
    """
    part_leak = leak_size_lpm
    part_pop = math.log(1.0 + max(0, affected_pop))
    part_vuln = 1.0 + max(0.0, vuln_score)
    part_heat = 1.0 + max(0.0, heat_risk_score)

    total_score = part_leak * part_pop * part_vuln * part_heat

    return {
        "priority_score": round(total_score, 2),
        "leak_size_part": round(part_leak, 2),
        "pop_part": round(part_pop, 2),
        "vuln_part": round(part_vuln, 2),
        "heat_part": round(part_heat, 2),
    }

def simulate_repair_impact(
    leaks: List[Dict[str, Any]],
    repair_crew_hours: float = 4.0
) -> Dict[str, Any]:
    """
    Simulates repair impact:
    Baseline order = reported_at order (oldest first / complaint order)
    Tript-Dhara order = priority_score descending
    Liters lost = sum(leak_size_lpm * 60 * hours_until_fixed)
    Vulnerable protected = served_pop * vuln_score for leaks fixed within 24 hours.
    """
    if not leaks:
        return {
            "repair_crew_hours": repair_crew_hours,
            "baseline_order": [],
            "tript_dhara_order": [],
            "baseline_liters_lost": 0.0,
            "tript_dhara_liters_lost": 0.0,
            "liters_saved": 0.0,
            "baseline_vulnerable_protected": 0,
            "tript_dhara_vulnerable_protected": 0,
            "additional_vulnerable_protected": 0,
        }

    # Top 5 leaks for focus
    top_subset = leaks[:5] if len(leaks) >= 5 else leaks

    # 1. Baseline Order (reported_at ascending)
    baseline_order = sorted(top_subset, key=lambda x: x["reported_at"])
    # 2. Tript-Dhara Order (priority_score descending)
    td_order = sorted(top_subset, key=lambda x: x["priority_score"], reverse=True)

    def evaluate_order(order_list: List[Dict[str, Any]]):
        liters_lost = 0.0
        vuln_protected = 0
        for idx, item in enumerate(order_list):
            hours_until_fixed = (idx + 1) * repair_crew_hours
            rate_per_hour = item["leak_size_lpm"] * 60.0
            liters_lost += rate_per_hour * hours_until_fixed
            if hours_until_fixed <= 24.0:
                vuln_protected += int(item["affected_population"] * item["vulnerability_score"])
        return round(liters_lost, 1), vuln_protected

    base_liters, base_vuln = evaluate_order(baseline_order)
    td_liters, td_vuln = evaluate_order(td_order)

    return {
        "repair_crew_hours": repair_crew_hours,
        "baseline_order": baseline_order,
        "tript_dhara_order": td_order,
        "baseline_liters_lost": base_liters,
        "tript_dhara_liters_lost": td_liters,
        "liters_saved": max(0.0, round(base_liters - td_liters, 1)),
        "baseline_vulnerable_protected": base_vuln,
        "tript_dhara_vulnerable_protected": td_vuln,
        "additional_vulnerable_protected": max(0, td_vuln - base_vuln),
    }
