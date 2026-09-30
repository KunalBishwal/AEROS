from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class Station(BaseModel):
    station_id: str
    external_id: Optional[str] = None
    name: str
    city: str
    state: str
    country: str = "India"
    latitude: float
    longitude: float
    source: str = "CPCB"
    monitored_pollutants: List[str] = Field(default_factory=list)
    latest_aqi: Optional[int] = None
    latest_aqi_category: Optional[str] = None
    latest_dominant_pollutant: Optional[str] = None
    last_updated: Optional[datetime] = None


class StationSummary(BaseModel):
    station_id: str
    name: str
    city: str
    latitude: float
    longitude: float
    aqi: Optional[int] = None
    aqi_category: Optional[str] = None
    dominant_pollutant: Optional[str] = None
    color: Optional[str] = None
    last_updated: Optional[datetime] = None
