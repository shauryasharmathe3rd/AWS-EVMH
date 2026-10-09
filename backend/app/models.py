import uuid
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index, BigInteger
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from app.database import Base

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    url = Column(Text)
    license = Column(String(100))
    provenance = Column(String(20), nullable=False)
    last_success = Column(DateTime(timezone=True))
    last_error = Column(DateTime(timezone=True))
    status = Column(String(50), default="INITIALIZING")
    record_count = Column(Integer, default=0)
    attribution = Column(Text)
    notes = Column(Text)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    ward_number = Column(String(50), unique=True, nullable=False)
    ward_name = Column(String(100), nullable=False)
    geometry = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=False)
    centroid = Column(Geometry("POINT", srid=4326), nullable=False)
    population = Column(Integer, default=0)
    area_sqkm = Column(Float, default=0.0)
    vulnerability_score = Column(Float, default=0.0)
    heat_risk_score = Column(Float, default=0.0)
    heat_risk_class = Column(String(20), default="Low")
    data_origin = Column(String(20), default="REAL")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    osm_id = Column(BigInteger)
    name = Column(String(200), nullable=False)
    facility_type = Column(String(50), nullable=False)
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    capacity = Column(Integer, nullable=True)
    data_origin = Column(String(20), default="REAL")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class WeatherHourly(Base):
    __tablename__ = "weather_hourly"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False)
    temperature_c = Column(Float, nullable=False)
    apparent_temperature_c = Column(Float, nullable=False)
    relative_humidity_pct = Column(Float, nullable=False)
    precipitation_mm = Column(Float, default=0.0)
    soil_moisture_m3m3 = Column(Float, nullable=True)
    evapotranspiration_mm = Column(Float, nullable=True)
    is_forecast = Column(Boolean, default=False)
    data_origin = Column(String(20), default="REAL")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class Climatology(Base):
    __tablename__ = "climatology"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False)
    day_of_year = Column(Integer, nullable=False)
    normal_temp_max_c = Column(Float, nullable=False)
    normal_temp_mean_c = Column(Float, nullable=False)
    std_dev_c = Column(Float, default=1.0)
    data_origin = Column(String(20), default="DERIVED")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class RiverDischarge(Base):
    __tablename__ = "river_discharge"

    id = Column(Integer, primary_key=True, index=True)
    recorded_at = Column(DateTime(timezone=True), nullable=False)
    river_name = Column(String(100), nullable=False)
    location = Column(Geometry("POINT", srid=4326), nullable=True)
    discharge_m3s = Column(Float, nullable=False)
    discharge_threshold_m3s = Column(Float, nullable=True)
    flood_risk_level = Column(String(20), default="Low")
    data_origin = Column(String(20), default="REAL")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class Leak(Base):
    __tablename__ = "leaks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    leak_size_lpm = Column(Float, default=40.0)
    size_class = Column(String(20), default="steady")
    status = Column(String(20), default="open")
    reported_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    repaired_at = Column(DateTime(timezone=True), nullable=True)
    affected_population = Column(Integer, default=0)
    priority_score = Column(Float, default=0.0)
    score_leak_size_part = Column(Float, default=0.0)
    score_pop_part = Column(Float, default=0.0)
    score_vuln_part = Column(Float, default=0.0)
    score_heat_part = Column(Float, default=0.0)
    data_origin = Column(String(20), default="SIMULATED")
    source_ref = Column(String(100), nullable=True)
    photo_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    idempotency_key = Column(String(100), unique=True, nullable=True)
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    size_class = Column(String(20), default="steady")
    description = Column(Text, nullable=True)
    photo_path = Column(Text, nullable=True)
    device_id = Column(String(100), nullable=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class DemandEstimate(Base):
    __tablename__ = "demand_estimates"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    estimated_demand_m3h = Column(Float, nullable=False)
    anomaly_detected = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    data_origin = Column(String(20), default="DERIVED")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_token = Column(String(255), unique=True, nullable=False)
    platform = Column(String(20), nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    language = Column(String(10), default="en")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)
    trained_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    metrics = Column(JSONB, nullable=True)
    parameters = Column(JSONB, nullable=True)
    status = Column(String(50), default="SUCCESS")
    data_origin = Column(String(20), default="DERIVED")
