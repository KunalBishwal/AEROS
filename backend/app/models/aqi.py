from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import date, datetime


class SubIndexResult(BaseModel):
    pollutant: str
    concentration: float
    unit: str
    sub_index: Optional[int] = None
    category: Optional[str] = None
    color: Optional[str] = None
    health_advisory: Optional[str] = None
    valid: bool = True
    reason: Optional[str] = None


class AQIResult(BaseModel):
    station_id: Optional[str] = None
    city: Optional[str] = None
    date: Optional[str] = None
    timestamp: Optional[datetime] = None
    aqi: Optional[int] = None
    aqi_category: Optional[str] = None
    dominant_pollutant: Optional[str] = None
    color: Optional[str] = None
    health_advisory: Optional[str] = None
    sub_indices: Dict[str, Optional[int]] = Field(default_factory=dict)
    detailed_sub_indices: List[SubIndexResult] = Field(default_factory=list)
    monitored_pollutant_count: int = 0
    has_particulate: bool = False
    is_provisional: bool = False
    validation_status: str = "VALID"
