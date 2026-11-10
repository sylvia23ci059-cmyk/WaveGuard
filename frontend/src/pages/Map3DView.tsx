import React, { useState } from 'react';
import { MapContainer } from '../components/map/MapContainer';
import { LayerControlPanel } from '../components/map/LayerControlPanel';
import { useApp } from '../context/AppContext';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Crosshair,
  AlertTriangle,
  Cpu,
  Compass,
  MapPin
} from 'lucide-react';

export const Map3DView: React.FC = () => {
  const [showLayers, setShowLayers] = useState<boolean>(true);
  const {
    selectedHotspot,
    setSelectedHotspot,
    selectedSensor,
    setSelectedSensor,
    sampledTerrain,
    setSampledTerrain
  } = useApp();

  return (
    <div className="relative w-full h-full bg-navy-950 overflow-hidden">
      {/* Central 3D Interactive Map */}
      <MapContainer showLayerControls={true} />

      {/* Left Layer Control Panel Drawer */}
      <div className="absolute top-4 left-4 z-20 flex items-start space-x-2 pointer-events-none">
        <div className="pointer-events-auto">
          {showLayers ? (
            <div className="relative">
              <LayerControlPanel />
              <button
                onClick={() => setShowLayers(false)}
                className="absolute -right-3 top-4 w-6 h-6 rounded-full bg-navy-800 border border-navy-600 text-slate-300 hover:text-white flex items-center justify-center shadow-lg"
                title="Collapse Layers"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLayers(true)}
              className="p-2.5 rounded-lg bg-navy-900/95 border border-navy-700 text-cyan-400 hover:text-cyan-300 shadow-2xl backdrop-blur-md flex items-center space-x-2 text-xs font-mono font-medium"
              title="Open Layer Controls"
            >
              <Layers className="w-4 h-4" />
              <span>Map Layers (16)</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Feature Inspector Panel (When a hotspot, sensor, or point is clicked) */}
      {(selectedHotspot || selectedSensor || sampledTerrain) && (
        <div className="absolute top-4 right-4 z-20 w-80 bg-navy-900/95 backdrop-blur-md border border-navy-700 rounded-xl p-4 shadow-2xl text-xs space-y-3 max-h-[85vh] overflow-y-auto">
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-2 border-b border-navy-800">
            <span className="font-mono text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Inspection Telemetry</span>
            </span>
            <button
              onClick={() => {
                setSelectedHotspot(null);
                setSelectedSensor(null);
                setSampledTerrain(null);
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Point Sample Inspector */}
          {sampledTerrain && (
            <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-800 space-y-2">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-mono text-[11px] font-bold">
                <Crosshair className="w-3.5 h-3.5" />
                <span>Selected Coordinates</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                <div className="bg-navy-900 p-1.5 rounded">
                  <span className="text-slate-400 text-[10px]">Elevation:</span>
                  <div className="font-bold text-white">{sampledTerrain.elevation_m} m</div>
                </div>
                <div className="bg-navy-900 p-1.5 rounded">
                  <span className="text-slate-400 text-[10px]">Slope:</span>
                  <div className="font-bold text-white">{sampledTerrain.slope_degrees}° Horn</div>
                </div>
                <div className="bg-navy-900 p-1.5 rounded">
                  <span className="text-slate-400 text-[10px]">Flow Accum:</span>
                  <div className="font-bold text-white">{sampledTerrain.flow_accumulation_cells?.toLocaleString()}</div>
                </div>
                <div className="bg-navy-900 p-1.5 rounded">
                  <span className="text-slate-400 text-[10px]">Wetness Index:</span>
                  <div className="font-bold text-white">{sampledTerrain.topographic_wetness_index}</div>
                </div>
              </div>
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30">
                <div className="text-[10px] text-cyan-300 font-mono">
                  Susceptibility: {(sampledTerrain.flood_susceptibility_score! * 100).toFixed(1)}% ({sampledTerrain.susceptibility_category})
                </div>
              </div>
            </div>
          )}

          {/* 2. Hotspot Details */}
          {selectedHotspot && (
            <div className="p-2.5 rounded-lg bg-navy-950 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-amber-400">{selectedHotspot.hotspot_code}</span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">
                  {selectedHotspot.inspection_priority} Priority
                </span>
              </div>
              <div className="text-sm font-semibold text-white">{selectedHotspot.name}</div>
              <div className="text-[11px] text-slate-300 leading-snug">
                <b>Nearby Drainage:</b> {selectedHotspot.nearby_drainage_type}
              </div>
              <div className="text-[11px] text-slate-400 bg-navy-900 p-2 rounded">
                <b>Historical Evidence:</b> {selectedHotspot.historical_evidence}
              </div>
              <div className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 p-2 rounded">
                <b>Recommended Mitigation:</b> {selectedHotspot.recommended_action}
              </div>
            </div>
          )}

          {/* 3. IoT Sensor Details */}
          {selectedSensor && (
            <div className="p-2.5 rounded-lg bg-navy-950 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-cyan-400">{selectedSensor.station_code}</span>
                <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedSensor.provenance_label}
                </span>
              </div>
              <div className="text-sm font-semibold text-white">{selectedSensor.name}</div>
              <div className="bg-navy-900 p-2 rounded font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Current Depth:</span>
                  <span className="font-bold text-white text-sm">{selectedSensor.current_water_level_m} m</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Warning: {selectedSensor.warning_threshold_m}m</span>
                  <span>Critical: {selectedSensor.critical_threshold_m}m</span>
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Battery: {selectedSensor.battery_pct}%</span>
                <span>Signal: {selectedSensor.signal_rssi} dBm</span>
                <span>Status: <b className="text-emerald-400 uppercase">{selectedSensor.status}</b></span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
