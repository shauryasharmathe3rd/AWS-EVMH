# Deployment & Operational Handoff Guide

## Container Images & Services

| Service | Container Name | Network | Exposed Host Port | Health Endpoint |
|---|---|---|---|---|
| **Gateway** | `tript_dhara_gateway` | `edge` | `8080` (or `$GATEWAY_PORT`) | `GET /health` |
| **Frontend** | `tript_dhara_frontend` | `edge` | None (Internal) | `GET /` |
| **Backend** | `tript_dhara_backend` | `edge`, `internal` | None (Internal) | `GET /health` |
| **Database** | `tript_dhara_db` | `internal` | None (Internal) | `pg_isready` |
| **Worker** | `tript_dhara_worker` | `internal` | None (Internal) | `/tmp/worker_healthy` |

---

## Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `CITY_NAME` | Name of the municipal jurisdiction | `Ghaziabad` |
| `CITY_LAT` | Center latitude coordinate | `28.6345839` |
| `CITY_LON` | Center longitude coordinate | `77.4477459` |
| `GATEWAY_PORT` | Published host port for the gateway | `8080` |
| `DEMO_MODE` | Enables jury reset and testing flags | `true` |
| `ALLOW_PUBLIC_STATUS_CHANGES` | Allows public repair marking in demo | `true` |
| `POSTGRES_DB` | PostgreSQL database name | `tript_dhara` |
| `POSTGRES_USER` | PostgreSQL master username | `tript_user` |
| `POSTGRES_PASSWORD` | PostgreSQL master password | `tript_secure_pass` |
| `DATABASE_URL` | SQLAlchemy connection string | `postgresql://...` |
| `OPEN_METEO_BASE_URL` | Open-Meteo API base URL | `https://api.open-meteo.com/v1` |
| `ENABLE_STRANDS_BRIEFING` | Activates Strands AI operator synthesis | `true` |
| `STORAGE_ADAPTER` | Storage interface for citizen photos | `local` |

---

## Named Volumes & Persistence

- `pgdata`: PostgreSQL database storage directory (`/var/lib/postgresql/data`).
- `photos`: Uploaded citizen leak report photos (`/app/storage/photos`).
- `models`: Serialized scikit-learn models and parameters (`/app/models`).
- `rawcache`: Cached API payloads and raster files (`/app/data/cache`).
