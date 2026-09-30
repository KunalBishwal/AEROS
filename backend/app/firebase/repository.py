"""
Firestore Repository Layer.
Provides typed access to stations, measurements, daily AQI, and precomputed analytics collections.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from .client import get_firestore_db
from ..models.station import Station, StationSummary
from ..models.measurement import CanonicalMeasurement, QualityFlag
from ..aqi.breakpoints import get_aqi_category_info


class FirestoreRepository:
    def __init__(self):
        self.db = get_firestore_db()

    # --- STATIONS ---
    def save_station(self, station: Station):
        data = station.model_dump(mode="json")
        self.db.collection("stations").document(station.station_id).set(data)

    def get_stations(self, city: Optional[str] = None) -> List[Station]:
        col = self.db.collection("stations")
        if city:
            docs = col.where("city", "==", city).stream()
        else:
            docs = col.stream()

        stations = []
        for doc in docs:
            data = doc.to_dict()
            if data:
                stations.append(Station(**data))
        return sorted(stations, key=lambda s: s.name)

    def get_station(self, station_id: str) -> Optional[Station]:
        doc = self.db.collection("stations").document(station_id).get()
        if doc.exists:
            return Station(**doc.to_dict())
        return None

    # --- MEASUREMENTS ---
    def save_measurements(self, measurements: List[CanonicalMeasurement]):
        batch_docs = {}
        for m in measurements:
            doc_id = f"{m.station_id}_{m.pollutant}_{m.timestamp.isoformat()}"
            batch_docs[doc_id] = m.model_dump(mode="json")
        if hasattr(self.db, "set_batch"):
            self.db.set_batch("measurements", batch_docs)
        else:
            for doc_id, data in batch_docs.items():
                self.db.collection("measurements").document(doc_id).set(data)

    def get_measurements(
        self,
        station_id: str,
        pollutant: Optional[str] = None,
        limit: int = 500
    ) -> List[CanonicalMeasurement]:
        col = self.db.collection("measurements")
        q = col.where("station_id", "==", station_id)
        if pollutant:
            q = q.where("pollutant", "==", pollutant.upper())
        docs = q.limit(limit).stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            if data:
                results.append(CanonicalMeasurement(**data))
        return sorted(results, key=lambda x: x.timestamp)

    # --- DAILY AQI ---
    def save_daily_aqi_records(self, records: List[Dict[str, Any]]):
        batch_docs = {}
        for r in records:
            doc_id = f"{r['station_id']}_{r['date']}"
            batch_docs[doc_id] = r
        if hasattr(self.db, "set_batch"):
            self.db.set_batch("daily_aqi", batch_docs)
        else:
            for doc_id, data in batch_docs.items():
                self.db.collection("daily_aqi").document(doc_id).set(data)

    def get_daily_aqi(
        self,
        station_id: Optional[str] = None,
        city: Optional[str] = None,
        year: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        col = self.db.collection("daily_aqi")
        if station_id:
            docs = col.where("station_id", "==", station_id).stream()
        elif city:
            docs = col.where("city", "==", city).stream()
        else:
            docs = col.stream()

        records = [doc.to_dict() for doc in docs if doc.to_dict()]

        if year:
            y_str = str(year)
            records = [r for r in records if r.get("date", "").startswith(y_str)]

        return sorted(records, key=lambda r: r.get("date", ""))

    # --- PRECOMPUTED ANALYTICS ---
    def save_precomputed(self, key: str, data: Dict[str, Any]):
        self.db.collection("precomputed_analytics").document(key).set(data)

    def get_precomputed(self, key: str) -> Optional[Dict[str, Any]]:
        doc = self.db.collection("precomputed_analytics").document(key).get()
        if doc.exists:
            return doc.to_dict()
        return None


repository = FirestoreRepository()


def get_repository() -> FirestoreRepository:
    return repository
