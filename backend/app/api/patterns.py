from fastapi import APIRouter, Query
from typing import Optional, Dict, Any
import httpx
from ..analytics.patterns import compute_diurnal_patterns, compute_seasonal_summary
from ..models.analytics import DiurnalResponse

router = APIRouter(prefix="/patterns", tags=["Patterns & Diurnal"])


@router.get("/diurnal", response_model=DiurnalResponse)
def get_diurnal_patterns(
    pollutant: str = Query("PM2.5", description="Pollutant parameter"),
    city: Optional[str] = Query(None),
    station_id: Optional[str] = Query(None)
):
    return compute_diurnal_patterns(pollutant=pollutant, city=city, station_id=station_id)


@router.get("/weekday")
def get_weekday_comparison(
    pollutant: str = Query("NO2", description="Pollutant parameter"),
    city: Optional[str] = Query(None)
):
    diurnal = compute_diurnal_patterns(pollutant=pollutant, city=city)
    return {
        "pollutant": pollutant,
        "city": city,
        "weekdays": diurnal.weekdays,
        "weekends": diurnal.weekends
    }


@router.get("/seasonal")
def get_seasonal_patterns(city: Optional[str] = Query(None)):
    return compute_seasonal_summary(city=city)


@router.get("/weather")
async def get_weather_correlation(
    latitude: float = Query(28.6469, description="Station latitude"),
    longitude: float = Query(77.3160, description="Station longitude"),
    pollutant: str = Query("PM2.5")
):
    """
    Fetches real ambient weather from Open-Meteo API for dual-axis correlation.
    Gracefully handles network errors.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m",
        "past_days": 3,
        "forecast_days": 1
    }
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                hourly = data.get("hourly", {})
                times = hourly.get("time", [])[-48:]
                temps = hourly.get("temperature_2m", [])[-48:]
                humidities = hourly.get("relative_humidity_2m", [])[-48:]
                winds = hourly.get("wind_speed_10m", [])[-48:]

                return {
                    "status": "AVAILABLE",
                    "source": "Open-Meteo",
                    "latitude": latitude,
                    "longitude": longitude,
                    "timeseries": [
                        {
                            "time": times[i],
                            "temperature_c": temps[i] if i < len(temps) else None,
                            "relative_humidity_pct": humidities[i] if i < len(humidities) else None,
                            "wind_speed_kmh": winds[i] if i < len(winds) else None
                        }
                        for i in range(len(times))
                    ]
                }
    except Exception as e:
        pass

    return {
        "status": "UNAVAILABLE",
        "reason": "Open-Meteo external endpoint not reachable or network timeout",
        "timeseries": []
    }
