import React from 'react';
import { useApp } from '../context/AppContext';
import { MapContainer } from '../components/map/MapContainer';
import {
  ShieldAlert,
  Droplets,
  Cpu,
  AlertTriangle,
  Navigation,
  ArrowRight,
  Wind,
  CheckCircle2,
  Clock,
  Compass
} from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const {
    hotspots,
    sensors,
    incidents,
    weather,
    setActivePage,
    triggerSimulationScenario,
    isSimulating
  } = useApp();

  const criticalHotspots = hotspots.filter(h => h.inspection_priority === 'critical');
  const alertSensors = sensors.filter(s => s.status !== 'online');
  const unverifiedIncidents = incidents.filter(i => i.verification_status === 'unverified');

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-4 bg-navy-950">
      {/* 1. Executive Situational Awareness Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-navy-700/80 rounded-xl p-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-base font-bold font-mono tracking-wide text-white uppercase">
              Kolar Gold Fields &bull; Situational Awareness Command Overview
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Automated hydrological screening, DEM topographic flow analysis, and IoT sensor fleet telemetry.
          </p>
        </div>

        <div className="mt-3 md:mt-0 flex items-center space-x-2">
          <button
            onClick={() => setActivePage('map3d')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-glow border border-cyan-500/40 glow-cyan transition flex items-center space-x-1.5"
          >
            <span>Open 3D Digital Twin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top Analytical Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1: Taluk Coverage */}
        <div className="bg-navy-900/90 border border-navy-700/70 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[10px] uppercase">Taluk Extent</span>
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">442.8 km²</div>
          <div className="text-[10px] text-cyan-400/80 font-mono mt-0.5">EPSG:32644 UTM 44N &bull; Taluk 1912</div>
        </div>

        {/* KPI 2: Critical Hotspots */}
        <div className="bg-navy-900/90 border border-navy-700/70 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[10px] uppercase">Candidate Hotspots</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-baseline space-x-1.5">
            <span>{hotspots.length}</span>
            <span className="text-xs font-normal text-red-400">({criticalHotspots.length} Critical)</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Topographic Depression Model</div>
        </div>

        {/* KPI 3: IoT Sensor Fleet */}
        <div className="bg-navy-900/90 border border-navy-700/70 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[10px] uppercase">IoT Stations</span>
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-baseline space-x-1.5">
            <span>{sensors.length} Active</span>
            {alertSensors.length > 0 && (
              <span className="text-xs font-normal text-amber-400">({alertSensors.length} Alert)</span>
            )}
          </div>
          <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">DEMONSTRATION DATA</div>
        </div>

        {/* KPI 4: Live Precipitation */}
        <div className="bg-navy-900/90 border border-navy-700/70 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[10px] uppercase">Live Rainfall</span>
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {weather ? `${weather.precipitation_mm} mm` : '0.0 mm'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Open-Meteo Satellite Model</div>
        </div>
      </div>

      {/* 3. Center Section: Map Preview + Situational Intelligence Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[460px]">
        {/* Left 2 Cols: Interactive Map Preview */}
        <div className="lg:col-span-2 bg-navy-900/80 border border-navy-700 rounded-xl overflow-hidden relative shadow-xl flex flex-col">
          <div className="h-9 bg-navy-900 border-b border-navy-800 px-3 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="font-semibold text-white">KGF Digital Twin Map Preview</span>
              <span className="text-[10px] text-slate-400">| 3D Buildings & Natural Pathways</span>
            </div>
            <button
              onClick={() => setActivePage('map3d')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1"
            >
              <span>Full Screen</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 relative">
            <MapContainer showLayerControls={false} />
          </div>
        </div>

        {/* Right Col: High-Priority Hotspot Feed & Incidents Queue */}
        <div className="bg-navy-900/80 border border-navy-700 rounded-xl p-3.5 flex flex-col justify-between shadow-xl space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-navy-800">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Priority Vulnerability Feed
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{hotspots.length} Screened</span>
            </div>

            <div className="space-y-2 mt-3 overflow-y-auto max-h-[320px] pr-1">
              {hotspots.slice(0, 4).map((h) => (
                <div
                  key={h.id}
                  onClick={() => setActivePage('hotspots')}
                  className="p-2.5 rounded-lg bg-navy-950/70 border border-navy-800 hover:border-cyan-500/40 cursor-pointer transition space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-white">{h.name}</span>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                        h.inspection_priority === 'critical'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {h.inspection_priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Elev: {h.elevation_m}m &bull; Slope: {h.slope_deg}°</span>
                    <span className="text-cyan-400">Score: {(h.susceptibility_score * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{h.recommended_action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Citizen Actions & Rerouting Callout */}
          <div className="pt-2 border-t border-navy-800 space-y-2">
            <button
              onClick={() => setActivePage('routing')}
              className="w-full py-2 px-3 rounded-lg bg-navy-800 hover:bg-navy-750 text-white text-xs font-medium border border-navy-700 flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-2">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>Check Safe Road Detours</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => setActivePage('incidents')}
              className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/30 flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Submit Incident / Emergency SOS</span>
              </div>
              <span className="text-[10px] font-mono bg-red-500/20 px-1.5 py-0.5 rounded">112</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom IoT Sensor Live Status Fleet Strip */}
      <div className="bg-navy-900/90 border border-navy-700 rounded-xl p-3.5 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              IoT Sensor Fleet Telemetry
            </span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
              DEMONSTRATION DATA
            </span>
          </div>
          <button
            onClick={() => setActivePage('sensors')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1"
          >
            <span>Sensor Dashboard</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {sensors.map((s) => (
            <div
              key={s.id}
              onClick={() => setActivePage('sensors')}
              className={`p-2.5 rounded-lg border cursor-pointer transition ${
                s.status === 'critical'
                  ? 'bg-red-500/10 border-red-500/40'
                  : s.status === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-navy-950/80 border-navy-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-white mb-1">
                <span>{s.station_code}</span>
                <span className={`text-[8px] uppercase px-1 py-0.5 rounded ${
                  s.status === 'critical' ? 'bg-red-500 text-black font-bold' : s.status === 'warning' ? 'bg-amber-500 text-black font-bold' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {s.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 truncate mb-1">{s.name}</div>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xs text-slate-400">Depth:</span>
                <span className="text-sm font-bold text-white">{s.current_water_level_m} m</span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                Warn: {s.warning_threshold_m}m &bull; Crit: {s.critical_threshold_m}m
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
