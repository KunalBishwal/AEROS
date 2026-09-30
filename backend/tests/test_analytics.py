import pytest
from app.analytics.patterns import compute_diurnal_patterns, compute_calendar_data
from app.analytics.exceedance import compute_exceedance_metrics
from app.analytics.clustering import compute_station_clusters
from app.analytics.intervention import compute_intervention_window
from app.analytics.insights import generate_dynamic_insights


class TestAnalyticsEngine:
    def test_diurnal_patterns(self):
        resp = compute_diurnal_patterns(pollutant="PM2.5")
        assert resp.pollutant == "PM2.5"
        assert len(resp.overall) == 24
        assert len(resp.weekdays) == 24
        assert len(resp.weekends) == 24
        assert resp.overall[8].hour == 8
        assert resp.overall[8].mean > 0

    def test_calendar_data(self):
        cal = compute_calendar_data(year=2026)
        assert cal.year == 2026
        assert len(cal.days) > 0
        jan_sample = [d for d in cal.days if d.month == 1]
        assert len(jan_sample) == 31
        assert jan_sample[0].aqi is not None

    def test_exceedance_metrics(self):
        # Default PM2.5 threshold = 60 ug/m3
        exc = compute_exceedance_metrics(pollutant="PM2.5", threshold=60.0)
        assert exc.total_days > 0
        assert 0 <= exc.exceedance_percentage <= 100
        assert exc.longest_streak_days >= 0
        assert exc.max_concentration > 60.0

    def test_clustering_kmeans_pca(self):
        for k in (2, 3, 4, 5):
            res = compute_station_clusters(k=k)
            assert res.k == k
            assert len(res.profiles) == k
            assert len(res.points) == 20
            assert -1.0 <= res.silhouette_score <= 1.0
            assert len(res.explained_variance) == 2
            # Check 2D PCA points
            p0 = res.points[0]
            assert isinstance(p0.pc1, float)
            assert isinstance(p0.pc2, float)
            assert p0.cluster_id in range(k)

    def test_intervention_window(self):
        iw = compute_intervention_window()
        assert iw.window_hours is not None
        assert iw.day_type in ("Weekdays", "Weekends", "All Days")
        assert iw.dominant_pollutant == "PM2.5"
        assert iw.elevation_pct > 0
        assert iw.exceedance_rate > 0

    def test_dynamic_insights(self):
        insights = generate_dynamic_insights()
        assert len(insights) >= 3
        types = [i.type for i in insights]
        assert "driver" in types
        assert "severity" in types
