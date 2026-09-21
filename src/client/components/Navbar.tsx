import React from 'react';
import { Tv, Shield, Smartphone, Globe, UserPlus, UserCheck, Activity } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSelectView, isConnected }) => {
  const navItems = [
    { id: 'projector', label: 'PROJECTOR', icon: Tv, sub: '30M AUDITORIUM' },
    { id: 'admin', label: 'FLIGHT DECK', icon: Shield, sub: 'OPERATIONS' },
    { id: 'bidding', label: 'FRANCHISE PAD', icon: Smartphone, sub: 'TACTILE' },
    { id: 'live', label: 'STREAM & ROSTER', icon: Globe, sub: 'TELEMETRY' },
    { id: 'register', label: 'REGISTRATION', icon: UserPlus, sub: 'STUDENTS' },
    { id: 'player-login', label: 'PROFILE', icon: UserCheck, sub: 'PORTAL' },
  ];

  return (
    <header className="bg-spengle-carbon border-b border-spengle-border sticky top-0 z-50 px-4 py-2.5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Spengle Brand Emblem */}
        <div 
          onClick={() => onSelectView('live')}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="relative w-9 h-9 bg-spengle-surface border border-spengle-gold/50 flex items-center justify-center transition-all group-hover:border-spengle-gold">
            <span className="font-mono text-xs font-black text-spengle-gold tracking-tighter">SP</span>
            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-spengle-gold" />
          </div>
          <div>
            <div className="text-[9px] font-mono tracking-widest-tech uppercase text-spengle-muted flex items-center gap-1.5">
              <span>SWISS MONOCOQUE</span>
              <span className="text-spengle-dim">•</span>
              <span className="text-spengle-gold font-medium">EDITION 2026</span>
            </div>
            <h1 className="text-xs lg:text-sm font-bold tracking-[0.18em] text-spengle-titanium uppercase">
              AVANTHI CRICKET CARNIVAL
            </h1>
          </div>
        </div>

        {/* View Switcher: Precision Segmented Rail */}
        <nav className="hidden lg:flex items-center space-x-1 bg-spengle-chassis p-1 border border-spengle-border">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`group flex items-center space-x-2 px-3 py-1.5 text-xs font-mono transition-all relative ${
                  isActive
                    ? 'bg-spengle-elevated text-spengle-titanium border-b-2 border-spengle-gold shadow-sm'
                    : 'text-spengle-muted hover:text-spengle-titanium hover:bg-spengle-surface'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-spengle-gold' : 'text-spengle-dim group-hover:text-spengle-muted'}`} />
                <span className="tracking-[0.14em] uppercase font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Telemetry & Connectivity Diode */}
        <div className="flex items-center space-x-3 font-mono">
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-spengle-chassis border border-spengle-border text-[10px]">
            <span
              className={`w-1.5 h-1.5 rounded-none ${
                isConnected ? 'bg-spengle-emerald shadow-sm shadow-emerald-500/50 animate-pulse-fast' : 'bg-spengle-crimson'
              }`}
            />
            <span className="text-spengle-muted tracking-widest-tech">
              {isConnected ? 'NODE // LIVE' : 'NODE // OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Responsive Rail */}
      <div className="flex lg:hidden items-center justify-between pt-2 border-t border-spengle-border/60 mt-2 text-[10px] font-mono overflow-x-auto gap-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`px-2 py-1 whitespace-nowrap transition-colors ${
                isActive ? 'text-spengle-gold font-bold border-b border-spengle-gold' : 'text-spengle-muted hover:text-spengle-titanium'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
