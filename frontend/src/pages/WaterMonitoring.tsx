import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Droplets,
  Play,
  Square,
  Activity,
  RotateCcw,
  PlusCircle,
  Clock,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle
} from 'lucide-react';

export const WaterMonitoring: React.FC = () => {
  const { locations, simulator, refreshAll } = useApp();
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || '');
  const [manualDepth, setManualDepth] = useState<number>(18.0);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  const handleToggleSimulator = async () => {
    try {
      if (simulator?.is_running) {
        await api.stopSimulator();
      } else {
        await api.startSimulator({ interval_seconds: 5, scenario: simulator?.active_scenario || 'MONSOON_SURGE' });
      }
      await refreshAll();
    } catch (err: any) {
      alert(`Error toggling simulator: ${err.message}`);
    }
  };

  const handleStepPulse = async () => {
    try {
      await api.stepSimulator();
      await refreshAll();
    } catch (err: any) {
      alert(`Error running simulation step: ${err.message}`);
    }
  };

  const handleScenarioChange = async (scenario: string) => {
    try {
      await api.setSimulatorScenario(scenario);
      await api.stepSimulator();
      await refreshAll();
    } catch (err: any) {
      alert(`Error updating scenario: ${err.message}`);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocationId) return;
    setIsSubmittingManual(true);
    setManualSuccessMsg(null);
    try {
      const res = await api.injectManualReading({
        location_id: selectedLocationId,
        water_depth_cm: manualDepth,
        source: 'MANUAL',
      });
      setManualSuccessMsg(`Injected ${manualDepth} cm reading for ${res.location_name} (Status: ${res.status})`);
      await refreshAll();
    } catch (err: any) {
      alert(`Error injecting reading: ${err.message}`);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all simulated telemetry and restore initial baseline conditions?')) {
      try {
        await api.resetDemoData();
        await refreshAll();
        alert('Demonstration database restored to baseline normal state.');
      } catch (err: any) {
        alert(`Error resetting data: ${err.message}`);
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 space-y-6 text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Water-Level Telemetry & Simulator Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate dynamic monsoon surge pulses, inject manual test measurements, and calibrate depth thresholds.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition-colors self-start md:self-auto shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Demonstration Baseline</span>
        </button>
      </div>

      {/* Simulator Control Dashboard Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              simulator?.is_running ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-slate-900">Background Telemetry Engine</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  simulator?.is_running ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {simulator?.is_running ? 'Running (Active Loop)' : 'Paused'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Emits synthetic ultrasonic depth measurements every {simulator?.interval_seconds || 5} seconds.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleSimulator}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors text-white shadow-sm ${
                simulator?.is_running ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {simulator?.is_running ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Pause Engine</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Engine</span>
                </>
              )}
            </button>

            <button
              onClick={handleStepPulse}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center space-x-1 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Step 1 Tick</span>
            </button>
          </div>
        </div>

        {/* Scenarios Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Simulated Storm Scenarios:</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'DRY_WEATHER', name: 'Dry Weather', desc: '0 – 3 cm (Normal)' },
              { id: 'LIGHT_SHOWERS', name: 'Light Showers', desc: '5 – 12 cm (Low)' },
              { id: 'MONSOON_SURGE', name: 'Monsoon Surge', desc: 'Marathahalli & Silk Board Blocked' },
              { id: 'FLASH_FLOOD', name: 'Cloudburst Surge', desc: 'Subways & Low-points Critical' },
              { id: 'RECEDING', name: 'Pump Drainage', desc: 'Receding back to clearance' },
            ].map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleScenarioChange(sc.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  simulator?.active_scenario === sc.id
                    ? 'bg-cyan-50/80 border-cyan-500 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">{sc.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{sc.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Reading Injection Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100">
          <PlusCircle className="w-4 h-4 text-cyan-600" />
          <h3 className="font-bold text-sm text-slate-900">Manual Water Depth Measurement Entry</h3>
        </div>

        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Underpass / Location:</label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-cyan-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.current_status} - {loc.current_water_depth_cm} cm)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Water Depth (cm):</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="200"
              required
              value={manualDepth}
              onChange={(e) => setManualDepth(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmittingManual}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
              Inject Telemetry Pulse
            </button>
          </div>

          {manualSuccessMsg && (
            <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
              {manualSuccessMsg}
            </div>
          )}
        </form>
      </div>

      {/* Live Monitored Sites Telemetry Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Live Monitored Underpasses ({locations.length})</h2>
          <span className="text-xs text-slate-500">Auto-refreshing every 6s</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{loc.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{loc.road_identifier}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  loc.current_status === 'NORMAL'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : loc.current_status === 'CAUTION'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : loc.current_status === 'BLOCKED'
                    ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {loc.current_status}
                </span>
              </div>

              {/* Water Depth Gauge */}
              <div className="my-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Water Depth:</span>
                  <span className="font-mono font-bold text-base text-slate-900">{loc.current_water_depth_cm} cm</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      loc.current_status === 'BLOCKED'
                        ? 'bg-red-600'
                        : loc.current_status === 'CAUTION'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (loc.current_water_depth_cm / loc.closure_threshold_cm) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Caution: {loc.caution_threshold_cm} cm</span>
                  <span>Closure: {loc.closure_threshold_cm} cm</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Sensor: {loc.sensor_status || 'SIMULATED'}</span>
                <span>{loc.last_reading_time ? new Date(loc.last_reading_time).toLocaleTimeString() : 'Awaiting pulse'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
