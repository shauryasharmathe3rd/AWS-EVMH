from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class ProblemDetails(BaseModel):
    type: str = "about:blank"
    title: str
    status: int
    detail: Optional[str] = None
    instance: Optional[str] = None

class DataSourceOut(BaseModel):
    id: int
    name: str
    url: Optional[str]
    license: Optional[str]
    provenance: str
    last_success: Optional[datetime]
    last_error: Optional[datetime]
    status: str
    record_count: int
    attribution: Optional[str]
    notes: Optional[str]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class DataStatusResponse(BaseModel):
    coverage_real_derived_pct: float
    data_sources: List[DataSourceOut]
    total_sources: int
    active_sources: int

class MetaResponse(BaseModel):
    app_name: str
    version: str
    min_client_version: str
    city_name: str
    city_center: List[float]
    supported_languages: List[str]
    feature_flags: Dict[str, bool]
    data_freshness: Dict[str, Optional[datetime]]

class WardGeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: int
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class WardGeoJSONCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[WardGeoJSONFeature]

class FacilityOut(BaseModel):
    id: int
    name: str
    facility_type: str
    lat: float
    lon: float
    ward_id: Optional[int]
    capacity: Optional[int]
    data_origin: str

class LeakOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    lat: float
    lon: float
    ward_id: Optional[int]
    ward_name: Optional[str] = None
    leak_size_lpm: float
    size_class: str
    status: str
    reported_at: datetime
    repaired_at: Optional[datetime]
    affected_population: int
    priority_score: float
    score_breakdown: Dict[str, float]
    data_origin: str
    source_ref: Optional[str]
    photo_url: Optional[str]

class LeakStatusUpdate(BaseModel):
    status: str

class CitizenReportCreate(BaseModel):
    lat: float
    lon: float
    size_class: str = "steady"
    description: Optional[str] = None
    device_id: Optional[str] = None

class DeviceCreate(BaseModel):
    device_token: str
    platform: str
    ward_id: Optional[int] = None
    language: Optional[str] = "en"

class ImpactSimulationResponse(BaseModel):
    repair_crew_hours: float
    baseline_order: List[Dict[str, Any]]
    tript_dhara_order: List[Dict[str, Any]]
    baseline_liters_lost: float
    tript_dhara_liters_lost: float
    liters_saved: float
    baseline_vulnerable_protected: int
    tript_dhara_vulnerable_protected: int
    additional_vulnerable_protected: int

class OperatorBriefingResponse(BaseModel):
    generated_at: datetime
    provider: str
    model_id: str
    briefing_en: str
    briefing_hi: str
    is_fallback: bool
