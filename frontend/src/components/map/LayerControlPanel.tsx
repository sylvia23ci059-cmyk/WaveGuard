import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapLayerState } from '../../types';
import { Eye, EyeOff, Layers, Info } from 'lucide-react';

interface LayerMeta {
  key: keyof MapLayerState;
  label: string;
  category: 'Government & Baseline' | 'Model Outputs' | 'Observations & Telemetry' | 'Public & Field Reports' | 'Proposed Infrastructure';
  legendColor: string;
  legendType: 'fill' | 'line' | 'point';
  description: string;
}

const LAYER_CONFIGS: LayerMeta[] = [
  // 1-5 Government & Baseline
  { key: 'baseMap', label: 'Base Map (OSM Dark Vector)', category: 'Government & Baseline', legendColor: '#1e293b', legendType: 'fill', description: 'CartoDB Dark Matter / OSM road network base' },
  { key: 'satellite', label: 'Satellite Imagery', category: 'Government & Baseline', legendColor: '#059669', legendType: 'fill', description: 'High-resolution true color optical imagery' },
  { key: 'buildings3d', label: '3D Buildings Extrusion', category: 'Government & Baseline', legendColor: '#00f2fe', legendType: 'fill', description: 'Extruded building heights where mapped in OSM' },
  { key: 'terrainElevation', label: 'Terrain Elevation Mesh', category: 'Government & Baseline', legendColor: '#10b981', legendType: 'fill', description: 'Copernicus GLO-30 Digital Surface Model (30m)' },
  { key: 'hillshade', label: 'Hillshade Shading', category: 'Government & Baseline', legendColor: '#64748b', legendType: 'fill', description: 'NW illumination 315° altitude 45° relief shadow' },

  // 6-10 Model Outputs
  { key: 'slope', label: 'Terrain Slope (°)', category: 'Model Outputs', legendColor: '#f97316', legendType: 'fill', description: 'Horn finite difference gradient in degrees' },
  { key: 'flowAccumulation', label: 'Flow Accumulation', category: 'Model Outputs', legendColor: '#3b82f6', legendType: 'fill', description: 'D8 upslope contributing drainage area matrix' },
  { key: 'naturalDrainage', label: 'Natural Drainage Pathways', category: 'Model Outputs', legendColor: '#06b6d4', legendType: 'line', description: 'D8 model extracted overland flow convergence' },
  { key: 'mappedDrainage', label: 'Mapped Drainage Network', category: 'Model Outputs', legendColor: '#60a5fa', legendType: 'line', description: 'Official KGIS and OSM mapped nallahs and streams' },
  { key: 'floodSusceptibility', label: 'Flood Susceptibility Heatmap', category: 'Model Outputs', legendColor: '#dc2626', legendType: 'fill', description: 'Multi-factor weighted overlay (0.0 to 1.0)' },

  // 11-12 Observations & Telemetry
  { key: 'rainfall', label: 'Live Rainfall Grid', category: 'Observations & Telemetry', legendColor: '#38bdf8', legendType: 'fill', description: 'IMD daily series + Open-Meteo live KGF observation' },
  { key: 'waterSensors', label: 'Water-Level IoT Sensors', category: 'Observations & Telemetry', legendColor: '#10b981', legendType: 'point', description: 'ESP32 ultrasonic sensors (DEMONSTRATION DATA)' },

  // 13-15 Public & Field Reports
  { key: 'roadWaterlogging', label: 'Road Waterlogging Reports', category: 'Public & Field Reports', legendColor: '#eab308', legendType: 'point', description: 'Verified and unverified citizen flood reports' },
  { key: 'roadClosures', label: 'Road Closures & Warnings', category: 'Public & Field Reports', legendColor: '#ef4444', legendType: 'line', description: 'Authority confirmed road closures and detours' },
  { key: 'emergencySos', label: 'Emergency SOS Calls', category: 'Public & Field Reports', legendColor: '#f43f5e', legendType: 'point', description: 'Assistance requests flagged for 112 triage' },

  // 16 Proposed Infrastructure
  { key: 'proposedSensors', label: 'Proposed Sensor Locations', category: 'Proposed Infrastructure', legendColor: '#a855f7', legendType: 'point', description: 'Recommended installation sites based on hotspot ranking' }
];

export const LayerControlPanel: React.FC = () => {
  const { layers, toggleLayer } = useApp();

  const categories = [
    'Government & Baseline',
    'Model Outputs',
    'Observations & Telemetry',
    'Public & Field Reports',
    'Proposed Infrastructure'
  ] as const;

  return (
    <div className="w-80 bg-navy-900/95 backdrop-blur-md border border-navy-700 rounded-xl p-3 shadow-2xl flex flex-col max-h-[85vh] select-none text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-navy-800">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white tracking-wide">Map Layer Controls</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">16 Layers</span>
      </div>

      <div className="overflow-y-auto space-y-4 pt-3 pr-1">
        {categories.map((cat) => {
          const catLayers = LAYER_CONFIGS.filter(l => l.category === cat);
          return (
            <div key={cat} className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold px-1 flex items-center justify-between">
                <span>{cat}</span>
              </div>
              <div className="space-y-1">
                {catLayers.map((l) => {
                  const isVisible = layers[l.key];
                  return (
                    <div
                      key={l.key}
                      onClick={() => toggleLayer(l.key)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border ${
                        isVisible
                          ? 'bg-navy-800/90 border-navy-600 text-white'
                          : 'bg-navy-950/40 border-navy-900 text-slate-400 hover:bg-navy-800/40'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {/* Legend Symbol */}
                        {l.legendType === 'line' && (
                          <div className="w-4 h-1 rounded" style={{ backgroundColor: l.legendColor }} />
                        )}
                        {l.legendType === 'point' && (
                          <div className="w-2.5 h-2.5 rounded-full border border-white/40" style={{ backgroundColor: l.legendColor }} />
                        )}
                        {l.legendType === 'fill' && (
                          <div className="w-3.5 h-3.5 rounded border border-white/20" style={{ backgroundColor: l.legendColor }} />
                        )}
                        <div>
                          <div className="font-medium text-[11px]">{l.label}</div>
                          <div className="text-[9px] text-slate-400 leading-tight">{l.description}</div>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-white p-1">
                        {isVisible ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
