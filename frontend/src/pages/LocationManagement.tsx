import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LocationItem } from '../types';
import { api } from '../services/api';
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  History,
  Check,
  X,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

export const LocationManagement: React.FC = () => {
  const { locations, refreshLocations, setSelectedLocation, setActivePage } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: 12.9716,
    longitude: 77.5946,
    category: 'underpass',
    road_identifier: '',
    caution_threshold_cm: 15.0,
    closure_threshold_cm: 35.0,
    is_active: true,
  });

  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLocName, setHistoryLocName] = useState('');

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.road_identifier && loc.road_identifier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (loc.description && loc.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || loc.current_status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || loc.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleOpenCreate = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      description: '',
      latitude: 12.9716,
      longitude: 77.5946,
      category: 'underpass',
      road_identifier: '',
      caution_threshold_cm: 15.0,
      closure_threshold_cm: 35.0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc: LocationItem) => {
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      description: loc.description || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
      category: loc.category,
      road_identifier: loc.road_identifier || '',
      caution_threshold_cm: loc.caution_threshold_cm,
      closure_threshold_cm: loc.closure_threshold_cm,
      is_active: loc.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await api.updateLocation(editingLocation.id, formData);
      } else {
        await api.createLocation(formData);
      }
      setIsModalOpen(false);
      await refreshLocations();
    } catch (err: any) {
      alert(`Error saving location: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from monitored inventory?`)) {
      try {
        await api.deleteLocation(id);
        await refreshLocations();
      } catch (err: any) {
        alert(`Error deleting location: ${err.message}`);
      }
    }
  };

  const handleViewHistory = async (loc: LocationItem) => {
    setHistoryLocName(loc.name);
    try {
      const history = await api.getLocationHistory(loc.id, 25);
      setHistoryData(history);
      setHistoryModalOpen(true);
    } catch (err: any) {
      alert(`Error loading history: ${err.message}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bengaluru Location & Underpass Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain geographic coordinates, underpass clearance thresholds, and sensor telemetry configurations.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center space-x-1.5 transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Monitored Site</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by underpass name, corridor, or road ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="NORMAL">Normal</option>
            <option value="CAUTION">Caution</option>
            <option value="BLOCKED">Blocked</option>
            <option value="UNKNOWN">Unknown</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
          >
            <option value="ALL">All Categories</option>
            <option value="underpass">Underpass</option>
            <option value="subway">Subway</option>
            <option value="arterial_lowpoint">Arterial Low-Point</option>
            <option value="intersection">Intersection</option>
          </select>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Location Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">Caution Thresh.</th>
                <th className="py-3 px-4">Closure Thresh.</th>
                <th className="py-3 px-4">Current Depth</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{loc.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{loc.road_identifier || loc.id}</div>
                  </td>
                  <td className="py-3 px-4 capitalize">{loc.category}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-amber-700">{loc.caution_threshold_cm} cm</td>
                  <td className="py-3 px-4 font-mono font-medium text-red-700">{loc.closure_threshold_cm} cm</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{loc.current_water_depth_cm} cm</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      loc.current_status === 'NORMAL'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : loc.current_status === 'CAUTION'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : loc.current_status === 'BLOCKED'
                        ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {loc.current_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleViewHistory(loc)}
                        title="View Telemetry History"
                        className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 rounded"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(loc)}
                        title="Edit Thresholds & Info"
                        className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id, loc.name)}
                        title="Delete Location"
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-slate-100 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                {editingLocation ? `Edit ${editingLocation.name}` : 'Register New Monitored Site'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site / Underpass Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Marathahalli Underpass"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Context, connecting roads, drainage catchment..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Latitude (°N) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Longitude (°E) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                  >
                    <option value="underpass">Underpass</option>
                    <option value="subway">Subway</option>
                    <option value="arterial_lowpoint">Arterial Low-Point</option>
                    <option value="intersection">Intersection</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Road / Corridor Code</label>
                  <input
                    type="text"
                    value={formData.road_identifier}
                    onChange={(e) => setFormData({ ...formData, road_identifier: e.target.value })}
                    placeholder="e.g. ORR-EAST-UP01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-amber-800 mb-1">Caution Threshold (cm) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.caution_threshold_cm}
                    onChange={(e) => setFormData({ ...formData, caution_threshold_cm: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-red-800 mb-1">Closure Threshold (cm) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.closure_threshold_cm}
                    onChange={(e) => setFormData({ ...formData, closure_threshold_cm: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Historical Telemetry</h3>
                <p className="text-[11px] text-slate-500">{historyLocName}</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto">
              {historyData.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs">No readings recorded yet.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                    <tr>
                      <th className="py-2 px-3">Depth</th>
                      <th className="py-2 px-3">Source</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyData.map((h) => (
                      <tr key={h.id}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{h.water_depth_cm} cm</td>
                        <td className="py-2 px-3 text-slate-600">{h.source}</td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {h.validation_status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                          {new Date(h.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
