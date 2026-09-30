"""
Official CPCB Air Quality Index (AQI) Calculation Engine.
Calculates individual pollutant sub-indices and overall AQI adhering strictly to CPCB guidelines.
"""

import math
from typing import Dict, Optional, List, Tuple
from datetime import datetime

from .breakpoints import POLLUTANT_BREAKPOINTS, AQI_CATEGORIES, get_aqi_category_info
from ..models.aqi import SubIndexResult, AQIResult


def calculate_sub_index(pollutant: str, concentration: float) -> SubIndexResult:
    """
    Calculate the CPCB AQI sub-index for a single pollutant concentration.
    
    Formula:
        Ip = I_low + ((I_high - I_low) / (B_high - B_low)) * (C - B_low)
    """
    pol = pollutant.upper()
    if pol not in POLLUTANT_BREAKPOINTS:
        return SubIndexResult(
            pollutant=pollutant,
            concentration=concentration,
            unit="unknown",
            valid=False,
            reason=f"Unsupported pollutant: {pollutant}"
        )

    config = POLLUTANT_BREAKPOINTS[pol]
    unit = config["unit"]

    if concentration is None or math.isnan(concentration) or concentration < 0:
        return SubIndexResult(
            pollutant=pol,
            concentration=concentration if concentration is not None else -1,
            unit=unit,
            valid=False,
            reason="Invalid concentration value (negative or missing)"
        )

    breakpoints = config["breakpoints"]

    # Check if concentration exceeds the highest breakpoint
    max_b_high = breakpoints[-1][1]
    if concentration >= max_b_high:
        sub_index = 500
        cat_info = AQI_CATEGORIES[-1]
        return SubIndexResult(
            pollutant=pol,
            concentration=concentration,
            unit=unit,
            sub_index=sub_index,
            category=cat_info["category"],
            color=cat_info["color"],
            health_advisory=cat_info["health_advisory"],
            valid=True
        )

    for b_low, b_high, i_low, i_high in breakpoints:
        if b_low <= concentration <= b_high:
            # Linear interpolation
            if b_high == b_low:
                sub_index = i_low
            else:
                ratio = (i_high - i_low) / (b_high - b_low)
                raw_idx = i_low + ratio * (concentration - b_low)
                sub_index = int(round(raw_idx))
            
            sub_index = max(0, min(500, sub_index))
            cat_info = get_aqi_category_info(sub_index)
            return SubIndexResult(
                pollutant=pol,
                concentration=round(concentration, 2),
                unit=unit,
                sub_index=sub_index,
                category=cat_info["category"],
                color=cat_info["color"],
                health_advisory=cat_info["health_advisory"],
                valid=True
            )

    # Edge case: between breakpoint bins (e.g. 50.1 to 50.9)
    # Find nearest enclosing bin
    for i in range(len(breakpoints) - 1):
        curr_b_high = breakpoints[i][1]
        next_b_low = breakpoints[i+1][0]
        if curr_b_high < concentration < next_b_low:
            # Interpolate smoothly between curr_b_high and next_b_low
            b_low, b_high = breakpoints[i][0], breakpoints[i+1][1]
            i_low, i_high = breakpoints[i][2], breakpoints[i+1][3]
            raw_idx = i_low + ((i_high - i_low) / (b_high - b_low)) * (concentration - b_low)
            sub_index = max(0, min(500, int(round(raw_idx))))
            cat_info = get_aqi_category_info(sub_index)
            return SubIndexResult(
                pollutant=pol,
                concentration=round(concentration, 2),
                unit=unit,
                sub_index=sub_index,
                category=cat_info["category"],
                color=cat_info["color"],
                health_advisory=cat_info["health_advisory"],
                valid=True
            )

    # Fallback to nearest
    cat_info = AQI_CATEGORIES[-1]
    return SubIndexResult(
        pollutant=pol,
        concentration=concentration,
        unit=unit,
        sub_index=500,
        category=cat_info["category"],
        color=cat_info["color"],
        health_advisory=cat_info["health_advisory"],
        valid=True
    )


# Priority tie-breaker for dominant pollutant
POLLUTANT_PRIORITY = {
    "PM2.5": 10,
    "PM10": 9,
    "NO2": 8,
    "O3": 7,
    "SO2": 6,
    "CO": 5
}


def calculate_aqi(pollutant_concentrations: Dict[str, float],
                  station_id: Optional[str] = None,
                  city: Optional[str] = None,
                  timestamp: Optional[datetime] = None) -> AQIResult:
    """
    Calculate overall CPCB AQI from a dictionary of pollutant concentrations.
    
    Adheres strictly to CPCB criteria:
    1. At least three pollutants must be monitored.
    2. At least one must be a particulate matter (PM2.5 or PM10).
    3. The overall AQI is the maximum of the individual sub-indices.
    4. The pollutant responsible for the maximum sub-index is the dominant pollutant.
    """
    detailed_sub_indices: List[SubIndexResult] = []
    sub_indices_dict: Dict[str, Optional[int]] = {}

    for pol, conc in pollutant_concentrations.items():
        if conc is not None and not math.isnan(conc):
            res = calculate_sub_index(pol, conc)
            detailed_sub_indices.append(res)
            if res.valid:
                sub_indices_dict[res.pollutant] = res.sub_index

    valid_sub_indices = [r for r in detailed_sub_indices if r.valid and r.sub_index is not None]
    monitored_count = len(valid_sub_indices)
    has_pm = any(r.pollutant in ("PM2.5", "PM10") for r in valid_sub_indices)

    if not valid_sub_indices:
        return AQIResult(
            station_id=station_id,
            city=city,
            timestamp=timestamp,
            date=timestamp.strftime("%Y-%m-%d") if timestamp else None,
            aqi=None,
            aqi_category=None,
            dominant_pollutant=None,
            color=None,
            health_advisory=None,
            sub_indices={},
            detailed_sub_indices=[],
            monitored_pollutant_count=0,
            has_particulate=False,
            is_provisional=False,
            validation_status="NO_VALID_POLLUTANTS"
        )

    # CPCB Minimum Data Criteria
    is_cpcb_valid = (monitored_count >= 3) and has_pm
    is_provisional = not is_cpcb_valid

    # Find maximum sub-index and dominant pollutant
    max_sub_idx = -1
    dominant_pol = None

    # Sort with tie-breaker: highest sub_index first, then highest priority
    sorted_sub_indices = sorted(
        valid_sub_indices,
        key=lambda r: (r.sub_index, POLLUTANT_PRIORITY.get(r.pollutant, 0)),
        reverse=True
    )

    max_sub_idx = sorted_sub_indices[0].sub_index
    dominant_pol = sorted_sub_indices[0].pollutant

    cat_info = get_aqi_category_info(max_sub_idx)

    status_str = "VALID"
    if is_provisional:
        if not has_pm:
            status_str = "PROVISIONAL_MISSING_PARTICULATE"
        elif monitored_count < 3:
            status_str = "PROVISIONAL_INSUFFICIENT_POLLUTANTS"

    return AQIResult(
        station_id=station_id,
        city=city,
        timestamp=timestamp,
        date=timestamp.strftime("%Y-%m-%d") if timestamp else None,
        aqi=max_sub_idx,
        aqi_category=cat_info["category"],
        dominant_pollutant=dominant_pol,
        color=cat_info["color"],
        health_advisory=cat_info["health_advisory"],
        sub_indices=sub_indices_dict,
        detailed_sub_indices=detailed_sub_indices,
        monitored_pollutant_count=monitored_count,
        has_particulate=has_pm,
        is_provisional=is_provisional,
        validation_status=status_str
    )
