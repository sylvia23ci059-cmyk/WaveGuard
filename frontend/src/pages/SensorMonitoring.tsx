import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { IoTStation } from '../types';
import { api } from '../services/api';
import {
  Cpu,
  Radio,
  BatteryCharging,
  Wifi,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Clock,
  TrendingUp,
  MapPin,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const SensorMonitoring: React.FC = () => {
  const { sensors, triggerSimulationScenario, isSimulating, setSelectedSensor, setActivePage } = useApp();
  const [activeStationId, setActiveStationId] = useState<number>(sensors[0]?.id || 1);
  const [stationHistory, setStationHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const activeStation = sensors.find(s => s.id === activeStationId) || sensors[0];

  useEffect(() => {
    if (activeStation) {
      loadHistory(activeStation.id);
    }
  }, [activeStationId, sensors]);

  const loadHistory = async (id: number) => {
    setLoadingHistory(true);
    try {
      const data = await api.getSensorHistory(id);
      setStationHistory(data.history || []);
    } catch (err) {
      console.error('History load error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-4 bg-navy-950 text-slate-100">
      {/* 1. Header with Mandatory Demonstration Label */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold font-mono tracking-wide text-white uppercase">
              IoT Sensor Telemetry & Edge Fleet Gateway
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            ESP32 Microcontroller Nodes with Ultrasonic Water-Level & Tipping Bucket Rain Transducers.
          </p>
        </div>

        {/* Mandatory Label Badge */}
        <div className="mt-3 md:mt-0 flex items-center space-x-2">
          <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center space-x-1.5 glow-amber">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>DEMONSTRATION DATA (SIMULATED TELEMETRY)</span>
          </span>
        </div>
      </div>

      {/* 2. Hardware Architecture & Offline Protocol Note */}
      <div className="p-3 rounded-lg bg-navy-900 border border-navy-700 text-xs text-slate-300 flex items-start space-x-2.5">
        <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <b className="text-cyan-300">Edge Operational Integrity:</b> Physical ESP32 nodes process threshold breaches
          locally at the edge, activating on-site audio-visual warning beacons even during complete cellular outages.
          When connectivity is disrupted, readings are buffered in non-volatile flash memory and synchronized upon reconnection.
          <i> (Offline stations cannot transmit remote telemetry to cloud dashboards without an operational uplink channel).</i>
        </div>
      </div>

      {/* 3. Scenario Controller Strip */}
      <div className="bg-navy-900/90 border border-navy-700 rounded-xl p-3 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-xs">
          <span className="font-mono text-slate-400 uppercase text-[10px] block">Edge Ingestion Stream Controller</span>
          <span className="text-slate-200">Inject hydrodynamic scenarios to evaluate automated alert triggers:</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => triggerSimulationScenario('convective_storm')}
            disabled={isSimulating}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Convective Cloudburst (+24mm/hr)</span>
          </button>
          <button
            onClick={() => triggerSimulationScenario('drainage_subsidence')}
            disabled={isSimulating}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Water Recession (-0.15m/hr)</span>
          </button>
          <button
            onClick={() => triggerSimulationScenario('normal_baseflow')}
            disabled={isSimulating}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 border border-navy-700 transition disabled:opacity-50"
          >
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* 4. Active Station Deep-Dive & Station Fleet List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Left Col: Station Fleet Cards */}
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 shadow-xl space-y-2 overflow-y-auto max-h-[560px]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1 pb-1 border-b border-navy-800">
            Monitoring Stations ({sensors.length})
          </div>

          {sensors.map((s) => {
            const isSelected = s.id === activeStation?.id;
            return (
              <div
                key={s.id}
                onClick={() => setActiveStationId(s.id)}
                className={`p-3 rounded-lg border cursor-pointer transition space-y-2 ${
                  isSelected
                    ? 'bg-navy-800 border-cyan-500/60 shadow-[0_0_12px_rgba(0,242,254,0.15)]'
                    : 'bg-navy-950/60 border-navy-800 hover:bg-navy-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-white">{s.station_code}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-navy-850 text-slate-400 border border-navy-700">
                      {s.installation_type}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      s.status === 'critical'
                        ? 'bg-red-500 text-black'
                        : s.status === 'warning'
                        ? 'bg-amber-500 text-black'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-200 truncate">{s.name}</div>

                <div className="flex items-baseline justify-between font-mono pt-1 border-t border-navy-850">
                  <span className="text-[11px] text-slate-400">Water Depth:</span>
                  <span className={`text-sm font-bold ${
                    s.current_water_level_m >= s.critical_threshold_m ? 'text-red-400' :
                    s.current_water_level_m >= s.warning_threshold_m ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {s.current_water_level_m} m
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Battery: {s.battery_pct}%</span>
                  <span>RSSI: {s.signal_rssi} dBm</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 2 Cols: Active Station Telemetry Profile & History Chart */}
        {activeStation && (
          <div className="lg:col-span-2 bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              {/* Station Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-navy-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-cyan-400">{activeStation.station_code}</span>
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {activeStation.provenance_label}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">{activeStation.name}</h3>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Lat: {activeStation.latitude.toFixed(4)}°N &bull; Lon: {activeStation.longitude.toFixed(4)}°E &bull; Channel: {activeStation.channel_name}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedSensor(activeStation);
                    setActivePage('map3d');
                  }}
                  className="mt-2 md:mt-0 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-cyan-400 border border-navy-700 text-xs font-mono flex items-center space-x-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Locate on Map</span>
                </button>
              </div>

              {/* Real-Time Live Telemetry Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-navy-950 p-3 rounded-lg border border-navy-800 font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Live Water Level</div>
                  <div className={`text-xl font-bold mt-0.5 ${
                    activeStation.current_water_level_m >= activeStation.critical_threshold_m ? 'text-red-400' :
                    activeStation.current_water_level_m >= activeStation.warning_threshold_m ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {activeStation.current_water_level_m} m
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Max Channel: {activeStation.max_channel_depth_m}m
                  </div>
                </div>

                <div className="bg-navy-950 p-3 rounded-lg border border-navy-800 font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Thresholds</div>
                  <div className="text-xs text-amber-400 font-bold mt-1">Warn: {activeStation.warning_threshold_m} m</div>
                  <div className="text-xs text-red-400 font-bold">Crit: {activeStation.critical_threshold_m} m</div>
                </div>

                <div className="bg-navy-950 p-3 rounded-lg border border-navy-800 font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Battery Health</div>
                  <div className="text-xl font-bold text-white mt-0.5">{activeStation.battery_pct}%</div>
                  <div className="text-[9px] text-emerald-400 mt-0.5">Solar MPPT Charging</div>
                </div>

                <div className="bg-navy-950 p-3 rounded-lg border border-navy-800 font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Cellular Link (4G/LTE)</div>
                  <div className="text-xl font-bold text-white mt-0.5">{activeStation.signal_rssi} dBm</div>
                  <div className="text-[9px] text-cyan-400 mt-0.5">MQTT QoS 1 Active</div>
                </div>
              </div>

              {/* 24-Hour Telemetry Time Series Visualization */}
              <div className="mt-4 bg-navy-950 p-3.5 rounded-lg border border-navy-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-white flex items-center space-x-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>24-Hour Hydrograph Telemetry Series</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">1-Hour Resolution</span>
                </div>

                {/* SVG Hydrograph Chart */}
                <div className="h-40 w-full relative flex items-end pt-4 pb-2">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-red-500 w-full" />
                    <div className="border-b border-amber-500 w-full" />
                    <div className="border-b border-cyan-500 w-full" />
                  </div>

                  <div className="w-full h-full flex items-end space-x-1">
                    {stationHistory.map((pt, idx) => {
                      const maxVal = activeStation.max_channel_depth_m || 3.0;
                      const heightPct = Math.min(100, Math.max(5, (pt.water_level_m / maxVal) * 100));
                      const isWarn = pt.water_level_m >= activeStation.warning_threshold_m;
                      const isCrit = pt.water_level_m >= activeStation.critical_threshold_m;

                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center group relative h-full justify-end"
                        >
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-t transition-all ${
                              isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-cyan-500/70 group-hover:bg-cyan-400'
                            }`}
                          />
                          {/* Tooltip on Hover */}
                          <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-navy-800 text-[9px] font-mono p-1 rounded border border-navy-600 shadow-xl z-20 pointer-events-none whitespace-nowrap">
                            <span>{pt.water_level_m}m</span>
                            <span className="text-slate-400">{pt.timestamp?.slice(11, 16)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>-24 Hours</span>
                  <span>-12 Hours</span>
                  <span>Current Observation</span>
                </div>
              </div>
            </div>

            {/* Footer Attribution */}
            <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>FIRMWARE: ESP32-WROOM-32 v2.4.1</span>
              <span>PROTOCOL: MQTT over TLS &bull; WebSocket /ws/telemetry</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
