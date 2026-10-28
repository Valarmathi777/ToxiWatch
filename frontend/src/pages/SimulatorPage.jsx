import React, { useState, useEffect } from 'react';
import {
  Radio,
  Play,
  Pause,
  Square,
  Sliders,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Terminal,
  Shield,
  Key
} from 'lucide-react';
import { simulationAPI, sourcesAPI } from '../api/client';

export default function SimulatorPage({ latestLivePost }) {
  const [simStatus, setSimStatus] = useState({ status: 'stopped', speed_seconds: 2.0 });
  const [speed, setSpeed] = useState(2.0);
  const [liveLog, setLiveLog] = useState([]);
  const [sourceStatus, setSourceStatus] = useState(null);

  // Source config inputs
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [subreddit, setSubreddit] = useState('all');
  const [sourceMsg, setSourceMsg] = useState(null);

  const loadStatus = async () => {
    try {
      const [resSim, resSrc] = await Promise.all([
        simulationAPI.getStatus(),
        sourcesAPI.getStatus(),
      ]);
      setSimStatus(resSim.data);
      setSpeed(resSim.data.speed_seconds || 2.0);
      setSourceStatus(resSrc.data);
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // Append new live incoming post to simulator terminal
  useEffect(() => {
    if (latestLivePost) {
      setLiveLog((prev) => [latestLivePost, ...prev.slice(0, 20)]);
    }
  }, [latestLivePost]);

  const handleSimAction = async (action) => {
    try {
      if (action === 'start') await simulationAPI.start(speed);
      else if (action === 'pause') await simulationAPI.pause();
      else if (action === 'resume') await simulationAPI.resume();
      else if (action === 'stop') await simulationAPI.stop();
      loadStatus();
    } catch (err) {
      alert('Simulation error: ' + err.message);
    }
  };

  const handleSaveSourceConfig = async (e) => {
    e.preventDefault();
    try {
      await sourcesAPI.configure({
        enabled: Boolean(clientId),
        poll_interval_sec: 60,
        client_id: clientId,
        client_secret: clientSecret,
        subreddit_or_query: subreddit,
      });
      setSourceMsg('Source configuration saved.');
      loadStatus();
    } catch (err) {
      alert('Error updating source configuration: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Radio className="h-6 w-6 text-cyan-400" />
          <span>Live Ingestion Engine & Source Connectors</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage real-time forum simulation stream and configure authorized official external platform connectors
        </p>
      </div>

      {/* Mode B: Live Simulation Control Room */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Mode B: Real-Time Forum Stream Simulator
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                simStatus.status === 'running'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {simStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Streams continuous multi-context forum comments into the text preprocessor and ML inference pipeline
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {simStatus.status === 'running' ? (
              <button
                onClick={() => handleSimAction('pause')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </button>
            ) : simStatus.status === 'paused' ? (
              <button
                onClick={() => handleSimAction('resume')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
              >
                <Play className="h-4 w-4" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={() => handleSimAction('start')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                <Play className="h-4 w-4" />
                <span>Start Simulation</span>
              </button>
            )}

            {simStatus.status !== 'stopped' && (
              <button
                onClick={() => handleSimAction('stop')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
              >
                <Square className="h-4 w-4" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>

        {/* Speed Adjustment */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-300">Ingestion Frequency:</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{speed}s per comment</span>
          </div>

          <div className="flex items-center gap-3">
            {[0.5, 1.0, 2.0, 5.0].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setSpeed(s); if (simStatus.status === 'running') simulationAPI.start(s); }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  speed === s
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        {/* Live Ingestion Terminal Feed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-cyan-400" />
              <span>Real-Time Ingestion Event Log</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {liveLog.length} events logged this session
            </span>
          </div>

          <div className="h-64 overflow-y-auto rounded-xl bg-slate-950 p-4 font-mono text-xs border border-slate-800 space-y-2">
            {liveLog.length === 0 ? (
              <div className="text-center py-20 text-slate-600">
                Simulator is idle. Click "Start Simulation" above to begin streaming live posts.
              </div>
            ) : (
              liveLog.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 border-b border-slate-900 pb-1.5 text-slate-300">
                  <span className="text-slate-600 font-mono">[{new Date().toLocaleTimeString()}]</span>
                  <span className={`px-1.5 rounded text-[10px] uppercase font-bold ${
                    item.predicted_category === 'hate_speech'
                      ? 'bg-rose-500/20 text-rose-300'
                      : item.predicted_category === 'friendly_toxic'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {item.predicted_category}
                  </span>
                  <span className="font-sans flex-1 line-clamp-1">{item.comment}</span>
                  <span className="text-cyan-400 font-mono">{(item.toxicity_score * 100).toFixed(0)}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mode A: Real Source Integration (Reddit / Forum API) */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Mode A: Official External Forum Connector (Reddit / REST)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {sourceStatus?.configured ? 'Configured' : 'Credentials Needed'}
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Configure official API credentials for automated scheduled polling with pagination, rate limiting, and backoff.
          </p>
        </div>

        {/* Honest Connection Status Banner */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span className="text-slate-300">Current Status:</span>
            <span className="font-semibold text-slate-200">
              {sourceStatus?.status || 'Not connected - configure below'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Last fetch: {sourceStatus?.last_fetch || 'Never'}
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveSourceConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                API Client ID
              </label>
              <input
                type="text"
                placeholder="e.g. reddit_client_id_xxxxxxxx"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                API Client Secret
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Credentials are securely hashed and stored in database configuration table.
            </span>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
            >
              Save Source Settings
            </button>
          </div>
        </form>

        {sourceMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
            {sourceMsg}
          </div>
        )}
      </div>
    </div>
  );
}
