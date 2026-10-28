import React, { useState } from 'react';
import { Sparkles, Send, ShieldAlert, CheckCircle, AlertTriangle, MessageSquare, Info, Cpu, ArrowRight } from 'lucide-react';
import { predictAPI } from '../api/client';

export default function PredictorPage() {
  const [comment, setComment] = useState('Go die bro 😂');
  const [context, setContext] = useState('Close friends joking after a silly mistake');
  const [threshold, setThreshold] = useState(0.55);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const sampleCases = [
    {
      label: 'Friendly Banter (Context Test)',
      comment: 'Go die bro 😂',
      context: 'Close friends joking after a silly mistake',
      desc: 'Demonstrates context preventing a false positive attack flag'
    },
    {
      label: 'Hate Speech (Protected Group)',
      comment: 'That community is inferior to everyone else.',
      context: 'Hostile demographic discussion',
      desc: 'Severe xenophobic targeting requiring immediate action'
    },
    {
      label: 'Direct Threat (Harmful Toxic)',
      comment: 'I will hurt you if you come here.',
      context: 'Escalating harassment thread',
      desc: 'Direct physical intimidation and assault threat'
    },
    {
      label: 'Offensive Insult',
      comment: "You're an idiot.",
      context: 'Technical debate disagreement',
      desc: 'Offensive profanity without demographic targeting'
    },
    {
      label: 'Constructive Discussion (Normal)',
      comment: 'Thank you so much for explaining the solution clearly!',
      context: 'Help desk response thread',
      desc: 'Constructive community interaction'
    }
  ];

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    if (!comment.trim()) return;

    setLoading(true);
    try {
      const res = await predictAPI.predict(comment, context, threshold);
      setResult(res.data);
    } catch (err) {
      alert('Inference error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample) => {
    setComment(sample.comment);
    setContext(sample.context);
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'hate_speech':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'harmful_toxic':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'offensive':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'friendly_toxic':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="h-6 w-6 text-cyan-400" />
          <span>Interactive AI Inference Testbed</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Submit custom text and conversation thread contexts to inspect multi-model scoring, risk triage, and explainability
        </p>
      </div>

      {/* Preset Test Case Buttons */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
          Preset Context Test Cases
        </label>
        <div className="flex flex-wrap gap-2">
          {sampleCases.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSample(s)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs text-slate-300 hover:text-white transition-all text-left"
            >
              <span className="font-semibold">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form & Real-time inference trigger */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <form onSubmit={handlePredict} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
              Target Comment Text <span className="text-cyan-400">*</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter forum comment text to analyze..."
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                <span>Conversation Thread Context (Crucial for Ambiguity Resolution)</span>
              </label>
            </div>
            <textarea
              rows={2}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Friends playing a competitive video game, joking after a missed play..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none italic"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-400 w-full sm:w-auto">
              <span>Review Threshold:</span>
              <input
                type="range"
                min="0.4"
                max="0.8"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-cyan-400 font-bold">{(threshold * 100).toFixed(0)}%</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
            >
              <Cpu className="h-4 w-4" />
              <span>{loading ? 'Evaluating Model Inferences...' : 'Analyze with Multi-Model AI'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Prediction Output Results */}
      {result && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0B132B] to-slate-950 border border-cyan-500/30 shadow-2xl space-y-6 animate-fadeIn">
          {/* Top Classification Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Primary Classification Result
              </span>
              <div className="mt-1 flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-sm font-extrabold border ${getCategoryBadge(result.predicted_category)}`}>
                  {result.predicted_category.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-xs font-mono text-cyan-400 font-semibold">
                  {(result.confidence * 100).toFixed(1)}% Confidence
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {result.hate_speech ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs font-bold text-rose-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span>HATE SPEECH DETECTED</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300">
                  <CheckCircle className="h-4 w-4" />
                  <span>NO HATE SPEECH</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Model-Derived Toxicity</span>
              <div className="mt-1 text-2xl font-extrabold font-mono text-white">
                {(result.toxicity_score * 100).toFixed(1)}%
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400">Continuous severity</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Uncertainty Estimate</span>
              <div className="mt-1 text-2xl font-extrabold font-mono text-purple-400">
                {(result.uncertainty * 100).toFixed(1)}%
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400">Entropy measure</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Review Required?</span>
              <div className="mt-1 text-sm font-bold">
                {result.requires_review ? (
                  <span className="text-amber-400">YES (Flagged)</span>
                ) : (
                  <span className="text-emerald-400">NO (Automated)</span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400">Human triage flag</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Model Version</span>
              <div className="mt-1 text-sm font-mono font-bold text-slate-200">
                {result.model_version}
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400">Active artifact</p>
            </div>
          </div>

          {/* Model Comparison: Baseline Text-Only vs Context-Aware Model C */}
          {result.baseline_category && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                <Info className="h-4 w-4 text-cyan-400" />
                <span>Text-Only vs Context-Aware Model Comparison</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 block font-medium">Model A (Baseline Text-Only):</span>
                  <div className="mt-1 font-bold text-slate-200 uppercase">
                    {result.baseline_category.replace('_', ' ')} ({(result.baseline_confidence * 100).toFixed(0)}%)
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Classified purely from comment words</p>
                </div>

                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
                  <span className="text-cyan-400 block font-medium">Model C (Context-Aware):</span>
                  <div className="mt-1 font-bold text-cyan-200 uppercase">
                    {result.predicted_category.replace('_', ' ')} ({(result.confidence * 100).toFixed(0)}%)
                  </div>
                  <p className="mt-1 text-[11px] text-cyan-400/80">Incorporates conversation thread nuance</p>
                </div>
              </div>

              {result.review_reason && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  <strong>Decision Note:</strong> {result.review_reason}
                </div>
              )}
            </div>
          )}

          {/* Explainability / Influential Tokens */}
          {result.explanations && result.explanations.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Influential Linguistic Indicators (Model Explainability)
              </span>
              <div className="flex flex-wrap gap-2">
                {result.explanations.map((exp, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border flex items-center gap-2 ${
                      exp.impact === 'increases_toxicity'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    <span>{exp.term}</span>
                    <span className="text-[10px] font-bold opacity-80">
                      {exp.importance > 0 ? `+${exp.importance}` : exp.importance}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
