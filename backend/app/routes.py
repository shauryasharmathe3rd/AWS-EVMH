import os
import json
import hashlib
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, Response, Request, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from geoalchemy2.functions import ST_AsGeoJSON, ST_X, ST_Y, ST_SetSRID, ST_Point, ST_Contains

from app.database import get_db
from app.config import settings
from app.auth import get_current_principal, Principal
from app.models import (
    DataSource, Ward, Facility, Leak, CitizenReport, WeatherHourly, RiverDischarge, Device
)
from app.schemas import (
    DataStatusResponse, DataSourceOut, MetaResponse, WardGeoJSONCollection, WardGeoJSONFeature,
    FacilityOut, LeakOut, LeakStatusUpdate, CitizenReportCreate, DeviceCreate,
    ImpactSimulationResponse, OperatorBriefingResponse, ProblemDetails
)
from app.scoring import calculate_priority_score, simulate_repair_impact
from app.strands_service import generate_operator_briefing
from app.storage import sanitize_and_save_photo

router = APIRouter(prefix="/api/v1")

# Helper: Generate ETag
def compute_etag(data: Any) -> str:
    serialized = json.dumps(data, default=str, sort_keys=True)
    return hashlib.md5(serialized.encode("utf-8")).hexdigest()

@router.get("/meta", response_model=MetaResponse)
def get_meta(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Returns app metadata, client version requirements, feature flags, and data freshness.
    """
    # Check latest data freshness
    latest_weather = db.query(func.max(WeatherHourly.recorded_at)).scalar()
    latest_leak = db.query(func.max(Leak.updated_at)).scalar()
    latest_source = db.query(func.max(DataSource.last_success)).scalar()

    meta_data = {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "min_client_version": settings.MIN_CLIENT_VERSION,
        "city_name": settings.CITY_NAME,
        "city_center": [settings.CITY_LAT, settings.CITY_LON],
        "supported_languages": ["en", "hi"],
        "feature_flags": {
            "demo_mode": settings.DEMO_MODE,
            "allow_public_status_changes": settings.ALLOW_PUBLIC_STATUS_CHANGES,
            "enable_import_api": settings.ENABLE_IMPORT_API,
            "enable_strands_briefing": settings.ENABLE_STRANDS_BRIEFING,
        },
        "data_freshness": {
            "weather": latest_weather,
            "leaks": latest_leak,
            "data_sources": latest_source,
        }
    }

    etag = compute_etag(meta_data)
    response.headers["ETag"] = f'"{etag}"'
    response.headers["Cache-Control"] = "public, max-age=60"

    if request.headers.get("if-none-match") == f'"{etag}"':
        response.status_code = 304
        return response

    return meta_data

@router.get("/meta/data-status", response_model=DataStatusResponse)
def get_data_status(
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Returns provenance registry and overall real-data coverage metrics.
    """
    sources = db.query(DataSource).all()
    if not sources:
        return {
            "coverage_real_derived_pct": 100.0,
            "data_sources": [],
            "total_sources": 0,
            "active_sources": 0
        }

    real_derived_count = sum(1 for s in sources if s.provenance in ["REAL", "DERIVED"])
    coverage = (real_derived_count / len(sources)) * 100.0 if sources else 0.0

    return {
        "coverage_real_derived_pct": round(coverage, 1),
        "data_sources": sources,
        "total_sources": len(sources),
        "active_sources": sum(1 for s in sources if s.status in ["OK", "HEALTHY", "READY"]),
    }

@router.get("/wards", response_model=WardGeoJSONCollection)
def get_wards(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Returns GeoJSON FeatureCollection of all wards with real heat risk & vulnerability scores.
    """
    wards = db.query(Ward).all()
    features = []

    for w in wards:
        geom_json = json.loads(db.scalar(ST_AsGeoJSON(w.geometry)))
        features.append({
            "type": "Feature",
            "id": w.id,
            "geometry": geom_json,
            "properties": {
                "id": w.id,
                "ward_number": w.ward_number,
                "ward_name": w.ward_name,
                "population": w.population,
                "area_sqkm": round(w.area_sqkm, 2),
                "vulnerability_score": round(w.vulnerability_score, 2),
                "heat_risk_score": round(w.heat_risk_score, 2),
                "heat_risk_class": w.heat_risk_class,
                "data_origin": w.data_origin,
            }
        })

    result = {"type": "FeatureCollection", "features": features}
    etag = compute_etag(result)
    response.headers["ETag"] = f'"{etag}"'
    response.headers["Cache-Control"] = "public, max-age=300"

    if request.headers.get("if-none-match") == f'"{etag}"':
        response.status_code = 304
        return response

    return result

@router.get("/facilities", response_model=List[FacilityOut])
def get_facilities(
    ward_id: Optional[int] = Query(None),
    facility_type: Optional[str] = Query(None),
    limit: int = Query(200, le=500),
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Returns real critical facilities (hospitals, schools, care homes, water points).
    """
    query = db.query(
        Facility.id, Facility.name, Facility.facility_type,
        ST_Y(Facility.location).label("lat"),
        ST_X(Facility.location).label("lon"),
        Facility.ward_id, Facility.capacity, Facility.data_origin
    )
    if ward_id:
        query = query.filter(Facility.ward_id == ward_id)
    if facility_type:
        query = query.filter(Facility.facility_type == facility_type)

    results = query.limit(limit).all()
    return [
        FacilityOut(
            id=r.id,
            name=r.name,
            facility_type=r.facility_type,
            lat=round(r.lat, 6),
            lon=round(r.lon, 6),
            ward_id=r.ward_id,
            capacity=r.capacity,
            data_origin=r.data_origin
        )
        for r in results
    ]

@router.get("/leaks", response_model=List[LeakOut])
def get_leaks(
    status: Optional[str] = Query(None),
    ward_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Returns priority-ranked leak incidents.
    """
    query = db.query(
        Leak,
        ST_Y(Leak.location).label("lat"),
        ST_X(Leak.location).label("lon"),
        Ward.ward_name.label("ward_name")
    ).outerjoin(Ward, Leak.ward_id == Ward.id)

    if status:
        query = query.filter(Leak.status == status)
    if ward_id:
        query = query.filter(Leak.ward_id == ward_id)

    query = query.order_by(desc(Leak.priority_score)).offset(offset).limit(limit)
    rows = query.all()

    out = []
    for leak, lat, lon, ward_name in rows:
        out.append(LeakOut(
            id=leak.id,
            title=leak.title,
            description=leak.description,
            lat=round(lat, 6),
            lon=round(lon, 6),
            ward_id=leak.ward_id,
            ward_name=ward_name,
            leak_size_lpm=leak.leak_size_lpm,
            size_class=leak.size_class,
            status=leak.status,
            reported_at=leak.reported_at,
            repaired_at=leak.repaired_at,
            affected_population=leak.affected_population,
            priority_score=leak.priority_score,
            score_breakdown={
                "leak_size_part": leak.score_leak_size_part,
                "pop_part": leak.score_pop_part,
                "vuln_part": leak.score_vuln_part,
                "heat_part": leak.score_heat_part
            },
            data_origin=leak.data_origin,
            source_ref=leak.source_ref,
            photo_url=leak.photo_url
        ))
    return out

@router.patch("/leaks/{leak_id}", response_model=LeakOut)
def update_leak_status(
    leak_id: UUID,
    update: LeakStatusUpdate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Updates leak status (e.g. open -> assigned -> repaired).
    Allowed in demo mode or for authenticated staff.
    """
    if not settings.ALLOW_PUBLIC_STATUS_CHANGES and not principal.is_authenticated:
        raise HTTPException(status_code=403, detail="Public status changes are disabled.")

    leak = db.query(Leak).filter(Leak.id == leak_id).first()
    if not leak:
        raise HTTPException(status_code=404, detail="Leak incident not found.")

    valid_statuses = ["open", "assigned", "investigating", "repaired", "dismissed"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    leak.status = update.status
    if update.status == "repaired":
        leak.repaired_at = datetime.now(timezone.utc)
    leak.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(leak)

    lat = db.scalar(ST_Y(leak.location))
    lon = db.scalar(ST_X(leak.location))
    ward = db.query(Ward).filter(Ward.id == leak.ward_id).first() if leak.ward_id else None

    return LeakOut(
        id=leak.id,
        title=leak.title,
        description=leak.description,
        lat=round(lat, 6),
        lon=round(lon, 6),
        ward_id=leak.ward_id,
        ward_name=ward.ward_name if ward else None,
        leak_size_lpm=leak.leak_size_lpm,
        size_class=leak.size_class,
        status=leak.status,
        reported_at=leak.reported_at,
        repaired_at=leak.repaired_at,
        affected_population=leak.affected_population,
        priority_score=leak.priority_score,
        score_breakdown={
            "leak_size_part": leak.score_leak_size_part,
            "pop_part": leak.score_pop_part,
            "vuln_part": leak.score_vuln_part,
            "heat_part": leak.score_heat_part
        },
        data_origin=leak.data_origin,
        source_ref=leak.source_ref,
        photo_url=leak.photo_url
    )

@router.post("/reports", status_code=201)
def create_citizen_report(
    lat: float = Form(...),
    lon: float = Form(...),
    size_class: str = Form("steady"),
    description: Optional[str] = Form(None),
    device_id: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Anonymous citizen leak report with Idempotency-Key handling and photo stripping.
    Creates both a citizen report and a high-priority REAL leak record.
    """
    if idempotency_key:
        existing = db.query(CitizenReport).filter(CitizenReport.idempotency_key == idempotency_key).first()
        if existing:
            return {"status": "success", "report_id": str(existing.id), "note": "idempotent_duplicate"}

    # Handle photo upload
    photo_url = None
    if photo:
        photo_url = sanitize_and_save_photo(photo, settings.PHOTOS_DIR, settings.PHOTO_MAX_MB)

    point_geom = ST_SetSRID(ST_Point(lon, lat), 4326)

    # Find containing ward
    ward = db.query(Ward).filter(ST_Contains(Ward.geometry, point_geom)).first()
    ward_id = ward.id if ward else None
    ward_name = ward.ward_name if ward else "City Sector"

    # Save citizen report
    report = CitizenReport(
        idempotency_key=idempotency_key,
        location=point_geom,
        size_class=size_class,
        description=description,
        photo_path=photo_url,
        device_id=device_id,
        ward_id=ward_id
    )
    db.add(report)
    db.flush()

    # Map size to LPM
    size_lpm_map = {"drip": 5.0, "steady": 40.0, "burst": 250.0}
    leak_lpm = size_lpm_map.get(size_class, 40.0)

    # Calculate scoring metrics
    affected_pop = int((ward.population if ward else 5000) * 0.15)
    vuln_score = ward.vulnerability_score if ward else 0.5
    heat_score = ward.heat_risk_score if ward else 0.5

    scoring = calculate_priority_score(leak_lpm, affected_pop, vuln_score, heat_score)

    # Insert REAL leak entry
    leak_entry = Leak(
        title=f"Citizen Report: {size_class.capitalize()} Leak in {ward_name}",
        description=description or f"Reported by citizen near ({round(lat, 4)}, {round(lon, 4)})",
        location=point_geom,
        ward_id=ward_id,
        leak_size_lpm=leak_lpm,
        size_class=size_class,
        status="open",
        affected_population=affected_pop,
        priority_score=scoring["priority_score"],
        score_leak_size_part=scoring["leak_size_part"],
        score_pop_part=scoring["pop_part"],
        score_vuln_part=scoring["vuln_part"],
        score_heat_part=scoring["heat_part"],
        data_origin="REAL",
        source_ref=f"citizen:{report.id}",
        photo_url=photo_url
    )
    db.add(leak_entry)
    db.commit()

    return {
        "status": "success",
        "report_id": str(report.id),
        "leak_id": str(leak_entry.id),
        "priority_score": scoring["priority_score"],
        "data_origin": "REAL"
    }

@router.get("/impact/simulate", response_model=ImpactSimulationResponse)
def simulate_impact(
    repair_crew_hours: float = Query(4.0, ge=1.0, le=24.0),
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Computes Before/After impact comparison:
    Baseline order (complaint timestamp) vs Tript-Dhara priority order.
    """
    leaks = db.query(
        Leak.id, Leak.title, Leak.leak_size_lpm, Leak.affected_population,
        Leak.priority_score, Leak.reported_at, Ward.vulnerability_score,
        Ward.ward_name
    ).outerjoin(Ward, Leak.ward_id == Ward.id).filter(Leak.status.in_(["open", "assigned"])).all()

    leak_dicts = []
    for l in leaks:
        leak_dicts.append({
            "id": str(l.id),
            "title": l.title,
            "ward_name": l.ward_name or "General Ward",
            "leak_size_lpm": l.leak_size_lpm,
            "affected_population": l.affected_population,
            "priority_score": l.priority_score,
            "vulnerability_score": l.vulnerability_score or 0.3,
            "reported_at": l.reported_at.isoformat(),
        })

    return simulate_repair_impact(leak_dicts, repair_crew_hours)

@router.get("/briefing", response_model=OperatorBriefingResponse)
def get_briefing(
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Returns AI operator briefing generated with AWS open-source Strands Agents SDK
    or resilient multilingual fallback.
    """
    top_leaks_query = db.query(
        Leak.title, Leak.leak_size_lpm, Leak.affected_population,
        Leak.priority_score, Ward.ward_name, Ward.heat_risk_class
    ).outerjoin(Ward, Leak.ward_id == Ward.id).filter(Leak.status.in_(["open", "assigned"])).order_by(desc(Leak.priority_score)).limit(3).all()

    leaks_list = [
        {
            "title": l.title,
            "leak_size_lpm": l.leak_size_lpm,
            "affected_population": l.affected_population,
            "priority_score": l.priority_score,
            "ward_name": l.ward_name or "Central Sector",
        }
        for l in top_leaks_query
    ]

    city_heat_class = top_leaks_query[0].heat_risk_class if top_leaks_query else "Moderate"
    return generate_operator_briefing(leaks_list, city_heat_class)

@router.get("/conditions")
def get_conditions(
    ward_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Returns real conditions: live weather, 48h forecast, and river/flood outlook per ward.
    """
    weather_query = db.query(WeatherHourly).order_by(WeatherHourly.recorded_at.asc())
    if ward_id:
        weather_query = weather_query.filter(WeatherHourly.ward_id == ward_id)

    weather_records = weather_query.limit(48).all()
    discharge_records = db.query(RiverDischarge).order_by(desc(RiverDischarge.recorded_at)).limit(10).all()

    return {
        "weather_hourly": [
            {
                "time": w.recorded_at.isoformat(),
                "temperature_c": w.temperature_c,
                "apparent_temperature_c": w.apparent_temperature_c,
                "relative_humidity_pct": w.relative_humidity_pct,
                "precipitation_mm": w.precipitation_mm,
                "soil_moisture_m3m3": w.soil_moisture_m3m3,
                "evapotranspiration_mm": w.evapotranspiration_mm,
                "is_forecast": w.is_forecast,
                "data_origin": w.data_origin,
            }
            for w in weather_records
        ],
        "river_discharge": [
            {
                "river_name": r.river_name,
                "discharge_m3s": r.discharge_m3s,
                "threshold_m3s": r.discharge_threshold_m3s,
                "flood_risk_level": r.flood_risk_level,
                "recorded_at": r.recorded_at.isoformat(),
                "data_origin": r.data_origin,
            }
            for r in discharge_records
        ],
    }

@router.post("/devices", status_code=201)
def register_device(
    device: DeviceCreate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Anonymous device registration for future mobile push notifications.
    """
    existing = db.query(Device).filter(Device.device_token == device.device_token).first()
    if existing:
        existing.ward_id = device.ward_id
        existing.language = device.language
        existing.platform = device.platform
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        return {"status": "updated", "device_id": existing.id}

    new_device = Device(
        device_token=device.device_token,
        platform=device.platform,
        ward_id=device.ward_id,
        language=device.language
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    return {"status": "registered", "device_id": new_device.id}

@router.post("/demo/reset")
def reset_demo_state(
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal)
):
    """
    Resets leaks and simulation to repeatable demo state.
    """
    if not settings.DEMO_MODE:
        raise HTTPException(status_code=403, detail="Reset is only available when DEMO_MODE=true.")

    # Re-open any repaired demo leaks
    db.query(Leak).update({"status": "open", "repaired_at": None})
    db.commit()

    return {"status": "demo_reset_complete", "message": "Demo state reset successfully."}
