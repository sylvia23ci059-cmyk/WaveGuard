import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Activity,
  CloudRain,
  Shield,
  Radio,
  Play,
  RotateCcw,
  Zap,
  UserCheck
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    weather,
    userRole,
    setUserRole,
    triggerSimulationScenario,
    isSimulating,
    wsConnected,
    sensors
  } = useApp();

  // Determine overall city alert status from sensors
  const hasCritical = sensors.some(s => s.status === 'critical');
  const hasWarning = sensors.some(s => s.status === 'warning');

  let alertBadge = {
    label: 'NORMAL BASEFLOW',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  };
  if (hasCritical) {
    alertBadge = {
      label: 'CRITICAL INUNDATION ALERT',
      color: 'bg-red-500/20 text-red-400 border-red-500/50 glow-crimson'
    };
  } else if (hasWarning) {
    alertBadge = {
      label: 'ELEVATED CHANNEL SURGE WATCH',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/40 glow-amber'
    };
  }

  return (
    <header className="h-16 bg-navy-900 border-b border-navy-700/80 px-4 flex items-center justify-between z-30 shrink-0">
      {/* Brand & Study Area Identification */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-glow shadow-[0_0_12px_rgba(0,242,254,0.3)]">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-wider text-white font-mono flex items-center">
              WAVE<span className="text-cyan-glow">GUARD</span>
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-navy-800 border border-cyan-500/30 text-cyan-400 rounded">
                KGF
              </span>
            </h1>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${alertBadge.color}`}>
              {alertBadge.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 tracking-tight flex items-center">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5"></span>
            3D Urban Flood Intelligence & Situational Awareness &bull; Kolar Gold Fields Taluk
          </p>
        </div>
      </div>

      {/* Center: Live Meteorological & Environmental Telemetry */}
      <div className="hidden lg:flex items-center space-x-6 bg-navy-950/80 px-4 py-1.5 rounded-lg border border-navy-800">
        <div className="flex items-center space-x-2">
          <CloudRain className="w-4 h-4 text-cyan-400" />
          <div className="text-xs">
            <span className="text-slate-400">Precipitation:</span>{' '}
            <span className="font-mono font-bold text-white">
              {weather ? `${weather.precipitation_mm} mm` : '0.0 mm'}
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-navy-700" />

        <div className="text-xs">
          <span className="text-slate-400">Temp:</span>{' '}
          <span className="font-mono font-bold text-white">
            {weather ? `${weather.temperature_c}°C` : '27°C'}
          </span>
        </div>

        <div className="h-4 w-px bg-navy-700" />

        <div className="text-xs">
          <span className="text-slate-400">Humidity:</span>{' '}
          <span className="font-mono font-bold text-white">
            {weather ? `${weather.relative_humidity_pct}%` : '74%'}
          </span>
        </div>

        <div className="h-4 w-px bg-navy-700" />

        <div className="flex items-center space-x-1.5 text-xs">
          <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="font-mono text-[11px] text-slate-300">
            {wsConnected ? 'LIVE WS FEED' : 'OFFLINE WS'}
          </span>
        </div>
      </div>

      {/* Right Controls: Simulator Controls & Role Switcher */}
      <div className="flex items-center space-x-3">
        {/* Scenario Simulator Buttons */}
        <div className="hidden md:flex items-center bg-navy-950/90 border border-navy-700 rounded-lg p-1 space-x-1">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 text-slate-400 border-r border-navy-800">
            DEMO SIMULATOR
          </span>
          <button
            onClick={() => triggerSimulationScenario('convective_storm')}
            disabled={isSimulating}
            className="px-2.5 py-1 text-xs font-medium rounded bg-navy-800 hover:bg-navy-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 flex items-center space-x-1 transition disabled:opacity-50"
            title="Simulate sudden convective cloudburst runoff"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Storm Surge</span>
          </button>
          <button
            onClick={() => triggerSimulationScenario('drainage_subsidence')}
            disabled={isSimulating}
            className="px-2.5 py-1 text-xs font-medium rounded bg-navy-800 hover:bg-navy-700 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 flex items-center space-x-1 transition disabled:opacity-50"
            title="Simulate post-storm water recession"
          >
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            <span>Recession</span>
          </button>
          <button
            onClick={() => triggerSimulationScenario('normal_baseflow')}
            disabled={isSimulating}
            className="px-2 py-1 text-xs font-medium rounded bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition disabled:opacity-50"
            title="Reset to baseline dry weather flow"
          >
            <span>Reset</span>
          </button>
        </div>

        {/* Role Selector (RBAC) */}
        <div className="flex items-center space-x-1.5 bg-navy-800/80 px-2.5 py-1.5 rounded-lg border border-navy-700">
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="admin" className="bg-navy-900 text-white">Chief Disaster Admin</option>
            <option value="engineer" className="bg-navy-900 text-white">Drainage Engineer</option>
            <option value="surveyor" className="bg-navy-900 text-white">Field Surveyor</option>
            <option value="public" className="bg-navy-900 text-white">Public Resident</option>
          </select>
        </div>
      </div>
    </header>
  );
};
