"""
Quality Validation Engine.
Performs plausibility range checks, duplicate detection, and outlier identification.
Assigns explicit QualityFlags: VALID, MISSING, INVALID, DUPLICATE, OUTLIER, STALE.
"""

import math
from typing import Dict, Optional, Tuple
from datetime import datetime, timezone, timedelta
from ..models.measurement import QualityFlag

# Physically plausible environmental concentration limits (in standard units)
# Particles: ug/m3, Gases: ug/m3, CO: mg/m3
PLAUSIBLE_RANGES = {
    "PM2.5": {"min": 0.0, "max": 1000.0, "outlier_thresh": 600.0},
    "PM10": {"min": 0.0, "max": 1500.0, "outlier_thresh": 900.0},
    "NO2": {"min": 0.0, "max": 1000.0, "outlier_thresh": 500.0},
    "SO2": {"min": 0.0, "max": 1200.0, "outlier_thresh": 600.0},
    "CO": {"min": 0.0, "max": 100.0, "outlier_thresh": 45.0},      # mg/m3
    "O3": {"min": 0.0, "max": 1000.0, "outlier_thresh": 500.0},
}


class QualityValidator:
    def __init__(self):
        # Set of (station_id, pollutant, timestamp_iso) to detect duplicates
        self._seen_signatures = set()

    def validate_measurement(
        self,
        station_id: str,
        pollutant: str,
        concentration: Optional[float],
        unit: str,
        timestamp: datetime,
        is_live_mode: bool = False
    ) -> Tuple[QualityFlag, float, str, Optional[str]]:
        """
        Validates measurement and returns (quality_flag, normalized_conc, normalized_unit, reason)
        """
        pol = pollutant.upper()

        if concentration is None or math.isnan(concentration):
            return QualityFlag.MISSING, 0.0, unit, "Missing or NaN concentration value"

        # Check duplicate
        sig = (station_id, pol, timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp))
        if sig in self._seen_signatures:
            return QualityFlag.DUPLICATE, concentration, unit, "Duplicate record for station, pollutant, and timestamp"
        self._seen_signatures.add(sig)

        # Standardize units
        norm_conc, norm_unit = self.normalize_unit(pol, concentration, unit)

        # Check for negative values
        if norm_conc < 0:
            return QualityFlag.INVALID, norm_conc, norm_unit, f"Negative concentration ({norm_conc} {norm_unit})"

        # Check physical bounds
        if pol in PLAUSIBLE_RANGES:
            bounds = PLAUSIBLE_RANGES[pol]
            if norm_conc > bounds["max"]:
                return QualityFlag.INVALID, norm_conc, norm_unit, f"Concentration exceeds physical maximum limit ({bounds['max']} {norm_unit})"
            if norm_conc > bounds["outlier_thresh"]:
                return QualityFlag.OUTLIER, norm_conc, norm_unit, f"Extreme spike detected (> {bounds['outlier_thresh']} {norm_unit})"

        # Stale check in live mode (older than 48 hours from now)
        if is_live_mode:
            now_utc = datetime.now(timezone.utc)
            ts = timestamp if timestamp.tzinfo else timestamp.replace(tzinfo=timezone.utc)
            if now_utc - ts > timedelta(hours=48):
                return QualityFlag.STALE, norm_conc, norm_unit, "Timestamp is older than 48 hours"

        return QualityFlag.VALID, norm_conc, norm_unit, None

    @staticmethod
    def normalize_unit(pollutant: str, concentration: float, unit: str) -> Tuple[float, str]:
        """
        Standardizes units to CPCB standard:
        - CO in mg/m3 (if in ppm, convert with molecular weight ~ 1.145 factor at standard temp, or if in ug/m3 / 1000)
        - Others in ug/m3 (if in ppm, convert approx; if ppb, divide by 1000 or molecular weight)
        """
        u = unit.lower().strip()
        pol = pollutant.upper()

        if pol == "CO":
            if "ug/m" in u or "µg/m" in u:
                return concentration / 1000.0, "mg/m3"
            elif "ppm" in u:
                # 1 ppm CO = 1.145 mg/m3 at 25 deg C, 1 atm
                return concentration * 1.145, "mg/m3"
            return concentration, "mg/m3"
        else:
            if "mg/m" in u:
                return concentration * 1000.0, "ug/m3"
            elif "ppm" in u:
                # Approximate conversions at 25C for standard air
                factors = {"NO2": 1880.0, "SO2": 2620.0, "O3": 1960.0}
                factor = factors.get(pol, 1000.0)
                return concentration * factor, "ug/m3"
            return concentration, "ug/m3"
