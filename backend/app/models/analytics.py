from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class DiurnalPoint(BaseModel):
    hour: int
    mean: float
    median: float
    p25: float
    p75: float
    count: int


class DiurnalResponse(BaseModel):
    pollutant: str
    city: Optional[str] = None
    station_id: Optional[str] = None
    overall: List[DiurnalPoint]
    weekdays: List[DiurnalPoint]
    weekends: List[DiurnalPoint]


class CalendarDay(BaseModel):
    date: str
    month: int
    day: int
    aqi: Optional[int] = None
    category: Optional[str] = None
    color: Optional[str] = None
    dominant_pollutant: Optional[str] = None


class CalendarResponse(BaseModel):
    year: int
    city: Optional[str] = None
    station_id: Optional[str] = None
    days: List[CalendarDay]


class ExceedanceResponse(BaseModel):
    city: Optional[str] = None
    station_id: Optional[str] = None
    pollutant: str
    threshold: float
    unit: str
    total_days: int
    exceedance_days: int
    exceedance_percentage: float
    max_concentration: float
    longest_streak_days: int
    current_streak_days: int
    streak_dates: List[str] = Field(default_factory=list)


class ClusterProfile(BaseModel):
    cluster_id: int
    name: str
    size: int
    description: str
    centroid: Dict[str, float]
    stations: List[str]


class PCAPoint(BaseModel):
    station_id: str
    station_name: str
    city: str
    cluster_id: int
    cluster_name: str
    pc1: float
    pc2: float
    aqi: float
    dominant_pollutant: str


class ClusterResponse(BaseModel):
    k: int
    silhouette_score: float
    explained_variance: List[float]
    profiles: List[ClusterProfile]
    points: List[PCAPoint]


class InterventionWindowResponse(BaseModel):
    window_hours: str
    day_type: str
    season: str
    dominant_pollutant: str
    window_mean_aqi: float
    outside_mean_aqi: float
    elevation_pct: float
    exceedance_rate: float
    sample_size: int
    observation_summary: str


class InsightItem(BaseModel):
    type: str
    title: str
    headline: str
    detail: str
    supporting_metric: str
    level: str  # info, warning, critical


class CommissionerStoryResponse(BaseModel):
    city: str
    title: str
    subtitle: str
    generated_at: str
    situation: Dict[str, Any]
    driver: Dict[str, Any]
    pattern: Dict[str, Any]
    exposure: Dict[str, Any]
    intervention_window: Dict[str, Any]
