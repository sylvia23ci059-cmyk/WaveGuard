import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Box,
  BarChart3,
  Radio,
  AlertTriangle,
  GitFork,
  FileText,
  Layers,
  Settings
} from 'lucide-react';

interface RailItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage } = useApp();

  const railItems: RailItem[] = [
    { id: 'map3d', label: '3D Map', icon: Box },
    { id: 'susceptibility', label: 'Analysis', icon: BarChart3 },
    { id: 'sensors', label: 'Sensors', icon: Radio },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'routing', label: 'Routing', icon: GitFork },
    { id: 'hotspots', label: 'Reports', icon: FileText },
    { id: 'overview', label: 'Layers', icon: Layers }
  ];

  return (
    <aside className="w-20 bg-[#070b13]/95 backdrop-blur-md border-r border-navy-800/80 flex flex-col justify-between items-center py-4 shrink-0 select-none z-20">
      {/* Navigation Icons Stack */}
      <div className="flex flex-col items-center space-y-3 w-full px-2">
        {railItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition group ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-glow border border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.25)] font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-navy-900/60 border border-transparent'
              }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 mb-1 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-glow' : 'text-slate-400 group-hover:text-cyan-400'}`} />
              <span className="text-[10px] font-sans tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings at the Bottom */}
      <div className="w-full px-2">
        <button
          onClick={() => setActivePage('settings')}
          className={`w-full flex flex-col items-center justify-center py-2 px-1 rounded-xl transition ${
            activePage === 'settings'
              ? 'bg-cyan-500/15 text-cyan-glow border border-cyan-500/40'
              : 'text-slate-500 hover:text-white hover:bg-navy-900/60'
          }`}
          title="Platform Settings & API Keys"
        >
          <Settings className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-sans">Settings</span>
        </button>
      </div>
    </aside>
  );
};
