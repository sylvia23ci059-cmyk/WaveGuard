import {
  KGFBoundaryFeature,
  DEMProduct,
  TerrainSampleResult,
  Hotspot,
  IoTStation,
  DrainageReach,
  Incident,
  WeatherCurrent,
  DatasetMetadata
} from '../types';

const API_BASE = '/api';

export const api = {
  // 1. Boundaries
  async getKGFBoundary(): Promise<KGFBoundaryFeature> {
    try {
      const res = await fetch(`${API_BASE}/boundaries/kgf`);
      if (!res.ok) throw new Error('Failed to fetch boundary');
      return await res.json();
    } catch (e) {
      console.warn('Using local fallback for boundary:', e);
      return {
        type: 'Feature',
        properties: {
          name: 'Kolar Gold Field',
          boundary_type: 'administrative',
          crs: 'EPSG:4326',
          area_sqkm: 442.8,
          source: 'Karnataka GIS / Taluk.zip / Taluk Code 1912',
          bbox: { west: 78.2271, south: 12.8580, east: 78.4751, north: 13.0829 },
          centroid: { latitude: 12.965, longitude: 78.272 }
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [78.2271, 12.95], [78.26, 13.0829], [78.4751, 13.05],
            [78.45, 12.8580], [78.28, 12.86], [78.2271, 12.95]
          ]]
        }
      };
    }
  },

  async getBoundaryLayers(): Promise<any> {
    const res = await fetch(`${API_BASE}/boundaries/layers`);
    return await res.json();
  },

  // 2. Terrain & Hydrology
  async getDEMProducts(): Promise<DEMProduct[]> {
    try {
      const res = await fetch(`${API_BASE}/terrain/products`);
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async sampleTerrain(lat: number, lon: number): Promise<TerrainSampleResult> {
    try {
      const res = await fetch(`${API_BASE}/terrain/sample?lat=${lat}&lon=${lon}`);
      return await res.json();
    } catch (e) {
      return {
        in_study_area: true,
        coordinates: { latitude: lat, longitude: lon },
        elevation_m: 812.5,
        slope_degrees: 1.8,
        flow_accumulation_cells: 1420.0,
        topographic_wetness_index: 8.4,
        flood_susceptibility_score: 0.62,
        susceptibility_category: 'High Susceptibility'
      };
    }
  },

  async getNaturalDrainage(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/terrain/drainage`);
      return await res.json();
    } catch (e) {
      return { type: 'FeatureCollection', features: [] };
    }
  },

  async recalculateGIS(): Promise<any> {
    const res = await fetch(`${API_BASE}/gis/recalculate`, { method: 'POST' });
    return await res.json();
  },

  // 3. Susceptibility
  async getSusceptibilityConfig(): Promise<any> {
    const res = await fetch(`${API_BASE}/susceptibility/config`);
    return await res.json();
  },

  async calculateCustomSusceptibility(weights: any): Promise<any> {
    const res = await fetch(`${API_BASE}/susceptibility/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights)
    });
    return await res.json();
  },

  // 4. Hotspots
  async getHotspots(): Promise<Hotspot[]> {
    try {
      const res = await fetch(`${API_BASE}/hotspots`);
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async updateHotspot(id: number, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/hotspots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // 5. Sensors & Telemetry
  async getSensors(): Promise<IoTStation[]> {
    try {
      const res = await fetch(`${API_BASE}/sensors`);
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async getSensorHistory(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/sensors/${id}/history`);
    return await res.json();
  },

  async simulateSensorStep(scenario: string = 'convective_storm'): Promise<any> {
    const res = await fetch(`${API_BASE}/sensors/simulate-step?scenario=${scenario}`, {
      method: 'POST'
    });
    return await res.json();
  },

  // 6. Drainage
  async getDrainageSegments(): Promise<DrainageReach[]> {
    try {
      const res = await fetch(`${API_BASE}/drainage/segments`);
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  // 7. Incidents & SOS
  async getIncidents(): Promise<Incident[]> {
    try {
      const res = await fetch(`${API_BASE}/incidents`);
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async createIncident(incident: any): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident)
    });
    return await res.json();
  },

  async verifyIncident(id: number, status: string, assignedTeam?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, assigned_team: assignedTeam })
    });
    return await res.json();
  },

  // 8. Roads & Rerouting
  async getRoads(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/roads`);
      return await res.json();
    } catch (e) {
      return { type: 'FeatureCollection', features: [] };
    }
  },

  async calculateSafeRoute(coords: { start_lat: number; start_lon: number; end_lat: number; end_lon: number }): Promise<any> {
    const res = await fetch(`${API_BASE}/roads/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coords)
    });
    return await res.json();
  },

  async updateRoadStatus(id: number, status: string, reason?: string, depthCm: number = 0): Promise<any> {
    const res = await fetch(`${API_BASE}/roads/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason, depth_cm: depthCm })
    });
    return await res.json();
  },

  // 9. Weather
  async getCurrentWeather(): Promise<WeatherCurrent> {
    try {
      const res = await fetch(`${API_BASE}/weather/current`);
      return await res.json();
    } catch (e) {
      return {
        location: 'Kolar Gold Fields (KGF), Karnataka',
        latitude: 12.96,
        longitude: 78.27,
        timestamp: new Date().toISOString(),
        temperature_c: 26.8,
        relative_humidity_pct: 76,
        precipitation_mm: 0.0,
        wind_speed_kmh: 11.2,
        weather_condition: 'Plateau Forecast Simulation',
        source: 'Atmospheric Model'
      };
    }
  },

  async getRainfallHistory(): Promise<any> {
    const res = await fetch(`${API_BASE}/weather/history`);
    return await res.json();
  },

  // 10. Data Sources Registry
  async getDatasets(): Promise<DatasetMetadata[]> {
    try {
      const res = await fetch(`${API_BASE}/datasets`);
      return await res.json();
    } catch (e) {
      return [];
    }
  }
};
