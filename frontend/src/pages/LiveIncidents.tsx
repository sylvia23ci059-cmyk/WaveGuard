import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Incident } from '../types';
import { api } from '../services/api';
import {
  Radio,
  AlertTriangle,
  PlusCircle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  Send,
  PhoneCall,
  UserCheck
} from 'lucide-react';

export const LiveIncidents: React.FC = () => {
  const { incidents, refreshData, userRole, setActivePage } = useApp();
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('waterlogging');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(12.9600);
  const [longitude, setLongitude] = useState<number>(78.2700);
  const [locationName, setLocationName] = useState<string>('Robertsonpet Gandhi Circle');
  const [contact, setContact] = useState<string>('');
  const [severity, setSeverity] = useState<string>('medium');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Authority verification state
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setSubmitting(true);
    try {
      const res = await api.createIncident({
        category,
        title,
        description,
        latitude,
        longitude,
        location_name: locationName,
        reporter_type: 'citizen',
        reporter_contact: contact,
        severity
      });
      setSubmissionFeedback(res.message);
      await refreshData();
      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmissionFeedback(null);
        setTitle('');
        setDescription('');
      }, 2500);
    } catch (err) {
      console.error('Error submitting incident:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id: number, status: string) => {
    setVerifyingId(id);
    try {
      await api.verifyIncident(id, status, 'Municipal Drainage QRF Unit');
      await refreshData();
    } catch (err) {
      console.error('Error verifying incident:', err);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-4 bg-navy-950 text-slate-100">
      {/* 1. Header with Report Trigger */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono tracking-wide text-white uppercase">
              Situational Incident Center & Citizen SOS Triage
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Citizen-sourced waterlogging reports, road obstruction alerts, and verification queue.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="mt-3 md:mt-0 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-mono font-semibold flex items-center space-x-2 shadow-lg transition"
        >
          <PlusCircle className="w-4 h-4 text-red-400" />
          <span>Report Waterlogging / Request SOS</span>
        </button>
      </div>

      {/* 2. Mandatory SOS Protocol Disclaimer */}
      <div className="p-3.5 rounded-lg bg-navy-900 border border-red-500/30 text-xs text-slate-300 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <b className="text-red-400 uppercase font-mono tracking-wide">Emergency Dispatch Notice:</b> Submitting an SOS
          report on this platform logs a community situational awareness marker.
          <b> It does not guarantee or imply that government emergency rescue services have received, dispatched, or acknowledged your request.</b>
          <div className="mt-1 font-mono font-bold text-white flex items-center space-x-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-red-400" />
            <span>FOR IMMEDIATE LIFE-THREATENING RESCUE, CALL KARNATAKA EMERGENCY SERVICES: 112 (TOLL-FREE)</span>
          </div>
        </div>
      </div>

      {/* 3. Incidents Feed List */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1">
          Active Situational Reports ({incidents.length})
        </div>

        {incidents.map((inc) => {
          const isSos = inc.category === 'emergency_sos';
          const isVerified = inc.verification_status === 'verified';
          const isUnverified = inc.verification_status === 'unverified';

          return (
            <div
              key={inc.id}
              className={`p-4 rounded-xl border transition shadow-lg space-y-3 ${
                isSos
                  ? 'bg-red-950/20 border-red-500/50 glow-crimson'
                  : isVerified
                  ? 'bg-navy-900 border-emerald-500/30'
                  : 'bg-navy-900 border-navy-700/80'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-navy-800 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-white bg-navy-950 px-2 py-0.5 rounded border border-navy-800">
                    {inc.incident_number}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      isSos ? 'bg-red-500 text-black' : 'bg-navy-800 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    {inc.category.replace('_', ' ')}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${
                      isVerified
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : isUnverified
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    }`}
                  >
                    {inc.verification_status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{inc.reported_at?.slice(0, 16)}</span>
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-sm font-bold text-white">{inc.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{inc.description}</p>
                <div className="text-[11px] text-slate-400 font-mono mt-1.5 flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{inc.location_name} &bull; Lat: {inc.latitude.toFixed(4)}°, Lon: {inc.longitude.toFixed(4)}°</span>
                </div>
              </div>

              {/* Authority Actions Bar */}
              {(userRole === 'admin' || userRole === 'engineer') && isUnverified && (
                <div className="pt-2 border-t border-navy-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-amber-400 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Requires Authority Field Verification</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVerify(inc.id, 'verified')}
                      disabled={verifyingId === inc.id}
                      className="px-3 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold transition"
                    >
                      Verify Incident
                    </button>
                    <button
                      onClick={() => handleVerify(inc.id, 'false_alarm')}
                      disabled={verifyingId === inc.id}
                      className="px-3 py-1 rounded bg-navy-800 hover:bg-navy-750 text-slate-400 text-xs font-mono transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Citizen Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-navy-800">
              <h3 className="font-mono text-xs font-bold text-white uppercase flex items-center space-x-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Submit Citizen Waterlogging / SOS Report</span>
              </h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {submissionFeedback ? (
              <div className="p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-white">Report Successfully Broadcasted</div>
                <p className="text-xs text-slate-300">{submissionFeedback}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Incident Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-800 text-xs text-white rounded-lg p-2 focus:outline-none"
                  >
                    <option value="waterlogging">Road Waterlogging (Standing Water)</option>
                    <option value="blocked_drain">Blocked Sump / Clogged Box Culvert</option>
                    <option value="road_impassable">Road Impassable / Bridge Overtopping</option>
                    <option value="infrastructure_damage">Retaining Wall / Nallah Damage</option>
                    <option value="emergency_sos">Emergency SOS (Public Distress Request)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Title / Brief Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20cm Waterlogging on Bangarapet Road approach"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-800 text-xs text-white rounded-lg p-2 focus:outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Detailed Description & Depth Estimate</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe observed conditions, impassable lanes, trapped vehicles, or water ingress..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-800 text-xs text-white rounded-lg p-2 focus:outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Location Landmark</label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full bg-navy-950 border border-navy-800 text-xs text-white rounded-lg p-2 focus:outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Contact Phone (Optional)</label>
                    <input
                      type="text"
                      placeholder="+91 98450 ..."
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full bg-navy-950 border border-navy-800 text-xs text-white rounded-lg p-2 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-navy-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded bg-navy-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-xs font-mono font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded shadow-lg flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Transmitting...' : 'Submit Unverified Report'}</span>
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
