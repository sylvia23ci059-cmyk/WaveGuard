import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Compass,
  Plus,
  Minus,
  Box,
  Droplets,
  Layers,
  Mountain,
  Triangle,
  GitFork,
  Radio,
  Car
} from 'lucide-react';

interface MapContainerProps {
  showLayerControls?: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const sensorMarkersRef = useRef<Marker[]>([]);

  const {
    layers,
    toggleLayer,
    hotspots,
    sensors,
    setSelectedHotspot,
    setSelectedSensor,
    setSampledTerrain,
    mapTilerKey,
    terrainExaggeration
  } = useApp();

  const [is3D, setIs3D] = useState<boolean>(true);
  const [activeBottomLayer, setActiveBottomLayer] = useState<string>('floodRisk');

  // Exact perspective viewing KGF from South-West looking North-East as shown in the reference image
  const KGF_CENTER: [number, number] = [78.272, 12.965];
  const INITIAL_PITCH = 58;
  const INITIAL_BEARING = -22;
  const INITIAL_ZOOM = 12.3;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const isMapTiler = Boolean(mapTilerKey && mapTilerKey.trim().length > 5);

    // High-Resolution True-Color Satellite Base Map
    const satelliteTileUrl = isMapTiler
      ? `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${mapTilerKey}`
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const demTileUrl = isMapTiler
      ? `https://api.maptiler.com/tiles/terrain-rgb-v2/{z}/{x}/{y}.webp?key=${mapTilerKey}`
      : 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'satellite-base': {
            type: 'raster',
            tiles: [satelliteTileUrl],
            tileSize: 256,
            attribution: '© Esri, Maxar, Earthstar Geographics'
          },
          'terrain-dem': {
            type: 'raster-dem',
            tiles: [demTileUrl],
            tileSize: 256,
            encoding: isMapTiler ? 'mapbox' : 'terrarium',
            maxzoom: 14
          }
        },
        layers: [
          {
            id: 'satellite-base-layer',
            type: 'raster',
            source: 'satellite-base',
            minzoom: 0,
            maxzoom: 20
          }
        ]
      },
      center: KGF_CENTER,
      zoom: INITIAL_ZOOM,
      pitch: INITIAL_PITCH,
      bearing: INITIAL_BEARING,
      maxPitch: 75
    });

    mapRef.current = map;

    // Atmospheric lighting & 3D Terrain
    map.on('load', async () => {
      // 1. Enable 3D Terrain Mesh
      try {
        map.setTerrain({ source: 'terrain-dem', exaggeration: terrainExaggeration });
      } catch (e) {
        console.warn('Terrain activation:', e);
      }

      // 2. Fetch KGF Boundary and Vector Features
      try {
        const [boundaryData, drainageData, roadsData] = await Promise.all([
          api.getKGFBoundary(),
          api.getNaturalDrainage(),
          api.getRoads()
        ]);

        if (boundaryData && !map.getSource('kgf-boundary-source')) {
          map.addSource('kgf-boundary-source', {
            type: 'geojson',
            data: boundaryData
          });

          // A. Glowing Interior Polygon Tint
          map.addLayer({
            id: 'kgf-boundary-fill',
            type: 'fill',
            source: 'kgf-boundary-source',
            paint: {
              'fill-color': '#00f2fe',
              'fill-opacity': 0.05
            }
          });

          // B. Multi-pass Electric Neon Cyan Boundary (Like in reference image)
          // Wide Outer Glow
          map.addLayer({
            id: 'kgf-boundary-glow-outer',
            type: 'line',
            source: 'kgf-boundary-source',
            paint: {
              'line-color': '#00f2fe',
              'line-width': 10,
              'line-blur': 6,
              'line-opacity': 0.7
            }
          });

          // Intense Cyan Aura
          map.addLayer({
            id: 'kgf-boundary-glow-mid',
            type: 'line',
            source: 'kgf-boundary-source',
            paint: {
              'line-color': '#00e5ff',
              'line-width': 4.5,
              'line-blur': 1,
              'line-opacity': 0.95
            }
          });

          // Sharp White-Hot Center Core Line
          map.addLayer({
            id: 'kgf-boundary-core',
            type: 'line',
            source: 'kgf-boundary-source',
            paint: {
              'line-color': '#ffffff',
              'line-width': 1.5,
              'line-opacity': 1.0
            }
          });
        }

        // 3. Iconic KGF Mine Pits & Tailings Cyan Quarry Water Lakes (Bottom Right)
        const minePitLakes = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: 'Edgar Shaft Deep Open-Pit Quarry Lake' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [78.281, 12.940], [78.286, 12.942], [78.288, 12.937],
                  [78.285, 12.934], [78.281, 12.936], [78.281, 12.940]
                ]]
              }
            },
            {
              type: 'Feature',
              properties: { name: 'Biserahalli Cyanide Tailings Retention Basin' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [78.287, 12.932], [78.293, 12.933], [78.295, 12.928],
                  [78.290, 12.926], [78.286, 12.929], [78.287, 12.932]
                ]]
              }
            }
          ]
        };

        if (!map.getSource('kgf-mine-pits-source')) {
          map.addSource('kgf-mine-pits-source', {
            type: 'geojson',
            data: minePitLakes as any
          });

          map.addLayer({
            id: 'kgf-mine-pits-water',
            type: 'fill',
            source: 'kgf-mine-pits-source',
            paint: {
              'fill-color': '#06b6d4',
              'fill-opacity': 0.65
            }
          });

          map.addLayer({
            id: 'kgf-mine-pits-edge',
            type: 'line',
            source: 'kgf-mine-pits-source',
            paint: {
              'line-color': '#22d3ee',
              'line-width': 2,
              'line-opacity': 0.8
            }
          });
        }

        // 4. Natural Drainage Overlay
        if (drainageData && !map.getSource('kgf-drainage-source')) {
          map.addSource('kgf-drainage-source', {
            type: 'geojson',
            data: drainageData
          });

          map.addLayer({
            id: 'kgf-drainage-lines',
            type: 'line',
            source: 'kgf-drainage-source',
            layout: { visibility: layers.naturalDrainage ? 'visible' : 'none' },
            paint: {
              'line-color': '#00f2fe',
              'line-width': 2.5,
              'line-opacity': 0.85
            }
          });
        }

        // 5. Roads Network
        if (roadsData && !map.getSource('kgf-roads-source')) {
          map.addSource('kgf-roads-source', {
            type: 'geojson',
            data: roadsData
          });

          map.addLayer({
            id: 'kgf-roads-lines',
            type: 'line',
            source: 'kgf-roads-source',
            layout: { visibility: layers.roadWaterlogging ? 'visible' : 'none' },
            paint: {
              'line-color': '#f59e0b',
              'line-width': 2.0,
              'line-opacity': 0.75
            }
          });
        }

        // 6. Flood Susceptibility Risk Zones
        const floodRiskZones = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: 'Andersonpet South Depression Confluence', risk: 'High', score: 0.88 },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [78.268, 12.934], [78.276, 12.935], [78.278, 12.939], [78.273, 12.941], [78.267, 12.938], [78.268, 12.934]
                ]]
              }
            },
            {
              type: 'Feature',
              properties: { name: 'Robertsonpet Swarna Nallah Corridor', risk: 'High', score: 0.82 },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [78.263, 12.956], [78.272, 12.958], [78.274, 12.963], [78.267, 12.964], [78.262, 12.960], [78.263, 12.956]
                ]]
              }
            },
            {
              type: 'Feature',
              properties: { name: 'Champion Reefs Railway Underpass Basin', risk: 'Very High', score: 0.94 },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [78.270, 12.967], [78.277, 12.968], [78.278, 12.972], [78.272, 12.973], [78.269, 12.970], [78.270, 12.967]
                ]]
              }
            },
            {
              type: 'Feature',
              properties: { name: 'Marikuppam Sump Basin', risk: 'Moderate', score: 0.73 },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [78.275, 12.922], [78.282, 12.923], [78.283, 12.927], [78.277, 12.928], [78.274, 12.925], [78.275, 12.922]
                ]]
              }
            }
          ]
        };

        if (!map.getSource('kgf-flood-risk-source')) {
          map.addSource('kgf-flood-risk-source', {
            type: 'geojson',
            data: floodRiskZones as any
          });

          map.addLayer({
            id: 'kgf-flood-risk-fill',
            type: 'fill',
            source: 'kgf-flood-risk-source',
            layout: { visibility: layers.floodSusceptibility ? 'visible' : 'none' },
            paint: {
              'fill-color': '#0284c7',
              'fill-opacity': 0.35
            }
          });

          map.addLayer({
            id: 'kgf-flood-risk-outline',
            type: 'line',
            source: 'kgf-flood-risk-source',
            layout: { visibility: layers.floodSusceptibility ? 'visible' : 'none' },
            paint: {
              'line-color': '#38bdf8',
              'line-width': 1.5,
              'line-dasharray': [2, 2],
              'line-opacity': 0.8
            }
          });
        }
      } catch (err) {
        console.warn('3D features load:', err);
      }
    });

    // Point-and-click terrain probe
    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      try {
        const sample = await api.sampleTerrain(lat, lng);
        setSampledTerrain(sample);
        new Popup({ closeButton: true, offset: 15 })
          .setLngLat([lng, lat])
          .setHTML(`
            <div style="font-family: sans-serif; font-size: 11px; color: #f1f5f9; padding: 2px;">
              <div style="font-weight: bold; color: #00f2fe; margin-bottom: 4px; border-bottom: 1px solid #1e2c4d; padding-bottom: 2px;">
                TERRAIN PROBE: KGF
              </div>
              <div><b>Elevation:</b> ${sample.elevation_m} m AMSL</div>
              <div><b>Slope:</b> ${sample.slope_degrees}° Horn</div>
              <div><b>Flow Accum:</b> ${sample.flow_accumulation_cells?.toLocaleString()} cells</div>
              <div><b>TWI:</b> ${sample.topographic_wetness_index}</div>
              <div style="margin-top: 4px; color: #38bdf8; font-weight: bold;">
                Susceptibility: ${(sample.flood_susceptibility_score! * 100).toFixed(0)}% (${sample.susceptibility_category})
              </div>
            </div>
          `)
          .addTo(map);
      } catch (err) {
        console.error('Probe error:', err);
      }
    });

    return () => {
      map.remove();
    };
  }, [mapTilerKey]);

  // Floating 3D Locality Labels Matching the Reference Image
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // The 6 prominent KGF localities shown in the reference image
    const localities = [
      { name: 'Kolar Gold Field\n(KGF)', coords: [78.2720, 12.9540], isMain: true },
      { name: 'Champion Reefs', coords: [78.2580, 12.9730], isMain: false },
      { name: 'Robertsonpet', coords: [78.2684, 12.9610], isMain: false },
      { name: 'Andersonpet', coords: [78.2780, 12.9420], isMain: false },
      { name: 'Oorgaum', coords: [78.2660, 12.9840], isMain: false },
      { name: 'Nundydurg', coords: [78.2930, 12.9360], isMain: false }
    ];

    localities.forEach(loc => {
      const el = document.createElement('div');
      el.className = 'cursor-pointer flex flex-col items-center select-none pointer-events-auto group';

      if (loc.isMain) {
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="bg-black/90 text-white font-sans font-bold text-[11px] px-3.5 py-1.5 rounded-lg border border-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.8)] text-center leading-tight tracking-wide whitespace-pre-line">
              Kolar Gold Field<br/><span class="text-cyan-300 font-semibold text-[10px]">(KGF)</span>
            </div>
            <div class="w-0.5 h-6 bg-white/70 shadow-sm"></div>
            <div class="w-2 h-2 rounded-full bg-cyan-400 border border-white -mt-0.5 shadow-[0_0_8px_#00f2fe]"></div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="bg-black/85 text-slate-100 font-sans font-medium text-[10px] px-2.5 py-1 rounded-md border border-white/20 shadow-[0_6px_20px_rgba(0,0,0,0.7)] tracking-wide whitespace-nowrap">
              ${loc.name}
            </div>
            <div class="w-0.5 h-5 bg-white/60"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-white -mt-0.5"></div>
          </div>
        `;
      }

      el.addEventListener('click', () => {
        map.flyTo({
          center: loc.coords as [number, number],
          zoom: 14.5,
          pitch: 60,
          duration: 1800
        });
      });

      const marker = new Marker({ element: el })
        .setLngLat(loc.coords as [number, number])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, []);

  // Update Terrain Exaggeration & Layer Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getSource('terrain-dem')) {
      if (is3D) {
        map.setTerrain({ source: 'terrain-dem', exaggeration: terrainExaggeration });
      } else {
        map.setTerrain(null);
      }
    }

    if (map.getLayer('kgf-drainage-lines')) {
      map.setLayoutProperty('kgf-drainage-lines', 'visibility', layers.naturalDrainage ? 'visible' : 'none');
    }
    if (map.getLayer('kgf-roads-lines')) {
      map.setLayoutProperty('kgf-roads-lines', 'visibility', layers.roadWaterlogging ? 'visible' : 'none');
    }
    if (map.getLayer('kgf-flood-risk-fill')) {
      map.setLayoutProperty('kgf-flood-risk-fill', 'visibility', layers.floodSusceptibility ? 'visible' : 'none');
    }
    if (map.getLayer('kgf-flood-risk-outline')) {
      map.setLayoutProperty('kgf-flood-risk-outline', 'visibility', layers.floodSusceptibility ? 'visible' : 'none');
    }
  }, [terrainExaggeration, is3D, layers.naturalDrainage, layers.roadWaterlogging, layers.floodSusceptibility]);

  // Handle IoT Sensor Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    sensorMarkersRef.current.forEach(m => m.remove());
    sensorMarkersRef.current = [];

    if (layers.waterSensors && sensors && sensors.length > 0) {
      sensors.forEach(s => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer flex flex-col items-center group z-10';

        const isCrit = s.status === 'critical';
        const isWarn = s.status === 'warning';
        const ringColor = isCrit ? 'bg-red-500/40' : isWarn ? 'bg-amber-500/40' : 'bg-cyan-400/30';
        const dotColor = isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-400' : 'bg-cyan-400';
        const shadow = isCrit ? 'shadow-[0_0_12px_#ef4444]' : isWarn ? 'shadow-[0_0_10px_#f59e0b]' : 'shadow-[0_0_10px_#00f2fe]';

        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 rounded-full ${ringColor} animate-ping"></div>
            <div class="w-3.5 h-3.5 rounded-full ${dotColor} border-2 border-white ${shadow} z-10"></div>
          </div>
          <div class="mt-1 px-1.5 py-0.5 rounded bg-black/90 text-[9px] font-mono text-cyan-300 border border-cyan-500/40 shadow-xl whitespace-nowrap">
            ${s.station_code}: <span class="font-bold text-white">${s.current_water_level_m}m</span>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedSensor(s);
        });

        const marker = new Marker({ element: el })
          .setLngLat([s.longitude, s.latitude])
          .addTo(map);

        sensorMarkersRef.current.push(marker);
      });
    }
  }, [layers.waterSensors, sensors]);

  const toggle2D3D = () => {
    const map = mapRef.current;
    if (!map) return;
    const nextState = !is3D;
    setIs3D(nextState);
    map.easeTo({
      pitch: nextState ? INITIAL_PITCH : 0,
      bearing: nextState ? INITIAL_BEARING : 0,
      duration: 1200
    });
  };

  const resetNorth = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      bearing: 0,
      duration: 1000
    });
  };

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none font-sans">
      {/* MapLibre WebGL Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* BOTTOM LEFT: Elevation (m) Legend Card (Exact match to reference image) */}
      <div className="absolute bottom-6 left-6 z-20 bg-black/85 backdrop-blur-md border border-white/15 rounded-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white w-32 flex flex-col space-y-2">
        <div className="text-[11px] font-semibold tracking-wide">Elevation (m)</div>
        <div className="flex items-center space-x-2.5">
          {/* Vertical Color Gradient Bar */}
          <div className="w-3 h-28 rounded-sm bg-gradient-to-b from-[#ef4444] via-[#f97316] via-[#eab308] via-[#84cc16] via-[#06b6d4] to-[#1d4ed8]" />

          {/* Elevation Labels */}
          <div className="flex flex-col justify-between h-28 text-[9px] font-mono text-slate-200">
            <span>&gt; 940</span>
            <span>920 - 940</span>
            <span>900 - 920</span>
            <span>880 - 900</span>
            <span>860 - 880</span>
            <span>840 - 860</span>
            <span>&lt; 840</span>
          </div>
        </div>

        {/* Scale Bar */}
        <div className="pt-2 border-t border-white/10 flex flex-col space-y-1">
          <div className="flex justify-between text-[8px] font-mono text-slate-400 px-0.5">
            <span>0</span>
            <span>1</span>
            <span>2 km</span>
          </div>
          <div className="h-1 bg-white/30 rounded-full flex">
            <div className="w-1/2 h-full bg-white rounded-l-full" />
            <div className="w-1/2 h-full bg-transparent border-l border-white" />
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER: Interactive Layer Switcher Dock (Exact match to reference image) */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center space-x-1.5 bg-[#090d16]/90 backdrop-blur-md border border-white/15 p-1.5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] text-xs">
        {/* 1. Elevation */}
        <button
          onClick={() => toggleLayer('terrainElevation')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
            layers.terrainElevation ? 'bg-navy-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Elevation</span>
          <span className={`w-2.5 h-2.5 rounded-sm border ${layers.terrainElevation ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'}`} />
        </button>

        {/* 2. Slope */}
        <button
          onClick={() => toggleLayer('slope')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
            layers.slope ? 'bg-navy-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Triangle className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Slope</span>
          <span className={`w-2.5 h-2.5 rounded-sm border ${layers.slope ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'}`} />
        </button>

        {/* 3. Drainage */}
        <button
          onClick={() => toggleLayer('naturalDrainage')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
            layers.naturalDrainage ? 'bg-navy-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Drainage</span>
          <span className={`w-2.5 h-2.5 rounded-sm border ${layers.naturalDrainage ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'}`} />
        </button>

        {/* 4. Flood Risk (Active Blue Glowing Pill in reference) */}
        <button
          onClick={() => {
            toggleLayer('floodSusceptibility');
            setActiveBottomLayer(activeBottomLayer === 'floodRisk' ? '' : 'floodRisk');
          }}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition border ${
            layers.floodSusceptibility
              ? 'bg-cyan-500/25 text-cyan-glow border-cyan-500/60 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
              : 'text-slate-400 hover:text-white border-transparent'
          }`}
        >
          <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px]">Flood Risk</span>
          <span className={`w-2.5 h-2.5 rounded-sm ${layers.floodSusceptibility ? 'bg-cyan-400' : 'border border-slate-500'}`} />
        </button>

        {/* 5. Land Use */}
        <button
          onClick={() => toggleLayer('buildings3d')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
            layers.buildings3d ? 'bg-navy-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Land Use</span>
          <span className={`w-2.5 h-2.5 rounded-sm border ${layers.buildings3d ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'}`} />
        </button>

        {/* 6. Roads */}
        <button
          onClick={() => toggleLayer('roadWaterlogging')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
            layers.roadWaterlogging ? 'bg-navy-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Roads</span>
          <span className={`w-2.5 h-2.5 rounded-sm border ${layers.roadWaterlogging ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'}`} />
        </button>

        {/* 7. Sensors */}
        <button
          onClick={() => toggleLayer('waterSensors')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
            layers.waterSensors ? 'bg-navy-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Sensors</span>
          <span className={`w-2.5 h-2.5 rounded-sm border ${layers.waterSensors ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'}`} />
        </button>
      </div>

      {/* RIGHT CONTROLS: Compass, Zoom & 2D/3D Pill (Exact match to reference image) */}
      <div className="absolute top-8 right-6 z-20 flex flex-col items-center space-y-3">
        {/* Compass Rose Dial */}
        <button
          onClick={resetNorth}
          className="w-10 h-10 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl hover:border-cyan-400 transition group"
          title="Reset Bearing to North"
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            {/* North Red Pointer */}
            <div className="absolute top-0 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[9px] border-b-red-500" />
            {/* South White Pointer */}
            <div className="absolute bottom-0 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[9px] border-t-white/70" />
            <span className="absolute -top-3 text-[8px] font-mono font-bold text-red-400">N</span>
          </div>
        </button>

        {/* Zoom Controls Container */}
        <div className="flex flex-col bg-black/85 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-2xl">
          <button
            onClick={handleZoomIn}
            className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition border-b border-white/10"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* 2D / 3D Switcher Pill */}
        <button
          onClick={toggle2D3D}
          className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-mono font-bold transition shadow-2xl backdrop-blur-md ${
            is3D
              ? 'bg-cyan-500/20 text-cyan-glow border-cyan-500/50 glow-cyan'
              : 'bg-black/85 text-slate-300 border-white/20 hover:text-white'
          }`}
          title="Toggle 2D / 3D Perspective"
        >
          {is3D ? '3D' : '2D'}
        </button>
      </div>
    </div>
  );
};
