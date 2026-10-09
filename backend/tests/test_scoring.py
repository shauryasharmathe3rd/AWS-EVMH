import pytest
import math
from app.scoring import calculate_priority_score, simulate_repair_impact

def test_priority_score_hand_calculated():
    # Priority = leak_size_lpm * ln(1 + affected_population) * (1 + vulnerability_score) * (1 + heat_risk)
    leak_size = 40.0
    affected_pop = 1000
    vuln_score = 0.5
    heat_risk = 0.8

    # Hand calculation:
    # ln(1 + 1000) = ln(1001) ≈ 6.908755
    # (1 + 0.5) = 1.5
    # (1 + 0.8) = 1.8
    # Priority = 40.0 * 6.908755 * 1.5 * 1.8 = 40.0 * 6.908755 * 2.7 = 746.15
    result = calculate_priority_score(leak_size, affected_pop, vuln_score, heat_risk)

    expected_score = round(40.0 * math.log(1001) * 1.5 * 1.8, 2)
    assert result["priority_score"] == expected_score
    assert result["leak_size_part"] == 40.0
    assert result["pop_part"] == round(math.log(1001), 2)
    assert result["vuln_part"] == 1.5
    assert result["heat_part"] == 1.8

def test_simulate_repair_impact():
    # Test two leaks:
    # Leak 1: reported early (00:00), size 10 LPM, pop 100, vuln 0.1 (low priority)
    # Leak 2: reported late (02:00), size 200 LPM, pop 5000, vuln 0.9 (high priority)
    leaks = [
        {
            "id": "1",
            "title": "Minor Drip",
            "leak_size_lpm": 10.0,
            "affected_population": 100,
            "priority_score": 50.0,
            "vulnerability_score": 0.1,
            "reported_at": "2026-10-09T00:00:00Z"
        },
        {
            "id": "2",
            "title": "Main Burst",
            "leak_size_lpm": 200.0,
            "affected_population": 5000,
            "priority_score": 5000.0,
            "vulnerability_score": 0.9,
            "reported_at": "2026-10-09T02:00:00Z"
        }
    ]

    sim = simulate_repair_impact(leaks, repair_crew_hours=4.0)

    # In Baseline Order (complaint order):
    # Fix 1: Leak 1 at 4 hours -> Lost = 10 * 60 * 4 = 2,400 L
    # Fix 2: Leak 2 at 8 hours -> Lost = 200 * 60 * 8 = 96,000 L
    # Total Baseline Lost = 98,400 L

    # In Tript-Dhara Order (priority order):
    # Fix 1: Leak 2 at 4 hours -> Lost = 200 * 60 * 4 = 48,000 L
    # Fix 2: Leak 1 at 8 hours -> Lost = 10 * 60 * 8 = 4,800 L
    # Total TD Lost = 52,800 L

    # Liters Saved = 98,400 - 52,800 = 45,600 L
    assert sim["baseline_liters_lost"] == 98400.0
    assert sim["tript_dhara_liters_lost"] == 52800.0
    assert sim["liters_saved"] == 45600.0
    assert sim["liters_saved"] > 0
