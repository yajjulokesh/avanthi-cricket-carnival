import React, { useState, useEffect } from 'react';
import { LotState, PublicFranchise, PublicPlayer, ScarcityStatus } from '../../core/types.js';
import { Search, Trophy, Flame, User, AlertTriangle } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
      {/* Live Lot Spotlight Card */}
      {lotState?.player && lotState.status === 'ACTIVE' ? (
        <div className="bg-gradient-to-r from-slate-900 via-[#111a33] to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-500/40 shrink-0">
                <img
                  src={lotState.player.photoUrl}
                  alt={lotState.player.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              </div>
              <div>
                <span className="text-xs font-chakra font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300">
                  LIVE ON THE BLOCK • LOT #{lotState.lotNumber} • {lotState.bucket}
                </span>
                <h3 className="text-3xl font-extrabold text-white font-chakra mt-1">{lotState.player.name}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {lotState.player.program} ({lotState.player.branch}) • {lotState.player.derivedType}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-center">
              <div>
                <div className="text-[11px] font-mono text-slate-400">Current Bid</div>
                <div className="text-4xl font-black text-amber-400 font-mono">{lotState.currentPrice} pts</div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-slate-400">Leading Team</div>
                <div className="text-xl font-bold text-white font-chakra">
                  {lotState.highestBidderFranchiseName || 'No bids yet'}
                </div>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-amber-400 font-mono text-2xl font-bold">
                {secondsLeft}s
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 11 Franchises Standings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold font-chakra text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          FRANCHISE PURSE & SQUAD TRACKER (11 TEAMS)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Team Name</th>
                <th className="p-3 text-right">Available Purse</th>
                <th className="p-3 text-center">Auction Buys</th>
                <th className="p-3 text-center">Total Squad</th>
                <th className="p-3 text-center">B1</th>
                <th className="p-3 text-center">B2</th>
                <th className="p-3 text-center">B3</th>
                <th className="p-3 text-center">B4</th>
                <th className="p-3 text-center">B5 (Dip)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {franchises.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-semibold text-white font-sans flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-950 overflow-hidden shrink-0">
                      <img src={f.logoUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span>{f.name}</span>
                  </td>
                  <td className="p-3 text-right font-bold text-amber-400">{f.currentPurse} pts</td>
                  <td className="p-3 text-center">{f.auctionPurchasesCount} / 15</td>
                  <td className="p-3 text-center text-slate-300">{f.squadCount}</td>
                  <td className="p-3 text-center text-slate-400">{f.bucketCounts.B1}</td>
                  <td className="p-3 text-center text-slate-400">{f.bucketCounts.B2}</td>
                  <td className="p-3 text-center text-slate-400">{f.bucketCounts.B3}</td>
                  <td className="p-3 text-center text-slate-400">{f.bucketCounts.B4}</td>
                  <td className="p-3 text-center text-slate-400">{f.bucketCounts.B5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registered Players Directory */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold font-chakra text-white">REGISTERED PLAYERS ROSTER</h3>
            <p className="text-xs text-slate-400 font-mono">Public Directory • Phone Numbers Masked</p>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search name or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 font-mono"
              />
            </div>

            <select
              value={selectedBucketFilter}
              onChange={(e) => setSelectedBucketFilter(e.target.value)}
              className="bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 font-mono"
            >
              <option value="ALL">All Buckets</option>
              <option value="B1">B1 (1st Yr)</option>
              <option value="B2">B2 (2nd Yr)</option>
              <option value="B3">B3 (3rd Yr)</option>
              <option value="B4">B4 (4th Yr)</option>
              <option value="B5">B5 (Diploma)</option>
              <option value="PG">PG</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPlayers.map((p) => (
            <div
              key={p.id}
              className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden border border-slate-800 shrink-0">
                  <img
                    src={p.photoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm font-sans">{p.name}</h4>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {p.bucket} • {p.program} ({p.branch})
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold">{p.derivedType}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-amber-400">{p.basePrice} pts</div>
                <span
                  className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full font-bold mt-1 ${
                    p.status === 'SOLD'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : p.status === 'UNSOLD'
                      ? 'bg-slate-800 text-slate-400'
                      : p.status === 'RETAINED'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-amber-500/20 text-amber-300'
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
