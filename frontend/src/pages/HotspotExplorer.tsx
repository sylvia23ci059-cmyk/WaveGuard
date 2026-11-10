import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Hotspot } from '../types';
import { api } from '../services/api';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Edit3,
  ShieldAlert,
  ArrowUpDown,
  Download
} from 'lucide-react';

export const HotspotExplorer: React.FC = () => {
  const { hotspots, refreshData, userRole, setActivePage, setSelectedHotspot } = useApp();
  const [search, setSearch] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [editStatus, setEditStatus] = useState<string>('unverified');
  const [editAction, setEditAction] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Filter hotspots
  const filtered = hotspots.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
                          h.hotspot_code.toLowerCase().includes(search.toLowerCase()) ||
                          h.nearby_drainage_type.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || h.inspection_priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || h.verification_status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const handleOpenEdit = (h: Hotspot) => {
    setEditingHotspot(h);
    setEditStatus(h.verification_status);
    setEditAction(h.recommended_action);
  };

  const handleSaveEdit = async () => {
    if (!editingHotspot) return;
    setSaving(true);
    try {
      await api.updateHotspot(editingHotspot.id, {
        verification_status: editStatus,
        recommended_action: editAction
      });
      await refreshData();
      setEditingHotspot(null);
    } catch (err) {
      console.error('Error updating hotspot:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-4 bg-navy-950 text-slate-100">
      {/* 1. Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold font-mono tracking-wide text-white uppercase">
              Candidate Inundation Hotspot Inventory
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Multi-criteria prioritization based on local terrain depressions, flow convergence, and road exposure.
          </p>
        </div>

        <div className="mt-3 md:mt-0 flex items-center space-x-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-navy-800 border border-navy-700 text-slate-300">
            {hotspots.length} Initial Study Zones
          </span>
        </div>
      </div>

      {/* 2. Scientific Disclaimer Warning */}
      <div className="p-3 rounded-lg bg-navy-900 border border-amber-500/30 text-xs text-slate-300 space-y-1">
        <div className="font-mono text-amber-300 font-bold flex items-center space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Scientific Integrity & Field Verification Protocol:</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Locations such as Champion Reefs, Robertsonpet, Andersonpet, Oorgaum, and Nundydurg are <b>initial screening study zones</b>,
          not confirmed flood sites unless validated through recorded field observations or municipal drainage records.
        </p>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-navy-900/90 border border-navy-700 rounded-xl p-3 shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search hotspots by name, code, drainage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-950 border border-navy-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[10px]">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-navy-950 border border-navy-800 text-xs text-white rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[10px]">Verification:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-navy-950 border border-navy-800 text-xs text-white rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="unverified">Unverified</option>
              <option value="field_surveyed">Field Surveyed</option>
              <option value="confirmed_hotspot">Confirmed Hotspot</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Hotspots Detailed Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto">
        {filtered.map((h) => (
          <div
            key={h.id}
            className="bg-navy-900 border border-navy-700/80 rounded-xl p-4 shadow-lg space-y-3 hover:border-cyan-500/40 transition flex flex-col justify-between"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                    {h.hotspot_code}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                      h.inspection_priority === 'critical'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : h.inspection_priority === 'high'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    }`}
                  >
                    {h.inspection_priority} Priority
                  </span>
                </div>

                <span
                  className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded border ${
                    h.verification_status === 'confirmed_hotspot'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : h.verification_status === 'field_surveyed'
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : 'bg-navy-800 text-slate-400 border-navy-700'
                  }`}
                >
                  {h.verification_status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Title & Coordinates */}
              <div className="mt-2">
                <h3 className="text-sm font-semibold text-white">{h.name}</h3>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Lat: {h.latitude.toFixed(4)}°N &bull; Lon: {h.longitude.toFixed(4)}°E
                </div>
              </div>

              {/* Topographic & Hydrological Profile Grid */}
              <div className="grid grid-cols-4 gap-1.5 mt-3 text-center font-mono text-[10px]">
                <div className="bg-navy-950 p-1.5 rounded border border-navy-800">
                  <span className="text-slate-500 block">Elev</span>
                  <span className="font-bold text-white">{h.elevation_m}m</span>
                </div>
                <div className="bg-navy-950 p-1.5 rounded border border-navy-800">
                  <span className="text-slate-500 block">Slope</span>
                  <span className="font-bold text-white">{h.slope_deg}°</span>
                </div>
                <div className="bg-navy-950 p-1.5 rounded border border-navy-800">
                  <span className="text-slate-500 block">Catchment</span>
                  <span className="font-bold text-white">{h.catchment_area_ha} ha</span>
                </div>
                <div className="bg-navy-950 p-1.5 rounded border border-navy-800">
                  <span className="text-slate-500 block">Susceptibility</span>
                  <span className="font-bold text-cyan-400">{(h.susceptibility_score * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Drainage & Historical Notes */}
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="text-slate-300">
                  <b className="text-slate-400 text-[11px]">Drainage Infrastructure:</b> {h.nearby_drainage_type}
                </div>
                <div className="text-slate-400 text-[11px] bg-navy-950 p-2 rounded border border-navy-800/80">
                  <b>Historical Inundation Record:</b> {h.historical_evidence}
                </div>
                <div className="text-emerald-400 text-[11px] bg-emerald-950/30 p-2 rounded border border-emerald-500/20">
                  <b>Recommended Action:</b> {h.recommended_action}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-navy-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                Confidence: {(h.confidence_score * 100).toFixed(0)}%
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedHotspot(h);
                    setActivePage('map3d');
                  }}
                  className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-750 text-cyan-400 hover:text-cyan-300 text-xs font-mono flex items-center space-x-1 border border-navy-700"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Locate on 3D Map</span>
                </button>
                {(userRole === 'admin' || userRole === 'surveyor' || userRole === 'engineer') && (
                  <button
                    onClick={() => handleOpenEdit(h)}
                    className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-glow text-xs font-mono flex items-center space-x-1 border border-cyan-500/30"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Survey Update</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Field Survey Verification Modal */}
      {editingHotspot && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-navy-800">
              <h3 className="font-mono text-xs font-bold text-white uppercase">
                Field Survey Verification &bull; {editingHotspot.hotspot_code}
              </h3>
              <button onClick={() => setEditingHotspot(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Update empirical ground-truthing status for <b>{editingHotspot.name}</b>.
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Verification Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-800 text-xs text-white rounded-lg p-2 focus:outline-none"
                >
                  <option value="unverified">Unverified (Preliminary DEM Study Zone)</option>
                  <option value="field_surveyed">Field Surveyed (Site Visit Completed)</option>
                  <option value="confirmed_hotspot">Confirmed Hotspot (Empirically Validated Risk)</option>
                  <option value="rejected">Rejected (Adequate Gradient / False Positive)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Recommended Mitigation / Maintenance Action</label>
                <textarea
                  value={editAction}
                  onChange={(e) => setEditAction(e.target.value)}
                  rows={3}
                  className="w-full bg-navy-950 border border-navy-800 text-xs text-white rounded-lg p-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-navy-800 flex justify-end space-x-2">
              <button
                onClick={() => setEditingHotspot(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded bg-navy-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-1.5 text-xs font-mono font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded shadow-lg"
              >
                {saving ? 'Saving...' : 'Save Survey Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
