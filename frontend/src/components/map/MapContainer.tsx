import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map as MapLibreMap, Marker, Popup, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useApp } from '../../context/AppContext';
import { LocationItem } from '../../types';
import {
  Compass,
  Plus,
  Minus,
  Layers,
  Box,
  Droplets,
  AlertTriangle,
  Info,
  Maximize2
} from 'lucide-react';

interface MapContainerProps {
  routeGeoJSON?: any;
  selectedLocationId?: string | null;
  heightClass?: string;
}

const BENGALURU_CENTER: [number, number] = [77.5946, 12.9716];
const DEFAULT_PITCH = 48;
const DEFAULT_BEARING = -15;
const DEFAULT_ZOOM = 12.3;

export const MapContainer: React.FC<MapContainerProps> = ({
  routeGeoJSON,
  selectedLocationId,
  heightClass = 'h-full'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const { locations, setSelectedLocation } = useApp();

  const [is3D, setIs3D] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'BLOCKED' | 'CAUTION' | 'NORMAL'>('ALL');

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const styleUrl = import.meta.env.VITE_MAP_STYLE || 'https://tiles.openfreemap.org/styles/liberty';

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: BENGALURU_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: is3D ? DEFAULT_PITCH : 0,
        bearing: is3D ? DEFAULT_BEARING : 0,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: '© OpenStreetMap contributors | OpenFreeMap vector tiles | WaveGuard BBMP Study',
        }),
        'bottom-right'
      );

      map.on('load', () => {
        setMapLoaded(true);
        setMapError(null);

        // Add 3D building extrusions if supported by the vector style
        try {
          const layers = map.getStyle().layers || [];
          const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout && (layer.layout as any)['text-field']
          )?.id;

          if (!map.getLayer('3d-buildings') && map.getSource('openmaptiles')) {
            map.addLayer(
              {
                id: '3d-buildings',
                source: 'openmaptiles',
                'source-layer': 'building',
                filter: ['!=', ['get', 'hide_3d'], true],
                type: 'fill-extrusion',
                minzoom: 13,
                paint: {
                  'fill-extrusion-color': '#cbd5e1',
                  'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    13,
                    0,
                    15.05,
                    ['coalesce', ['get', 'render_height'], 14],
                  ],
                  'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    13,
                    0,
                    15.05,
                    ['coalesce', ['get', 'render_min_height'], 0],
                  ],
                  'fill-extrusion-opacity': 0.65,
                },
              },
              labelLayerId
            );
          }
        } catch (e) {
          console.warn('3D building extrusion setup skipped:', e);
        }
      });

      map.on('error', (e) => {
        // Handle style or tile loading errors gracefully
        if (!mapLoaded) {
          console.warn('Map service tile loading warning:', e);
        }
      });

      mapRef.current = map;
    } catch (err: any) {
      console.error('Failed to initialize MapLibre:', err);
      setMapError('Unable to load vector tiles. Please check internet connection.');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers when locations or filter change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = locations.filter((loc) => {
      if (activeFilter === 'ALL') return true;
      return loc.current_status === activeFilter;
    });

    filtered.forEach((loc) => {
      // Determine status styling
      let bgClass = 'bg-slate-500';
      let borderClass = 'border-slate-300';
      let pulseRing = '';

      if (loc.current_status === 'NORMAL') {
        bgClass = 'bg-emerald-500';
        borderClass = 'border-emerald-200';
      } else if (loc.current_status === 'CAUTION') {
        bgClass = 'bg-amber-500';
        borderClass = 'border-amber-200';
        pulseRing = 'ring-4 ring-amber-400/30';
      } else if (loc.current_status === 'BLOCKED') {
        bgClass = 'bg-red-600 animate-pulse';
        borderClass = 'border-red-200';
        pulseRing = 'ring-8 ring-red-500/40';
      }

      // Marker element
      const el = document.createElement('div');
      el.className = `cursor-pointer transition-transform hover:scale-125 z-10`;
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full ${bgClass} border-2 ${borderClass} shadow-lg flex items-center justify-center text-white font-bold text-[11px] ${pulseRing}">
            ${Math.round(loc.current_water_depth_cm)}
          </div>
          <div class="absolute -bottom-1.5 w-2 h-2 bg-slate-800 rotate-45 transform"></div>
        </div>
      `;

      // Popup Content
      const popupHtml = `
        <div class="p-3 text-slate-800 text-xs font-sans max-w-xs">
          <div class="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200">
            <span class="font-bold text-sm text-slate-900">${loc.name}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
              loc.current_status === 'NORMAL'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : loc.current_status === 'CAUTION'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : loc.current_status === 'BLOCKED'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-slate-100 text-slate-800 border border-slate-300'
            }">${loc.current_status}</span>
          </div>

          <div class="space-y-1 mb-2">
            <div class="flex justify-between">
              <span class="text-slate-500">Water Depth:</span>
              <strong class="text-slate-900 font-mono text-sm">${loc.current_water_depth_cm} cm</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Caution Limit:</span>
              <span class="font-mono text-amber-700 font-semibold">${loc.caution_threshold_cm} cm</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Closure Limit:</span>
              <span class="font-mono text-red-700 font-semibold">${loc.closure_threshold_cm} cm</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Category:</span>
              <span class="capitalize text-slate-700">${loc.category}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Road Corridor:</span>
              <span class="text-slate-700">${loc.road_identifier || 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Coordinates:</span>
              <span class="font-mono text-[10px] text-slate-600">${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}</span>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>Telemetry: <strong class="text-slate-700">SIMULATED</strong></span>
            <span>${loc.last_reading_time ? 'Fresh reading' : 'No recent pulse'}</span>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: true }).setHTML(popupHtml);

      el.addEventListener('click', () => {
        setSelectedLocation(loc);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([loc.longitude, loc.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [locations, activeFilter, setSelectedLocation]);

  // Handle selectedLocation pan
  useEffect(() => {
    if (!mapRef.current || !selectedLocationId) return;
    const loc = locations.find((l) => l.id === selectedLocationId);
    if (loc) {
      mapRef.current.flyTo({
        center: [loc.longitude, loc.latitude],
        zoom: 14.5,
        speed: 1.2,
      });
    }
  }, [selectedLocationId, locations]);

  // Handle Route GeoJSON Layer rendering
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const sourceId = 'route-source';
    const routeLayerId = 'route-layer';
    const blockedLayerId = 'blocked-avoided-layer';

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as any).setData(routeGeoJSON || { type: 'FeatureCollection', features: [] });
    } else if (routeGeoJSON) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: routeGeoJSON,
      });

      // Safe Route Line
      map.addLayer({
        id: routeLayerId,
        type: 'line',
        source: sourceId,
        filter: ['==', ['get', 'type'], 'route_segment'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0284c7', // Cyan / Light Blue
          'line-width': 5.5,
          'line-opacity': 0.9,
        },
      });

      // Avoided Blocked Segments (Red dashed line)
      map.addLayer({
        id: blockedLayerId,
        type: 'line',
        source: sourceId,
        filter: ['==', ['get', 'type'], 'avoided_blocked_segment'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#dc2626',
          'line-width': 5,
          'line-dasharray': [2, 2],
          'line-opacity': 0.85,
        },
      });
    }

    // Zoom to route bounds if features exist
    if (routeGeoJSON && routeGeoJSON.features && routeGeoJSON.features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      routeGeoJSON.features.forEach((feat: any) => {
        if (feat.geometry && feat.geometry.coordinates) {
          feat.geometry.coordinates.forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
        }
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 14.5 });
      }
    }
  }, [routeGeoJSON, mapLoaded]);

  // Toggle 3D Perspective
  const toggle3D = useCallback(() => {
    if (!mapRef.current) return;
    const next3D = !is3D;
    setIs3D(next3D);
    mapRef.current.easeTo({
      pitch: next3D ? DEFAULT_PITCH : 0,
      bearing: next3D ? DEFAULT_BEARING : 0,
      duration: 1000,
    });
  }, [is3D]);

  const resetView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: BENGALURU_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: is3D ? DEFAULT_PITCH : 0,
      bearing: is3D ? DEFAULT_BEARING : 0,
    });
  };

  return (
    <div className={`relative w-full ${heightClass} bg-slate-900 overflow-hidden`}>
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map error banner if vector tiles are offline */}
      {mapError && (
        <div className="absolute top-4 left-4 right-4 bg-amber-500/95 text-slate-950 px-4 py-2.5 rounded-lg shadow-lg flex items-center justify-between text-xs z-30">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{mapError} — Monitored coordinates and dashboard metrics remain fully operational.</span>
          </div>
          <button onClick={() => setMapError(null)} className="font-bold underline ml-3">
            Dismiss
          </button>
        </div>
      )}

      {/* Floating Status Filter Pill */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-md p-1 flex items-center space-x-1 text-xs">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            activeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({locations.length})
        </button>
        <button
          onClick={() => setActiveFilter('BLOCKED')}
          className={`px-2.5 py-1 rounded font-medium flex items-center space-x-1 transition-colors ${
            activeFilter === 'BLOCKED' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>Blocked ({locations.filter((l) => l.current_status === 'BLOCKED').length})</span>
        </button>
        <button
          onClick={() => setActiveFilter('CAUTION')}
          className={`px-2.5 py-1 rounded font-medium flex items-center space-x-1 transition-colors ${
            activeFilter === 'CAUTION' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Caution ({locations.filter((l) => l.current_status === 'CAUTION').length})</span>
        </button>
        <button
          onClick={() => setActiveFilter('NORMAL')}
          className={`px-2.5 py-1 rounded font-medium flex items-center space-x-1 transition-colors ${
            activeFilter === 'NORMAL' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Normal ({locations.filter((l) => l.current_status === 'NORMAL').length})</span>
        </button>
      </div>

      {/* 3D and Perspective Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-1.5">
        <button
          onClick={toggle3D}
          title={is3D ? 'Switch to 2D Plan View' : 'Switch to 3D Extrusion View'}
          className={`w-9 h-9 rounded-lg border shadow-md flex items-center justify-center font-bold text-xs transition-colors ${
            is3D
              ? 'bg-cyan-600 text-white border-cyan-500'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Box className="w-4 h-4" />
        </button>

        <button
          onClick={resetView}
          title="Reset to Central Bengaluru View"
          className="w-9 h-9 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg shadow-md flex items-center justify-center transition-colors"
        >
          <Compass className="w-4 h-4 text-slate-600" />
        </button>

        <button
          onClick={() => mapRef.current?.zoomIn()}
          title="Zoom In"
          className="w-9 h-9 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg shadow-md flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={() => mapRef.current?.zoomOut()}
          title="Zoom Out"
          className="w-9 h-9 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg shadow-md flex items-center justify-center transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-4 z-10 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-md p-3 text-xs w-56 text-slate-700">
        <div className="font-bold text-slate-900 mb-2 flex items-center justify-between border-b border-slate-100 pb-1">
          <span>Waterlogging Legend</span>
          <span className="text-[10px] text-slate-400 font-normal">Depth (cm)</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-300 inline-block"></span>
              <span>NORMAL Clearance</span>
            </div>
            <span className="text-slate-400">&lt; 15 cm</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-300 inline-block"></span>
              <span>CAUTION Inundation</span>
            </div>
            <span className="text-slate-400">15 – 35 cm</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-600 border border-red-300 inline-block animate-pulse"></span>
              <span className="font-semibold text-red-700">CONFIRMED BLOCKED</span>
            </div>
            <span className="text-slate-400">&ge; 35 cm</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-400 border border-slate-300 inline-block"></span>
              <span>UNKNOWN / Stale</span>
            </div>
            <span className="text-slate-400">&gt; 30 min</span>
          </div>

          {routeGeoJSON && (
            <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-1 bg-cyan-600 rounded"></span>
                <span className="text-cyan-800 font-medium">Safe Route</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-red-600"></span>
                <span className="text-red-700 font-medium">Avoided Blocked Road</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
