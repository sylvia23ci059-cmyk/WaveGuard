import {
  DashboardSummaryData,
  LocationItem,
  WaterReading,
  AlertItem,
  RouteResponse,
  GraphInfoResponse,
  SimulatorStatus,
  SystemSettings
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      // ignore
    }
    throw new Error(errorDetail || `Request failed with HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Health
  checkHealth: () => fetchJson<{ status: string; service: string }>('/health'),

  // Dashboard
  getDashboardSummary: () => fetchJson<DashboardSummaryData>('/dashboard/summary'),

  // Locations
  getLocations: (params?: { status?: string; category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.category) q.append('category', params.category);
    if (params?.search) q.append('search', params.search);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return fetchJson<LocationItem[]>(`/locations${queryString}`);
  },

  getLocationsGeoJSON: () => fetchJson<any>('/locations/geojson'),

  getLocationById: (id: string) => fetchJson<LocationItem>(`/locations/${id}`),

  getLocationHistory: (id: string, limit: number = 30) =>
    fetchJson<{ id: number; water_depth_cm: number; timestamp: string; source: string; validation_status: string }[]>(
      `/locations/${id}/history?limit=${limit}`
    ),

  createLocation: (data: Partial<LocationItem>) =>
    fetchJson<LocationItem>('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateLocation: (id: string, data: Partial<LocationItem>) =>
    fetchJson<LocationItem>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteLocation: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/locations/${id}`, {
      method: 'DELETE',
    }),

  // Readings
  getReadings: (params?: { location_id?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.location_id) q.append('location_id', params.location_id);
    if (params?.limit) q.append('limit', params.limit.toString());
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return fetchJson<WaterReading[]>(`/readings${queryString}`);
  },

  submitReading: (data: { location_id: string; water_depth_cm: number; source?: string }) =>
    fetchJson<any>('/readings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Alerts
  getAlerts: (params?: { acknowledged?: boolean; severity?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.acknowledged !== undefined) q.append('acknowledged', params.acknowledged.toString());
    if (params?.severity) q.append('severity', params.severity);
    if (params?.limit) q.append('limit', params.limit.toString());
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return fetchJson<AlertItem[]>(`/alerts${queryString}`);
  },

  acknowledgeAlert: (id: number, acknowledgedBy: string = 'Admin Operator') =>
    fetchJson<AlertItem>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ acknowledged_by: acknowledgedBy }),
    }),

  // Routing
  getRouteGraph: () => fetchJson<GraphInfoResponse>('/routes/graph'),

  calculateRoute: (data: { origin_node_id: string; destination_node_id: string; avoid_blocked?: boolean }) =>
    fetchJson<RouteResponse>('/routes/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Simulator
  getSimulatorStatus: () => fetchJson<SimulatorStatus>('/simulator/status'),

  startSimulator: (data?: { interval_seconds?: number; scenario?: string }) =>
    fetchJson<SimulatorStatus>('/simulator/start', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  stopSimulator: () =>
    fetchJson<SimulatorStatus>('/simulator/stop', {
      method: 'POST',
    }),

  stepSimulator: () =>
    fetchJson<any>('/simulator/step', {
      method: 'POST',
    }),

  setSimulatorScenario: (scenarioName: string) =>
    fetchJson<SimulatorStatus>('/simulator/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario_name: scenarioName }),
    }),

  injectManualReading: (data: { location_id: string; water_depth_cm: number; source?: string }) =>
    fetchJson<any>('/simulator/manual-reading', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetDemoData: () =>
    fetchJson<{ success: boolean; message: string; simulator_status: SimulatorStatus }>('/simulator/reset', {
      method: 'POST',
    }),

  // AI Assistant
  sendAIChat: (query: string, conversationHistory: { role: string; content: string }[] = []) =>
    fetchJson<{
      response: string;
      provider: string;
      model: string;
      error_note?: string;
      grounding_data?: any;
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ query, conversation_history: conversationHistory }),
    }),

  // Settings
  getSettings: () => fetchJson<SystemSettings>('/settings'),

  updateSettings: (data: Partial<SystemSettings>) =>
    fetchJson<SystemSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
