import pytest
from datetime import datetime
from app.ingestion.validator import QualityValidator
from app.ingestion.normalizer import create_canonical_record, get_season
from app.models.measurement import QualityFlag


class TestNormalization:
    def test_unit_normalization_co(self):
        v = QualityValidator()
        # CO in ug/m3 -> mg/m3
        conc, unit = v.normalize_unit("CO", 1500.0, "ug/m3")
        assert unit == "mg/m3"
        assert conc == 1.5

        # CO in ppm -> mg/m3
        conc_ppm, unit_ppm = v.normalize_unit("CO", 2.0, "ppm")
        assert unit_ppm == "mg/m3"
        assert round(conc_ppm, 2) == 2.29

    def test_negative_value_flagged_invalid(self):
        v = QualityValidator()
        flag, conc, unit, reason = v.validate_measurement(
            station_id="TEST01",
            pollutant="PM2.5",
            concentration=-10.0,
            unit="ug/m3",
            timestamp=datetime(2026, 9, 1, 10, 0)
        )
        assert flag == QualityFlag.INVALID
        assert "Negative" in reason

    def test_extreme_outlier_flag(self):
        v = QualityValidator()
        flag, conc, unit, reason = v.validate_measurement(
            station_id="TEST01",
            pollutant="PM2.5",
            concentration=750.0,  # exceeds 600 outlier threshold
            unit="ug/m3",
            timestamp=datetime(2026, 9, 1, 10, 0)
        )
        assert flag == QualityFlag.OUTLIER

    def test_duplicate_signature_detection(self):
        v = QualityValidator()
        ts = datetime(2026, 9, 1, 12, 0)
        # First call: valid
        f1, _, _, _ = v.validate_measurement("S1", "PM2.5", 55.0, "ug/m3", ts)
        assert f1 == QualityFlag.VALID

        # Second call with identical station, pollutant, timestamp: duplicate
        f2, _, _, _ = v.validate_measurement("S1", "PM2.5", 55.0, "ug/m3", ts)
        assert f2 == QualityFlag.DUPLICATE

    def test_season_mapping(self):
        assert get_season(1) == "Winter"
        assert get_season(4) == "Summer"
        assert get_season(7) == "Monsoon"
        assert get_season(10) == "Post-Monsoon"

    def test_canonical_record_creation(self):
        rec = create_canonical_record(
            station_id="DEL001",
            station_name="Anand Vihar",
            city="Delhi",
            state="Delhi",
            latitude=28.6469,
            longitude=77.3160,
            pollutant="PM2.5",
            raw_concentration=125.4,
            raw_unit="ug/m3",
            timestamp=datetime(2026, 1, 15, 9, 0),
            source="CPCB"
        )
        assert rec.station_id == "DEL001"
        assert rec.hour == 9
        assert rec.month == 1
        assert rec.season == "Winter"
        assert rec.is_weekend is False  # Jan 15, 2026 was a Thursday
        assert rec.quality_flag == QualityFlag.VALID
