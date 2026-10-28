import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { postsAPI } from '../api/client';
import PostDetailModal from '../components/PostDetailModal';

export default function PostExplorerPage({ latestLivePost }) {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [source, setSource] = useState('all');
  const [reviewStatus, setReviewStatus] = useState('all');
  const [minToxicity, setMinToxicity] = useState(0.0);

  // Selected post for modal
  const [selectedPost, setSelectedPost] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await postsAPI.getPosts({
        search: search || undefined,
        category: category !== 'all' ? category : undefined,
        source: source !== 'all' ? source : undefined,
        review_status: reviewStatus !== 'all' ? reviewStatus : undefined,
        min_toxicity: minToxicity > 0 ? minToxicity : undefined,
        page,
        page_size: pageSize,
      });
      setPosts(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, pageSize, category, source, reviewStatus, minToxicity]);

  // When a new live post arrives via WebSocket, prepend to table if on page 1
  useEffect(() => {
    if (latestLivePost && page === 1 && category === 'all') {
      setPosts((prev) => [latestLivePost, ...prev.slice(0, pageSize - 1)]);
      setTotal((prev) => prev + 1);
    }
  }, [latestLivePost]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleExportCsv = () => {
    const params = {
      search: search || undefined,
      category: category !== 'all' ? category : undefined,
      source: source !== 'all' ? source : undefined,
      review_status: reviewStatus !== 'all' ? reviewStatus : undefined,
    };
    window.open(postsAPI.exportCsvUrl(params), '_blank');
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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Live Post Explorer & Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, inspect normalized contexts, and audit ML classification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white hover:border-cyan-500/40 transition-all"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchPosts}
            title="Refresh Table"
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search comments or conversation contexts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="normal">Normal</option>
              <option value="friendly_toxic">Friendly-Context Toxic</option>
              <option value="offensive">Offensive</option>
              <option value="harmful_toxic">Harmful Toxic</option>
              <option value="hate_speech">Hate Speech</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 outline-none"
            >
              <option value="all">All Sources</option>
              <option value="dataset">Dataset Import</option>
              <option value="simulation">Live Simulation</option>
              <option value="reddit">Reddit API</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Review Status</label>
            <select
              value={reviewStatus}
              onChange={(e) => { setReviewStatus(e.target.value); setPage(1); }}
              className="w-full text-xs rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
              <span>Min Toxicity:</span>
              <span className="font-mono text-cyan-400 font-bold">{(minToxicity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={minToxicity}
              onChange={(e) => { setMinToxicity(parseFloat(e.target.value)); setPage(1); }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0B132B] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Post & Context</th>
                <th className="py-3 px-3">Predicted Category</th>
                <th className="py-3 px-3">Toxicity</th>
                <th className="py-3 px-3">Hate Speech</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading && posts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span>Loading verified posts...</span>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No posts matched the selected filters.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    {/* Post & Context */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <div className="font-medium text-slate-100 line-clamp-2">
                        {post.comment}
                      </div>
                      {post.conversation_context && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 italic line-clamp-1">
                          <MessageSquare className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                          <span>{post.conversation_context}</span>
                        </div>
                      )}
                    </td>

                    {/* Predicted Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getCategoryBadge(post.predicted_category)}`}>
                        {post.predicted_category?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    {/* Toxicity Score Meter */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${
                              post.toxicity_score > 0.7 ? 'bg-rose-500' : post.toxicity_score > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, post.toxicity_score * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-200 text-[11px]">
                          {(post.toxicity_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    {/* Hate Speech Flag */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {post.hate_speech ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          YES (FLAGGED)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">Clean</span>
                      )}
                    </td>

                    {/* Source */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] text-slate-400 font-mono capitalize">
                        {post.source}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-cyan-400 text-[11px]">
                      {(post.confidence * 100).toFixed(0)}%
                    </td>

                    {/* Review Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        post.review_status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : post.review_status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : post.review_status === 'reviewed'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {post.review_status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#0B132B] border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{posts.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{total.toLocaleString()}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-slate-300 px-2">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 disabled:opacity-40 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Post Detail & Review Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdated={fetchPosts}
        />
      )}
    </div>
  );
}
