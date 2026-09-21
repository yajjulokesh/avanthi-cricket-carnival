import React from 'react';
import { Tv, Shield, Smartphone, Globe, UserPlus, UserCheck, Trophy } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSelectView, isConnected }) => {
  return (
    <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onSelectView('live')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="font-chakra text-lg font-bold tracking-wide text-white flex items-center gap-2">
              AVANTHI CRICKET CARNIVAL
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                2026
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Real-time Auction Portal</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSelectView('projector')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentView === 'projector'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Projector (Hall)</span>
          </button>

          <button
            onClick={() => onSelectView('admin')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentView === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Cockpit</span>
          </button>

          <button
            onClick={() => onSelectView('bidding')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentView === 'bidding'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Franchise Pad</span>
          </button>

          <button
            onClick={() => onSelectView('live')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentView === 'live'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Public Stream</span>
          </button>

          <button
            onClick={() => onSelectView('register')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentView === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Player</span>
          </button>

          <button
            onClick={() => onSelectView('player-login')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentView === 'player-login'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Player Login</span>
          </button>
        </nav>

        {/* Live Indicator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-300 text-[11px]">{isConnected ? 'LIVE' : 'DISCONNECTED'}</span>
          </div>
        </div>
      </div>

      {/* Mobile Nav Links */}
      <div className="flex md:hidden items-center justify-around pt-2 border-t border-slate-800 mt-2 text-[11px]">
        <button
          onClick={() => onSelectView('bidding')}
          className={`px-2 py-1 rounded ${currentView === 'bidding' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          📱 Franchise
        </button>
        <button
          onClick={() => onSelectView('projector')}
          className={`px-2 py-1 rounded ${currentView === 'projector' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          📺 Projector
        </button>
        <button
          onClick={() => onSelectView('live')}
          className={`px-2 py-1 rounded ${currentView === 'live' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          🌐 Public
        </button>
        <button
          onClick={() => onSelectView('admin')}
          className={`px-2 py-1 rounded ${currentView === 'admin' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          ⚙️ Admin
        </button>
        <button
          onClick={() => onSelectView('register')}
          className={`px-2 py-1 rounded ${currentView === 'register' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          ✍️ Register
        </button>
      </div>
    </header>
  );
};
