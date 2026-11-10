export type UserRole = 'public' | 'surveyor' | 'engineer' | 'admin';

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface KGFBoundaryFeature {
  type: 'Feature';
  properties: {
    name: string;
    boundary_type: string;
    crs: string;
    area_sqkm: number;
    source: string;
    bbox: BoundingBox;
    centroid: {
      latitude: number;
      longitude: number;
    };
  };
  geometry: any;
}

export interface DEMProduct {
  id: number;
  layer_type: 'elevation' | 'slope' | 'hillshade' | 'flow_accumulation' | 'twi' | 'depressions' | 'susceptibility';
  file_path: string;
  grid_width: number;
  grid_height: number;
  cell_size_m: number;
  min_value: number;
  max_value: number;
  mean_value: number;
  unit: string;
  crs: string;
}

export interface TerrainSampleResult {
  in_study_area: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  elevation_m?: number;
  slope_degrees?: number;
  flow_accumulation_cells?: number;
  catchment_area_upstream_ha?: number;
  topographic_wetness_index?: number;
  flood_susceptibility_score?: number;
  susceptibility_category?: string;
  scientific_disclaimer?: string;
  message?: string;
}

export interface Hotspot {
  id: number;
  hotspot_code: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  slope_deg: number;
  flow_accum_pixels: number;
  catchment_area_ha: number;
  nearby_drainage_type: string;
  historical_evidence: string;
  verification_status: 'unverified' | 'field_surveyed' | 'confirmed_hotspot' | 'rejected';
  inspection_priority: 'critical' | 'high' | 'medium' | 'low';
  susceptibility_score: number;
  confidence_score: number;
  recommended_action: string;
  created_at?: string;
  updated_at?: string;
}

export interface IoTStation {
  id: number;
  station_code: string;
  name: string;
  latitude: number;
  longitude: number;
  channel_name: string;
  installation_type: 'nallah_bridge' | 'culvert' | 'underpass' | 'storm_channel' | 'weather_station';
  is_simulated: boolean;
  provenance_label: 'DEMONSTRATION DATA' | 'FIELD_HARDWARE';
  warning_threshold_m: number;
  critical_threshold_m: number;
  max_channel_depth_m: number;
  current_water_level_m: number;
  current_rainfall_mm: number;
  battery_pct: number;
  signal_rssi: number;
  status: 'online' | 'warning' | 'critical' | 'offline' | 'maintenance';
  last_seen: string;
}

export interface DrainageReach {
  id: number;
  reach_name: string;
  upstream_station: string;
  downstream_station: string;
  upstream_level_m: number;
  downstream_level_m: number;
  differential_head_m: number;
  status: 'normal' | 'rising_water' | 'possible_restriction' | 'possible_overflow' | 'sensor_fault' | 'insufficient_information';
  diagnosis_notes: string;
  disclaimer: string;
}

export interface Incident {
  id: number;
  incident_number: string;
  category: 'waterlogging' | 'blocked_drain' | 'road_impassable' | 'infrastructure_damage' | 'emergency_sos';
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location_name: string;
  reporter_type: 'citizen' | 'field_engineer' | 'sensor_automated';
  reporter_contact?: string;
  verification_status: 'unverified' | 'investigating' | 'verified' | 'resolved' | 'false_alarm';
  severity: 'low' | 'medium' | 'high' | 'critical';
  photo_url?: string;
  reported_at: string;
  verified_at?: string;
  assigned_team?: string;
}

export interface RoadSegmentFeature {
  type: string;
  id: number;
  properties: {
    name: string;
    osm_id: string;
    highway_type: string;
    status: 'open' | 'caution' | 'waterlogged' | 'closed';
    water_depth_cm: number;
    closure_reason?: string;
  };
  geometry: any;
}

export interface WeatherCurrent {
  location: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  temperature_c: number;
  relative_humidity_pct: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  weather_condition: string;
  source: string;
}

export interface DatasetMetadata {
  id: number;
  dataset_code: string;
  title: string;
  provider: string;
  url: string;
  download_date: string;
  spatial_resolution: string;
  crs: string;
  temporal_coverage: string;
  limitations: string;
  processing_history: string;
  status: string;
}

export interface MapLayerState {
  baseMap: boolean;
  satellite: boolean;
  buildings3d: boolean;
  terrainElevation: boolean;
  hillshade: boolean;
  slope: boolean;
  flowAccumulation: boolean;
  naturalDrainage: boolean;
  mappedDrainage: boolean;
  floodSusceptibility: boolean;
  rainfall: boolean;
  waterSensors: boolean;
  roadWaterlogging: boolean;
  roadClosures: boolean;
  emergencySos: boolean;
  proposedSensors: boolean;
}
