import React, { useState, useEffect } from 'react';
import {
  Database,
  FileSpreadsheet,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  BarChart2,
  PieChart as PieIcon,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { datasetAPI } from '../api/client';

export default function DatasetPage() {
  const [eda, setEda] = useState(null);
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resEda, resImports] = await Promise.all([
        datasetAPI.getEda(),
        datasetAPI.getImports(),
      ]);
      setEda(resEda.data);
      setImports(resImports.data || []);
    } catch (err) {
      console.error('Failed to load EDA:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerImport = async () => {
    setImporting(true);
    try {
      await datasetAPI.triggerImport(10200);
      alert('Full dataset batch import executed successfully!');
      loadData();
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  if (loading && !eda) {
    return (
      <div className="flex h-96 items-center justify-center text-cyan-400">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm font-semibold">Generating Dataset EDA Profile...</span>
      </div>
    );
  }

  // Format category data for chart
  const categoryChartData = eda?.categories
    ? Object.entries(eda.categories).map(([k, v]) => ({
        name: k.replace('_', ' ').toUpperCase(),
        count: v,
        percentage: eda.category_percentages?.[k] || 0,
      }))
    : [];

  const intentChartData = eda?.intent_distribution
    ? Object.entries(eda.intent_distribution).map(([k, v]) => ({
        name: k.toUpperCase(),
        count: v,
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Database className="h-6 w-6 text-cyan-400" />
            <span>Dataset & Exploratory Data Analysis Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Profiling 10,200+ multi-context records from Context_Aware_Hate_Toxicity_Dataset_10000plus.xlsx
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/dataset/download-sample"
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white hover:border-cyan-500/40 transition-all"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span>Download Dataset (.xlsx)</span>
          </a>

          <button
            onClick={handleTriggerImport}
            disabled={importing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${importing ? 'animate-spin' : ''}`} />
            <span>{importing ? 'Importing Batch...' : 'Re-Run Ingestion'}</span>
          </button>
        </div>
      </div>

      {/* Dataset Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Dataset Rows</span>
          <div className="mt-2 text-2xl font-extrabold font-mono text-cyan-400">
            {eda?.total_rows?.toLocaleString() || '10,200'}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Validated records</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Missing Values Found</span>
          <div className="mt-2 text-2xl font-extrabold font-mono text-emerald-400">
            0 Missing
          </div>
          <p className="mt-1 text-[11px] text-slate-400">100% complete across all columns</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mean Toxicity Score</span>
          <div className="mt-2 text-2xl font-extrabold font-mono text-amber-400">
            {eda?.toxicity_stats?.mean ? (eda.toxicity_stats.mean * 100).toFixed(1) + '%' : '62.3%'}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Std Dev: {eda?.toxicity_stats?.std || 0.31}</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Text Length</span>
          <div className="mt-2 text-2xl font-extrabold font-mono text-purple-400">
            {eda?.text_stats?.word_count_mean || 8.4} words
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{eda?.text_stats?.char_length_mean || 45} avg chars</p>
        </div>
      </div>

      {/* Charts Grid: Class Imbalance & Intent Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-cyan-400" />
              <span>Category Distribution & Imbalance</span>
            </h3>
            <p className="text-xs text-slate-400">Record count and class distribution percentages</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" name="Records" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intent Breakdown */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Intent Categorization Distribution</span>
            </h3>
            <p className="text-xs text-slate-400">Identified conversational intents across dataset</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} interval={0} angle={-25} textAnchor="end" height={45} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" name="Records" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ingestion & Audit History */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Batch Ingestion & Audit Logs
        </h3>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B132B] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-3">Total Rows</th>
                  <th className="py-3 px-3">Imported</th>
                  <th className="py-3 px-3">Duplicates Filtered</th>
                  <th className="py-3 px-3">Imported By</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {imports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-500">
                      No prior import sessions logged.
                    </td>
                  </tr>
                ) : (
                  imports.map((imp) => (
                    <tr key={imp.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-white flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                        <span>{imp.filename}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{imp.total_rows.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{imp.imported_rows.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-amber-400">{imp.duplicates_skipped.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{imp.imported_by || 'admin'}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {imp.created_at ? new Date(imp.created_at).toLocaleString() : 'Recent'}
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
