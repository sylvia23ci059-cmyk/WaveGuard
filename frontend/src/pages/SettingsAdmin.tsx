import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { api } from '../services/api';
import {
  Settings,
  Shield,
  UserCheck,
  Cpu,
  Sliders,
  CheckCircle2,
  Lock,
  Database,
  Terminal,
  Activity,
  Key,
  Sparkles,
  Box,
  ExternalLink
} from 'lucide-react';

export const SettingsAdmin: React.FC = () => {
  const {
    userRole,
    setUserRole,
    sensors,
    addCustomSensor,
    hotspots,
    groqApiKey,
    setGroqApiKey,
    mapTilerKey,
    setMapTilerKey,
    terrainExaggeration,
    setTerrainExaggeration
  } = useApp();
  const [activeTab, setActiveTab] = useState<'rbac' | 'api_keys' | 'sensors' | 'thresholds' | 'audit'>('api_keys');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // API Key Form State
  const [inputGroq, setInputGroq] = useState<string>(groqApiKey);
  const [inputMapTiler, setInputMapTiler] = useState<string>(mapTilerKey);
  const [testingGroq, setTestingGroq] = useState<boolean>(false);
  const [groqTestResult, setGroqTestResult] = useState<string | null>(null);

  // Form states for sensor registration
  const [newCode, setNewCode] = useState<string>('KGF-SEN-06');
  const [newName, setNewName] = useState<string>('Oorgaum Northern Outfall Gauge');
  const [newLat, setNewLat] = useState<number>(12.985);
  const [newLon, setNewLon] = useState<number>(78.261);
  const [newType, setNewType] = useState<string>('culvert');
  const [warnM, setWarnM] = useState<number>(1.2);
  const [critM, setCritM] = useState<number>(1.9);

  const handleRegisterSensor = (e: React.FormEvent) => {
    e.preventDefault();

    addCustomSensor({
      station_code: newCode.trim(),
      name: newName.trim(),
      latitude: Number(newLat),
      longitude: Number(newLon),
      installation_type: newType as any,
      warning_threshold_m: Number(warnM),
      critical_threshold_m: Number(critM)
    });

    setSaveFeedback(`Hardware ${newCode} added to the live station fleet at ${newLat.toFixed(4)}, ${newLon.toFixed(4)}.`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-4 bg-navy-950 text-slate-100">
      {/* 1. Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono tracking-wide text-white uppercase">
              Platform Administration & System Controls
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Role-Based Access Control (RBAC), IoT Sensor Fleet Configuration & Audit Logging.
          </p>
        </div>

        <div className="mt-3 md:mt-0 flex items-center space-x-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-navy-800 border border-navy-700 text-slate-300">
            Current Role: <b className="text-cyan-400 uppercase">{userRole}</b>
          </span>
        </div>
      </div>

      {/* 2. Settings Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-navy-800 pb-2">
        {[
          { id: 'api_keys', label: 'API Keys & 3D Terrain', icon: Key },
          { id: 'rbac', label: 'Role-Based Access (RBAC)', icon: Shield },
          { id: 'sensors', label: 'Sensor Station Registration', icon: Cpu },
          { id: 'thresholds', label: 'Threshold Calibration', icon: Sliders },
          { id: 'audit', label: 'System Audit Logs', icon: Terminal }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center space-x-1.5 transition ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-glow border border-cyan-500/40 glow-cyan'
                  : 'bg-navy-900 text-slate-400 hover:text-slate-200 border border-navy-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {saveFeedback && (
        <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* 3. Tab Contents */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 shadow-xl flex-1">
        {/* TAB 0: API Keys & Groq AI */}
        {activeTab === 'api_keys' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>API Keys & 3D Terrain Configuration</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Connect external cloud providers for ultra-fast Llama-3 AI copilot inference and photorealistic 3D satellite elevation drapes.
              </p>
            </div>

            {/* 1. Groq Cloud API Key */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-glow">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">Groq AI Inference Key (Free)</h4>
                    <span className="text-[10px] text-slate-400">Powers real-time natural language hydro-copilot (Llama-3.3-70B)</span>
                  </div>
                </div>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="gsk_..."
                  value={inputGroq}
                  onChange={(e) => setInputGroq(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={async () => {
                      if (!inputGroq) return;
                      setTestingGroq(true);
                      setGroqTestResult(null);
                      try {
                        const res = await api.testGroqKey(inputGroq);
                        setGroqTestResult(res.message);
                        if (res.valid) {
                          setGroqApiKey(inputGroq);
                          setSaveFeedback('Groq API Key saved and verified successfully!');
                        }
                      } catch (err: any) {
                        setGroqTestResult(`Connection failed: ${err.message}`);
                      } finally {
                        setTestingGroq(false);
                      }
                    }}
                    disabled={testingGroq || !inputGroq}
                    className="px-3 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-glow border border-cyan-500/40 text-xs font-mono font-semibold transition disabled:opacity-50"
                  >
                    {testingGroq ? 'Verifying with Groq...' : 'Test & Save Groq Key'}
                  </button>

                  {groqApiKey && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Key Configured</span>
                    </span>
                  )}
                </div>

                {groqTestResult && (
                  <div className="p-2 rounded bg-navy-900 border border-navy-700 text-[10px] font-mono text-cyan-300">
                    {groqTestResult}
                  </div>
                )}
              </div>
            </div>

            {/* 2. MapTiler 3D Satellite & Terrain Key */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Box className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">MapTiler Key (3D Photorealistic Satellite)</h4>
                    <span className="text-[10px] text-slate-400">Enables high-res satellite terrain drapes and global DEM (100k free/mo)</span>
                  </div>
                </div>
                <a
                  href="https://cloud.maptiler.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Paste MapTiler key..."
                  value={inputMapTiler}
                  onChange={(e) => setInputMapTiler(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />

                <div className="flex justify-between items-center pt-1">
                  <button
                    onClick={() => {
                      setMapTilerKey(inputMapTiler);
                      setSaveFeedback('MapTiler key saved. 3D satellite mesh updated.');
                    }}
                    className="px-3 py-1.5 rounded bg-navy-800 hover:bg-navy-750 text-white border border-navy-700 text-xs font-mono font-medium transition"
                  >
                    Save MapTiler Key
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Fallback: Free AWS Terrarium DEM (Zero-key required)
                  </span>
                </div>
              </div>
            </div>

            {/* 3. 3D Terrain Vertical Exaggeration Slider */}
            <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white font-mono">3D Terrain Vertical Exaggeration</span>
                <span className="font-mono font-bold text-cyan-400">{terrainExaggeration.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.1"
                value={terrainExaggeration}
                onChange={(e) => setTerrainExaggeration(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Amplifies elevation relief across Kolar Gold Fields hills, Swarna Nallah valleys, and mining dumps.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: RBAC */}
        {activeTab === 'rbac' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Role-Based Access Control (RBAC) Switcher
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Switch roles to experience how WaveGuard KGF dynamically toggles permissions for authority actions
              (e.g. road closures, incident verification, hotspot survey status updates, sensor calibration).
            </p>

            <div className="space-y-3 pt-2">
              {[
                { role: 'admin', label: 'Chief Disaster Management Officer (Admin)', desc: 'Full authority: verify/dismiss SOS calls, toggle road closures, adjust model weights, register sensors.' },
                { role: 'engineer', label: 'Municipal Stormwater Drainage Engineer', desc: 'Hydraulic review: inspect differential reach blockages, dispatch dewatering units, update road water depths.' },
                { role: 'surveyor', label: 'Field Geospatial Surveyor', desc: 'Ground-truthing: submit field survey observations, update hotspot verification status, inspect culvert barrels.' },
                { role: 'public', label: 'Public KGF Resident / Commuter', desc: 'Community situational awareness: view flood risk map, check safe road routes, submit waterlogging photos and reports.' }
              ].map(r => (
                <div
                  key={r.role}
                  onClick={() => setUserRole(r.role as UserRole)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex items-start justify-between ${
                    userRole === r.role
                      ? 'bg-navy-800 border-cyan-500/60 shadow-[0_0_12px_rgba(0,242,254,0.15)]'
                      : 'bg-navy-950 border-navy-800 hover:bg-navy-850'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-white">{r.label}</span>
                      {userRole === r.role && (
                        <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                          ACTIVE ROLE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{r.desc}</p>
                  </div>
                  <UserCheck className={`w-4 h-4 shrink-0 ${userRole === r.role ? 'text-cyan-400' : 'text-slate-600'}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Sensor Registration */}
        {activeTab === 'sensors' && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Register New IoT Monitoring Station (ESP32)
            </h3>
            <p className="text-xs text-slate-400">
              Add a proposed or active physical monitoring unit to the spatial telemetry network.
            </p>

            <form onSubmit={handleRegisterSensor} className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Station Code</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Installation Structure</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-white focus:outline-none"
                  >
                    <option value="culvert">Box Culvert Throat</option>
                    <option value="underpass">Railway Underpass Sump</option>
                    <option value="nallah_bridge">Open Nallah Bridge</option>
                    <option value="storm_channel">Storm Water Swale</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Station Name & Locality</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLat}
                    onChange={(e) => setNewLat(parseFloat(e.target.value))}
                    className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLon}
                    onChange={(e) => setNewLon(parseFloat(e.target.value))}
                    className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Warning Threshold (meters)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={warnM}
                    onChange={(e) => setWarnM(parseFloat(e.target.value))}
                    className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Critical Overflow Limit (meters)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={critM}
                    onChange={(e) => setCritM(parseFloat(e.target.value))}
                    className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-glow border border-cyan-500/40 font-mono font-semibold text-xs tracking-wider uppercase transition mt-2"
              >
                Enroll Station Into Ingestion Fleet
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Threshold Calibration */}
        {activeTab === 'thresholds' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Hydrodynamic Alarm Threshold Tuning
            </h3>
            <p className="text-xs text-slate-400">
              Calibrate automated alarm depth stages for all enrolled stations:
            </p>

            <div className="space-y-3 pt-2">
              {sensors.map(s => (
                <div key={s.id} className="p-3 rounded-lg bg-navy-950 border border-navy-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-white">{s.station_code}</span>
                    <span className="text-slate-400 ml-2">{s.name}</span>
                  </div>
                  <div className="flex items-center space-x-3 font-mono">
                    <span className="text-amber-400">Warn: {s.warning_threshold_m}m</span>
                    <span className="text-red-400">Crit: {s.critical_threshold_m}m</span>
                    <button className="px-2 py-0.5 rounded bg-navy-800 text-cyan-400 hover:text-white border border-navy-700 text-[10px]">
                      Tune
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="space-y-3 max-w-3xl font-mono text-[11px]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Platform Transaction Audit Logs
            </h3>
            <div className="bg-navy-950 p-3 rounded-lg border border-navy-800 space-y-1.5 text-slate-300">
              <div className="text-emerald-400">[2026-11-10 22:15:00] SYSTEM: Database schema verified and initialized.</div>
              <div className="text-cyan-400">[2026-11-10 22:18:22] GIS_ENGINE: DEM Horn slope gradient calculated for KGF bounding box.</div>
              <div className="text-cyan-400">[2026-11-10 22:20:41] GIS_ENGINE: D8 flow accumulation and natural drainage pathways vectorized.</div>
              <div className="text-amber-400">[2026-11-10 22:25:10] IOT_GATEWAY: Telemetry broker active on /ws/telemetry. Scenario simulation enabled.</div>
              <div className="text-slate-400">[2026-11-10 22:30:05] AUTH: RBAC access initialized for user admin@waveguard-kgf.gov.in.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
