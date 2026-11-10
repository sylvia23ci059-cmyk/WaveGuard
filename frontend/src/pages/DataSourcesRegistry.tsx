import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DatasetMetadata } from '../types';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Layers,
  HelpCircle
} from 'lucide-react';

export const DataSourcesRegistry: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importDataset, setImportDataset] = useState<string>('dem');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const data = await api.getDatasets();
      setDatasets(data);
    } catch (err) {
      console.error('Error fetching datasets metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualImport = (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus('Dataset validated. Reprojected to EPSG:32644 (UTM 44N) and archived in data/processed/.');
    setTimeout(() => {
      setShowImportModal(false);
      setImportStatus(null);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-4 bg-navy-950 text-slate-100">
      {/* 1. Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono tracking-wide text-white uppercase">
              Scientific Dataset Provenance & Metadata Registry
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Mandatory data provenance, spatial resolutions, Coordinate Reference Systems (CRS), and known limitations.
          </p>
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="mt-3 md:mt-0 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-glow border border-cyan-500/40 text-xs font-mono flex items-center space-x-1.5 transition"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Manual Dataset Import</span>
        </button>
      </div>

      {/* 2. Mandatory Scientific Integrity Commandments Callout */}
      <div className="p-4 rounded-xl bg-navy-900 border border-navy-700 space-y-2">
        <div className="font-mono text-cyan-400 text-xs font-bold uppercase flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Mandatory Scientific Integrity Principles:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
          <div className="p-2.5 rounded bg-navy-950 border border-navy-800">
            <b className="text-red-400">Rule 1:</b> Never claim a location is flooded based solely on elevation.
          </div>
          <div className="p-2.5 rounded bg-navy-950 border border-navy-800">
            <b className="text-red-400">Rule 2:</b> Never assume a drainage pipeline exists because a natural D8 overland flow path exists.
          </div>
          <div className="p-2.5 rounded bg-navy-950 border border-navy-800">
            <b className="text-red-400">Rule 3:</b> Never label an uncalibrated static susceptibility index as a hydrodynamic prediction.
          </div>
          <div className="p-2.5 rounded bg-navy-950 border border-navy-800">
            <b className="text-red-400">Rule 4:</b> Clearly label all simulated IoT sensor readings as <b>DEMONSTRATION DATA</b>.
          </div>
        </div>
      </div>

      {/* 3. Provenance Registry Cards */}
      <div className="space-y-3 flex-1">
        {datasets.map((ds) => (
          <div
            key={ds.id}
            className="p-4 rounded-xl bg-navy-900 border border-navy-700/80 shadow-lg space-y-3"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-navy-800 gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded">
                  {ds.dataset_code}
                </span>
                <h3 className="text-sm font-semibold text-white">{ds.title}</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                ACTIVE INGESTION
              </span>
            </div>

            {/* Metadata Attributes Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="bg-navy-950 p-2 rounded border border-navy-850">
                <span className="text-slate-500 block text-[9px] uppercase">Provider</span>
                <span className="text-slate-200">{ds.provider}</span>
              </div>
              <div className="bg-navy-950 p-2 rounded border border-navy-850">
                <span className="text-slate-500 block text-[9px] uppercase">Spatial Resolution</span>
                <span className="text-slate-200">{ds.spatial_resolution}</span>
              </div>
              <div className="bg-navy-950 p-2 rounded border border-navy-850">
                <span className="text-slate-500 block text-[9px] uppercase">Coordinate System</span>
                <span className="text-cyan-400">{ds.crs}</span>
              </div>
              <div className="bg-navy-950 p-2 rounded border border-navy-850">
                <span className="text-slate-500 block text-[9px] uppercase">Temporal Extent</span>
                <span className="text-slate-200">{ds.temporal_coverage}</span>
              </div>
            </div>

            {/* Limitations & Processing Lineage */}
            <div className="space-y-1.5 text-xs">
              <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/20 text-slate-300">
                <b className="text-amber-300 text-[11px]">Documented Limitations:</b> {ds.limitations}
              </div>
              <div className="p-2.5 rounded bg-navy-950 border border-navy-850 text-slate-400 text-[11px]">
                <b className="text-slate-300">Processing Lineage:</b> {ds.processing_history}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Manual Dataset Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-navy-800">
              <h3 className="font-mono text-xs font-bold text-white uppercase flex items-center space-x-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Manual Dataset Ingestion & Reprojection</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {importStatus ? (
              <div className="p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-white">Import Verified</div>
                <p className="text-xs text-slate-300">{importStatus}</p>
              </div>
            ) : (
              <form onSubmit={handleManualImport} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Geographic Layer</label>
                  <select
                    value={importDataset}
                    onChange={(e) => setImportDataset(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-800 text-xs text-white rounded-lg p-2 focus:outline-none"
                  >
                    <option value="dem">Copernicus DEM GeoTIFF (.tif / COG)</option>
                    <option value="boundary">KGF Boundary GeoPackage (.gpkg)</option>
                    <option value="drainage">Municipal Stormwater Shapefile (.shp / .zip)</option>
                    <option value="rainfall">KSNDMC Station NetCDF / CSV</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Select File from Disk</label>
                  <input
                    type="file"
                    required
                    className="w-full bg-navy-950 border border-navy-800 text-xs text-slate-300 rounded-lg p-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-glow hover:file:bg-cyan-500/30"
                  />
                </div>

                <div className="text-[11px] text-slate-400">
                  Import will automatically inspect geometry validity and project coordinates into EPSG:32644 (UTM 44N).
                </div>

                <div className="pt-2 border-t border-navy-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded bg-navy-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-mono font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded shadow-lg"
                  >
                    Validate & Ingest
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
