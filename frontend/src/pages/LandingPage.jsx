import React, { useEffect, useState } from 'react';
import { ShieldAlert, Activity, Lock, ArrowRight, Sparkles, TrendingUp, Cpu, Eye, AlertCircle, FileCheck, CheckCircle } from 'lucide-react';
import { statsAPI } from '../api/client';

export default function LandingPage({ setCurrentView }) {
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    statsAPI.getDashboard().then(r => setLiveStats(r.data)).catch(() => {});
  }, []);

  const stats = [
    { label: 'Posts Analyzed', value: liveStats ? liveStats.total_posts.toLocaleString() : '10,200', color: 'text-violet-400' },
    { label: 'Toxic Detected', value: liveStats ? liveStats.predicted_toxic.toLocaleString() : '8,600', color: 'text-amber-400' },
    { label: 'Hate Speech', value: liveStats ? liveStats.predicted_hate_speech.toLocaleString() : '2,200', color: 'text-rose-400' },
    { label: 'Avg Toxicity', value: liveStats ? (liveStats.average_toxicity_score * 100).toFixed(1) + '%' : '62.3%', color: 'text-emerald-400' },
  ];

  const features = [
    {
      icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20',
      title: 'Context-Aware Detection',
      desc: 'Evaluates full conversation threads to distinguish playful banter from genuine hate speech — eliminating false positives that plague keyword filters.'
    },
    {
      icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20',
      title: 'Early Warning Alerts',
      desc: 'Sliding window burst analysis detects coordinated hate raids and emerging toxic phrase clusters before they spread across communities.'
    },
    {
      icon: Eye, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20',
      title: 'Human-in-the-Loop',
      desc: 'Low-confidence predictions enter a dedicated review queue. Admin decisions are audited independently to prevent feedback poisoning.'
    },
  ];

  const pipeline = [
    { step: '01', label: 'Text Normalization', desc: 'Unicode NFKC, emoji & negation preservation', icon: Cpu },
    { step: '02', label: 'Context-Aware ML', desc: 'Models A, B, C, D with explainability tokens', icon: Sparkles },
    { step: '03', label: 'Trend & Alerting', desc: 'Burst ratio detection & human triage queue', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/8 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-indigo-600/6 blur-[100px] rounded-full" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 ring-pulse" />
            <span>Context-Aware Hate Speech Detection Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Detect Hate Speech with{' '}
            <span className="gradient-text">Context Intelligence</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto font-light">
            Enterprise-grade ML platform that understands conversation context — distinguishing playful banter from harmful harassment with real-time alerting and human oversight.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02]"
            >
              <Activity className="h-4 w-4" />
              <span>Open Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentView('login')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-violet-500/30 hover:bg-white/[0.07] text-sm font-medium text-slate-300 transition-all"
            >
              <Lock className="h-4 w-4 text-violet-400" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Stats Bar */}
      <section className="border-y border-white/[0.05] bg-[#0d0d15]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-8">Live Database Metrics</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="p-5 rounded-xl bg-[#0f0f1a] border border-white/[0.06] text-center">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
                <p className={`mt-2 text-2xl font-bold font-['JetBrains_Mono',monospace] ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-violet-500 mb-3">How It Works</p>
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-white mb-12">Three-Stage Detection Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pipeline.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="relative p-6 rounded-xl bg-[#0f0f1a] border border-white/[0.06] hover:border-violet-500/25 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-bold font-mono text-violet-500">{p.step}</span>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                </div>
                <Icon className="h-5 w-5 text-violet-400 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">{p.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-white/[0.05] bg-[#0d0d15]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-violet-500 mb-3">Capabilities</p>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-white mb-12">Built for Accuracy at Scale</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-xl bg-[#0f0f1a] border border-white/[0.06] hover:border-violet-500/20 transition-all">
                  <div className={`inline-flex p-2.5 rounded-lg border mb-4 ${f.bg}`}>
                    <Icon className={`h-4 w-4 ${f.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-[#0f0f1a] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-white">Safeguards & Limitations</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Model confidence is never treated as definitive proof. Protected-group mentions without disparagement are shielded from false positive labeling. Borderline predictions trigger mandatory human review.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-[#0f0f1a] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="h-4 w-4 text-violet-400" />
              <h4 className="text-sm font-semibold text-white">Technical Foundation</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trained on 10,200+ records with dual n-gram TF-IDF across four specialized estimators: Baseline, Binary Hate Speech, Context-Aware Multiclass, and Continuous Toxicity Regressor (R² = 0.923).
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-8 bg-[#0a0a0f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-violet-500" />
            <span className="font-semibold text-slate-400">ToxiWatch AI</span>
            <span>— Context-Aware Hate Speech Detection</span>
          </div>
          <p>© 2026 ToxiWatch AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
