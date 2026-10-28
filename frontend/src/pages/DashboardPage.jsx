import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert, AlertTriangle, UserCheck, TrendingUp, Database, RefreshCw, BarChart2, PieChart as PieIcon, Flame, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import { statsAPI } from '../api/client';

const TOOLTIP_STYLE = { backgroundColor: '#0f0f1a', borderColor: 'rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '11px' };
const AXIS_STYLE = { stroke: '#374151', fontSize: 10 };
const GRID_STYLE = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.04)' };

const CATEGORY_COLORS = {
  normal: '#10b981',
  friendly_toxic: '#7c3aed',
  offensive: '#f59e0b',
  harmful_toxic: '#f97316',
  hate_speech: '#ef4444',
};

export default function DashboardPage({ setCurrentView }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await statsAPI.getDashboard();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-violet-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading metrics...</span>
        </div>
      </div>
    );
  }

  const pieData = stats?.category_counts
    ? Object.entries(stats.category_counts).map(([name, value]) => ({
        name: name.replace('_', ' '),
        rawName: name,
        value,
      }))
    : [];

  return (
    <div className="space-y-5 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.05] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Live Monitoring Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time telemetry, context-aware classification, and toxic trend surveillance</p>
        </div>
        <button onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs font-medium text-slate-400 hover:text-white hover:border-violet-500/30 transition-all self-start sm:self-auto">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Posts" value={stats?.total_posts} subtitle="Verified in database" icon={Activity} color="violet" />
        <StatCard title="Toxic Content" value={stats?.predicted_toxic} subtitle="Offensive, harmful & banter" icon={AlertTriangle} color="amber" />
        <StatCard title="Hate Speech" value={stats?.predicted_hate_speech} subtitle="Protected group attacks" icon={ShieldAlert} color="red" />
        <StatCard title="Avg Toxicity" value={stats ? (stats.average_toxicity_score * 100).toFixed(1) + '%' : '0%'} subtitle="Continuous severity score" icon={TrendingUp} color="purple" />
        <StatCard title="Awaiting Review" value={stats?.awaiting_review} subtitle="Low confidence flags" icon={AlertTriangle} color="amber" />
        <StatCard title="Human Confirmed" value={stats?.confirmed_incidents} subtitle="Admin audited" icon={UserCheck} color="green" />
        <StatCard title="Pipeline Errors" value={stats?.error_count || 0} subtitle="Zero faults" icon={CheckCircle} color="green" />
        <StatCard title="Data Sources" value={stats ? Object.keys(stats.source_counts || {}).length : 1} subtitle="Active sources" icon={Database} color="cyan" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl bg-[#0f0f1a] border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-violet-400" />
                Detection Timeline
              </h3>
              <p className="text-xs text-slate-500">Post volume vs hate speech over time</p>
            </div>
            <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">Live</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.timeline_posts || []}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID_STYLE} />
                <XAxis dataKey="timestamp" {...AXIS_STYLE} />
                <YAxis {...AXIS_STYLE} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="volume" name="Total Posts" stroke="#7c3aed" fill="url(#volGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="hate_speech" name="Hate Speech" stroke="#ef4444" fill="url(#hateGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-[#0f0f1a] border border-white/[0.06] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-violet-400" />
              Category Distribution
            </h3>
            <p className="text-xs text-slate-500">Class balance across all posts</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.rawName] || '#6366f1'} stroke="#0a0a0f" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl bg-[#0f0f1a] border border-white/[0.06] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-indigo-400" />
              Confidence Distribution
            </h3>
            <p className="text-xs text-slate-500">Model probability certainty buckets</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.confidence_distribution || []}>
                <CartesianGrid {...GRID_STYLE} />
                <XAxis dataKey="range" {...AXIS_STYLE} />
                <YAxis {...AXIS_STYLE} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Posts" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-[#0f0f1a] border border-white/[0.06] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-400" />
                Emerging Phrases
              </h3>
              <button onClick={() => setCurrentView('trends')} className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors">
                View all →
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Unusual spikes in toxic comments</p>
            <div className="space-y-2">
              {stats?.top_phrases?.length > 0 ? stats.top_phrases.slice(0, 5).map((tp, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#13131f] border border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-600">#{idx + 1}</span>
                    <span className="text-xs text-slate-300">{tp.phrase}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-violet-400">{tp.count}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${tp.severity === 'critical' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
                      {tp.burst}x
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-xs text-slate-600">No active trends yet.</div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between">
            <span className="text-xs text-slate-600">Deep dive?</span>
            <button onClick={() => setCurrentView('explorer')} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Post Explorer →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
