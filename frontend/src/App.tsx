import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AICopilotDrawer } from './components/ai/AICopilotDrawer';

// 8 Platform Pages
import { OverviewDashboard } from './pages/OverviewDashboard';
import { Map3DView } from './pages/Map3DView';
import { LocationManagement } from './pages/LocationManagement';
import { WaterMonitoring } from './pages/WaterMonitoring';
import { AlertsAndIncidents } from './pages/AlertsAndIncidents';
import { RouteGuidance } from './pages/RouteGuidance';
import { AIAssistant } from './pages/AIAssistant';
import { SettingsView } from './pages/SettingsView';
import { LoginPage } from './pages/LoginPage';

const MainContent: React.FC = () => {
  const { activePage } = useApp();

  return (
    <main className="flex-1 h-full overflow-hidden relative bg-white">
      {activePage === 'overview' && <OverviewDashboard />}
      {activePage === 'map3d' && <Map3DView />}
      {activePage === 'locations' && <LocationManagement />}
      {activePage === 'monitoring' && <WaterMonitoring />}
      {activePage === 'alerts' && <AlertsAndIncidents />}
      {activePage === 'routing' && <RouteGuidance />}
      {activePage === 'ai' && <AIAssistant />}
      {activePage === 'settings' && <SettingsView />}
    </main>
  );
};

const AppShell: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white font-sans text-slate-800">
      <Header />
      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <AICopilotDrawer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
};

export default App;
