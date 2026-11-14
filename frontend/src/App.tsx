import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// 12 Platform View Pages
import { OverviewDashboard } from './pages/OverviewDashboard';
import { Map3DView } from './pages/Map3DView';
import { SusceptibilityAnalysis } from './pages/SusceptibilityAnalysis';
import { TerrainHydrology } from './pages/TerrainHydrology';
import { HotspotExplorer } from './pages/HotspotExplorer';
import { SensorMonitoring } from './pages/SensorMonitoring';
import { DrainageIntelligence } from './pages/DrainageIntelligence';
import { LiveIncidents } from './pages/LiveIncidents';
import { RoadSafetyRouting } from './pages/RoadSafetyRouting';
import { HistoricalAnalysis } from './pages/HistoricalAnalysis';
import { DataSourcesRegistry } from './pages/DataSourcesRegistry';
import { SettingsAdmin } from './pages/SettingsAdmin';
import { AICopilotDrawer } from './components/ai/AICopilotDrawer';

const MainContent: React.FC = () => {
  const { activePage } = useApp();

  return (
    <main className="flex-1 h-full overflow-hidden relative">
      {activePage === 'overview' && <OverviewDashboard />}
      {activePage === 'map3d' && <Map3DView />}
      {activePage === 'susceptibility' && <SusceptibilityAnalysis />}
      {activePage === 'terrain' && <TerrainHydrology />}
      {activePage === 'hotspots' && <HotspotExplorer />}
      {activePage === 'sensors' && <SensorMonitoring />}
      {activePage === 'drainage' && <DrainageIntelligence />}
      {activePage === 'incidents' && <LiveIncidents />}
      {activePage === 'routing' && <RoadSafetyRouting />}
      {activePage === 'historical' && <HistoricalAnalysis />}
      {activePage === 'datasets' && <DataSourcesRegistry />}
      {activePage === 'settings' && <SettingsAdmin />}
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-navy-950 font-sans">
        <Header />
        <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>
        <AICopilotDrawer />
      </div>
    </AppProvider>
  );
};

export default App;
