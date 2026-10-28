import React from 'react';
import {
  LayoutDashboard, Search, Sparkles, TrendingUp,
  CheckSquare, Cpu, FileText, Shield
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, pendingReviewCount = 0, activeAlertCount = 0 }) {
  const core = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'explorer', label: 'Post Explorer', icon: Search },
    { id: 'predictor', label: 'AI Testbed', icon: Sparkles },
    { id: 'trends', label: 'Trends & Alerts', icon: TrendingUp, badge: activeAlertCount || null, badgeColor: 'bg-rose-500' },
    { id: 'reviews', label: 'Review Queue', icon: CheckSquare, badge: pendingReviewCount || null, badgeColor: 'bg-amber-500' },
  ];
  const admin = [
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
  ];

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = currentView === item.id;
    return (
      <button
        onClick={() => setCurrentView(item.id)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
          active
            ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
            : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? 'text-violet-400' : 'text-slate-500'}`} />
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full text-white ${item.badgeColor}`}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-56 flex-shrink-0 border-r border-white/[0.05] bg-[#0d0d15] flex flex-col justify-between py-5 px-3 min-h-[calc(100vh-3.5rem)]">
      <div className="space-y-5">
        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Monitoring</p>
          <nav className="space-y-0.5">{core.map(i => <NavItem key={i.id} item={i} />)}</nav>
        </div>
        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">System</p>
          <nav className="space-y-0.5">{admin.map(i => <NavItem key={i.id} item={i} />)}</nav>
        </div>
      </div>

      <div className="mx-1 p-3 rounded-xl bg-violet-600/5 border border-violet-500/10">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-slate-300">Context AI</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Evaluates thread context to prevent false positives.
        </p>
      </div>
    </aside>
  );
}
