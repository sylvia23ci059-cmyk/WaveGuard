import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SystemSettings } from '../types';
import {
  Settings,
  Shield,
  Database,
  Cpu,
  Clock,
  Radio,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [freshnessMinutes, setFreshnessMinutes] = useState(30);
  const [simInterval, setSimInterval] = useState(5);
  const [groqModel, setGroqModel] = useState('openai/gpt-oss-120b');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
        setFreshnessMinutes(data.freshness_window_minutes);
        setSimInterval(data.simulator_interval_seconds);
        setGroqModel(data.groq_model);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    try {
      const updated = await api.updateSettings({
        freshness_window_minutes: freshnessMinutes,
        simulator_interval_seconds: simInterval,
        groq_model: groqModel,
      });
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error updating settings: ${err.message}`);
    }
  };

  if (loading || !settings) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 space-y-6 text-slate-800">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Governance</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure telemetry staleness thresholds, Groq AI model parameters, and inspect hardware integration provenance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form & Configuration */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Settings className="w-4 h-4 text-cyan-600" />
            <h3 className="font-bold text-sm text-slate-900">Runtime Parameters</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Data Freshness Window (Minutes):
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={freshnessMinutes}
                onChange={(e) => setFreshnessMinutes(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Telemetry older than this threshold is automatically flagged as UNKNOWN.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Simulator Telemetry Pulse Interval (Seconds):
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={simInterval}
                onChange={(e) => setSimInterval(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Frequency at which the simulation service updates underpass water depths.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Groq AI Inference Model ID:
              </label>
              <input
                type="text"
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                placeholder="e.g. openai/gpt-oss-120b"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Active Groq model for data-grounded flood intelligence copilot.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>

              {saveSuccess && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Settings updated successfully!</span>
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: System Environment & Architecture Metadata */}
        <div className="space-y-4">
          {/* Metadata Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Database className="w-4 h-4 text-cyan-600" />
              <h3 className="font-bold text-sm text-slate-900">System Environment & Persistence</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Platform:</span>
                <span className="font-semibold text-slate-800">{settings.project_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Version:</span>
                <span className="font-mono text-slate-800">v{settings.version}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Database Engine:</span>
                <span className="font-mono text-slate-800">{settings.database_url}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Study Focus:</span>
                <span className="text-slate-800 font-medium">{settings.study_area}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Groq API Status:</span>
                <span className={`font-semibold ${settings.groq_configured ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {settings.groq_configured ? `Active (${settings.groq_key_preview})` : 'Rule-Based Fallback'}
                </span>
              </div>
            </div>
          </div>

          {/* Hardware & Prototype Roadmap Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Shield className="w-4 h-4 text-cyan-600" />
              <h3 className="font-bold text-sm text-slate-900">Important Implementation Disclosure</h3>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              This college demonstration prototype has <strong>NO physical IoT sensors installed</strong> on field underpasses. Telemetry is synthesized via the WaveGuard simulated data pipeline for validation.
            </p>

            <div className="space-y-1.5 text-[11px] pt-1">
              <div className="flex items-center space-x-2 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Implemented:</strong> 3D Map, SQLite ORM, Dijkstra Routing, Alert Engine, Groq AI Copilot</span>
              </div>
              <div className="flex items-center space-x-2 text-cyan-800">
                <Radio className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span><strong>Simulated:</strong> Multi-scenario storm telemetry pulses & depth fluctuations</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span><strong>Planned Hardware:</strong> ESP32 ultrasonic water-depth transducers & LoRaWAN gateways</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
