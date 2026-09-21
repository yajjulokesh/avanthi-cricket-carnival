import React from 'react';
import { LotState, PublicFranchise, ScarcityStatus } from '../../core/types.js';
import { Timer, AlertTriangle, Trophy, ShieldCheck, Flame, User } from 'lucide-react';

interface ProjectorViewProps {
  lotState: LotState | null;
  franchises: PublicFranchise[];
  scarcities: ScarcityStatus[];
  secondsLeft: number;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({
  lotState,
  franchises,
  scarcities,
  secondsLeft,
}) => {
  const activeScarcities = scarcities.filter((s) => s.isScarcityWarning);
  const player = lotState?.player;

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#070b14] text-white flex flex-col justify-between p-6 lg:p-10 select-none overflow-hidden">
      {/* Top Bar: Scarcity Warning Banner (if active §12.3) */}
      {activeScarcities.length > 0 && (
        <div className="mb-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg flex items-center justify-center space-x-3 text-lg animate-pulse">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <span>
            ⚠️ SCARCITY NOTICE: Unsold supply is at or below aggregate franchise demand for{' '}
            {activeScarcities.map((s) => `${s.bucket} (${s.unsoldSupply} remaining / ${s.totalDemand} needed)`).join(', ')}!
          </span>
        </div>
      )}

      {/* Main Lot Display */}
      {player && lotState?.status === 'ACTIVE' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
          {/* Left Column: Player Photo & Details (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="absolute top-4 left-4 bg-amber-500 text-slate-950 font-chakra font-bold text-sm px-3 py-1 rounded-lg">
              LOT #{lotState.lotNumber} • {lotState.bucket}
            </div>

            <div className="w-64 h-64 lg:w-72 lg:h-72 rounded-2xl overflow-hidden border-4 border-amber-500/40 shadow-2xl mb-4 bg-slate-950 flex items-center justify-center">
              {player.photoUrl ? (
                <img
                  src={player.photoUrl}
                  alt={player.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              ) : (
                <User className="w-32 h-32 text-slate-700" />
              )}
            </div>

            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-wide text-center mb-1 font-chakra">
              {player.name}
            </h2>
            <div className="flex items-center gap-2 mb-3 text-slate-400 font-mono text-sm">
              <span>{player.program}</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">{player.branch}</span>
              <span>•</span>
              <span>Year {player.yearOfStudy}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-300 mb-4">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{player.derivedType}</span>
            </div>

            {/* Career Stats Grid */}
            <div className="grid grid-cols-4 gap-2 w-full text-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 text-xs">
              <div className="p-1">
                <div className="text-slate-400">Matches</div>
                <div className="font-bold text-base text-white">{player.stats?.matches || 0}</div>
              </div>
              <div className="p-1">
                <div className="text-slate-400">Runs</div>
                <div className="font-bold text-base text-amber-400">{player.stats?.runs || 0}</div>
              </div>
              <div className="p-1">
                <div className="text-slate-400">Strike Rate</div>
                <div className="font-bold text-base text-white">{player.stats?.strikeRate || 0}</div>
              </div>
              <div className="p-1">
                <div className="text-slate-400">Wickets</div>
                <div className="font-bold text-base text-emerald-400">{player.stats?.wickets || 0}</div>
              </div>
              <div className="p-1">
                <div className="text-slate-400">Bowl Avg</div>
                <div className="font-bold text-base text-white">{player.stats?.bowlingAverage || '-'}</div>
              </div>
              <div className="p-1">
                <div className="text-slate-400">Economy</div>
                <div className="font-bold text-base text-white">{player.stats?.economy || '-'}</div>
              </div>
              <div className="p-1">
                <div className="text-slate-400">Catches</div>
                <div className="font-bold text-base text-white">{player.stats?.catches || 0}</div>
              </div>
              <div className="p-1">
                <div className="text-slate-400">Highest</div>
                <div className="font-bold text-base text-white">{player.stats?.highestScore || '-'}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Bidding Arena (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            {/* Top Price Bar */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Base Price</div>
                <div className="text-3xl font-mono font-bold text-slate-300">
                  {player.basePrice} <span className="text-sm font-sans text-slate-500 font-normal">pts</span>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className={`border rounded-2xl p-4 flex items-center justify-between transition-colors ${
                secondsLeft <= 5
                  ? 'bg-rose-950/40 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-slate-900/60 border-slate-800 text-amber-400'
              }`}>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Lot Timer</div>
                  <div className="text-4xl font-mono font-black">{secondsLeft}s</div>
                </div>
                <Timer className={`w-10 h-10 ${secondsLeft <= 5 ? 'text-rose-500 animate-spin' : 'text-amber-500'}`} />
              </div>
            </div>

            {/* Giant Current Bid Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border-2 border-amber-500/50 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="text-sm font-chakra tracking-widest text-amber-400 uppercase mb-2 font-bold">
                CURRENT HIGHEST BID
              </div>
              <div className="text-7xl lg:text-8xl font-black text-amber-400 font-mono tracking-tight drop-shadow-md">
                {lotState.currentPrice}
                <span className="text-2xl text-amber-300/70 font-sans ml-2">PTS</span>
              </div>

              {/* Leading Franchise Banner */}
              <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-center space-x-4">
                {lotState.highestBidderFranchiseName ? (
                  <>
                    <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-400">Leading Franchise</div>
                      <div className="text-2xl lg:text-3xl font-black text-white font-chakra">
                        {lotState.highestBidderFranchiseName}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-lg font-mono">Waiting for opening bid at base price...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Waiting / Idle Screen */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 shadow-xl">
            <Trophy className="w-12 h-12 text-amber-400" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white font-chakra tracking-wide mb-3">
            AVANTHI CRICKET CARNIVAL 2026
          </h2>
          <p className="text-slate-400 text-lg max-w-lg mb-8 font-mono">
            {lotState?.status === 'SOLD'
              ? 'LOT HAMMERED SOLD! Preparing next lot...'
              : lotState?.status === 'UNSOLD'
              ? 'LOT UNTOUCHED (UNSOLD). Next player drawing...'
              : 'Auction floor is standing by. Next lot commencing shortly.'}
          </p>
        </div>
      )}

      {/* Bottom Bar: 11 Franchises Live Status (§14 Layout item 5) */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <div className="text-xs font-chakra tracking-wider text-slate-400 uppercase mb-3 flex items-center justify-between">
          <span>Franchise Table Status (11 Teams)</span>
          <div className="flex items-center space-x-4 text-[11px] font-normal font-mono">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> In Play</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Passed</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Blocked</span>
          </div>
        </div>

        <div className="grid grid-cols-6 lg:grid-cols-11 gap-2.5">
          {franchises.map((f) => {
            const isHighest = lotState?.highestBidderFranchiseId === f.id;
            const isBlocked = lotState?.blockedFranchiseIds?.includes(f.id);
            const isPassed = lotState?.passedFranchiseIds?.includes(f.id);

            let statusColor = 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300';
            let label = 'IN PLAY';

            if (isHighest) {
              statusColor = 'border-amber-400 bg-amber-500/20 text-amber-300 ring-2 ring-amber-400';
              label = 'LEADING';
            } else if (isBlocked) {
              statusColor = 'border-rose-600/40 bg-rose-950/20 text-rose-400 opacity-60';
              label = 'BLOCKED';
            } else if (isPassed) {
              statusColor = 'border-amber-600/40 bg-amber-950/20 text-amber-400';
              label = 'PASSED';
            }

            return (
              <div
                key={f.id}
                className={`p-2 rounded-xl border text-center transition-all ${statusColor}`}
              >
                <div className="w-7 h-7 mx-auto rounded-full bg-slate-900 overflow-hidden mb-1 flex items-center justify-center border border-slate-800">
                  <img
                    src={f.logoUrl}
                    alt={f.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                  />
                </div>
                <div className="font-bold text-[11px] truncate text-white">{f.name}</div>
                <div className="text-[10px] font-mono font-bold mt-0.5">{label}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{f.currentPurse} pts</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
