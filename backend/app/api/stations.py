from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..firebase.repository import get_repository
from ..models.station import Station, StationSummary
from ..models.measurement import MeasurementResponse
from ..aqi.breakpoints import get_aqi_category_info

router = APIRouter(prefix="/stations", tags=["Stations"])


@router.get("", response_model=List[StationSummary])
def list_stations(city: Optional[str] = Query(None, description="Filter stations by city name")):
    repo = get_repository()
    stations = repo.get_stations(city=city)
    summaries = []
    for s in stations:
        color = get_aqi_category_info(s.latest_aqi)["color"] if s.latest_aqi else "#71717A"
        summaries.append(StationSummary(
            station_id=s.station_id,
            name=s.name,
            city=s.city,
            latitude=s.latitude,
            longitude=s.longitude,
            aqi=s.latest_aqi,
            aqi_category=s.latest_aqi_category,
            dominant_pollutant=s.latest_dominant_pollutant,
            color=color,
            last_updated=s.last_updated
        ))
    return summaries


@router.get("/{station_id}", response_model=Station)
def get_station_details(station_id: str):
    repo = get_repository()
    station = repo.get_station(station_id)
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found")
    return station


@router.get("/{station_id}/timeseries", response_model=List[MeasurementResponse])
def get_station_timeseries(
    station_id: str,
    pollutant: Optional[str] = Query(None, description="Pollutant (PM2.5, PM10, NO2, SO2, CO, O3)"),
    limit: int = Query(200, ge=1, le=1000)
):
    repo = get_repository()
    records = repo.get_measurements(station_id=station_id, pollutant=pollutant, limit=limit)
    return [
        MeasurementResponse(
            station_id=r.station_id,
            station_name=r.station_name,
            city=r.city,
            pollutant=r.pollutant,
            concentration=r.concentration,
            unit=r.unit,
            timestamp=r.timestamp,
            source=r.source,
            quality_flag=r.quality_flag.value if hasattr(r.quality_flag, "value") else str(r.quality_flag)
        )
        for r in records
    ]
