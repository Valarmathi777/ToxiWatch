import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, badge, color = 'violet' }) {
  const theme = {
    violet: { icon: 'bg-violet-500/10 text-violet-400', accent: 'from-violet-500/20', border: 'hover:border-violet-500/30' },
    red:    { icon: 'bg-rose-500/10 text-rose-400',     accent: 'from-rose-500/20',   border: 'hover:border-rose-500/30' },
    amber:  { icon: 'bg-amber-500/10 text-amber-400',   accent: 'from-amber-500/20',  border: 'hover:border-amber-500/30' },
    green:  { icon: 'bg-emerald-500/10 text-emerald-400', accent: 'from-emerald-500/20', border: 'hover:border-emerald-500/30' },
    cyan:   { icon: 'bg-sky-500/10 text-sky-400',       accent: 'from-sky-500/20',    border: 'hover:border-sky-500/30' },
    purple: { icon: 'bg-purple-500/10 text-purple-400', accent: 'from-purple-500/20', border: 'hover:border-purple-500/30' },
  }[color] || { icon: 'bg-violet-500/10 text-violet-400', accent: 'from-violet-500/20', border: 'hover:border-violet-500/30' };

  return (
    <div className={`group relative overflow-hidden rounded-xl bg-[#0f0f1a] border border-white/[0.06] p-5 transition-all duration-200 ${theme.border}`}>
      {/* Top accent gradient */}
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${theme.accent} to-transparent`} />

      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{title}</p>
        {Icon && (
          <div className={`rounded-lg p-2 ${theme.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white font-['JetBrains_Mono',monospace] tracking-tight">
          {value !== undefined && value !== null ? (typeof value === 'number' ? value.toLocaleString() : value) : '—'}
        </span>
        {badge && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white/[0.05] text-slate-400 border border-white/[0.06]">
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1.5 text-[11px] text-slate-500">{subtitle}</p>}
    </div>
  );
}
