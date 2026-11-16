import React from 'react';
import { useApp, NavPage } from '../../context/AppContext';
import {
  LayoutDashboard,
  Map,
  MapPin,
  Droplets,
  AlertTriangle,
  Navigation,
  Bot,
  Settings,
  Waves
} from 'lucide-react';

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, dashboardData } = useApp();

  const unackedAlertsCount = dashboardData?.recent_alerts?.filter(a => !a.is_acknowledged).length || 0;

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'map3d', label: '3D Bengaluru Map', icon: Map },
    { id: 'locations', label: 'Location Management', icon: MapPin },
    { id: 'monitoring', label: 'Water Monitoring', icon: Droplets },
    { id: 'alerts', label: 'Alerts & Incidents', icon: AlertTriangle, badge: unackedAlertsCount },
    { id: 'routing', label: 'Route Guidance', icon: Navigation },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div className="py-4">
        <div className="px-4 pb-3 mb-2 border-b border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Navigation Console
          </p>
        </div>

        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-cyan-800' : 'bg-red-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Study area & disclosure badge */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
        <div className="flex items-center space-x-2 text-slate-300 mb-1">
          <Waves className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">Bengaluru Digital Twin</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          BBMP & KSNDMC Urban Flood Zone. OpenFreeMap vector tiles with MapLibre GL.
        </p>
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[10px] text-slate-300 flex items-center justify-between">
          <span>Prototype v1.0</span>
          <span className="text-emerald-400 font-medium">Local SQLite</span>
        </div>
      </div>
    </aside>
  );
};
