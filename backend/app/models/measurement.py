from enum import Enum
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class QualityFlag(str, Enum):
    VALID = "VALID"
    MISSING = "MISSING"
    INVALID = "INVALID"
    DUPLICATE = "DUPLICATE"
    OUTLIER = "OUTLIER"
    STALE = "STALE"


class CanonicalMeasurement(BaseModel):
    station_id: str
    station_name: str
    city: str
    state: str
    country: str = "India"
    latitude: float
    longitude: float
    pollutant: str
    concentration: float
    unit: str
    timestamp: datetime
    source: str
    quality_flag: QualityFlag = QualityFlag.VALID
    date: str
    hour: int
    day_of_week: str
    is_weekend: bool
    month: int
    season: str
    year: int
    raw_concentration: Optional[float] = None


class MeasurementResponse(BaseModel):
    station_id: str
    station_name: str
    city: str
    pollutant: str
    concentration: float
    unit: str
    timestamp: datetime
    source: str
    quality_flag: str
