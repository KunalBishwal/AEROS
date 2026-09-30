import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAPIEndpoints:
    def test_health(self):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "firebase_project" in data

    def test_stations_list(self):
        resp = client.get("/api/stations")
        assert resp.status_code == 200
        stations = resp.json()
        assert len(stations) > 0
        s0 = stations[0]
        assert "station_id" in s0
        assert "name" in s0
        assert "latitude" in s0

    def test_current_telemetry(self):
        resp = client.get("/api/current")
        assert resp.status_code == 200
        data = resp.json()
        assert "monitored_stations_count" in data
        assert "average_aqi" in data
        assert "dominant_pollutant" in data
        assert "mode" in data

    def test_diurnal_patterns(self):
        resp = client.get("/api/patterns/diurnal?pollutant=PM2.5")
        assert resp.status_code == 200
        data = resp.json()
        assert data["pollutant"] == "PM2.5"
        assert len(data["overall"]) == 24

    def test_cities_compare(self):
        resp = client.get("/api/cities/compare?cities=Delhi,Mumbai")
        assert resp.status_code == 200
        data = resp.json()
        assert "profiles" in data
        assert len(data["profiles"]) >= 1

    def test_exceedance(self):
        resp = client.get("/api/exceedance?pollutant=PM2.5&threshold=60.0")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_days"] > 0
        assert "longest_streak_days" in data

    def test_clusters(self):
        resp = client.get("/api/clusters?k=3")
        assert resp.status_code == 200
        data = resp.json()
        assert data["k"] == 3
        assert len(data["profiles"]) == 3
        assert len(data["points"]) > 0

    def test_intervention_windows(self):
        resp = client.get("/api/intervention-windows")
        assert resp.status_code == 200
        data = resp.json()
        assert "window_hours" in data
        assert "elevation_pct" in data

    def test_commissioner_story(self):
        resp = client.get("/api/story?city=Delhi")
        assert resp.status_code == 200
        data = resp.json()
        assert "situation" in data
        assert "driver" in data
        assert "pattern" in data
        assert "exposure" in data
        assert "intervention_window" in data

    def test_explorer_and_data_quality(self):
        resp_exp = client.get("/api/explorer?limit=5")
        assert resp_exp.status_code == 200
        assert "records" in resp_exp.json()

        resp_qual = client.get("/api/data-quality")
        assert resp_qual.status_code == 200
        assert "quality_flags" in resp_qual.json()
