"""
Data Normalization Module.
Transforms validated records into the canonical measurement schema with derived temporal attributes.
"""

from datetime import datetime
from typing import Dict, Any, Optional
from ..models.measurement import CanonicalMeasurement, QualityFlag
from .validator import QualityValidator

SEASON_MAP = {
    12: "Winter", 1: "Winter", 2: "Winter",
    3: "Summer", 4: "Summer", 5: "Summer",
    6: "Monsoon", 7: "Monsoon", 8: "Monsoon", 9: "Monsoon",
    10: "Post-Monsoon", 11: "Post-Monsoon"
}


def get_season(month: int) -> str:
    return SEASON_MAP.get(month, "Winter")


def create_canonical_record(
    station_id: str,
    station_name: str,
    city: str,
    state: str,
    latitude: float,
    longitude: float,
    pollutant: str,
    raw_concentration: Optional[float],
    raw_unit: str,
    timestamp: datetime,
    source: str,
    validator: Optional[QualityValidator] = None,
    is_live_mode: bool = False
) -> CanonicalMeasurement:
    """
    Constructs a CanonicalMeasurement model with validation and derived temporal attributes.
    """
    if validator is None:
        validator = QualityValidator()

    quality_flag, norm_conc, norm_unit, _ = validator.validate_measurement(
        station_id=station_id,
        pollutant=pollutant,
        concentration=raw_concentration,
        unit=raw_unit,
        timestamp=timestamp,
        is_live_mode=is_live_mode
    )

    dt = timestamp
    day_name = dt.strftime("%A")
    is_weekend = dt.weekday() >= 5  # Saturday = 5, Sunday = 6
    month = dt.month
    season = get_season(month)

    return CanonicalMeasurement(
        station_id=station_id,
        station_name=station_name,
        city=city,
        state=state,
        country="India",
        latitude=latitude,
        longitude=longitude,
        pollutant=pollutant.upper(),
        concentration=norm_conc,
        unit=norm_unit,
        timestamp=timestamp,
        source=source,
        quality_flag=quality_flag,
        date=dt.strftime("%Y-%m-%d"),
        hour=dt.hour,
        day_of_week=day_name,
        is_weekend=is_weekend,
        month=month,
        season=season,
        year=dt.year,
        raw_concentration=raw_concentration
    )
