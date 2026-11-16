import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AlertItem } from '../types';
import { api } from '../services/api';
import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  Check,
  Filter,
  Clock,
  ShieldAlert,
  Info
} from 'lucide-react';

export const AlertsAndIncidents: React.FC = () => {
  const { alerts, refreshAlerts } = useApp();
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterAcknowledged, setFilterAcknowledged] = useState<'ALL' | 'UNACK' | 'ACK'>('UNACK');
  const [ackLoading, setAckLoading] = useState<number | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    const matchesSev = filterSeverity === 'ALL' || a.severity === filterSeverity;
    const matchesAck =
      filterAcknowledged === 'ALL'
        ? true
        : filterAcknowledged === 'UNACK'
        ? !a.is_acknowledged
        : a.is_acknowledged;
    return matchesSev && matchesAck;
  });

  const handleAcknowledge = async (id: number) => {
    setAckLoading(id);
    try {
      await api.acknowledgeAlert(id, 'Admin Operator');
      await refreshAlerts();
    } catch (err: any) {
      alert(`Error acknowledging alert: ${err.message}`);
    } finally {
      setAckLoading(null);
    }
  };

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && !a.is_acknowledged).length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING' && !a.is_acknowledged).length;
  const infoCount = alerts.filter((a) => a.severity === 'INFO' && !a.is_acknowledged).length;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Alerts & Incident Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time threshold violation notifications, confirmed underpass closures, and telemetry staleness tracking.
          </p>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-red-200 rounded-xl p-4 shadow-sm border-l-4 border-l-red-600 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-red-700 uppercase">Critical Road Closures</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{criticalCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Unacknowledged closure alerts</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-500/80" />
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase">Caution Inundation</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{warningCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Water levels &gt; caution limit</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500/80" />
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-700 uppercase">Telemetry & System Info</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{infoCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Status updates & sensor heartbeats</p>
          </div>
          <Info className="w-8 h-8 text-blue-500/80" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Alerts:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Ack state */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterAcknowledged('UNACK')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterAcknowledged === 'UNACK' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600'
              }`}
            >
              Unacknowledged
            </button>
            <button
              onClick={() => setFilterAcknowledged('ACK')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterAcknowledged === 'ACK' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600'
              }`}
            >
              Acknowledged
            </button>
            <button
              onClick={() => setFilterAcknowledged('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterAcknowledged === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600'
              }`}
            >
              All
            </button>
          </div>

          {/* Severity */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No Matching Alerts</p>
            <p className="mt-1">All conditions are normal or matching filter criteria are satisfied.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                alert.severity === 'CRITICAL'
                  ? 'border-red-200 hover:border-red-300'
                  : alert.severity === 'WARNING'
                  ? 'border-amber-200 hover:border-amber-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-100 text-red-700'
                    : alert.severity === 'WARNING'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-600 text-white'
                        : alert.severity === 'WARNING'
                        ? 'bg-amber-500 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {alert.severity}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{alert.location_name || alert.location_id}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({alert.alert_type})
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{alert.description}</p>

                  <div className="mt-2 text-[10px] text-slate-400 flex items-center space-x-3 font-mono">
                    <span>Timestamp: {new Date(alert.timestamp).toLocaleString()}</span>
                    {alert.is_acknowledged && (
                      <span className="text-emerald-600 font-medium">
                        • Acknowledged by {alert.acknowledged_by} at {alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleTimeString() : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="self-end sm:self-center shrink-0">
                {!alert.is_acknowledged ? (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={ackLoading === alert.id}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledge Alert</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-semibold">
                    <Check className="w-4 h-4" />
                    <span>Resolved / Acknowledged</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
