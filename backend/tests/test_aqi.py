import pytest
from app.aqi.calculator import calculate_sub_index, calculate_aqi
from app.aqi.breakpoints import get_aqi_category_info, AQI_CATEGORIES


class TestAQICalculator:
    def test_pm25_boundary_values(self):
        # Good: 0-30 -> 0-50
        r0 = calculate_sub_index("PM2.5", 0.0)
        assert r0.valid is True
        assert r0.sub_index == 0
        assert r0.category == "Good"

        r30 = calculate_sub_index("PM2.5", 30.0)
        assert r30.valid is True
        assert r30.sub_index == 50
        assert r30.category == "Good"

        # Satisfactory: 31-60 -> 51-100
        r31 = calculate_sub_index("PM2.5", 31.0)
        assert r31.valid is True
        assert r31.sub_index == 51
        assert r31.category == "Satisfactory"

        r60 = calculate_sub_index("PM2.5", 60.0)
        assert r60.valid is True
        assert r60.sub_index == 100
        assert r60.category == "Satisfactory"

        # Moderate: 61-90 -> 101-200
        r90 = calculate_sub_index("PM2.5", 90.0)
        assert r90.valid is True
        assert r90.sub_index == 200
        assert r90.category == "Moderate"

        # Severe: > 250
        r300 = calculate_sub_index("PM2.5", 300.0)
        assert r300.valid is True
        assert r300.sub_index > 400
        assert r300.category == "Severe"

    def test_pm10_boundary_values(self):
        r50 = calculate_sub_index("PM10", 50.0)
        assert r50.sub_index == 50
        assert r50.category == "Good"

        r100 = calculate_sub_index("PM10", 100.0)
        assert r100.sub_index == 100
        assert r100.category == "Satisfactory"

        r250 = calculate_sub_index("PM10", 250.0)
        assert r250.sub_index == 200
        assert r250.category == "Moderate"

    def test_co_units_mg_per_m3(self):
        # CO: 0-1.0 -> 0-50, 1.1-2.0 -> 51-100
        r_co_low = calculate_sub_index("CO", 0.5)
        assert r_co_low.sub_index == 25
        assert r_co_low.category == "Good"
        assert r_co_low.unit == "mg/m3"

        r_co_mid = calculate_sub_index("CO", 5.0)
        assert 101 <= r_co_mid.sub_index <= 200
        assert r_co_mid.category == "Moderate"

    def test_negative_concentration_handling(self):
        r_neg = calculate_sub_index("PM2.5", -15.0)
        assert r_neg.valid is False
        assert r_neg.sub_index is None

    def test_cpcb_validation_rule_valid(self):
        # Monitored: PM2.5, PM10, NO2 (3 pollutants including particulate)
        concentrations = {
            "PM2.5": 75.0,  # Moderate (~150)
            "PM10": 80.0,   # Satisfactory (~80)
            "NO2": 30.0,    # Good (~38)
        }
        res = calculate_aqi(concentrations)
        assert res.validation_status == "VALID"
        assert res.is_provisional is False
        assert res.dominant_pollutant == "PM2.5"
        assert res.aqi_category == "Moderate"
        assert res.aqi >= 145

    def test_cpcb_validation_rule_insufficient_pollutants(self):
        # Monitored only 2 pollutants (PM2.5, NO2) -> Provisional
        concentrations = {
            "PM2.5": 85.0,
            "NO2": 35.0
        }
        res = calculate_aqi(concentrations)
        assert res.is_provisional is True
        assert res.validation_status == "PROVISIONAL_INSUFFICIENT_POLLUTANTS"
        assert res.dominant_pollutant == "PM2.5"
        assert res.aqi is not None  # Still returns provisional max sub-index

    def test_cpcb_validation_rule_no_particulate(self):
        # 3 pollutants (NO2, SO2, CO) but NO PM -> Provisional
        concentrations = {
            "NO2": 60.0,
            "SO2": 25.0,
            "CO": 1.5
        }
        res = calculate_aqi(concentrations)
        assert res.is_provisional is True
        assert res.validation_status == "PROVISIONAL_MISSING_PARTICULATE"
        assert res.has_particulate is False

    def test_dominant_pollutant_selection(self):
        # NO2 has highest sub-index
        concentrations = {
            "PM2.5": 20.0,   # Good (~33)
            "PM10": 40.0,    # Good (~40)
            "NO2": 250.0,    # Poor (~270)
            "SO2": 20.0      # Good (~25)
        }
        res = calculate_aqi(concentrations)
        assert res.dominant_pollutant == "NO2"
        assert res.aqi_category == "Poor"
        assert 201 <= res.aqi <= 300
