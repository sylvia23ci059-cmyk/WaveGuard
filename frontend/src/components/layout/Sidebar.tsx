import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Box,
  Layers,
  Mountain,
  AlertTriangle,
  Cpu,
  GitFork,
  Radio,
  Navigation,
  History,
  Database,
  Settings
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, hotspots, sensors, incidents } = useApp();

  const criticalHotspots = hotspots.filter(h => h.inspection_priority === 'critical').length;
  const criticalSensors = sensors.filter(s => s.status === 'critical').length;
  const unverifiedIncidents = incidents.filter(i => i.verification_status === 'unverified').length;

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'map3d', label: '3D KGF Map Twin', icon: Box, badge: '3D', badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { id: 'susceptibility', label: 'Flood Susceptibility', icon: Layers },
    { id: 'terrain', label: 'Terrain & Hydrology', icon: Mountain },
    { id: 'hotspots', label: 'Hotspot Explorer', icon: AlertTriangle, badge: criticalHotspots > 0 ? `${criticalHotspots} Crit` : undefined, badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40' },
    { id: 'sensors', label: 'Sensor Monitoring', icon: Cpu, badge: criticalSensors > 0 ? `${criticalSensors} Alert` : undefined, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
    { id: 'drainage', label: 'Drainage Intelligence', icon: GitFork },
    { id: 'incidents', label: 'Live Incidents & SOS', icon: Radio, badge: unverifiedIncidents > 0 ? `${unverifiedIncidents} New` : undefined, badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { id: 'routing', label: 'Road Safety & Routing', icon: Navigation },
    { id: 'historical', label: 'Historical Analysis', icon: History },
    { id: 'datasets', label: 'Data Sources Registry', icon: Database },
    { id: 'settings', label: 'Settings & Admin', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-navy-700/80 flex flex-col justify-between shrink-0 select-none">
      {/* Navigation List */}
      <div className="py-4 px-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Core Command Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-glow border border-cyan-500/40 shadow-[0_0_12px_rgba(0,242,254,0.15)] font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-glow' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${item.badgeColor || 'bg-navy-800 text-slate-300 border-navy-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Provenance & Scientific Integrity Reminder */}
      <div className="p-3 m-2 rounded-lg bg-navy-950 border border-navy-800 text-[11px] space-y-1.5">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
          <span>STUDY EXTENT</span>
          <span className="text-cyan-400">EPSG:32644</span>
        </div>
        <p className="text-slate-400 text-[10px] leading-tight">
          Analytical bounds limited to KGF Taluk & upstream catchments. Elevation from Copernicus GLO-30 DSM (30m).
        </p>
        <div className="pt-1 border-t border-navy-800 flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>DATA INTEGRITY</span>
          <span className="text-emerald-400">VERIFIED</span>
        </div>
      </div>
    </aside>
  );
};
