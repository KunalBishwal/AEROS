"""
Exceedance Analysis Engine.
Calculates dynamic threshold exceedance days, percentages, and maximum consecutive streaks.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from ..firebase.repository import get_repository
from ..models.analytics import ExceedanceResponse


def compute_exceedance_metrics(
    pollutant: str = "PM2.5",
    threshold: float = 60.0,
    city: Optional[str] = None,
    station_id: Optional[str] = None
) -> ExceedanceResponse:
    repo = get_repository()
    daily_records = repo.get_daily_aqi(station_id=station_id, city=city)

    pol = pollutant.upper()
    unit = "mg/m3" if pol == "CO" else "ug/m3"

    if not daily_records:
        return ExceedanceResponse(
            city=city,
            station_id=station_id,
            pollutant=pol,
            threshold=threshold,
            unit=unit,
            total_days=0,
            exceedance_days=0,
            exceedance_percentage=0.0,
            max_concentration=0.0,
            longest_streak_days=0,
            current_streak_days=0,
            streak_dates=[]
        )

    # Extract date and pollutant concentration
    series_data = []
    for r in daily_records:
        d = r.get("date")
        concs = r.get("concentrations", {})
        c_val = concs.get(pol)
        if c_val is not None:
            series_data.append({"date": d, "val": float(c_val)})

    if not series_data:
        return ExceedanceResponse(
            city=city,
            station_id=station_id,
            pollutant=pol,
            threshold=threshold,
            unit=unit,
            total_days=0,
            exceedance_days=0,
            exceedance_percentage=0.0,
            max_concentration=0.0,
            longest_streak_days=0,
            current_streak_days=0,
            streak_dates=[]
        )

    df = pd.DataFrame(series_data).sort_values("date").drop_duplicates(subset=["date"])
    total_days = len(df)
    max_conc = round(float(df["val"].max()), 2)

    # Boolean mask
    df["is_exceeded"] = df["val"] > threshold
    exceedance_days = int(df["is_exceeded"].sum())
    exceedance_pct = round((exceedance_days / total_days * 100.0), 1) if total_days > 0 else 0.0

    # Calculate longest streak via run-length encoding
    is_exc = df["is_exceeded"].tolist()
    dates = df["date"].tolist()

    longest_streak = 0
    current_streak = 0
    temp_streak = 0
    streak_start_idx = 0
    best_streak_indices = (0, 0)

    for i, exc in enumerate(is_exc):
        if exc:
            if temp_streak == 0:
                streak_start_idx = i
            temp_streak += 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak
                best_streak_indices = (streak_start_idx, i)
        else:
            temp_streak = 0

    # Current streak (trailing consecutive exceedances)
    for exc in reversed(is_exc):
        if exc:
            current_streak += 1
        else:
            break

    streak_dates_sample = []
    if longest_streak > 0:
        start_idx, end_idx = best_streak_indices
        streak_dates_sample = dates[start_idx:end_idx + 1]

    return ExceedanceResponse(
        city=city,
        station_id=station_id,
        pollutant=pol,
        threshold=threshold,
        unit=unit,
        total_days=total_days,
        exceedance_days=exceedance_days,
        exceedance_percentage=exceedance_pct,
        max_concentration=max_conc,
        longest_streak_days=longest_streak,
        current_streak_days=current_streak,
        streak_dates=streak_dates_sample[:10]  # First 10 dates of peak streak
    )
