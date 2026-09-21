import React, { useState, useEffect } from 'react';
import { LotState, PublicFranchise, PublicPlayer, ScarcityStatus } from '../../core/types.js';
import { Search, Shield, Trophy, Activity, Flame, Award, Filter, User } from 'lucide-react';

interface PublicViewProps {
  lotState: LotState | null;
  franchises: PublicFranchise[];
  scarcities: ScarcityStatus[];
  secondsLeft: number;
}

export const PublicView: React.FC<PublicViewProps> = ({
  lotState,
  franchises,
  scarcities,
  secondsLeft,
}) => {
  const [players, setPlayers] = useState<PublicPlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucketFilter, setSelectedBucketFilter] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/players/public-list')
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch((err) => console.error(err));
  }, [lotState?.status]);

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.branch.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBucket = selectedBucketFilter === 'ALL' || p.bucket === selectedBucketFilter;
    return matchesSearch && matchesBucket;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8 bg-spengle-carbon text-spengle-titanium min-h-screen">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-spengle-border pb-6 gap-4">
        <div>
          <div className="text-[10px] font-mono tracking-widest-tech uppercase text-spengle-gold flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-spengle-gold" />
            <span>SWISS TELEMETRY // PUBLIC AUCTION BROADCAST</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight uppercase mt-1">
            AVANTHI CRICKET CARNIVAL 2026
          </h1>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono text-spengle-muted">
          <div className="px-3 py-1.5 bg-spengle-chassis border border-spengle-border">
            <span className="text-spengle-dim">FRANCHISES:</span> <span className="text-spengle-titanium font-bold">{franchises.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-spengle-chassis border border-spengle-border">
            <span className="text-spengle-dim">ROSTER:</span> <span className="text-spengle-titanium font-bold">{players.length} PLAYERS</span>
          </div>
        </div>
      </div>

      {/* Live Lot Spotlight Card: Spengle Kinetic Showcase */}
      {lotState?.player && lotState.status === 'ACTIVE' ? (
        <div className="spengle-box border border-spengle-gold/60 p-6 lg:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-spengle-gold/5 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Player Visual & Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full lg:w-auto">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-spengle-surface border border-spengle-border shrink-0 overflow-hidden">
                <img
                  src={lotState.player.photoUrl}
                  alt={lotState.player.name}
                  className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-300"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <div className="absolute top-1 left-1 bg-spengle-carbon/90 border border-spengle-border px-1.5 py-0.5 text-[9px] font-mono text-spengle-gold">
                  {lotState.player.bucket}
                </div>
              </div>

              <div className="text-center sm:text-left space-y-1.5">
                <div className="inline-flex items-center space-x-2 text-[10px] font-mono tracking-widest-tech text-spengle-gold uppercase">
                  <span>[ACTIVE LOT #{lotState.lotNumber}]</span>
                  <span>•</span>
                  <span>{lotState.bucket} TIER</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  {lotState.player.name}
                </h2>
                <p className="text-xs text-spengle-muted font-mono tracking-wide">
                  {lotState.player.program} ({lotState.player.branch}) • YEAR {lotState.player.yearOfStudy}
                </p>
                <div className="inline-block mt-2 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 bg-spengle-surface border border-spengle-border text-spengle-titanium">
                  {lotState.player.derivedType}
                </div>
              </div>
            </div>

            {/* Bidding Telemetry & Clock */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6 w-full lg:w-auto text-center lg:text-right">
              <div className="p-4 bg-spengle-surface border border-spengle-border min-w-[140px]">
                <div className="text-[10px] font-mono tracking-widest-tech uppercase text-spengle-muted">
                  CURRENT PRICE
                </div>
                <div className="text-3xl sm:text-4xl font-black text-spengle-gold font-mono tracking-tight">
                  {lotState.currentPrice} <span className="text-sm font-normal text-spengle-muted">PTS</span>
                </div>
              </div>

              <div className="p-4 bg-spengle-surface border border-spengle-border min-w-[170px]">
                <div className="text-[10px] font-mono tracking-widest-tech uppercase text-spengle-muted">
                  LEADING FRANCHISE
                </div>
                <div className="text-base sm:text-lg font-bold text-white tracking-wide truncate max-w-[200px]">
                  {lotState.highestBidderFranchiseName || 'NO BIDS YET'}
                </div>
              </div>

              <div className="p-4 bg-spengle-surface border border-spengle-gold/60 text-center min-w-[110px]">
                <div className="text-[9px] font-mono tracking-widest-tech uppercase text-spengle-gold">
                  CHRONO
                </div>
                <div className={`text-3xl sm:text-4xl font-mono font-black ${secondsLeft <= 5 ? 'text-spengle-crimson animate-pulse-fast' : 'text-spengle-gold'}`}>
                  00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 11 Franchises Standings Table: High-Precision Monocoque Grid */}
      <div className="spengle-box p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-spengle-border pb-3">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-spengle-gold" />
            <h3 className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-spengle-titanium">
              FRANCHISE SQUAD & PURSE TELEMETRY (11 TEAMS)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-spengle-dim uppercase tracking-widest-tech">
            1000 PTS PURSE BASE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-spengle-surface text-spengle-muted border-b border-spengle-border">
              <tr>
                <th className="p-3 uppercase tracking-widest text-[10px]">Franchise Name</th>
                <th className="p-3 text-right uppercase tracking-widest text-[10px]">Purse Available</th>
                <th className="p-3 text-center uppercase tracking-widest text-[10px]">Auction Buys</th>
                <th className="p-3 text-center uppercase tracking-widest text-[10px]">Squad</th>
                <th className="p-3 text-center uppercase tracking-widest text-[10px]">B1</th>
                <th className="p-3 text-center uppercase tracking-widest text-[10px]">B2</th>
                <th className="p-3 text-center uppercase tracking-widest text-[10px]">B3</th>
                <th className="p-3 text-center uppercase tracking-widest text-[10px]">B4</th>
                <th className="p-3 text-center uppercase tracking-widest text-[10px]">B5 (Dip)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-spengle-border/50">
              {franchises.map((f, idx) => (
                <tr key={f.id} className="hover:bg-spengle-surface/50 transition-colors">
                  <td className="p-3 font-semibold text-spengle-titanium flex items-center gap-3">
                    <div className="w-7 h-7 bg-spengle-surface border border-spengle-border shrink-0 overflow-hidden flex items-center justify-center">
                      <img src={f.logoUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="tracking-wide">{f.name}</span>
                  </td>
                  <td className="p-3 text-right font-bold text-spengle-gold font-mono">
                    {f.currentPurse} <span className="text-[10px] font-normal text-spengle-muted">PTS</span>
                  </td>
                  <td className="p-3 text-center text-spengle-titanium">{f.auctionPurchasesCount} / 15</td>
                  <td className="p-3 text-center text-spengle-muted">{f.squadCount}</td>
                  <td className="p-3 text-center text-spengle-dim">{f.bucketCounts.B1}</td>
                  <td className="p-3 text-center text-spengle-dim">{f.bucketCounts.B2}</td>
                  <td className="p-3 text-center text-spengle-dim">{f.bucketCounts.B3}</td>
                  <td className="p-3 text-center text-spengle-dim">{f.bucketCounts.B4}</td>
                  <td className="p-3 text-center text-spengle-dim">{f.bucketCounts.B5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registered Players Directory: Swiss Product Framing */}
      <div className="spengle-box p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-spengle-border pb-4">
          <div>
            <div className="text-[10px] font-mono tracking-widest-tech uppercase text-spengle-gold">
              INDEXED CATALOGUE
            </div>
            <h3 className="text-sm font-bold tracking-[0.16em] uppercase text-spengle-titanium">
              REGISTERED PLAYERS DIRECTORY
            </h3>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center space-x-2 w-full md:w-auto font-mono text-xs">
            <div className="relative flex-1 md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-spengle-dim" />
              <input
                type="text"
                placeholder="SEARCH NAME OR ROLL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-spengle-surface text-spengle-titanium text-xs pl-9 pr-3 py-2 border border-spengle-border focus:border-spengle-gold outline-none tracking-wider"
              />
            </div>

            <select
              value={selectedBucketFilter}
              onChange={(e) => setSelectedBucketFilter(e.target.value)}
              className="bg-spengle-surface text-spengle-titanium text-xs px-3 py-2 border border-spengle-border focus:border-spengle-gold outline-none uppercase"
            >
              <option value="ALL">ALL BUCKETS</option>
              <option value="B1">BUCKET B1</option>
              <option value="B2">BUCKET B2</option>
              <option value="B3">BUCKET B3</option>
              <option value="B4">BUCKET B4</option>
              <option value="B5">BUCKET B5 (DIPLOMA)</option>
              <option value="PG">BUCKET PG</option>
            </select>
          </div>
        </div>

        {/* Players Grid: Razor-Edge Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((p) => (
            <div
              key={p.id}
              className="bg-spengle-chassis border border-spengle-border p-4 flex items-center justify-between hover:border-spengle-gold/50 transition-colors group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-14 h-14 bg-spengle-surface border border-spengle-border shrink-0 overflow-hidden relative">
                  <img
                    src={p.photoUrl}
                    alt=""
                    className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-300"
                    onError={(e) => {
                      (e.target as any).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div className="absolute bottom-0 right-0 bg-spengle-carbon px-1 text-[8px] font-mono text-spengle-gold">
                    {p.bucket}
                  </div>
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-spengle-titanium text-sm uppercase tracking-wide truncate">
                    {p.name}
                  </h4>
                  <div className="text-[11px] text-spengle-muted font-mono truncate">
                    {p.program} ({p.branch}) • Y{p.yearOfStudy}
                  </div>
                  <div className="text-[10px] text-spengle-gold font-mono uppercase tracking-widest mt-0.5">
                    {p.derivedType}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-3">
                <div className="text-xs font-mono font-bold text-spengle-gold">
                  {p.basePrice} <span className="text-[10px] text-spengle-muted">PTS</span>
                </div>
                <span
                  className={`inline-block text-[9px] font-mono px-2 py-0.5 mt-1 tracking-widest-tech uppercase border ${
                    p.status === 'SOLD'
                      ? 'border-spengle-emerald/50 bg-spengle-emerald/10 text-spengle-emerald'
                      : p.status === 'UNSOLD'
                      ? 'border-spengle-border bg-spengle-surface text-spengle-dim'
                      : p.status === 'RETAINED'
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                      : 'border-spengle-gold/50 bg-spengle-goldMuted text-spengle-gold'
                  }`}
                >
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
