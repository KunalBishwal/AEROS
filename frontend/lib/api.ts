const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Accept": "application/json",
        ...(options?.headers || {})
      },
      next: { revalidate: 30 }
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error(`API Fetch Failure (${endpoint}):`, err);
    throw err;
  }
}

export interface StationSummary {
  station_id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  aqi: number | null;
  aqi_category: string | null;
  dominant_pollutant: string | null;
  color: string | null;
  last_updated: string | null;
}

export interface CurrentTelemetry {
  monitored_stations_count: number;
  monitored_cities_count: number;
  average_aqi: number;
  category: string;
  color: string;
  dominant_pollutant: string;
  severe_stations_count: number;
  severe_stations: any[];
  last_updated: string | null;
  mode: "LIVE" | "DEMO";
  data_source: string;
}

export interface CalendarDay {
  date: string;
  month: number;
  day: number;
  aqi: number | null;
  category: string | null;
  color: string | null;
  dominant_pollutant: string | null;
}

export interface ExceedanceResponse {
  city: string | null;
  station_id: string | null;
  pollutant: string;
  threshold: number;
  unit: string;
  total_days: number;
  exceedance_days: number;
  exceedance_percentage: number;
  max_concentration: number;
  longest_streak_days: number;
  current_streak_days: number;
  streak_dates: string[];
}

export interface ClusterResponse {
  k: number;
  silhouette_score: number;
  explained_variance: number[];
  profiles: any[];
  points: any[];
}

export const api = {
  getCurrentTelemetry: () => fetchJson<CurrentTelemetry>("/current"),
  
  getStations: (city?: string) => 
    fetchJson<StationSummary[]>(`/stations${city ? `?city=${encodeURIComponent(city)}` : ""}`),
  
  getStationDetails: (stationId: string) => 
    fetchJson<any>(`/stations/${encodeURIComponent(stationId)}`),
  
  getStationTimeseries: (stationId: string, pollutant?: string) => 
    fetchJson<any[]>(`/stations/${encodeURIComponent(stationId)}/timeseries${pollutant ? `?pollutant=${pollutant}` : ""}`),
  
  getDiurnalPatterns: (pollutant: string = "PM2.5", city?: string, stationId?: string) => {
    const params = new URLSearchParams({ pollutant });
    if (city) params.set("city", city);
    if (stationId) params.set("station_id", stationId);
    return fetchJson<any>(`/patterns/diurnal?${params.toString()}`);
  },
  
  getCalendarData: (year: number = 2026, city?: string) => {
    const params = new URLSearchParams({ year: year.toString() });
    if (city) params.set("city", city);
    return fetchJson<any>(`/aqi/calendar?${params.toString()}`);
  },
  
  getPollutantContributions: (city?: string) =>
    fetchJson<any>(`/pollutants/contribution${city ? `?city=${encodeURIComponent(city)}` : ""}`),
  
  getSeasonalPatterns: (city?: string) =>
    fetchJson<any>(`/patterns/seasonal${city ? `?city=${encodeURIComponent(city)}` : ""}`),
  
  getWeatherCorrelation: (lat: number, lon: number, pollutant: string = "PM2.5") =>
    fetchJson<any>(`/patterns/weather?latitude=${lat}&longitude=${lon}&pollutant=${pollutant}`),
  
  getCities: () => fetchJson<any[]>("/cities"),
  
  getCityComparison: (cities: string[]) =>
    fetchJson<any>(`/cities/compare?cities=${encodeURIComponent(cities.join(","))}`),
  
  getExceedance: (pollutant: string, threshold: number, city?: string, stationId?: string) => {
    const params = new URLSearchParams({
      pollutant,
      threshold: threshold.toString()
    });
    if (city) params.set("city", city);
    if (stationId) params.set("station_id", stationId);
    return fetchJson<any>(`/exceedance?${params.toString()}`);
  },
  
  getClusters: (k: number = 3) =>
    fetchJson<any>(`/clusters?k=${k}`),
  
  getInterventionWindows: (city?: string) =>
    fetchJson<any>(`/intervention-windows${city ? `?city=${encodeURIComponent(city)}` : ""}`),
  
  getDynamicInsights: (city?: string) =>
    fetchJson<any[]>(`/insights${city ? `?city=${encodeURIComponent(city)}` : ""}`),
  
  getSevereAlerts: () =>
    fetchJson<any>("/alerts"),
  
  getCommissionerStory: (city: string = "Delhi") =>
    fetchJson<any>(`/story?city=${encodeURIComponent(city)}`),
  
  getExplorerRecords: (params: Record<string, any>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, v.toString());
    });
    return fetchJson<any>(`/explorer?${q.toString()}`);
  },
  
  getDataQualityAudit: () =>
    fetchJson<any>("/data-quality")
};
