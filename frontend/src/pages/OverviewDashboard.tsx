import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapContainer } from '../components/map/MapContainer';
import {
  ShieldAlert,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Activity,
  Play,
  Square,
  ArrowRight,
  Clock,
  Database,
  Radio,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export const OverviewDashboard: React.FC = () => {
  const { dashboardData, simulator, refreshAll, setActivePage, setSelectedLocation, error, isLoading } = useApp();
  const [scenarioLoading, setScenarioLoading] = useState(false);

  if (!dashboardData) {
    if (isLoading) {
      return (
        <div className="flex-1 h-full flex items-center justify-center bg-slate-50 text-slate-500">
          <div className="flex flex-col items-center space-y-3">
            <Activity className="w-8 h-8 text-cyan-600 animate-spin" />
            <p className="text-sm font-medium">Connecting to WaveGuard Backend Telemetry...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 h-full flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex max-w-md flex-col items-center space-y-4 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <XCircle className="w-10 h-10 text-red-500" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Dashboard unavailable</h2>
            <p className="text-sm text-slate-600">
              {error || 'WaveGuard could not connect to the backend telemetry service.'}
            </p>
          </div>
          <button
            onClick={() => refreshAll()}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  const { summary, distribution, recent_readings, recent_alerts, last_system_update, data_source_indicator } = dashboardData;

  const handleScenarioChange = async (scenario: string) => {
    setScenarioLoading(true);
    try {
      await api.setSimulatorScenario(scenario);
      await api.stepSimulator();
      await refreshAll();
    } catch (err) {
      console.error(err);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await api.acknowledgeAlert(id, 'Admin Operator');
      await refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bengaluru Urban Waterlogging Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time underpass inundation surveillance, hydraulic classification, and automated detour coordination.
          </p>
        </div>

        {/* Data Source Disclosure */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg shadow-sm text-xs">
          <Radio className="w-4 h-4 text-cyan-600 shrink-0" />
          <div>
            <div className="font-semibold text-slate-800">{data_source_indicator.mode}</div>
            <div className="text-[10px] text-slate-500">{data_source_indicator.disclosure}</div>
          </div>
        </div>
      </div>

      {/* 5 Main Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monitored Sites</span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.total_locations}</div>
          <p className="text-[11px] text-slate-400 mt-1">BBMP underpass inventory</p>
        </div>

        {/* Normal */}
        <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Normal</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.normal_locations}</div>
          <p className="text-[11px] text-emerald-600 mt-1">&lt; Caution depth clearance</p>
        </div>

        {/* Caution */}
        <div className="bg-white border border-amber-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Caution</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.caution_locations}</div>
          <p className="text-[11px] text-amber-600 mt-1">Waterlogging present</p>
        </div>

        {/* Blocked */}
        <div className="bg-white border border-red-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-red-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Blocked</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.blocked_locations}</div>
          <p className="text-[11px] text-red-600 mt-1">Critical closure threshold</p>
        </div>

        {/* Unknown / Stale */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unknown / Stale</span>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.unknown_locations}</div>
          <p className="text-[11px] text-slate-400 mt-1">&gt; 30 min without pulse</p>
        </div>
      </div>

      {/* Simulator Scenario Injection Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs">
          <Activity className="w-4 h-4 text-cyan-600 shrink-0" />
          <span className="font-semibold text-slate-800">Weather & Hydraulic Scenario Injector:</span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
            Active: {simulator?.active_scenario || 'MONSOON_SURGE'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'DRY_WEATHER', label: 'Dry Weather' },
            { id: 'LIGHT_SHOWERS', label: 'Light Showers' },
            { id: 'MONSOON_SURGE', label: 'Monsoon Surge' },
            { id: 'FLASH_FLOOD', label: 'Flash Cloudburst' },
            { id: 'RECEDING', label: 'Pump Drainage' },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleScenarioChange(sc.id)}
              disabled={scenarioLoading}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                simulator?.active_scenario === sc.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Middle Grid: Interactive Map Preview + Distribution & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Preview (2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">Interactive 3D Bengaluru Underpass Map</span>
              <span className="text-[11px] text-slate-400">({summary.total_locations} active sites)</span>
            </div>
            <button
              onClick={() => setActivePage('map3d')}
              className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold flex items-center space-x-1"
            >
              <span>Full Screen 3D</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-96 w-full relative">
            <MapContainer heightClass="h-96" />
          </div>
        </div>

        {/* Status Distribution & System Health (1 Column) */}
        <div className="space-y-6">
          {/* Status Distribution Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Status Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Normal Clearance</span>
                  <span className="text-slate-900 font-bold">
                    {distribution.NORMAL} ({Math.round((distribution.NORMAL / (summary.total_locations || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(distribution.NORMAL / (summary.total_locations || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Caution Inundation</span>
                  <span className="text-slate-900 font-bold">
                    {distribution.CAUTION} ({Math.round((distribution.CAUTION / (summary.total_locations || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(distribution.CAUTION / (summary.total_locations || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Confirmed Blocked</span>
                  <span className="text-slate-900 font-bold">
                    {distribution.BLOCKED} ({Math.round((distribution.BLOCKED / (summary.total_locations || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(distribution.BLOCKED / (summary.total_locations || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Unknown / Stale</span>
                  <span className="text-slate-900 font-bold">
                    {distribution.UNKNOWN} ({Math.round((distribution.UNKNOWN / (summary.total_locations || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(distribution.UNKNOWN / (summary.total_locations || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Last Cycle:</span>
              <span className="font-mono text-slate-700">
                {last_system_update ? new Date(last_system_update).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Quick Rerouting Callout */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl p-5 shadow-sm">
            <h4 className="font-bold text-sm text-cyan-300 mb-1">Dijkstra Safe Route Guidance</h4>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              When arterial underpasses flood, WaveGuard automatically recalculates paths across Bengaluru's road graph to detour around blocked segments.
            </p>
            <button
              onClick={() => setActivePage('routing')}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-2 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Test Detour Routing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Readings & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Water-Level Readings Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Telemetry Readings</h3>
            </div>
            <button
              onClick={() => setActivePage('monitoring')}
              className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold"
            >
              View All Readings
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Depth (cm)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recent_readings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{r.location_name}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold">{r.water_depth_cm} cm</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.validation_status === 'VALID' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {r.validation_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts List */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Recent Waterlogging Alerts</h3>
            </div>
            <button
              onClick={() => setActivePage('alerts')}
              className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold"
            >
              Alert Dashboard
            </button>
          </div>

          {recent_alerts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No recent alerts recorded. All monitored corridors operating within normal parameters.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recent_alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50/60 border-red-200 text-red-950'
                      : alert.severity === 'WARNING'
                      ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                      : 'bg-blue-50/60 border-blue-200 text-blue-950'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {alert.severity}
                      </span>
                      <strong className="text-slate-900 font-semibold">{alert.location_name}</strong>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-1 leading-snug">{alert.description}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {!alert.is_acknowledged ? (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-[10px] shrink-0"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center space-x-0.5 shrink-0">
                      <Check className="w-3 h-3" />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
