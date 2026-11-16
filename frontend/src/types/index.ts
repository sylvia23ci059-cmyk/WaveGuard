export type LocationStatus = 'NORMAL' | 'CAUTION' | 'BLOCKED' | 'UNKNOWN';

export interface LocationItem {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  category: string;
  road_identifier?: string;
  caution_threshold_cm: number;
  closure_threshold_cm: number;
  is_active: boolean;
  verification_status: string;
  current_status: LocationStatus;
  current_water_depth_cm: number;
  last_reading_time?: string | null;
  source_info: string;
  sensor_installed?: boolean;
  sensor_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WaterReading {
  id: number;
  location_id: string;
  location_name?: string;
  water_depth_cm: number;
  timestamp: string;
  source: string;
  validation_status: string;
  validation_note?: string;
}

export interface AlertItem {
  id: number;
  location_id: string;
  location_name?: string;
  alert_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  description: string;
  timestamp: string;
  is_acknowledged: boolean;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
}

export interface SimulatorStatus {
  is_running: boolean;
  interval_seconds: number;
  readings_generated_count: number;
  active_scenario: string;
  last_tick_time?: string | null;
  data_source_mode: string;
}

export interface DashboardSummaryData {
  summary: {
    total_locations: number;
    normal_locations: number;
    caution_locations: number;
    blocked_locations: number;
    unknown_locations: number;
  };
  distribution: {
    NORMAL: number;
    CAUTION: number;
    BLOCKED: number;
    UNKNOWN: number;
  };
  recent_readings: WaterReading[];
  recent_alerts: AlertItem[];
  last_system_update: string;
  simulator: SimulatorStatus;
  data_source_indicator: {
    mode: string;
    disclosure: string;
    study_area: string;
  };
}

export interface GraphNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface GraphEdge {
  id: string;
  from_node: string;
  to_node: string;
  name: string;
  distance_km: number;
  associated_location_id?: string | null;
  status: string;
  coordinates: number[][];
}

export interface GraphInfoResponse {
  graph_id: string;
  name: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RouteSegmentDetail {
  edge_id: string;
  from_node: string;
  to_node: string;
  name: string;
  distance_km: number;
  status: string;
  associated_location_id?: string | null;
  associated_location_name?: string | null;
  water_depth_cm?: number | null;
  coordinates: number[][];
}

export interface RouteResponse {
  success: boolean;
  path_nodes: string[];
  total_distance_km: number;
  segments: RouteSegmentDetail[];
  blocked_segments_avoided: any[];
  caution_segments_included: any[];
  is_safe: boolean;
  explanation: string;
  geometry_geojson: {
    type: string;
    features: any[];
  };
  disclaimer: string;
}

export interface SystemSettings {
  project_name: string;
  version: string;
  environment: string;
  database_url: string;
  freshness_window_minutes: number;
  simulator_interval_seconds: number;
  groq_configured: boolean;
  groq_key_preview: string;
  groq_model: string;
  data_source_mode: string;
  study_area: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  provider?: string;
  model?: string;
  error_note?: string;
}
