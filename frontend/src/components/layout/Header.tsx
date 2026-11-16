import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  Bot,
  Play,
  Square,
  RefreshCw,
  Bell,
  Activity
} from 'lucide-react';
import { api } from '../../services/api';

export const Header: React.FC = () => {
  const { dashboardData, simulator, refreshAll, isCopilotOpen, setIsCopilotOpen, setActivePage, logout } = useApp();
  const [actionLoading, setActionLoading] = React.useState(false);

  const unackedAlerts = dashboardData?.recent_alerts?.filter(a => !a.is_acknowledged) || [];

  const handleToggleSimulator = async () => {
    setActionLoading(true);
    try {
      if (simulator?.is_running) {
        await api.stopSimulator();
      } else {
        await api.startSimulator({ interval_seconds: 5, scenario: simulator?.active_scenario || 'MONSOON_SURGE' });
      }
      await refreshAll();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStepPulse = async () => {
    setActionLoading(true);
    try {
      await api.stepSimulator();
      await refreshAll();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-6 z-20 shadow-sm">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-md">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-wider text-white">WAVEGUARD</span>
            <span className="bg-cyan-900/80 text-cyan-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-cyan-700/60 uppercase">
              Bengaluru 3D
            </span>
          </div>
          <p className="text-[11px] text-slate-300 hidden md:block">
            3D Urban Waterlogging Monitoring & Safe Route Guidance System
          </p>
        </div>
      </div>

      {/* Center status badges */}
      <div className="hidden lg:flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Pipeline: <strong className="text-white">SIMULATED DEMO</strong></span>
        </div>

        {dashboardData && (
          <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded">
            <span className="text-emerald-400 font-medium">● {dashboardData.summary.normal_locations} Normal</span>
            <span className="text-amber-400 font-medium">● {dashboardData.summary.caution_locations} Caution</span>
            <span className="text-red-400 font-medium">● {dashboardData.summary.blocked_locations} Blocked</span>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3">
        {/* Simulator controls */}
        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-md p-1 space-x-1">
          <button
            onClick={handleToggleSimulator}
            disabled={actionLoading}
            title={simulator?.is_running ? 'Stop Simulation Loop' : 'Start Simulation Loop'}
            className={`px-2.5 py-1 text-xs rounded font-medium flex items-center space-x-1.5 transition-colors ${
              simulator?.is_running
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {simulator?.is_running ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Simulate</span>
              </>
            )}
          </button>

          <button
            onClick={handleStepPulse}
            disabled={actionLoading}
            title="Step One Simulation Tick"
            className="px-2 py-1 text-xs rounded font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refreshAll()}
          title="Refresh Data"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Alerts Bell */}
        <button
          onClick={() => setActivePage('alerts')}
          className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          title="View Alerts"
        >
          <Bell className="w-4 h-4" />
          {unackedAlerts.length > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
              {unackedAlerts.length}
            </span>
          )}
        </button>

        {/* AI Assistant Drawer Button */}
        <button
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            isCopilotOpen
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-800/80'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
        >
          Log out
        </button>
      </div>
    </header>
  );
};
