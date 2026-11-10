import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DEMProduct } from '../types';
import {
  Mountain,
  Download,
  FileCode,
  Layers,
  Compass,
  AlertTriangle,
  Info,
  CheckCircle,
  Play
} from 'lucide-react';

export const TerrainHydrology: React.FC = () => {
  const [products, setProducts] = useState<DEMProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'elevation' | 'slope' | 'flow' | 'depressions' | 'twi'>('elevation');
  const [recomputing, setRecomputing] = useState<boolean>(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getDEMProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleRerunPipeline = async () => {
    setRecomputing(true);
    try {
      await api.recalculateGIS();
      await loadProducts();
    } finally {
      setRecomputing(false);
    }
  };

  // Find products
  const elevProduct = products.find(p => p.layer_type === 'elevation') || { min_value: 754.4, max_value: 913.9, mean_value: 825.5, unit: 'meters' };
  const slopeProduct = products.find(p => p.layer_type === 'slope') || { min_value: 0.0, max_value: 4.1, mean_value: 1.6, unit: 'degrees' };
  const flowProduct = products.find(p => p.layer_type === 'flow_accumulation') || { min_value: 1, max_value: 26001, mean_value: 382, unit: 'pixels' };
  const twiProduct = products.find(p => p.layer_type === 'twi') || { min_value: 4.1, max_value: 16.8, mean_value: 8.9, unit: 'index' };
  const depProduct = products.find(p => p.layer_type === 'depressions') || { min_value: 0.0, max_value: 2.4, mean_value: 0.1, unit: 'meters' };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-4 bg-navy-950 text-slate-100">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Mountain className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono tracking-wide text-white uppercase">
              Scientific Terrain & Hydrological Processing Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Copernicus DEM GLO-30 Digital Surface Model &bull; Reprojected to UTM Zone 44N (EPSG:32644)
          </p>
        </div>

        <div className="mt-3 md:mt-0 flex items-center space-x-2">
          <button
            onClick={handleRerunPipeline}
            disabled={recomputing}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-mono text-cyan-glow border border-cyan-500/40 glow-cyan transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>{recomputing ? 'Processing Rasters...' : 'Re-Execute GIS Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* 2. Key Topographic Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 shadow-md">
          <div className="text-[10px] font-mono uppercase text-slate-400">Min Elevation</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">{elevProduct.min_value?.toFixed(1)} m</div>
          <div className="text-[9px] text-cyan-400 font-mono">Southern Valley Outfall</div>
        </div>

        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 shadow-md">
          <div className="text-[10px] font-mono uppercase text-slate-400">Max Elevation</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">{elevProduct.max_value?.toFixed(1)} m</div>
          <div className="text-[9px] text-cyan-400 font-mono">North-Eastern Ridge</div>
        </div>

        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 shadow-md">
          <div className="text-[10px] font-mono uppercase text-slate-400">Mean Relief</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">{elevProduct.mean_value?.toFixed(1)} m</div>
          <div className="text-[9px] text-slate-400 font-mono">Kolar Plateau Baseline</div>
        </div>

        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 shadow-md">
          <div className="text-[10px] font-mono uppercase text-slate-400">Max Slope</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">{slopeProduct.max_value?.toFixed(1)}°</div>
          <div className="text-[9px] text-amber-400 font-mono">Granite Ridge Escarpment</div>
        </div>

        <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 shadow-md">
          <div className="text-[10px] font-mono uppercase text-slate-400">Max Flow Accum</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">{flowProduct.max_value?.toLocaleString()}</div>
          <div className="text-[9px] text-blue-400 font-mono">Swarna Nallah Trunk</div>
        </div>
      </div>

      {/* 3. Deep-Dive Analytical Tabs */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-navy-800 bg-navy-950/70 px-3 pt-2 space-x-2">
          {[
            { id: 'elevation', label: 'Elevation Profile' },
            { id: 'slope', label: 'Slope in Degrees' },
            { id: 'flow', label: 'D8 Flow Accumulation' },
            { id: 'depressions', label: 'Depression Analysis' },
            { id: 'twi', label: 'Topographic Wetness (TWI)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-mono font-medium rounded-t-lg transition border-t border-x ${
                activeTab === tab.id
                  ? 'bg-navy-900 text-cyan-glow border-navy-700 border-b-transparent font-bold'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-navy-850'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 flex-1 space-y-4">
          {activeTab === 'elevation' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white font-mono uppercase">
                  Digital Elevation Model (DEM) Statistical Distribution
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">Copernicus GLO-30 DSM (30m)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The Kolar Gold Fields taluk lies on the southern plateau of Karnataka, flanked by metamorphic schist
                ridges and ancient granite outcrops. Terrain elevations range from <b>{elevProduct.min_value?.toFixed(1)} m</b> in
                the downstream southern basin (discharging towards Palar river basin) to <b>{elevProduct.max_value?.toFixed(1)} m</b> along
                the eastern mining dump ridgelines and northern hills.
              </p>

              {/* DSM Warning Callout */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Important Scientific Sensor Limitation:</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Copernicus GLO-30 is a <b>Digital Surface Model (DSM)</b>, reflecting vegetation canopies, mine tailings dumps,
                  and building rooftops rather than a bare-earth bare ground surface (DTM). It is suitable for regional catchment screening,
                  not sub-meter railway underpass invert elevations or road gutter depths.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'slope' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white font-mono uppercase">
                  Horn's Gradient Slope Calculation
                </h3>
                <span className="text-[10px] font-mono text-amber-400">Gradient in Degrees (0° - 4.1°)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Slopes were computed using Horn's 8-neighbor weighted finite difference algorithm:
                <br />
                <code className="text-cyan-400 font-mono">tan(θ) = sqrt((dz/dx)² + (dz/dy)²)</code>
                <br />
                The Robertsonpet and Andersonpet urban corridor is dominated by extremely flat gradients (&lt; 1.5°),
                which severely impedes gravitational stormwater runoff and accelerates ponding during sudden convective downpours.
              </p>
            </div>
          )}

          {activeTab === 'flow' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white font-mono uppercase">
                  D8 Steepest Descent Flow Accumulation
                </h3>
                <span className="text-[10px] font-mono text-blue-400">Upslope Catchment Convergence</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The D8 algorithm routes each cell's runoff into one of its 8 neighbors along the steepest downhill gradient.
                Cells with accumulation exceeding 1,200 grid cells (~108 hectares upstream catchment) delineate the primary
                natural overland swales and the Swarna Nallah main stem.
              </p>
            </div>
          )}

          {activeTab === 'depressions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white font-mono uppercase">
                  Hydrological Conditioning & Terrain Depression Identification
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">Fill DEM Comparison</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rather than blindly sinking all depressions (which destroys genuine retention ponds and quarry pits),
                our pipeline preserves verified depressions and quantifies maximum ponding depth:
                <br />
                <code className="text-cyan-400 font-mono">Depression Depth = max(0, Fill_DEM - Original_DEM)</code>
                <br />
                This pinpoints closed sumps such as the Champion Reefs railway underbridge.
              </p>
            </div>
          )}

          {activeTab === 'twi' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white font-mono uppercase">
                  Topographic Wetness Index (TWI)
                </h3>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">TWI = ln(a / tan β)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                TWI estimates the spatial distribution of soil saturation zones:
                <br />
                <code className="text-cyan-400 font-mono">a = Catchment area per contour length, β = Local slope in radians</code>
                <br />
                <b>Limitations:</b> TWI assumes steady-state uniform recharge and isotropic soil transmissivity, which
                does not account for localized pipe backflow or hard impervious pavement.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
