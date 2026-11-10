import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Compass,
  Maximize2,
  Minimize2,
  Box,
  Layers,
  MapPin,
  Search,
  Crosshair,
  AlertTriangle,
  Radio,
  Cpu
} from 'lucide-react';

interface MapContainerProps {
  showLayerControls?: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = ({ showLayerControls = true }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const {
    layers,
    hotspots,
    sensors,
    incidents,
    selectedHotspot,
    setSelectedHotspot,
    selectedSensor,
    setSelectedSensor,
    sampledTerrain,
    setSampledTerrain
  } = useApp();

  const [is3D, setIs3D] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [talukBoundary, setTalukBoundary] = useState<any>(null);
  const [drainageLines, setDrainageLines] = useState<any>(null);
  const [roads, setRoads] = useState<any>(null);
  const [loadingTerrainSample, setLoadingTerrainSample] = useState<boolean>(false);

  // KGF center coordinates
  const KGF_CENTER: [number, number] = [78.272, 12.965];

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use high quality CartoDB Dark Matter / OSM style
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © CARTO'
          }
        },
        layers: [
          {
            id: 'osm-dark-layer',
            type: 'raster',
            source: 'osm-dark',
            minzoom: 0,
            maxzoom: 20
          }
        ]
      },
      center: KGF_CENTER,
      zoom: 12.5,
      pitch: is3D ? 55 : 0,
      bearing: is3D ? -15 : 0
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    mapRef.current = map;

    // Point-and-click terrain inspector
    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      setLoadingTerrainSample(true);
      try {
        const sample = await api.sampleTerrain(lat, lng);
        setSampledTerrain(sample);

        new Popup({ closeButton: true, offset: 15 })
          .setLngLat([lng, lat])
          .setHTML(`
            <div style="font-family: monospace; font-size: 11px; color: #f1f5f9;">
              <div style="font-weight: bold; color: #00f2fe; margin-bottom: 4px; border-bottom: 1px solid #1e2c4d; padding-bottom: 2px;">
                GEOSPATIAL TERRAIN INSPECTION
              </div>
              <div><b>Lat:</b> ${lat.toFixed(5)}°N, <b>Lon:</b> ${lng.toFixed(5)}°E</div>
              <div><b>Elevation:</b> ${sample.elevation_m} m AMSL</div>
              <div><b>Slope:</b> ${sample.slope_degrees}° Horn gradient</div>
              <div><b>Flow Accum:</b> ${sample.flow_accumulation_cells?.toLocaleString()} cells</div>
              <div><b>TWI:</b> ${sample.topographic_wetness_index}</div>
              <div style="margin-top: 4px; padding: 2px 4px; background: rgba(0,242,254,0.1); border-left: 2px solid #00f2fe;">
                <b>Susceptibility:</b> ${(sample.flood_susceptibility_score! * 100).toFixed(1)}% (${sample.susceptibility_category})
              </div>
            </div>
          `)
          .addTo(map);
      } catch (err) {
        console.error('Terrain sample error:', err);
      } finally {
        setLoadingTerrainSample(false);
      }
    });

    // Ingest and render vector layers on map load
    map.on('load', async () => {
      try {
        const [boundaryData, drainageData, roadsData] = await Promise.all([
          api.getKGFBoundary(),
          api.getNaturalDrainage(),
          api.getRoads()
        ]);
        setTalukBoundary(boundaryData);
        setDrainageLines(drainageData);
        setRoads(roadsData);

        // 1. KGF Taluk Administrative Boundary
        if (boundaryData && !map.getSource('kgf-boundary-source')) {
          map.addSource('kgf-boundary-source', {
            type: 'geojson',
            data: boundaryData
          });

          // Taluk boundary polygon fill (subtle cyan tint)
          map.addLayer({
            id: 'kgf-boundary-fill',
            type: 'fill',
            source: 'kgf-boundary-source',
            paint: {
              'fill-color': '#00f2fe',
              'fill-opacity': 0.04
            }
          });

          // Taluk boundary polygon outline (glowing cyan line)
          map.addLayer({
            id: 'kgf-boundary-stroke',
            type: 'line',
            source: 'kgf-boundary-source',
            paint: {
              'line-color': '#00f2fe',
              'line-width': 2.5,
              'line-dasharray': [3, 2]
            }
          });
        }

        // 2. Natural Drainage Pathways (D8 Model)
        if (drainageData && !map.getSource('kgf-drainage-source')) {
          map.addSource('kgf-drainage-source', {
            type: 'geojson',
            data: drainageData
          });

          map.addLayer({
            id: 'kgf-drainage-lines',
            type: 'line',
            source: 'kgf-drainage-source',
            paint: {
              'line-color': '#06b6d4',
              'line-width': 2.2,
              'line-opacity': 0.85
            }
          });
        }

        // 3. Roads Network
        if (roadsData && !map.getSource('kgf-roads-source')) {
          map.addSource('kgf-roads-source', {
            type: 'geojson',
            data: roadsData
          });

          map.addLayer({
            id: 'kgf-roads-lines',
            type: 'line',
            source: 'kgf-roads-source',
            paint: {
              'line-color': [
                'match',
                ['get', 'status'],
                'closed', '#ef4444',
                'caution', '#f59e0b',
                'waterlogged', '#f97316',
                '#3b82f6'
              ],
              'line-width': [
                'match',
                ['get', 'status'],
                'closed', 4.0,
                'caution', 3.0,
                2.0
              ],
              'line-opacity': 0.9
            }
          });
        }
      } catch (err) {
        console.warn('Vector layer initialization fallback:', err);
      }
    });

    return () => {
      map.remove();
    };
  }, []);

  // Update 2D / 3D Pitch
  const toggle3D = () => {
    if (!mapRef.current) return;
    const nextState = !is3D;
    setIs3D(nextState);
    mapRef.current.easeTo({
      pitch: nextState ? 55 : 0,
      bearing: nextState ? -15 : 0,
      duration: 1200
    });
  };

  const resetCamera = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: KGF_CENTER,
      zoom: 12.5,
      pitch: is3D ? 55 : 0,
      bearing: is3D ? -15 : 0,
      duration: 1500
    });
  };

  // Search Jump to Locality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapRef.current || !searchQuery) return;
    const q = searchQuery.toLowerCase();
    const locMap: { [key: string]: [number, number] } = {
      andersonpet: [78.2721, 12.9372],
      robertsonpet: [78.2684, 12.9585],
      'champion reefs': [78.2743, 12.9691],
      champion: [78.2743, 12.9691],
      oorgaum: [78.2625, 12.9814],
      marikuppam: [78.2789, 12.9248],
      nundydurg: [78.2570, 13.0021]
    };

    for (const [name, coords] of Object.entries(locMap)) {
      if (q.includes(name)) {
        mapRef.current.flyTo({
          center: coords,
          zoom: 15,
          pitch: 50,
          duration: 2000
        });
        return;
      }
    }
  };

  // Render Interactive Markers for Hotspots and IoT Stations
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 1. Hotspots Markers
    if (layers.floodSusceptibility) {
      hotspots.forEach(h => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer group flex items-center justify-center';

        const colorClass = h.inspection_priority === 'critical'
          ? 'bg-red-500 shadow-[0_0_15px_#ef4444]'
          : h.inspection_priority === 'high'
          ? 'bg-amber-500 shadow-[0_0_12px_#f59e0b]'
          : 'bg-cyan-500 shadow-[0_0_10px_#00f2fe]';

        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-5 h-5 rounded-full ${colorClass} opacity-60 animate-ping"></span>
            <span class="relative w-4 h-4 rounded-full ${colorClass} border-2 border-white flex items-center justify-center text-[8px] font-bold text-black">
              !
            </span>
          </div>
        `;

        el.addEventListener('click', () => {
          setSelectedHotspot(h);
          new Popup({ closeButton: true, offset: 15 })
            .setLngLat([h.longitude, h.latitude])
            .setHTML(`
              <div style="font-family: monospace; font-size: 11px; color: #f1f5f9; min-width: 220px;">
                <div style="font-weight: bold; color: #f59e0b; margin-bottom: 4px; border-bottom: 1px solid #1e2c4d; padding-bottom: 2px;">
                  HOTSPOT: ${h.hotspot_code}
                </div>
                <div style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 4px;">${h.name}</div>
                <div><b>Elevation:</b> ${h.elevation_m} m AMSL</div>
                <div><b>Slope:</b> ${h.slope_deg}°</div>
                <div><b>Drainage Context:</b> ${h.nearby_drainage_type}</div>
                <div><b>Priority:</b> <span style="text-transform: uppercase; color: ${h.inspection_priority === 'critical' ? '#ef4444' : '#f59e0b'};">${h.inspection_priority}</span></div>
                <div><b>Status:</b> ${h.verification_status}</div>
                <div style="margin-top: 6px; font-size: 10px; color: #94a3b8; background: #070b13; padding: 4px; border-radius: 4px;">
                  ${h.recommended_action}
                </div>
              </div>
            `)
            .addTo(map);
        });

        const marker = new Marker({ element: el })
          .setLngLat([h.longitude, h.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // 2. IoT Sensor Markers (Tagged explicitly DEMONSTRATION DATA)
    if (layers.waterSensors) {
      sensors.forEach(s => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer group flex items-center justify-center';

        const colorBg = s.status === 'critical'
          ? 'bg-red-500 shadow-[0_0_18px_#ef4444]'
          : s.status === 'warning'
          ? 'bg-amber-500 shadow-[0_0_14px_#f59e0b]'
          : 'bg-emerald-400 shadow-[0_0_10px_#10b981]';

        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-5 h-5 rounded-full ${colorBg} opacity-50 animate-pulse"></span>
            <div class="relative w-4 h-4 rounded-md ${colorBg} border-2 border-white flex items-center justify-center text-[7px] font-bold text-navy-950 font-mono">
              IoT
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          setSelectedSensor(s);
          new Popup({ closeButton: true, offset: 15 })
            .setLngLat([s.longitude, s.latitude])
            .setHTML(`
              <div style="font-family: monospace; font-size: 11px; color: #f1f5f9; min-width: 230px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e2c4d; padding-bottom: 3px; margin-bottom: 4px;">
                  <span style="font-weight: bold; color: #00f2fe;">${s.station_code}</span>
                  <span style="font-size: 8px; background: rgba(245,158,11,0.2); color: #f59e0b; border: 1px solid rgba(245,158,11,0.4); padding: 1px 4px; border-radius: 3px;">
                    ${s.provenance_label}
                  </span>
                </div>
                <div style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 4px;">${s.name}</div>
                <div><b>Current Water Level:</b> <span style="font-size: 13px; font-weight: bold; color: ${s.current_water_level_m >= s.warning_threshold_m ? '#ef4444' : '#10b981'};">${s.current_water_level_m} m</span></div>
                <div><b>Warning Threshold:</b> ${s.warning_threshold_m} m</div>
                <div><b>Critical Threshold:</b> ${s.critical_threshold_m} m</div>
                <div><b>Installation:</b> ${s.installation_type}</div>
                <div><b>Battery:</b> ${s.battery_pct}% &bull; <b>RSSI:</b> ${s.signal_rssi} dBm</div>
                <div><b>Status:</b> <span style="text-transform: uppercase; font-weight: bold;">${s.status}</span></div>
              </div>
            `)
            .addTo(map);
        });

        const marker = new Marker({ element: el })
          .setLngLat([s.longitude, s.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // 3. Incidents Markers
    if (layers.roadWaterlogging || layers.emergencySos) {
      incidents.forEach(inc => {
        if (!layers.emergencySos && inc.category === 'emergency_sos') return;
        if (!layers.roadWaterlogging && inc.category !== 'emergency_sos') return;

        const el = document.createElement('div');
        el.className = 'cursor-pointer';
        const isSos = inc.category === 'emergency_sos';
        const color = isSos ? 'bg-pink-500' : 'bg-yellow-400';

        el.innerHTML = `
          <div class="w-3.5 h-3.5 rounded-full ${color} border border-white flex items-center justify-center text-[7px] font-bold text-black shadow-md">
            ${isSos ? 'SOS' : 'R'}
          </div>
        `;

        new Marker({ element: el })
          .setLngLat([inc.longitude, inc.latitude])
          .addTo(map);
      });
    }
  }, [layers, hotspots, sensors, incidents]);

  return (
    <div className="relative w-full h-full bg-navy-950 overflow-hidden">
      {/* Search & Camera Bar Top Left */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2">
        <form onSubmit={handleSearch} className="flex items-center bg-navy-900/95 border border-navy-700 rounded-lg px-2.5 py-1.5 shadow-xl backdrop-blur-md">
          <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search KGF locality (e.g. Robertsonpet, Andersonpet)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-64 font-sans"
          />
        </form>

        <button
          onClick={toggle3D}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border shadow-xl backdrop-blur-md transition ${
            is3D
              ? 'bg-cyan-500/20 text-cyan-glow border-cyan-500/40 glow-cyan'
              : 'bg-navy-900/90 text-slate-300 border-navy-700 hover:text-white'
          }`}
          title="Toggle 2D / 3D Digital Twin View"
        >
          <Box className="w-3.5 h-3.5" />
          <span>{is3D ? '3D VIEW' : '2D VIEW'}</span>
        </button>

        <button
          onClick={resetCamera}
          className="p-2 rounded-lg bg-navy-900/90 text-slate-300 border border-navy-700 hover:text-white shadow-xl backdrop-blur-md transition"
          title="Reset Camera to KGF Center"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MapLibre GL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Active Inspection Prompt Tooltip Bottom Left */}
      <div className="absolute bottom-4 left-4 z-20 bg-navy-900/90 border border-navy-700/80 rounded-lg p-2.5 shadow-xl backdrop-blur-md text-xs max-w-sm text-slate-300 pointer-events-none">
        <div className="flex items-center space-x-1.5 text-cyan-400 font-mono text-[10px] font-bold uppercase mb-0.5">
          <Crosshair className="w-3 h-3 animate-spin" />
          <span>Scientific Terrain Probe</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Click any point inside KGF Taluk to interpolate elevation, slope in degrees, upslope accumulation, and susceptibility index.
        </p>
      </div>
    </div>
  );
};
