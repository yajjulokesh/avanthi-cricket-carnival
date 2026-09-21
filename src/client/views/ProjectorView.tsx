import React from 'react';
import { LotState, PublicFranchise, ScarcityStatus } from '../../core/types.js';
import { Timer, AlertTriangle, Trophy, Flame, User, Activity } from 'lucide-react';

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
    <div className="min-h-[calc(100vh-65px)] bg-spengle-carbon text-spengle-titanium flex flex-col justify-between p-6 lg:p-10 select-none overflow-hidden font-sans">
      {/* Top Bar: Spengle Scarcity Telemetry Warning (§12.3) */}
      {activeScarcities.length > 0 && (
        <div className="mb-4 bg-spengle-chassis border border-spengle-gold/60 text-spengle-gold px-6 py-3 shadow-2xl flex items-center justify-center space-x-3 text-sm lg:text-base font-mono">
          <AlertTriangle className="w-5 h-5 text-spengle-gold shrink-0 animate-pulse" />
          <span className="tracking-widest-tech uppercase font-bold">
            CRITICAL SCARCITY TELEMETRY // SUPPLY ≤ AGGREGATE DEMAND:{' '}
            {activeScarcities.map((s) => `${s.bucket} [${s.unsoldSupply} REMAINING / ${s.totalDemand} NEEDED]`).join(' • ')}
          </span>
        </div>
      )}

      {/* Main Lot Display: Swiss Monocoque Stage */}
      {player && lotState?.status === 'ACTIVE' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1 my-auto">
          {/* Left Column: Player Monolith (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center spengle-box p-6 lg:p-8 relative">
            <div className="absolute top-3 left-3 bg-spengle-surface border border-spengle-gold/50 text-spengle-gold font-mono text-[10px] tracking-widest-tech uppercase px-2.5 py-1">
              LOT #{lotState.lotNumber} • {lotState.bucket}
            </div>

            {/* High-Resolution Portrait Container */}
            <div className="w-64 h-64 lg:w-72 lg:h-72 bg-spengle-surface border-2 border-spengle-border mb-5 overflow-hidden flex items-center justify-center relative">
              {player.photoUrl ? (
                <img
                  src={player.photoUrl}
                  alt={player.name}
                  className="w-full h-full object-cover grayscale contrast-125"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              ) : (
                <User className="w-24 h-24 text-spengle-dim" />
              )}
              <div className="absolute bottom-2 right-2 bg-spengle-carbon/90 border border-spengle-border px-2 py-0.5 text-[9px] font-mono tracking-widest text-spengle-gold uppercase">
                {player.derivedType}
              </div>
            </div>

            <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight uppercase text-center mb-1">
              {player.name}
            </h2>
            <div className="flex items-center gap-2 mb-4 text-spengle-muted font-mono text-xs tracking-wider">
              <span>{player.program}</span>
              <span className="text-spengle-dim">•</span>
              <span className="text-spengle-gold font-bold">{player.branch}</span>
              <span className="text-spengle-dim">•</span>
              <span>YEAR {player.yearOfStudy}</span>
            </div>

            {/* Career Stats Grid: Machined Swiss Data Matrix */}
            <div className="grid grid-cols-4 gap-2 w-full text-center bg-spengle-surface p-3 border border-spengle-border text-xs font-mono">
              <div className="p-1 border-r border-spengle-border/40">
                <div className="text-spengle-dim text-[9px] uppercase tracking-wider">Matches</div>
                <div className="font-bold text-base text-white">{player.stats?.matches || 0}</div>
              </div>
              <div className="p-1 border-r border-spengle-border/40">
                <div className="text-spengle-dim text-[9px] uppercase tracking-wider">Runs</div>
                <div className="font-bold text-base text-spengle-gold">{player.stats?.runs || 0}</div>
              </div>
              <div className="p-1 border-r border-spengle-border/40">
                <div className="text-spengle-dim text-[9px] uppercase tracking-wider">Strike Rate</div>
                <div className="font-bold text-base text-white">{player.stats?.strikeRate || 0}</div>
              </div>
              <div className="p-1">
                <div className="text-spengle-dim text-[9px] uppercase tracking-wider">Wickets</div>
                <div className="font-bold text-base text-spengle-emerald">{player.stats?.wickets || 0}</div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Legibility Live Bidding Arena (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            {/* Top Telemetry Row: Base Price + Swiss Chrono */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-spengle-chassis border border-spengle-border p-5">
                <div className="text-[10px] font-mono uppercase tracking-widest-tech text-spengle-dim mb-1">
                  BASE PRICE
                </div>
                <div className="text-3xl font-mono font-bold text-spengle-muted">
                  {player.basePrice} <span className="text-xs font-normal text-spengle-dim">PTS</span>
                </div>
              </div>

              {/* Swiss Countdown Timer */}
              <div className={`border p-5 flex items-center justify-between transition-colors ${
                secondsLeft <= 5
                  ? 'bg-spengle-crimsonMuted border-spengle-crimson text-spengle-crimson animate-pulse-fast'
                  : 'bg-spengle-chassis border-spengle-border text-spengle-gold'
              }`}>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest-tech text-spengle-dim mb-1">
                    SWISS CHRONO
                  </div>
                  <div className="text-4xl font-mono font-black">
                    00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
                  </div>
                </div>
                <Timer className={`w-9 h-9 ${secondsLeft <= 5 ? 'text-spengle-crimson' : 'text-spengle-gold'}`} />
              </div>
            </div>

            {/* Monolithic Current Bid Showcase */}
            <div className="spengle-box border-2 border-spengle-gold/60 p-8 lg:p-10 text-center shadow-2xl relative overflow-hidden">
              <div className="text-xs font-mono tracking-super-tech text-spengle-gold uppercase mb-2 font-bold">
                CURRENT HIGHEST BID
              </div>
              <div className="text-7xl lg:text-9xl font-black text-spengle-gold font-mono tracking-tight">
                {lotState.currentPrice}
                <span className="text-2xl text-spengle-goldLight font-mono ml-3">PTS</span>
              </div>

              {/* Leading Franchise Callout */}
              <div className="mt-8 pt-6 border-t border-spengle-border flex items-center justify-center space-x-4">
                {lotState.highestBidderFranchiseName ? (
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-7 h-7 text-spengle-gold" />
                    <div>
                      <div className="text-[10px] font-mono tracking-widest-tech uppercase text-spengle-muted">
                        LEADING FRANCHISE
                      </div>
                      <div className="text-2xl lg:text-3xl font-black text-white uppercase tracking-wider">
                        {lotState.highestBidderFranchiseName}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-spengle-dim text-base font-mono uppercase tracking-widest">
                    AWAITING OPENING BID AT BASE PRICE
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standby / Intermission Display */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 my-auto spengle-box max-w-3xl mx-auto w-full">
          <div className="w-16 h-16 border border-spengle-gold/60 bg-spengle-surface flex items-center justify-center mb-6">
            <Trophy className="w-8 h-8 text-spengle-gold" />
          </div>
          <div className="text-[10px] font-mono tracking-super-tech uppercase text-spengle-gold mb-1">
            AUCTION AUDITORIUM STAGE
          </div>
          <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight uppercase mb-3">
            AVANTHI CRICKET CARNIVAL 2026
          </h2>
          <p className="text-spengle-muted text-sm font-mono uppercase tracking-widest max-w-md">
            {lotState?.status === 'SOLD'
              ? 'LOT HAMMERED SOLD. PREPARING NEXT LOT TELEMETRY.'
              : lotState?.status === 'UNSOLD'
              ? 'LOT CONCLUDED UNSOLD. NEXT PLAYER DRAWING.'
              : 'AUCTION FLOOR IS STANDING BY. NEXT LOT COMMENCING.'}
          </p>
        </div>
      )}

      {/* Bottom Bar: 11 Franchises Array (Auditorium 30m Telemetry) */}
      <div className="mt-6 pt-4 border-t border-spengle-border">
        <div className="text-[10px] font-mono tracking-widest-tech text-spengle-muted uppercase mb-3 flex items-center justify-between">
          <span>FRANCHISE TELEMETRY PADDLES (11 TEAMS)</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-spengle-emerald"></span> IN PLAY</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-spengle-gold"></span> LEADING</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-spengle-dim"></span> PASSED</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-spengle-crimson"></span> BLOCKED</span>
          </div>
        </div>

        <div className="grid grid-cols-6 lg:grid-cols-11 gap-2">
          {franchises.map((f) => {
            const isHighest = lotState?.highestBidderFranchiseId === f.id;
            const isBlocked = lotState?.blockedFranchiseIds?.includes(f.id);
            const isPassed = lotState?.passedFranchiseIds?.includes(f.id);

            let borderStyle = 'border-spengle-border bg-spengle-chassis text-spengle-titanium';
            let label = 'IN PLAY';
            let labelColor = 'text-spengle-emerald';

            if (isHighest) {
              borderStyle = 'border-spengle-gold bg-spengle-surface text-spengle-gold ring-1 ring-spengle-gold';
              label = 'LEADING';
              labelColor = 'text-spengle-gold';
            } else if (isBlocked) {
              borderStyle = 'border-spengle-crimson/40 bg-spengle-chassis text-spengle-dim opacity-50';
              label = 'BLOCKED';
              labelColor = 'text-spengle-crimson';
            } else if (isPassed) {
              borderStyle = 'border-spengle-border bg-spengle-chassis text-spengle-dim opacity-60';
              label = 'PASSED';
              labelColor = 'text-spengle-muted';
            }

            return (
              <div
                key={f.id}
                className={`p-2 border text-center transition-all ${borderStyle}`}
              >
                <div className="w-6 h-6 mx-auto bg-spengle-surface border border-spengle-border overflow-hidden mb-1 flex items-center justify-center">
                  <img
                    src={f.logoUrl}
                    alt={f.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                  />
                </div>
                <div className="font-bold text-[10px] truncate uppercase">{f.name}</div>
                <div className={`text-[9px] font-mono font-bold mt-0.5 tracking-wider ${labelColor}`}>{label}</div>
                <div className="text-[9px] text-spengle-muted font-mono mt-0.5">{f.currentPurse} pts</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
