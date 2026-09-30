export interface AQICategory {
  category: string;
  min_aqi: number;
  max_aqi: number;
  color: string;
  severity: number;
  health_advisory: string;
}

export const CPCB_AQI_CATEGORIES: AQICategory[] = [
  {
    category: "Good",
    min_aqi: 0,
    max_aqi: 50,
    color: "#00B050",
    severity: 1,
    health_advisory: "Minimal impact. Air quality is considered satisfactory, and air pollution poses little or no risk."
  },
  {
    category: "Satisfactory",
    min_aqi: 51,
    max_aqi: 100,
    color: "#92D050",
    severity: 2,
    health_advisory: "Minor breathing discomfort to sensitive people."
  },
  {
    category: "Moderate",
    min_aqi: 101,
    max_aqi: 200,
    color: "#EAB308",
    severity: 3,
    health_advisory: "Breathing discomfort to the people with lungs, asthma and heart diseases."
  },
  {
    category: "Poor",
    min_aqi: 201,
    max_aqi: 300,
    color: "#FF9900",
    severity: 4,
    health_advisory: "Breathing discomfort to most people on prolonged exposure."
  },
  {
    category: "Very Poor",
    min_aqi: 301,
    max_aqi: 400,
    color: "#FF0000",
    severity: 5,
    health_advisory: "Respiratory illness on prolonged exposure."
  },
  {
    category: "Severe",
    min_aqi: 401,
    max_aqi: 500,
    color: "#C00000",
    severity: 6,
    health_advisory: "Affects healthy people and seriously impacts those with existing diseases."
  }
];

export function getAQICategory(aqi: number | null | undefined): AQICategory {
  if (aqi === null || aqi === undefined) {
    return {
      category: "Unknown",
      min_aqi: 0,
      max_aqi: 0,
      color: "#71717A",
      severity: 0,
      health_advisory: "No telemetry data available."
    };
  }

  const clamped = Math.max(0, Math.min(500, aqi));
  for (const cat of CPCB_AQI_CATEGORIES) {
    if (clamped >= cat.min_aqi && clamped <= cat.max_aqi) {
      return cat;
    }
  }
  return CPCB_AQI_CATEGORIES[CPCB_AQI_CATEGORIES.length - 1];
}

export const POLLUTANT_DESCRIPTIONS: Record<string, { name: string; unit: string; description: string }> = {
  "PM2.5": {
    name: "Fine Particulate Matter (≤ 2.5 µm)",
    unit: "µg/m³",
    description: "Inhalable fine particles capable of deep pulmonary penetration and entering the bloodstream."
  },
  "PM10": {
    name: "Coarse Particulate Matter (≤ 10 µm)",
    unit: "µg/m³",
    description: "Respirable suspended particles primarily arising from road dust, construction, and mechanical abrasion."
  },
  "NO2": {
    name: "Nitrogen Dioxide",
    unit: "µg/m³",
    description: "Combustion gas generated predominantly by vehicular emissions and high-temperature thermal power generation."
  },
  "SO2": {
    name: "Sulfur Dioxide",
    unit: "µg/m³",
    description: "Reactive acidic gas emitted during industrial fuel combustion and smelting processes."
  },
  "CO": {
    name: "Carbon Monoxide",
    unit: "mg/m³",
    description: "Colorless toxic gas produced by incomplete hydrocarbon combustion in motor vehicles."
  },
  "O3": {
    name: "Ground-Level Ozone",
    unit: "µg/m³",
    description: "Secondary photochemical oxidant synthesized when NOx and VOCs react in the presence of solar radiation."
  }
};
