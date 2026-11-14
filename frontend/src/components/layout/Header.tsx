import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  CloudRain,
  AlertTriangle,
  MapPin,
  Sparkles,
  UserCheck,
  Radio
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    weather,
    userRole,
    setUserRole,
    isAiOpen,
    setIsAiOpen,
    sensors
  } = useApp();

  const hasCritical = sensors.some(s => s.status === 'critical');
  const hasWarning = sensors.some(s => s.status === 'warning');

  let riskBadge = {
    label: 'Moderate',
    color: 'text-amber-400 border-amber-500/40 bg-amber-500/10'
  };
  if (hasCritical) {
    riskBadge = {
      label: 'High Risk',
      color: 'text-red-400 border-red-500/50 bg-red-500/10'
    };
  } else if (!hasWarning && weather?.precipitation_mm === 0) {
    riskBadge = {
      label: 'Low',
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
    };
  }

  return (
    <header className="h-16 bg-[#070b13]/90 backdrop-blur-md border-b border-navy-800/80 px-4 flex items-center justify-between z-30 shrink-0">
      {/* Brand & Platform Identity */}
      <div className="flex items-center space-x-3">
        {/* WaveGuard Stylized Blue Crest */}
        <div className="flex items-center space-x-2.5">
          <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 22C10 14 18 14 24 22C30 30 36 24 38 20" stroke="#00f2fe" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M6 28C11 22 17 22 22 28C27 34 33 29 36 26" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <path d="M10 16C14 12 19 12 23 16C27 20 31 18 33 16" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </svg>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center">
              Wave<span className="text-white">Guard</span>
            </h1>
            <p className="text-[10px] text-slate-400 tracking-wide font-sans -mt-0.5">
              Urban Flood Intelligence Platform
            </p>
          </div>
        </div>

        {/* Location Pill */}
        <div className="hidden sm:flex items-center space-x-2 bg-navy-900/80 border border-navy-700/80 rounded-xl px-3 py-1.5 ml-3">
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="leading-tight">
            <div className="text-xs font-semibold text-white font-sans">Kolar Gold Fields (KGF)</div>
            <div className="text-[10px] text-slate-400">Karnataka, India</div>
          </div>
        </div>
      </div>

      {/* Right Meteorological, Risk Status & AI Copilot */}
      <div className="flex items-center space-x-2.5">
        {/* Weather Card */}
        <div className="hidden md:flex items-center space-x-2 bg-navy-900/80 border border-navy-700/80 rounded-xl px-3 py-1.5 text-xs">
          <CloudRain className="w-4 h-4 text-cyan-400" />
          <div className="leading-tight font-sans">
            <div className="font-bold text-white font-mono">
              {weather ? `${weather.temperature_c}°C` : '24.6°C'}
            </div>
            <div className="text-[10px] text-slate-400">
              {weather?.precipitation_mm ? 'Light Rain' : 'Scattered Clouds'}
            </div>
          </div>
        </div>

        {/* Today's Rainfall Card */}
        <div className="hidden lg:flex flex-col bg-navy-900/80 border border-navy-700/80 rounded-xl px-3 py-1 text-xs leading-tight font-sans">
          <span className="text-[10px] text-slate-400">Today's Rainfall</span>
          <span className="font-bold text-white font-mono text-sm">
            {weather ? `${weather.precipitation_mm} mm` : '18.4 mm'}
          </span>
        </div>

        {/* Risk Level Badge */}
        <div className={`flex items-center space-x-1.5 border rounded-xl px-3 py-1.5 text-xs font-sans font-semibold ${riskBadge.color}`}>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <div className="leading-tight">
            <span className="text-[10px] text-slate-400 block font-normal">Risk Level</span>
            <span className="font-bold">{riskBadge.label}</span>
          </div>
        </div>

        {/* AI Copilot Button */}
        <button
          onClick={() => setIsAiOpen(!isAiOpen)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition ${
            isAiOpen
              ? 'bg-cyan-500/20 text-cyan-glow border-cyan-500/50 glow-cyan'
              : 'bg-navy-900/90 text-slate-300 border-navy-700 hover:text-white hover:border-cyan-500/40'
          }`}
          title="Toggle Groq AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Role Switcher */}
        <div className="hidden xl:flex items-center space-x-1.5 bg-navy-900/80 px-2.5 py-1.5 rounded-xl border border-navy-700">
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="admin" className="bg-navy-900 text-white">Admin</option>
            <option value="engineer" className="bg-navy-900 text-white">Engineer</option>
            <option value="surveyor" className="bg-navy-900 text-white">Surveyor</option>
            <option value="public" className="bg-navy-900 text-white">Public</option>
          </select>
        </div>
      </div>
    </header>
  );
};
