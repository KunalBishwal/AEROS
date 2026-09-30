"""
Dynamic Insights Generator.
Computes factual, evidence-backed editorial insights from actual underlying observations.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from ..firebase.repository import get_repository
from ..models.analytics import InsightItem


def generate_dynamic_insights(city: Optional[str] = None) -> List[InsightItem]:
    repo = get_repository()
    daily_records = repo.get_daily_aqi(city=city)
    
    insights: List[InsightItem] = []

    if not daily_records:
        return [
            InsightItem(
                type="general",
                title="Baseline Observation",
                headline="Awaiting Ingestion Telemetry",
                detail="No historical records available to synthesize analytical insights.",
                supporting_metric="0 Observations",
                level="info"
            )
        ]

    df = pd.DataFrame(daily_records)
    total_obs = len(df)

    # 1. Dominant Pollutant Insight
    if "dominant_pollutant" in df:
        dom_counts = df["dominant_pollutant"].value_counts()
        top_pol = dom_counts.index[0]
        top_count = int(dom_counts.iloc[0])
        top_pct = round(top_count / total_obs * 100, 1)

        insights.append(InsightItem(
            type="driver",
            title="Dominant Driver",
            headline=f"{top_pol} Dictated AQI in {top_pct}% of Observations",
            detail=f"Across {total_obs:,} station-day calculations, {top_pol} produced the highest sub-index {top_count:,} times, making it the primary target for exposure reduction.",
            supporting_metric=f"{top_pct}% dominance",
            level="warning" if top_pct > 50 else "info"
        ))

    # 2. Severe / Poor Days Exceedance
    if "aqi" in df:
        poor_mask = df["aqi"] > 200
        poor_count = int(poor_mask.sum())
        poor_pct = round(poor_count / total_obs * 100, 1)
        max_aqi = int(df["aqi"].max())

        insights.append(InsightItem(
            type="severity",
            title="Exposure Exceedance",
            headline=f"{poor_pct}% of Observed Days Exceeded CPCB Poor Threshold",
            detail=f"A total of {poor_count} days breached the 200 AQI mark, with the highest single-day station reading reaching {max_aqi}.",
            supporting_metric=f"{poor_count} / {total_obs} days",
            level="critical" if poor_pct > 30 else "warning"
        ))

    # 3. Seasonal Disparity
    if "date" in df:
        df["month"] = pd.to_datetime(df["date"]).dt.month
        winter_df = df[df["month"].isin([11, 12, 1, 2])]
        monsoon_df = df[df["month"].isin([6, 7, 8, 9])]

        if not winter_df.empty and not monsoon_df.empty:
            w_mean = round(float(winter_df["aqi"].mean()), 1)
            m_mean = round(float(monsoon_df["aqi"].mean()), 1)
            ratio = round(w_mean / m_mean, 1) if m_mean > 0 else 1.0

            insights.append(InsightItem(
                type="seasonal",
                title="Seasonal Inversion Dynamic",
                headline=f"Winter Pollution Averaged {ratio}x Higher than Monsoon",
                detail=f"Atmospheric dispersion during wet monsoon periods lowered average AQI to {m_mean}, compared to {w_mean} during shallow winter boundary layer conditions.",
                supporting_metric=f"{w_mean} vs {m_mean} AQI",
                level="info"
            ))

    # 4. Weekly Traffic Indicator Delta
    meas_col = repo.db.collection("measurements")
    no2_docs = meas_col.where("pollutant", "==", "NO2").stream()
    no2_records = [d.to_dict() for d in no2_docs if d.to_dict()]
    if no2_records:
        no2_df = pd.DataFrame(no2_records)
        wkday_no2 = no2_df[no2_df["is_weekend"] == False]["concentration"].mean()
        wkend_no2 = no2_df[no2_df["is_weekend"] == True]["concentration"].mean()
        if pd.notnull(wkday_no2) and pd.notnull(wkend_no2) and wkend_no2 > 0:
            delta_pct = round(((wkday_no2 - wkend_no2) / wkend_no2 * 100), 1)
            insights.append(InsightItem(
                type="diurnal",
                title="Combustion & Commuter Signature",
                headline=f"NO2 Levels Rose {delta_pct}% on Weekdays vs Weekends",
                detail=f"Nitrogen dioxide concentrations averaged {round(wkday_no2, 1)} µg/m³ during Monday–Friday commuter hours compared to {round(wkend_no2, 1)} µg/m³ on weekends.",
                supporting_metric=f"+{delta_pct}% weekday delta",
                level="info"
            ))

    return insights
