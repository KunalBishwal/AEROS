from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
import pandas as pd
from ..firebase.repository import get_repository
from ..models.measurement import MeasurementResponse

router = APIRouter(tags=["Data Explorer & Quality Audit"])


@router.get("/explorer")
def query_explorer_records(
    city: Optional[str] = Query(None),
    station_id: Optional[str] = Query(None),
    pollutant: Optional[str] = Query(None),
    quality_flag: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200)
):
    repo = get_repository()
    # Fetch sample measurements
    col = repo.db.collection("measurements")
    docs = col.stream()
    all_records = [d.to_dict() for d in docs if d.to_dict()]

    if not all_records:
        return {
            "total_records": 0,
            "page": page,
            "limit": limit,
            "total_pages": 0,
            "records": []
        }

    df = pd.DataFrame(all_records)

    # Apply filters
    if city:
        df = df[df["city"].str.lower() == city.lower()]
    if station_id:
        df = df[df["station_id"] == station_id]
    if pollutant:
        df = df[df["pollutant"].str.upper() == pollutant.upper()]
    if quality_flag:
        df = df[df["quality_flag"].str.upper() == quality_flag.upper()]

    total_filtered = len(df)
    total_pages = max(1, (total_filtered + limit - 1) // limit)

    # Sort descending by timestamp
    if "timestamp" in df:
        df = df.sort_values("timestamp", ascending=False)

    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    page_df = df.iloc[start_idx:end_idx]

    records = [
        MeasurementResponse(
            station_id=row["station_id"],
            station_name=row.get("station_name", "Station"),
            city=row["city"],
            pollutant=row["pollutant"],
            concentration=float(row["concentration"]),
            unit=row.get("unit", "ug/m3"),
            timestamp=pd.to_datetime(row["timestamp"]),
            source=row.get("source", "CPCB"),
            quality_flag=str(row.get("quality_flag", "VALID"))
        )
        for _, row in page_df.iterrows()
    ]

    return {
        "total_records": total_filtered,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "records": records
    }


@router.get("/data-quality")
def get_data_quality_audit():
    repo = get_repository()
    stations = repo.get_stations()
    cities = list(set(s.city for s in stations))
    
    # Check sample measurements for flag breakdown
    col = repo.db.collection("measurements")
    docs = col.stream()
    records = [d.to_dict() for d in docs if d.to_dict()]

    flag_counts = {"VALID": 0, "INVALID": 0, "OUTLIER": 0, "DUPLICATE": 0, "MISSING": 0, "STALE": 0}
    dates = []
    
    for r in records:
        f = r.get("quality_flag", "VALID")
        flag_counts[f] = flag_counts.get(f, 0) + 1
        if "date" in r:
            dates.append(r["date"])

    total_records = len(records)
    min_date = min(dates) if dates else "2025-09-15"
    max_date = max(dates) if dates else "2026-09-15"

    return {
        "dataset_name": "CPCB National Continuous Ambient Air Quality Monitoring Network (CAAQMS)",
        "source": "CPCB Official / OpenAQ v3 Schema",
        "station_count": len(stations),
        "city_count": len(cities),
        "total_observations_audited": total_records,
        "date_range": f"{min_date} to {max_date}",
        "quality_flags": flag_counts,
        "valid_percentage": round((flag_counts.get("VALID", 0) / total_records * 100), 2) if total_records > 0 else 100.0,
        "transparency_note": "Quality flags are assigned during ingestion. Invalid values and outliers are preserved and tagged rather than silently removed."
    }
