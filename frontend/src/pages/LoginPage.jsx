import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft, Key } from 'lucide-react';
import { authAPI } from '../api/client';

export default function LoginPage({ onLoginSuccess, setCurrentView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem('toxiwatch_token', res.data.access_token);
      localStorage.setItem('toxiwatch_user', JSON.stringify(res.data.user));
      localStorage.setItem('sentinel_token', res.data.access_token);
      localStorage.setItem('sentinel_user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/8 blur-[120px] rounded-full" />

      <div className="relative w-full max-w-sm fade-up">
        <button
          onClick={() => setCurrentView('landing')}
          className="mb-6 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-violet-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Overview
        </button>

        <div className="rounded-2xl bg-[#0f0f1a] border border-white/[0.07] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-500/25 mb-4">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Admin Portal</h2>
            <p className="mt-1 text-xs text-slate-500">Secure access to monitoring & review</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-rose-500/8 border border-rose-500/20 p-3 text-xs text-rose-400">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@sentinel.ai" required
                  className="w-full rounded-lg bg-[#13131f] border border-white/[0.07] pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
                <input
                  type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••" required
                  className="w-full rounded-lg bg-[#13131f] border border-white/[0.07] pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 outline-none transition-all font-mono"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300">
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50">
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.05] text-center">
            <button type="button" onClick={() => { setEmail('admin@sentinel.ai'); setPassword('Admin@Sentinel2026'); setError(null); }}
              className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
              <Key className="h-3 w-3" />
              Fill demo credentials
            </button>
            <p className="mt-1 text-[11px] text-slate-600">admin@sentinel.ai / Admin@Sentinel2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
