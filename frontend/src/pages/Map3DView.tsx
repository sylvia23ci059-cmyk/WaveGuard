import React from 'react';
import { useApp } from '../context/AppContext';
import { MapContainer } from '../components/map/MapContainer';
import {
  MapPin,
  Droplets,
  Activity,
  Layers,
  X,
  Compass,
  AlertTriangle,
  Info
} from 'lucide-react';

export const Map3DView: React.FC = () => {
  const { locations, selectedLocation, setSelectedLocation, simulator, setActivePage } = useApp();

  return (
    <div className="h-full w-full relative flex flex-col overflow-hidden bg-slate-900">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/95 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-xl shadow-lg flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-900">Bengaluru Digital Twin 3D</span>
        </div>
        <div className="h-4 w-px bg-slate-200"></div>
        <span className="text-slate-600">
          Showing <strong className="text-slate-900">{locations.length}</strong> vulnerable monitored underpasses
        </span>
        <div className="h-4 w-px bg-slate-200"></div>
        <button
          onClick={() => setActivePage('monitoring')}
          className="text-cyan-700 hover:text-cyan-800 font-semibold"
        >
          View Telemetry Grid
        </button>
      </div>

      {/* Main Map */}
      <div className="flex-1 w-full h-full">
        <MapContainer heightClass="h-full" selectedLocationId={selectedLocation?.id} />
      </div>

      {/* Selected Location Card Drawer (Right Side) */}
      {selectedLocation && (
        <div className="absolute top-16 right-4 bottom-16 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-2xl p-4 flex flex-col justify-between z-20 text-slate-800 animate-in slide-in-from-right duration-300">
          <div>
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{selectedLocation.name}</h3>
                <span className="text-[11px] text-slate-500 capitalize">{selectedLocation.category}</span>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {/* Status Badge */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedLocation.current_status === 'NORMAL'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : selectedLocation.current_status === 'CAUTION'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : selectedLocation.current_status === 'BLOCKED'
                    ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {selectedLocation.current_status}
                </span>
              </div>

              {/* Water Depth Gauge */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">Water Depth:</span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {selectedLocation.current_water_depth_cm} cm
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedLocation.current_status === 'BLOCKED'
                        ? 'bg-red-600'
                        : selectedLocation.current_status === 'CAUTION'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (selectedLocation.current_water_depth_cm / selectedLocation.closure_threshold_cm) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0 cm</span>
                  <span>Caution: {selectedLocation.caution_threshold_cm} cm</span>
                  <span>Closure: {selectedLocation.closure_threshold_cm} cm</span>
                </div>
              </div>

              {/* Attributes */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Corridor ID:</span>
                  <span className="font-mono text-slate-700">{selectedLocation.road_identifier || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Coordinates:</span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Sensor Status:</span>
                  <span className="text-slate-700 font-semibold">{selectedLocation.sensor_status || 'SIMULATED'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Verification:</span>
                  <span className="text-emerald-700 font-medium">{selectedLocation.verification_status}</span>
                </div>
              </div>

              {selectedLocation.description && (
                <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
                  {selectedLocation.description}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <button
              onClick={() => setActivePage('routing')}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm"
            >
              Calculate Route Around This Site
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
