import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Flame,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  RefreshCw,
  Bell,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { trendsAPI } from '../api/client';

export default function TrendsPage() {
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertFilter, setAlertFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resTrends, resAlerts] = await Promise.all([
        trendsAPI.getTrends(120),
        trendsAPI.getAlerts(alertFilter !== 'all' ? alertFilter : undefined),
      ]);
      setTrends(resTrends.data || []);
      setAlerts(resAlerts.data || []);
    } catch (err) {
      console.error('Failed to load trends & alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [alertFilter]);

  const handleUpdateAlert = async (alertId, newStatus) => {
    try {
      await trendsAPI.updateAlertStatus(alertId, newStatus);
      loadData();
    } catch (err) {
      alert('Failed to update alert: ' + err.message);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Flame className="h-6 w-6 text-rose-400" />
            <span>Toxic Trend & Early Warning Alert Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time sliding window statistical burst analysis, phrase cluster spikes, and actionable incident alerts
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white hover:border-cyan-500/40 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Alert Center Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Incident & Surveillance Alerts</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {alerts.length} Total
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-slate-200 focus:border-cyan-500 outline-none"
            >
              <option value="all">All Alerts</option>
              <option value="active">Active Only</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            No incident alerts currently recorded for the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityBadge(alt.severity)}`}>
                      {alt.severity} SEVERITY
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {alt.detected_at ? new Date(alt.detected_at).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-white leading-snug">
                    {alt.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    {alt.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className={`font-semibold uppercase text-[11px] ${
                    alt.status === 'resolved' ? 'text-emerald-400' : alt.status === 'acknowledged' ? 'text-cyan-400' : 'text-rose-400'
                  }`}>
                    Status: {alt.status}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {alt.status === 'active' && (
                      <button
                        onClick={() => handleUpdateAlert(alt.id, 'acknowledged')}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white font-semibold text-[11px] transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alt.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateAlert(alt.id, 'resolved')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emerging Toxic Trends Table */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Emerging Phrase Burst Clusters</h3>
          <span className="text-xs text-slate-400">(Calculated against baseline window)</span>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B132B] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Phrase / Term</th>
                  <th className="py-3 px-3">Recent Window</th>
                  <th className="py-3 px-3">Baseline</th>
                  <th className="py-3 px-3">Burst Ratio</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-4">Supporting Example Posts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {trends.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No phrase spikes identified in current sliding window.
                    </td>
                  </tr>
                ) : (
                  trends.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-100 font-mono">
                        {t.phrase}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                        {t.occurrence_count}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {t.baseline_count}
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-amber-400">
                        {t.burst_ratio}x
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityBadge(t.severity)}`}>
                          {t.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        {t.sample_posts && t.sample_posts.length > 0 ? (
                          <div className="space-y-1">
                            {t.sample_posts.slice(0, 2).map((sample, sIdx) => (
                              <div key={sIdx} className="text-[11px] text-slate-300 italic line-clamp-1">
                                "{sample}"
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No samples attached</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
