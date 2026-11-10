import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DrainageReach } from '../types';
import {
  GitFork,
  ArrowRight,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Activity,
  Layers
} from 'lucide-react';

export const DrainageIntelligence: React.FC = () => {
  const [reaches, setReaches] = useState<DrainageReach[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDrainage();
  }, []);

  const loadDrainage = async () => {
    setLoading(true);
    try {
      const data = await api.getDrainageSegments();
      setReaches(data);
    } catch (err) {
      console.error('Error fetching drainage reaches:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-4 bg-navy-950 text-slate-100">
      {/* 1. Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <GitFork className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono tracking-wide text-white uppercase">
              Drainage Network Differential Hydraulic Intelligence
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Multi-node comparative analysis of upstream vs downstream hydraulic head differentials.
          </p>
        </div>

        <button
          onClick={loadDrainage}
          className="mt-3 md:mt-0 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-cyan-400 border border-navy-700 text-xs font-mono flex items-center space-x-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* 2. Scientific Disclaimer Warning */}
      <div className="p-3 rounded-lg bg-navy-900 border border-amber-500/30 text-xs text-slate-300 space-y-1">
        <div className="font-mono text-amber-300 font-bold flex items-center space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Hydraulic Diagnosis Integrity Principle:</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          <b>Water-level readings alone cannot confirm a physical drain blockage.</b> A heightened upstream water level
          with low downstream stage indicates an empirical hydraulic differential consistent with a <i>possible restriction</i>,
          silt sedimentation, or severe backwater effect, but requires manual physical or CCTV camera inspection before confirming obstruction.
        </p>
      </div>

      {/* 3. Drainage Reach Comparative Cards */}
      <div className="space-y-4 flex-1">
        {reaches.map((reach) => {
          const isRestriction = reach.status === 'possible_restriction';
          const isOverflow = reach.status === 'possible_overflow';

          return (
            <div
              key={reach.id}
              className={`p-4 rounded-xl border transition shadow-xl space-y-4 ${
                isRestriction
                  ? 'bg-amber-950/20 border-amber-500/40 glow-amber'
                  : isOverflow
                  ? 'bg-red-950/20 border-red-500/40 glow-crimson'
                  : 'bg-navy-900 border-navy-700/80'
              }`}
            >
              {/* Reach Title & Diagnostic Status */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-navy-800 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>{reach.reach_name}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Segment ID: KGF-DRAIN-0{reach.id} &bull; Open Channel Swale
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-mono font-bold uppercase px-2.5 py-1 rounded border ${
                      isRestriction
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : isOverflow
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {reach.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Upstream vs Downstream Comparative Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                {/* Node 1: Upstream */}
                <div className="bg-navy-950 p-3 rounded-lg border border-navy-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 block">Upstream Node</span>
                  <div className="font-semibold text-xs text-white truncate">{reach.upstream_station}</div>
                  <div className="flex items-baseline space-x-2 font-mono mt-1">
                    <span className="text-lg font-bold text-white">{reach.upstream_level_m} m</span>
                    <span className="text-[10px] text-slate-400">stage depth</span>
                  </div>
                </div>

                {/* Hydraulic Differential Connector */}
                <div className="flex flex-col items-center justify-center p-2 text-center font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Differential Head (Δh)</div>
                  <div className="text-base font-bold text-cyan-glow my-0.5">
                    {reach.differential_head_m} m
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                    <span>Gravity Flow</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </div>
                </div>

                {/* Node 2: Downstream */}
                <div className="bg-navy-950 p-3 rounded-lg border border-navy-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 block">Downstream Node</span>
                  <div className="font-semibold text-xs text-white truncate">{reach.downstream_station}</div>
                  <div className="flex items-baseline space-x-2 font-mono mt-1">
                    <span className="text-lg font-bold text-white">{reach.downstream_level_m} m</span>
                    <span className="text-[10px] text-slate-400">stage depth</span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Notes & Protocol Disclaimer */}
              <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800 text-xs space-y-1">
                <div className="font-mono text-[11px] font-bold text-slate-300">Diagnostic Assessment:</div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{reach.diagnosis_notes}</p>
                <div className="pt-1 text-[10px] text-slate-400 font-mono">
                  Attribution: {reach.disclaimer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
