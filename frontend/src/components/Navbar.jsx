import React from 'react';
import { ShieldAlert, LogOut, Lock, Wifi, WifiOff } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, user, onLogout, wsConnected }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setCurrentView('landing')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-lg shadow-violet-500/30">
            <ShieldAlert className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight text-sm">ToxiWatch</span>
            <span className="rounded-md bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-400">
              AI
            </span>
          </div>
        </div>

        {/* Center status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs">
          <span className={`h-1.5 w-1.5 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          <span className={`font-medium ${wsConnected ? 'text-slate-300' : 'text-slate-500'}`}>
            {wsConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="h-5 w-5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {(user.full_name || user.email || 'A')[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 leading-none">{user.full_name || user.email}</span>
                  <span className="text-[10px] text-violet-400 leading-none mt-0.5 uppercase tracking-wider">{user.role}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('landing')}
                className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentView('login')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 transition-all"
              >
                <Lock className="h-3 w-3" />
                <span>Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
