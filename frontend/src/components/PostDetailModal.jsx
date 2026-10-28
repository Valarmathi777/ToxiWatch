import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, XCircle, AlertTriangle, MessageSquare, Info, Sparkles } from 'lucide-react';
import { reviewsAPI } from '../api/client';

export default function PostDetailModal({ post, onClose, onUpdated }) {
  const [reviewStatus, setReviewStatus] = useState(post?.review_status || 'pending');
  const [notes, setNotes] = useState(post?.reviewer_notes || '');
  const [confirmedCategory, setConfirmedCategory] = useState(post?.predicted_category || 'normal');
  const [loading, setLoading] = useState(false);

  if (!post) return null;

  const handleReviewAction = async (status) => {
    setLoading(true);
    try {
      await reviewsAPI.submitDecision(post.id, {
        review_status: status,
        confirmed_category: confirmedCategory,
        reviewer_notes: notes,
      });
      setReviewStatus(status);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert('Failed to update review status: ' + err.message);
    } finally {
      setLoading(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0B132B] border border-cyan-500/30 p-6 shadow-2xl shadow-cyan-950/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Post Intelligence & Triage</h3>
              <p className="text-xs text-slate-400 font-mono">
                ID: #{post.id} • Comment ID: {post.comment_id || 'N/A'} • Source: {post.source}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-5 space-y-5 text-sm">
          {/* Post Comment */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Original Post Content
            </label>
            <div className="mt-1.5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 font-sans leading-relaxed">
              {post.comment}
            </div>
          </div>

          {/* Conversation Context */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
              <span>Conversation Thread Context</span>
            </div>
            <div className="mt-1.5 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-300 italic text-xs leading-relaxed">
              {post.conversation_context || 'No prior context provided with this comment.'}
            </div>
          </div>

          {/* Cleaned text & normalization indicators */}
          {post.cleaned_comment && post.cleaned_comment !== post.comment && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Preprocessed & Normalized Content
              </label>
              <div className="mt-1.5 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300">
                {post.cleaned_comment}
              </div>
            </div>
          )}

          {/* Classification & Risk Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Predicted Category</span>
              <div className="mt-1">
                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${getCategoryBadge(post.predicted_category)}`}>
                  {post.predicted_category?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Toxicity Score</span>
              <div className="mt-1 text-base font-extrabold font-mono text-white">
                {(post.toxicity_score * 100).toFixed(1)}%
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Hate Speech Flag</span>
              <div className="mt-1 text-xs font-bold">
                {post.hate_speech ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Flagged
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Clean
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Model Confidence</span>
              <div className="mt-1 text-base font-extrabold font-mono text-cyan-400">
                {(post.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Explainability tokens */}
          {post.explanations && post.explanations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Top Influential Features (Explainability)</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {post.explanations.map((exp, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono border flex items-center gap-1.5 ${
                      exp.impact === 'increases_toxicity'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    <span>{exp.term}</span>
                    <span className="text-[10px] opacity-75 font-bold">
                      {exp.importance > 0 ? `+${exp.importance}` : exp.importance}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Human Review & Moderation Decision Section */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Moderation Action & Human Review
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Confirm/Adjust Category:</label>
                <select
                  value={confirmedCategory}
                  onChange={(e) => setConfirmedCategory(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="friendly_toxic">Friendly-Context Toxic</option>
                  <option value="offensive">Offensive</option>
                  <option value="harmful_toxic">Harmful Toxic</option>
                  <option value="hate_speech">Hate Speech</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Reviewer Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. Sarcastic humor acknowledged..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Current Status:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  reviewStatus === 'confirmed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : reviewStatus === 'rejected'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {reviewStatus}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={loading}
                  onClick={() => handleReviewAction('confirmed')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Confirm Prediction</span>
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleReviewAction('rejected')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject (False Positive)</span>
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleReviewAction('reviewed')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Mark Reviewed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
