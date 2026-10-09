import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routes import router as api_router
from app.schemas import ProblemDetails

app = FastAPI(
    title="Tript-Dhara API",
    description="Backend API for Tript-Dhara - Heat & Water Resilience and Leak Prioritization System",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")] if settings.CORS_ORIGINS != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded photos securely
os.makedirs(settings.PHOTOS_DIR, exist_ok=True)
app.mount("/photos", StaticFiles(directory=settings.PHOTOS_DIR), name="photos")

# Register versioned routes
app.include_router(api_router)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "city": settings.CITY_NAME
    }

# RFC 7807 problem+json error formatting
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=ProblemDetails(
            type="https://httpstatuses.com/500",
            title="Internal Server Error",
            status=500,
            detail=str(exc),
            instance=request.url.path
        ).dict(),
        media_type="application/problem+json"
    )
