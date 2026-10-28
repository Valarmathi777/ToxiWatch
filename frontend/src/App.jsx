import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PostExplorerPage from './pages/PostExplorerPage';
import PredictorPage from './pages/PredictorPage';
import TrendsPage from './pages/TrendsPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import ModelHubPage from './pages/ModelHubPage';
import AuditPage from './pages/AuditPage';
import { ShieldAlert, Bell, X } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [latestLivePost, setLatestLivePost] = useState(null);
  const [activeToast, setActiveToast] = useState(null);
  const wsRef = useRef(null);

  // Check initial user session
  useEffect(() => {
    const savedUser = localStorage.getItem('toxiwatch_user') || localStorage.getItem('sentinel_user');
    const token = localStorage.getItem('toxiwatch_token') || localStorage.getItem('sentinel_token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('toxiwatch_user');
        localStorage.removeItem('sentinel_user');
      }
    }
  }, []);

  // WebSocket Connection Management
  useEffect(() => {
    let reconnectTimeout = null;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In development vite proxy forwards /ws to backend:8000
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'NEW_POST') {
            setLatestLivePost(message.data);
          } else if (message.type === 'NEW_ALERT') {
            setActiveToast({
              title: message.data.title,
              description: message.data.description,
              severity: message.data.severity,
            });
            setTimeout(() => setActiveToast(null), 7000);
          }
        } catch (e) {
          // ignore heartbeat pong
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    };

    connectWs();

    // Heartbeat ping
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 15000);

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pingInterval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('toxiwatch_token');
    localStorage.removeItem('toxiwatch_user');
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_user');
    setUser(null);
    setCurrentView('landing');
  };

  const isPublicPage = currentView === 'landing' || currentView === 'login';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col font-['Inter',sans-serif]">
      {/* Universal Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onLogout={handleLogout}
        wsConnected={wsConnected}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex">
        {/* Render Sidebar on internal application pages */}
        {!isPublicPage && (
          <Sidebar
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        )}

        <main className={`flex-1 ${isPublicPage ? 'w-full' : 'p-5 sm:p-7 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto'}`}>
          {currentView === 'landing' && <LandingPage setCurrentView={setCurrentView} />}
          {currentView === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} setCurrentView={setCurrentView} />}
          {currentView === 'dashboard' && <DashboardPage setCurrentView={setCurrentView} />}
          {currentView === 'explorer' && <PostExplorerPage latestLivePost={latestLivePost} />}
          {currentView === 'predictor' && <PredictorPage />}
          {currentView === 'trends' && <TrendsPage />}
          {currentView === 'reviews' && <ReviewQueuePage />}
          {currentView === 'models' && <ModelHubPage />}
          {currentView === 'audit' && <AuditPage />}
        </main>
      </div>

      {/* Real-time Incident Alert Toast */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm p-4 rounded-xl bg-[#13131f] border border-rose-500/30 shadow-2xl fade-up flex items-start gap-3">
          <div className="rounded-lg p-1.5 bg-rose-500/15 text-rose-400 flex-shrink-0">
            <Bell className="h-4 w-4" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-white">{activeToast.title}</span>
              <button onClick={() => setActiveToast(null)} className="text-slate-500 hover:text-white flex-shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-slate-400 leading-relaxed">{activeToast.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
