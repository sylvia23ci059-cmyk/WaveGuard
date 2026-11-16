import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { DashboardSummaryData, LocationItem, AlertItem, SimulatorStatus } from '../types';

export type NavPage =
  | 'overview'
  | 'map3d'
  | 'locations'
  | 'monitoring'
  | 'alerts'
  | 'routing'
  | 'ai'
  | 'settings';

interface AppContextType {
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
  dashboardData: DashboardSummaryData | null;
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  setSelectedLocation: (loc: LocationItem | null) => void;
  alerts: AlertItem[];
  simulator: SimulatorStatus | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  refreshAll: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavPage>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardSummaryData | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [simulator, setSimulator] = useState<SimulatorStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('waveguard-authenticated') === 'true';
  });
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('waveguard-authenticated', String(isAuthenticated));
    }
  }, [isAuthenticated]);

  const login = useCallback((username: string, password: string) => {
    const normalizedUser = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (normalizedUser === 'admin' && normalizedPassword === 'waveguard123') {
      setIsAuthenticated(true);
      setActivePage('overview');
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setActivePage('overview');
    setIsCopilotOpen(false);
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getDashboardSummary();
      setDashboardData(data);
      setSimulator(data.simulator);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch dashboard summary:', err);
      setDashboardData(null);
      setError(err.message || 'Error connecting to WaveGuard backend');
    }
  }, []);

  const refreshLocations = useCallback(async () => {
    try {
      const data = await api.getLocations();
      setLocations(data);
    } catch (err: any) {
      console.error('Failed to fetch locations:', err);
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    try {
      const data = await api.getAlerts({ limit: 50 });
      setAlerts(data);
    } catch (err: any) {
      console.error('Failed to fetch alerts:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.allSettled([refreshDashboard(), refreshLocations(), refreshAlerts()]);
    setIsLoading(false);
  }, [refreshDashboard, refreshLocations, refreshAlerts]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Periodic polling every 6 seconds to update live simulator readings
  useEffect(() => {
    const timer = setInterval(() => {
      refreshDashboard();
      refreshLocations();
    }, 6000);
    return () => clearInterval(timer);
  }, [refreshDashboard, refreshLocations]);

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        dashboardData,
        locations,
        selectedLocation,
        setSelectedLocation,
        alerts,
        simulator,
        isLoading,
        error,
        isAuthenticated,
        login,
        logout,
        refreshAll,
        refreshDashboard,
        refreshLocations,
        refreshAlerts,
        isCopilotOpen,
        setIsCopilotOpen,
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
