import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { RouteResponse, GraphNode, GraphInfoResponse } from '../types';
import { MapContainer } from '../components/map/MapContainer';
import {
  Navigation,
  ArrowRight,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Route as RouteIcon,
  Compass,
  CheckCircle2,
  Info
} from 'lucide-react';

export const RouteGuidance: React.FC = () => {
  const { locations } = useApp();
  const [graphInfo, setGraphInfo] = useState<GraphInfoResponse | null>(null);
  const [originId, setOriginId] = useState('node-domlur');
  const [destinationId, setDestinationId] = useState('node-silk-board');
  const [avoidBlocked, setAvoidBlocked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load graph info
  useEffect(() => {
    const loadGraph = async () => {
      try {
        const data = await api.getRouteGraph();
        setGraphInfo(data);
      } catch (err: any) {
        console.error('Failed to load route graph:', err);
      }
    };
    loadGraph();
  }, []);

  const handleCalculateRoute = async () => {
    if (originId === destinationId) {
      alert('Please choose different origin and destination nodes.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.calculateRoute({
        origin_node_id: originId,
        destination_node_id: destinationId,
        avoid_blocked: avoidBlocked,
      });
      setRouteResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Route calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (orig: string, dest: string) => {
    setOriginId(orig);
    setDestinationId(dest);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 space-y-6 text-slate-800">
      {/* Header with Mandatory Prototype Disclaimer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Safe Route Guidance & Flood Detour Engine
            </h1>
            <span className="bg-cyan-900 text-cyan-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-700/60">
              Dijkstra Solver
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Topological shortest path routing that dynamically avoids CONFIRMED_BLOCKED underpass corridors.
          </p>
        </div>

        {/* Mandatory Prominent Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 self-start md:self-auto shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>PROTOTYPE ROUTE CALCULATION – NOT LIVE TRAFFIC NAVIGATION</span>
        </div>
      </div>

      {/* Main Grid: Left Controls & Details | Right Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Navigation className="w-4 h-4 text-cyan-600" />
              <span>Route Parameters</span>
            </h3>

            {/* Quick Test Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Common Corridor Presets:</span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreset('node-domlur', 'node-silk-board')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                >
                  Domlur → Silk Board
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('node-majestic', 'node-hebbal')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                >
                  Majestic → Hebbal
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('node-kr-circle', 'node-whitefield')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                >
                  KR Circle → Whitefield
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('node-sirsi-circle', 'node-silk-board')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                >
                  Mysore Rd → Silk Board
                </button>
              </div>
            </div>

            {/* Origin & Destination Dropdowns */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Starting Origin Node:</label>
                <select
                  value={originId}
                  onChange={(e) => setOriginId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-cyan-500 font-medium"
                >
                  {graphInfo?.nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Destination Node:</label>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-cyan-500 font-medium"
                >
                  {graphInfo?.nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Avoid Blocked Roads Toggle */}
              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={avoidBlocked}
                    onChange={(e) => setAvoidBlocked(e.target.checked)}
                    className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Avoid CONFIRMED_BLOCKED roads</span>
                    <p className="text-[10px] text-slate-500">
                      Omits edges with water levels exceeding closure thresholds.
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCalculateRoute}
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors text-xs flex items-center justify-center space-x-2 mt-2"
              >
                <RouteIcon className="w-4 h-4" />
                <span>{loading ? 'Calculating Path...' : 'Calculate Safe Transit Route'}</span>
              </button>
            </div>
          </div>

          {/* Route Results Explanation & Steps */}
          {routeResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  {routeResult.success ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-800">Calculated Safe Corridor</span>
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="w-4 h-4 text-red-600" />
                      <span className="text-red-800">No Safe Route Available</span>
                    </>
                  )}
                </h3>
                {routeResult.success && (
                  <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                    {routeResult.total_distance_km} km
                  </span>
                )}
              </div>

              {/* Text Explanation */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-700">
                {routeResult.explanation}
              </div>

              {/* Avoided Blocked Segments Alert Box */}
              {routeResult.blocked_segments_avoided && routeResult.blocked_segments_avoided.length > 0 && (
                <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-xs space-y-1.5 text-red-950">
                  <div className="font-bold flex items-center space-x-1.5 text-red-800">
                    <AlertOctagon className="w-4 h-4 text-red-600" />
                    <span>Avoided Inundated Road Segments ({routeResult.blocked_segments_avoided.length})</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-red-900 pl-1">
                    {routeResult.blocked_segments_avoided.map((b: any, idx: number) => (
                      <li key={idx}>
                        <strong>{b.name}</strong> — {b.location_name} flooded (Depth: {b.water_depth_cm} cm)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step-by-step corridor segments */}
              {routeResult.segments && routeResult.segments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Transit Corridors Sequence:</h4>
                  <div className="space-y-1.5 text-xs">
                    {routeResult.segments.map((seg, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/80 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900">{seg.name}</div>
                            {seg.associated_location_name && (
                              <div className="text-[10px] text-slate-500">
                                Near: {seg.associated_location_name}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="font-mono text-slate-600 font-medium shrink-0">{seg.distance_km} km</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Map Visualization Column (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">Corridor Topography & Route Overlay</span>
            <span className="text-slate-500">
              {routeResult?.success ? 'Showing calculated safe detour' : 'Ready for calculation'}
            </span>
          </div>
          <div className="flex-1 w-full relative min-h-[480px]">
            <MapContainer routeGeoJSON={routeResult?.geometry_geojson} heightClass="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
