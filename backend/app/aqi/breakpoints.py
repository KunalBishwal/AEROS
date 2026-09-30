"""
Authoritative CPCB National Air Quality Index Breakpoint Tables, Categories, and Health Advisories.
Source: Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change, Govt of India.
"""

from typing import Dict, List, Tuple, Optional

# CPCB AQI Categories & Bands
AQI_CATEGORIES = [
    {
        "category": "Good",
        "min_aqi": 0,
        "max_aqi": 50,
        "color": "#00B050",
        "severity": 1,
        "health_advisory": "Minimal impact. Air quality is considered satisfactory, and air pollution poses little or no risk."
    },
    {
        "category": "Satisfactory",
        "min_aqi": 51,
        "max_aqi": 100,
        "color": "#92D050",
        "severity": 2,
        "health_advisory": "Minor breathing discomfort to sensitive people."
    },
    {
        "category": "Moderate",
        "min_aqi": 101,
        "max_aqi": 200,
        "color": "#EAB308",  # Accessible gold/yellow
        "severity": 3,
        "health_advisory": "Breathing discomfort to the people with lungs, asthma and heart diseases."
    },
    {
        "category": "Poor",
        "min_aqi": 201,
        "max_aqi": 300,
        "color": "#FF9900",
        "severity": 4,
        "health_advisory": "Breathing discomfort to most people on prolonged exposure."
    },
    {
        "category": "Very Poor",
        "min_aqi": 301,
        "max_aqi": 400,
        "color": "#FF0000",
        "severity": 5,
        "health_advisory": "Respiratory illness on prolonged exposure."
    },
    {
        "category": "Severe",
        "min_aqi": 401,
        "max_aqi": 500,
        "color": "#C00000",
        "severity": 6,
        "health_advisory": "Affects healthy people and seriously impacts those with existing diseases."
    }
]

# Official CPCB Breakpoint Tables
# Format: List of (B_low, B_high, I_low, I_high)
# Concentrations are in µg/m³ unless otherwise specified (CO is in mg/m³)
POLLUTANT_BREAKPOINTS: Dict[str, Dict] = {
    "PM10": {
        "unit": "ug/m3",
        "averaging_hours": 24,
        "breakpoints": [
            (0.0, 50.0, 0, 50),
            (51.0, 100.0, 51, 100),
            (101.0, 250.0, 101, 200),
            (251.0, 350.0, 201, 300),
            (351.0, 430.0, 301, 400),
            (431.0, 600.0, 401, 500)
        ]
    },
    "PM2.5": {
        "unit": "ug/m3",
        "averaging_hours": 24,
        "breakpoints": [
            (0.0, 30.0, 0, 50),
            (31.0, 60.0, 51, 100),
            (61.0, 90.0, 101, 200),
            (91.0, 120.0, 201, 300),
            (121.0, 250.0, 301, 400),
            (251.0, 400.0, 401, 500)
        ]
    },
    "NO2": {
        "unit": "ug/m3",
        "averaging_hours": 24,
        "breakpoints": [
            (0.0, 40.0, 0, 50),
            (41.0, 80.0, 51, 100),
            (81.0, 180.0, 101, 200),
            (181.0, 280.0, 201, 300),
            (281.0, 400.0, 301, 400),
            (401.0, 600.0, 401, 500)
        ]
    },
    "O3": {
        "unit": "ug/m3",
        "averaging_hours": 8,
        "breakpoints": [
            (0.0, 50.0, 0, 50),
            (51.0, 100.0, 51, 100),
            (101.0, 168.0, 101, 200),
            (169.0, 208.0, 201, 300),
            (209.0, 748.0, 301, 400),
            (749.0, 1000.0, 401, 500)
        ]
    },
    "CO": {
        "unit": "mg/m3",
        "averaging_hours": 8,
        "breakpoints": [
            (0.0, 1.0, 0, 50),
            (1.1, 2.0, 51, 100),
            (2.1, 10.0, 101, 200),
            (10.1, 17.0, 201, 300),
            (17.1, 34.0, 301, 400),
            (34.1, 50.0, 401, 500)
        ]
    },
    "SO2": {
        "unit": "ug/m3",
        "averaging_hours": 24,
        "breakpoints": [
            (0.0, 40.0, 0, 50),
            (41.0, 80.0, 51, 100),
            (81.0, 380.0, 101, 200),
            (381.0, 800.0, 201, 300),
            (801.0, 1600.0, 301, 400),
            (1601.0, 2000.0, 401, 500)
        ]
    }
}


def get_aqi_category_info(aqi_value: int) -> Dict:
    """Return category metadata for an AQI integer."""
    if aqi_value is None:
        return {
            "category": "Unknown",
            "min_aqi": 0,
            "max_aqi": 0,
            "color": "#71717A",
            "severity": 0,
            "health_advisory": "No data available."
        }
    
    clamped_aqi = max(0, min(500, aqi_value))
    for cat in AQI_CATEGORIES:
        if cat["min_aqi"] <= clamped_aqi <= cat["max_aqi"]:
            return cat
    return AQI_CATEGORIES[-1]
