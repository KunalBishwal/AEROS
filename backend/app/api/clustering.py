from fastapi import APIRouter, Query
from typing import Optional
from ..firebase.repository import get_repository
from ..analytics.clustering import compute_station_clusters
from ..models.analytics import ClusterResponse

router = APIRouter(prefix="/clusters", tags=["Clustering & Machine Learning"])


@router.get("", response_model=ClusterResponse)
def get_station_clusters(
    k: int = Query(3, ge=2, le=5, description="Number of clusters (2-5)")
):
    repo = get_repository()
    # Check precomputed cache
    cache_key = f"clusters_k{k}"
    cached = repo.get_precomputed(cache_key)
    if cached:
        return ClusterResponse(**cached)
    return compute_station_clusters(k=k)
