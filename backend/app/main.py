"""
FastAPI Main Application Entry Point.
Configures CORS, mounts all modular analytical and telemetry routers, and exposes OpenAPI docs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api import stations, aqi, patterns, cities, exceedance, clustering, story, explorer

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-resolution Environmental Intelligence & Urban Air Quality Exposure Tracker API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Next.js development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Registrations
app.include_router(stations.router, prefix=settings.API_V1_STR)
app.include_router(aqi.router, prefix=settings.API_V1_STR)
app.include_router(patterns.router, prefix=settings.API_V1_STR)
app.include_router(cities.router, prefix=settings.API_V1_STR)
app.include_router(exceedance.router, prefix=settings.API_V1_STR)
app.include_router(clustering.router, prefix=settings.API_V1_STR)
app.include_router(story.router, prefix=settings.API_V1_STR)
app.include_router(explorer.router, prefix=settings.API_V1_STR)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": settings.APP_MODE,
        "firebase_project": settings.FIREBASE_PROJECT_ID
    }


@app.get("/", tags=["Root"])
def root_endpoint():
    return {
        "message": "Air Quality Intelligence API is online.",
        "documentation": "/docs",
        "health": "/api/health"
    }
