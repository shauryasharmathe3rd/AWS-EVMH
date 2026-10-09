-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Data sources provenance registry
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    url TEXT,
    license VARCHAR(100),
    provenance VARCHAR(20) NOT NULL CHECK (provenance IN ('REAL', 'DERIVED', 'BENCHMARK', 'SIMULATED')),
    last_success TIMESTAMP WITH TIME ZONE,
    last_error TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'INITIALIZING',
    record_count INTEGER NOT NULL DEFAULT 0,
    attribution TEXT,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wards / Municipal zones
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    ward_number VARCHAR(50) NOT NULL UNIQUE,
    ward_name VARCHAR(100) NOT NULL,
    geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
    centroid GEOMETRY(Point, 4326) NOT NULL,
    population INTEGER NOT NULL DEFAULT 0,
    area_sqkm DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    vulnerability_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    heat_risk_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    heat_risk_class VARCHAR(20) NOT NULL DEFAULT 'Low' CHECK (heat_risk_class IN ('Low', 'Moderate', 'High', 'Extreme')),
    data_origin VARCHAR(20) NOT NULL DEFAULT 'REAL' CHECK (data_origin IN ('REAL', 'DERIVED', 'BENCHMARK', 'SIMULATED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wards_geom ON wards USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_wards_centroid ON wards USING GIST(centroid);

-- Critical facilities
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT,
    name VARCHAR(200) NOT NULL,
    facility_type VARCHAR(50) NOT NULL CHECK (facility_type IN ('hospital', 'clinic', 'school', 'college', 'care_home', 'drinking_water', 'water_tower', 'other')),
    location GEOMETRY(Point, 4326) NOT NULL,
    ward_id INTEGER REFERENCES wards(id) ON DELETE SET NULL,
    capacity INTEGER,
    data_origin VARCHAR(20) NOT NULL DEFAULT 'REAL' CHECK (data_origin IN ('REAL', 'DERIVED', 'BENCHMARK', 'SIMULATED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_facilities_ward_id ON facilities(ward_id);

-- Weather hourly & forecast cache
CREATE TABLE IF NOT EXISTS weather_hourly (
    id SERIAL PRIMARY KEY,
    ward_id INTEGER REFERENCES wards(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    temperature_c DOUBLE PRECISION NOT NULL,
    apparent_temperature_c DOUBLE PRECISION NOT NULL,
    relative_humidity_pct DOUBLE PRECISION NOT NULL,
    precipitation_mm DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    soil_moisture_m3m3 DOUBLE PRECISION,
    evapotranspiration_mm DOUBLE PRECISION,
    is_forecast BOOLEAN NOT NULL DEFAULT FALSE,
    data_origin VARCHAR(20) NOT NULL DEFAULT 'REAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (ward_id, recorded_at, is_forecast)
);

CREATE INDEX IF NOT EXISTS idx_weather_ward_time ON weather_hourly(ward_id, recorded_at);

-- Climatology baseline (10-year historical day-of-year averages)
CREATE TABLE IF NOT EXISTS climatology (
    id SERIAL PRIMARY KEY,
    ward_id INTEGER REFERENCES wards(id) ON DELETE CASCADE,
    day_of_year INTEGER NOT NULL CHECK (day_of_year BETWEEN 1 AND 366),
    normal_temp_max_c DOUBLE PRECISION NOT NULL,
    normal_temp_mean_c DOUBLE PRECISION NOT NULL,
    std_dev_c DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    data_origin VARCHAR(20) NOT NULL DEFAULT 'DERIVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (ward_id, day_of_year)
);

-- River discharge & flood outlook
CREATE TABLE IF NOT EXISTS river_discharge (
    id SERIAL PRIMARY KEY,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    river_name VARCHAR(100) NOT NULL,
    location GEOMETRY(Point, 4326),
    discharge_m3s DOUBLE PRECISION NOT NULL,
    discharge_threshold_m3s DOUBLE PRECISION,
    flood_risk_level VARCHAR(20) DEFAULT 'Low',
    data_origin VARCHAR(20) NOT NULL DEFAULT 'REAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leaks (Real reports, utility data, or simulated)
CREATE TABLE IF NOT EXISTS leaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    ward_id INTEGER REFERENCES wards(id) ON DELETE SET NULL,
    leak_size_lpm DOUBLE PRECISION NOT NULL DEFAULT 40.0,
    size_class VARCHAR(20) NOT NULL DEFAULT 'steady' CHECK (size_class IN ('drip', 'steady', 'burst')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'investigating', 'repaired', 'dismissed')),
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    repaired_at TIMESTAMP WITH TIME ZONE,
    affected_population INTEGER NOT NULL DEFAULT 0,
    priority_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    score_leak_size_part DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    score_pop_part DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    score_vuln_part DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    score_heat_part DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    data_origin VARCHAR(20) NOT NULL DEFAULT 'SIMULATED' CHECK (data_origin IN ('REAL', 'DERIVED', 'BENCHMARK', 'SIMULATED')),
    source_ref VARCHAR(100),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaks_location ON leaks USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_leaks_ward_id ON leaks(ward_id);
CREATE INDEX IF NOT EXISTS idx_leaks_status ON leaks(status);
CREATE INDEX IF NOT EXISTS idx_leaks_priority ON leaks(priority_score DESC);

-- Citizen leak reports (Anonymous mobile/web reports)
CREATE TABLE IF NOT EXISTS citizen_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key VARCHAR(100) UNIQUE,
    location GEOMETRY(Point, 4326) NOT NULL,
    size_class VARCHAR(20) NOT NULL DEFAULT 'steady' CHECK (size_class IN ('drip', 'steady', 'burst')),
    description TEXT,
    photo_path TEXT,
    device_id VARCHAR(100),
    ward_id INTEGER REFERENCES wards(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_citizen_reports_loc ON citizen_reports USING GIST(location);

-- Demand estimates per zone/ward
CREATE TABLE IF NOT EXISTS demand_estimates (
    id SERIAL PRIMARY KEY,
    ward_id INTEGER REFERENCES wards(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_demand_m3h DOUBLE PRECISION NOT NULL,
    anomaly_detected BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_score DOUBLE PRECISION,
    data_origin VARCHAR(20) NOT NULL DEFAULT 'DERIVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (ward_id, timestamp)
);

-- Device registrations (for anonymous push)
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    device_token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
    ward_id INTEGER REFERENCES wards(id) ON DELETE SET NULL,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Model runs registry (for ML tracking)
CREATE TABLE IF NOT EXISTS model_runs (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metrics JSONB,
    parameters JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    data_origin VARCHAR(20) NOT NULL DEFAULT 'DERIVED'
);
