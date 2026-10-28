import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  Clock,
  Shield,
  FileText
} from 'lucide-react';
import { reviewsAPI } from '../api/client';

export default function ReviewQueuePage() {
  const [queue, setQueue] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await reviewsAPI.getQueue({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        page_size: 15,
      });
      setQueue(res.data.posts || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [page, statusFilter]);

  const handleDecision = async (postId, status, notes = '') => {
    setActionLoading(postId);
    try {
      await reviewsAPI.submitDecision(postId, {
        review_status: status,
        reviewer_notes: notes || `Moderator confirmed status: ${status}`,
      });
      loadQueue();
    } catch (err) {
      alert('Review action error: ' + err.message);
    } finally {
      setActionLoading(null);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-amber-400" />
            <span>Human-in-the-Loop Review Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit posts requiring human decision-making due to low confidence, contextual ambiguity, or hate speech alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 outline-none"
          >
            <option value="pending">Pending Review Only</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected (False Positives)</option>
            <option value="all">All Moderated Posts</option>
          </select>

          <button
            onClick={loadQueue}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Review Queue Items */}
      {loading && queue.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-cyan-400 mb-2" />
          <span className="text-xs font-semibold">Loading review items...</span>
        </div>
      ) : queue.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
          <Shield className="h-8 w-8 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">Review Queue is Clear!</h4>
          <p className="text-xs text-slate-400">
            No posts currently require human moderation triage for the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    POST #{item.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getCategoryBadge(item.predicted_category)}`}>
                    {item.predicted_category?.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Toxicity: {(item.toxicity_score * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-mono">
                    {item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'Recent'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.review_status === 'confirmed'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : item.review_status === 'rejected'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {item.review_status}
                  </span>
                </div>
              </div>

              {/* Content and Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Comment Content
                  </span>
                  <p className="text-xs text-white font-medium bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    {item.comment}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-cyan-400" />
                    <span>Thread Conversation Context</span>
                  </span>
                  <p className="text-xs text-slate-300 italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    {item.conversation_context || 'No conversation thread provided.'}
                  </p>
                </div>
              </div>

              {/* Reason Flag */}
              {item.review_reason && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span><strong>Triage Reason:</strong> {item.review_reason}</span>
                </div>
              )}

              {/* Reviewer Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-400">
                  {item.reviewed_by ? `Audited by: ${item.reviewed_by}` : 'Pending moderator triage'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionLoading === item.id}
                    onClick={() => handleDecision(item.id, 'confirmed', 'Moderator confirmed hate/toxic assessment')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Confirm Toxic</span>
                  </button>

                  <button
                    disabled={actionLoading === item.id}
                    onClick={() => handleDecision(item.id, 'rejected', 'Moderator identified false positive')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject (False Positive)</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
