import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserRole,
  MapLayerState,
  Hotspot,
  IoTStation,
  Incident,
  WeatherCurrent,
  TerrainSampleResult
} from '../types';
import { api } from '../services/api';

interface AppContextType {
  activePage: string;
  setActivePage: (page: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  layers: MapLayerState;
  toggleLayer: (layerName: keyof MapLayerState) => void;
  hotspots: Hotspot[];
  sensors: IoTStation[];
  incidents: Incident[];
  weather: WeatherCurrent | null;
  selectedHotspot: Hotspot | null;
  setSelectedHotspot: (h: Hotspot | null) => void;
  selectedSensor: IoTStation | null;
  setSelectedSensor: (s: IoTStation | null) => void;
  sampledTerrain: TerrainSampleResult | null;
  setSampledTerrain: (res: TerrainSampleResult | null) => void;
  isSimulating: boolean;
  refreshData: () => Promise<void>;
  triggerSimulationScenario: (scenario: string) => Promise<void>;
  wsConnected: boolean;
}

const defaultLayers: MapLayerState = {
  baseMap: true,
  satellite: false,
  buildings3d: true,
  terrainElevation: true,
  hillshade: true,
  slope: false,
  flowAccumulation: false,
  naturalDrainage: true,
  mappedDrainage: true,
  floodSusceptibility: true,
  rainfall: false,
  waterSensors: true,
  roadWaterlogging: true,
  roadClosures: true,
  emergencySos: true,
  proposedSensors: false
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<string>('overview');
  const [userRole, setUserRole] = useState<UserRole>('admin'); // Default admin so user can test all features
  const [layers, setLayers] = useState<MapLayerState>(defaultLayers);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [sensors, setSensors] = useState<IoTStation[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<IoTStation | null>(null);
  const [sampledTerrain, setSampledTerrain] = useState<TerrainSampleResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const toggleLayer = (layerName: keyof MapLayerState) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const refreshData = async () => {
    try {
      const [h, s, inc, w] = await Promise.all([
        api.getHotspots(),
        api.getSensors(),
        api.getIncidents(),
        api.getCurrentWeather()
      ]);
      setHotspots(h);
      setSensors(s);
      setIncidents(inc);
      setWeather(w);
    } catch (e) {
      console.error('Error refreshing platform data:', e);
    }
  };

  const triggerSimulationScenario = async (scenario: string) => {
    setIsSimulating(true);
    try {
      await api.simulateSensorStep(scenario);
      await refreshData();
    } finally {
      setIsSimulating(false);
    }
  };

  // Initial fetch and WebSocket connection
  useEffect(() => {
    refreshData();

    // Setup WebSocket
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
      
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
          console.log('[WaveGuard WS] Connected to live situational stream');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'SENSOR_TELEMETRY_UPDATE') {
              refreshData();
            } else if (data.type === 'NEW_INCIDENT_REPORTED') {
              refreshData();
            }
          } catch (err) {
            console.error('WS parse error:', err);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWS, 4000);
        };

        ws.onerror = () => {
          setWsConnected(false);
        };
      } catch (err) {
        console.warn('WS initialization fallback:', err);
      }
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        userRole,
        setUserRole,
        layers,
        toggleLayer,
        hotspots,
        sensors,
        incidents,
        weather,
        selectedHotspot,
        setSelectedHotspot,
        selectedSensor,
        setSelectedSensor,
        sampledTerrain,
        setSampledTerrain,
        isSimulating,
        refreshData,
        triggerSimulationScenario,
        wsConnected
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
