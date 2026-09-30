"""
OpenAQ v3 API Client.
Communicates with OpenAQ REST API v3 using X-API-Key authentication.
"""

import httpx
from typing import Dict, List, Optional, Any
from ..config import settings


class OpenAQv3Client:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.OPENAQ_API_KEY
        self.base_url = (base_url or settings.OPENAQ_BASE_URL).rstrip("/")
        self.headers = {
            "Accept": "application/json",
            "User-Agent": "AQI-Urban-Tracker/1.0"
        }
        if self.api_key:
            self.headers["X-API-Key"] = self.api_key

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def get_locations(self, country: str = "IN", limit: int = 50) -> Dict[str, Any]:
        """Fetch active monitoring locations for given country code."""
        if not self.is_configured():
            return {"error": "NO_API_KEY", "message": "OpenAQ API Key not configured. Please supply OPENAQ_API_KEY in .env."}

        url = f"{self.base_url}/locations"
        params = {"countries_id": country, "limit": limit}
        async with httpx.AsyncClient(headers=self.headers, timeout=15.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 401:
                return {"error": "UNAUTHORIZED", "message": "Invalid or unauthorized OpenAQ v3 API Key."}
            if resp.status_code == 429:
                return {"error": "RATE_LIMITED", "message": "OpenAQ rate limit exceeded. Please retry later."}
            resp.raise_for_status()
            return resp.json()

    async def get_location_latest(self, location_id: int) -> Dict[str, Any]:
        """Fetch latest sensor readings for a location."""
        if not self.is_configured():
            return {"error": "NO_API_KEY", "message": "OpenAQ API Key not configured."}

        url = f"{self.base_url}/locations/{location_id}/latest"
        async with httpx.AsyncClient(headers=self.headers, timeout=15.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return {"error": f"HTTP_{resp.status_code}", "message": resp.text}
            return resp.json()

    async def get_sensor_measurements(self, sensor_id: int, date_from: Optional[str] = None, date_to: Optional[str] = None, limit: int = 100) -> Dict[str, Any]:
        """Fetch timeseries measurements for a specific sensor."""
        if not self.is_configured():
            return {"error": "NO_API_KEY", "message": "OpenAQ API Key not configured."}

        url = f"{self.base_url}/sensors/{sensor_id}/measurements"
        params = {"limit": limit}
        if date_from:
            params["date_from"] = date_from
        if date_to:
            params["date_to"] = date_to

        async with httpx.AsyncClient(headers=self.headers, timeout=15.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
