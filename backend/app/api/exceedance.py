from fastapi import APIRouter, Query
from typing import Optional
from ..analytics.exceedance import compute_exceedance_metrics
from ..models.analytics import ExceedanceResponse

router = APIRouter(prefix="/exceedance", tags=["Exceedance Analysis"])


@router.get("", response_model=ExceedanceResponse)
def get_exceedance_analysis(
    pollutant: str = Query("PM2.5", description="Pollutant (PM2.5, PM10, NO2, SO2, CO, O3)"),
    threshold: float = Query(60.0, description="Concentration threshold value"),
    city: Optional[str] = Query(None, description="City filter"),
    station_id: Optional[str] = Query(None, description="Station ID filter")
):
    return compute_exceedance_metrics(
        pollutant=pollutant,
        threshold=threshold,
        city=city,
        station_id=station_id
    )
