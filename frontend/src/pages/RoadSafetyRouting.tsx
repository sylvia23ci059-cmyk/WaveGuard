import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import {
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Compass,
  ArrowRight,
  RotateCcw,
  Clock,
  Layers,
  MapPin,
  Lock,
  Unlock
} from 'lucide-react';

export const RoadSafetyRouting: React.FC = () => {
  const { userRole, setActivePage } = useApp();
  const [origin, setOrigin] = useState<string>('Bangarapet Highway Entrance');
  const [destination, setDestination] = useState<string>('Andersonpet South Market');
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [roads, setRoads] = useState<any[]>([]);

  useEffect(() => {
    loadRoads();
    computeDefaultRoute();
  }, []);

  const loadRoads = async () => {
    try {
      const data = await api.getRoads();
      setRoads(data.features || []);
    } catch (err) {
      console.error('Error fetching roads:', err);
    }
  };

  const computeDefaultRoute = async () => {
    setLoadingRoute(true);
    try {
      const res = await api.calculateSafeRoute({
        start_lat: 12.980,
        start_lon: 78.255,
        end_lat: 12.935,
        end_lon: 78.275
      });
      setRoutingResult(res);
    } catch (err) {
      console.error('Error calculating route:', err);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleToggleClosure = async (roadId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'closed' ? 'open' : 'closed';
    const reason = nextStatus === 'closed' ? 'Submerged by storm runoff (>25cm water depth)' : undefined;
    const depth = nextStatus === 'closed' ? 28.0 : 0.0;
    try {
      await api.updateRoadStatus(roadId, nextStatus, reason, depth);
      await loadRoads();
      await computeDefaultRoute();
    } catch (err) {
      console.error('Road status toggle error:', err);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-4 bg-navy-950 text-slate-100">
      {/* 1. Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono tracking-wide text-white uppercase">
              Road Safety Intelligence & Flood Detour Rerouting
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Automated Dijkstra routing avoiding verified impassable road segments and low-lying railway underpasses.
          </p>
        </div>

        <button
          onClick={() => setActivePage('map3d')}
          className="mt-3 md:mt-0 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-glow border border-cyan-500/40 text-xs font-mono flex items-center space-x-1.5"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>View Road Network on 3D Map</span>
        </button>
      </div>

      {/* 2. Interactive Route Calculator Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Col: Trip Planner Form */}
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl space-y-4">
          <div className="pb-2 border-b border-navy-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Safe Trip Planner
            </h3>
            <p className="text-[11px] text-slate-400">Avoid active waterlogging and verified underpass closures</p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[10px]">Origin Landmark (KGF North)</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg p-2 text-white text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono text-[10px]">Destination Landmark (KGF South)</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg p-2 text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={computeDefaultRoute}
            disabled={loadingRoute}
            className="w-full py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-glow border border-cyan-500/50 glow-cyan text-xs font-mono font-semibold tracking-wider uppercase transition flex items-center justify-center space-x-2"
          >
            <Navigation className="w-4 h-4" />
            <span>{loadingRoute ? 'Recalculating...' : 'Calculate Safe Flood Detour'}</span>
          </button>
        </div>

        {/* Right 2 Cols: Recommended Detour vs Direct Hazardous Route */}
        {routingResult && (
          <div className="lg:col-span-2 bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Recommended Safe Route Card */}
              <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>RECOMMENDED SAFE FLOOD DETOUR</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    High Elevation Ridge Corridor
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400">Distance:</span>{' '}
                    <b className="text-white">{routingResult.recommended_route?.properties?.distance_km} km</b>
                  </div>
                  <div>
                    <span className="text-slate-400">Est. Travel Time:</span>{' '}
                    <b className="text-white">{routingResult.recommended_route?.properties?.estimated_time_mins} mins</b>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300">
                  <b>Successfully Bypasses:</b>{' '}
                  <span className="text-amber-300">
                    {routingResult.recommended_route?.properties?.avoided_hazards?.join(', ')}
                  </span>
                </div>
              </div>

              {/* Direct Route Warning Card */}
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 space-y-1.5">
                <div className="flex items-center space-x-2 text-red-400 font-mono text-xs font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>DIRECT PATHWAY (IMPASSABLE / HIGH RISK)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {routingResult.direct_route_hazards?.properties?.warning}
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-navy-800">
              ROUTING ALGORITHM: Graph Edge Cost W_safe = Length * (1 + 10 * WaterDepth) + ClosurePenalty
            </div>
          </div>
        )}
      </div>

      {/* 3. Road Network Segments & Authority Closure Toggles */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-navy-800">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Monitored Arterial Road Segments ({roads.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">KGF Urban Road Centerlines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roads.map((road) => {
            const props = road.properties;
            const isClosed = props.status === 'closed';
            const isCaution = props.status === 'caution';

            return (
              <div
                key={road.id}
                className={`p-3 rounded-lg border transition ${
                  isClosed
                    ? 'bg-red-950/20 border-red-500/40 glow-crimson'
                    : isCaution
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-navy-950 border-navy-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white truncate">{props.name}</span>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                      isClosed
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : isCaution
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {props.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
                  <span>Type: {props.highway_type}</span>
                  <span className="text-amber-400">Depth: {props.water_depth_cm} cm</span>
                </div>

                {props.closure_reason && (
                  <p className="text-[10px] text-red-300 mt-1 line-clamp-1">{props.closure_reason}</p>
                )}

                {/* Authority Toggle */}
                {(userRole === 'admin' || userRole === 'engineer') && (
                  <div className="mt-2 pt-2 border-t border-navy-800 flex justify-end">
                    <button
                      onClick={() => handleToggleClosure(road.id, props.status)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-medium flex items-center space-x-1.5 transition ${
                        isClosed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                      }`}
                    >
                      {isClosed ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{isClosed ? 'Reopen Road' : 'Issue Road Closure'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
