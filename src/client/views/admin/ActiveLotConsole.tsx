import React from 'react';
import { LotState, PublicPlayer } from '../../../core/types.js';
import { Gavel, SkipForward, Pause, Play, User, Flame, AlertCircle } from 'lucide-react';

interface ActiveLotConsoleProps {
  lotState: LotState | null;
  secondsLeft: number;
  onHammer: () => void;
  onSkip: () => void;
  onPauseResume: (isPause: boolean) => void;
}

/**
 * ActiveLotConsole - Primary Flight Deck Command Center
 * Handcrafted with the Whoop performance aesthetic:
 * - Matte dark surfaces, mechanical data layout
 * - Stark numerical telemetry with mono digits
 * - Heavy physical button weights (Spacebar/Click hammer)
 * - Clean empty states with zero placeholder dummy text
 */
export const ActiveLotConsole: React.FC<ActiveLotConsoleProps> = ({
  lotState,
  secondsLeft,
  onHammer,
  onSkip,
  onPauseResume,
}) => {
  const isLotActive = lotState?.status === 'ACTIVE';
  const isLotPaused = lotState?.status === 'PAUSED';
  const player: PublicPlayer | null = lotState?.player || null;

  return (
    <section className="bg-whoop-surface border border-whoop-border rounded-xl p-5 lg:p-6 shadow-sm flex flex-col justify-between space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-whoop-borderMuted pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-whoop-highlight"></span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-whoop-textMuted uppercase font-bold">
            TELEMETRY // ACTIVE LOT
          </span>
        </div>

        {/* State indicator and pause/resume control */}
        <div className="flex items-center space-x-3">
          {lotState && (
            <span
              className={`font-mono text-xs px-2.5 py-0.5 rounded border uppercase font-bold ${
                isLotActive
                  ? 'bg-emerald-950/40 text-whoop-recovery border-emerald-800/40'
                  : isLotPaused
                  ? 'bg-amber-950/40 text-whoop-telemetry border-amber-800/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              {lotState.status}
            </span>
          )}

          {isLotActive && (
            <button
              type="button"
              onClick={() => onPauseResume(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-whoop-elevated hover:bg-zinc-800 text-zinc-300 border border-whoop-border rounded text-xs font-mono transition-all active:translate-y-[1px]"
            >
              <Pause className="w-3.5 h-3.5 text-whoop-telemetry" />
              <span>PAUSE</span>
            </button>
          )}

          {isLotPaused && (
            <button
              type="button"
              onClick={() => onPauseResume(false)}
              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-950/30 hover:bg-emerald-900/40 text-whoop-recovery border border-emerald-800/50 rounded text-xs font-mono transition-all active:translate-y-[1px]"
            >
              <Play className="w-3.5 h-3.5" />
              <span>RESUME</span>
            </button>
          )}
        </div>
      </div>

      {/* Lot Core Presentation */}
      {player && (isLotActive || isLotPaused) ? (
        <div className="space-y-6">
          {/* Player Identity Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-whoop-elevated/80 border border-whoop-border rounded-lg p-4">
            {/* Player Photograph */}
            <div className="md:col-span-3 flex justify-center md:justify-start">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-md overflow-hidden bg-whoop-carbon border border-whoop-border flex items-center justify-center shrink-0">
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="w-10 h-10 text-zinc-600" />
                )}
              </div>
            </div>

            {/* Player Metadata */}
            <div className="md:col-span-9 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 rounded bg-whoop-carbon border border-whoop-border text-whoop-telemetry font-bold">
                  LOT #{lotState?.lotNumber}
                </span>
                <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 rounded bg-whoop-carbon border border-whoop-border text-white font-bold">
                  BUCKET {lotState?.bucket}
                </span>
                {player.isLateral && (
                  <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 rounded bg-sky-950/40 border border-sky-800/40 text-sky-400 font-bold">
                    LATERAL ENTRY
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold font-sans text-white tracking-tight">
                  {player.name}
                </h2>
                <p className="font-mono text-xs text-whoop-textDim mt-0.5">
                  {player.program} // {player.branch} // Year {player.yearOfStudy} // Roll: {player.rollNumber}
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-whoop-carbon border border-whoop-border text-xs font-mono text-zinc-200">
                  <Flame className="w-3 h-3 text-whoop-telemetry" />
                  <span>{player.derivedType}</span>
                </span>
                <span className="font-mono text-xs text-whoop-textMuted">
                  Base Price: <strong className="text-white">{player.basePrice} pts</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Bid & Clock Telemetry Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric 1: Current Price */}
            <div className="bg-whoop-elevated border border-whoop-border rounded-lg p-4 flex flex-col justify-between">
              <span className="font-mono text-[10px] tracking-[0.2em] text-whoop-textMuted uppercase font-bold">
                CURRENT BID VALUE
              </span>
              <div className="my-2">
                <span className="font-mono text-4xl lg:text-5xl font-black text-white tracking-tight">
                  {lotState?.currentPrice || 0}
                </span>
                <span className="font-mono text-xs text-whoop-textMuted ml-1.5 uppercase">pts</span>
              </div>
              <span className="font-mono text-[11px] text-whoop-textDim">
                Floor: {player.basePrice} pts
              </span>
            </div>

            {/* Metric 2: Leading Franchise */}
            <div className="bg-whoop-elevated border border-whoop-border rounded-lg p-4 flex flex-col justify-between">
              <span className="font-mono text-[10px] tracking-[0.2em] text-whoop-textMuted uppercase font-bold">
                LEADING CALLSIGN
              </span>
              <div className="my-2">
                <div className="font-sans text-xl lg:text-2xl font-bold text-white truncate">
                  {lotState?.highestBidderFranchiseName || (
                    <span className="text-zinc-600 font-mono text-base font-normal">AWAITING OPENING BID</span>
                  )}
                </div>
              </div>
              <span className="font-mono text-[11px] text-whoop-textDim">
                {lotState?.highestBidderFranchiseId ? 'Holding Current Hammer' : 'Base increment active'}
              </span>
            </div>

            {/* Metric 3: Lot Timer */}
            <div
              className={`border rounded-lg p-4 flex flex-col justify-between transition-colors ${
                secondsLeft <= 5 && isLotActive
                  ? 'bg-red-950/30 border-red-800/60'
                  : 'bg-whoop-elevated border-whoop-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-whoop-textMuted uppercase font-bold">
                  COUNTDOWN TELEMETRY
                </span>
                {secondsLeft <= 5 && isLotActive && (
                  <span className="w-2 h-2 rounded-full bg-whoop-strain animate-ping"></span>
                )}
              </div>
              <div className="my-2">
                <span
                  className={`font-mono text-4xl lg:text-5xl font-black tracking-tight ${
                    secondsLeft <= 5 && isLotActive ? 'text-whoop-strain' : 'text-white'
                  }`}
                >
                  {secondsLeft}
                </span>
                <span className="font-mono text-xs text-whoop-textMuted ml-1.5 uppercase">sec</span>
              </div>
              <span className="font-mono text-[11px] text-whoop-textDim">
                Resets to 20s upon valid bid
              </span>
            </div>
          </div>

          {/* Tactical Command Control Suite */}
          <div className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Hammer Primary Action */}
              <button
                type="button"
                onClick={onHammer}
                className="w-full py-4 px-6 bg-whoop-recovery hover:bg-emerald-400 text-whoop-carbon font-mono font-black text-sm uppercase tracking-wider rounded-lg shadow-md transition-all active:translate-y-[1px] flex items-center justify-center space-x-2.5"
              >
                <Gavel className="w-5 h-5" />
                <span>HAMMER: {lotState?.highestBidderFranchiseId ? 'CONFIRM SALE' : 'MARK UNSOLD'}</span>
              </button>

              {/* Skip Secondary Action */}
              <button
                type="button"
                onClick={onSkip}
                className="w-full py-4 px-6 bg-whoop-elevated hover:bg-zinc-800 text-zinc-300 hover:text-white border border-whoop-border font-mono font-bold text-sm uppercase tracking-wider rounded-lg transition-all active:translate-y-[1px] flex items-center justify-center space-x-2.5"
              >
                <SkipForward className="w-4 h-4 text-whoop-telemetry" />
                <span>SKIP PLAYER (RECALL LATER)</span>
              </button>
            </div>
            <p className="font-mono text-[10px] text-whoop-textMuted text-center mt-2.5">
              CONFIRM SALE WRITES AN IMMUTABLE LEDGER RECORD // CAN BE SAFELY REVERSED VIA AUDIT LOG (§12.4)
            </p>
          </div>
        </div>
      ) : (
        /* Purposeful Clean Empty State */
        <div className="py-16 text-center space-y-3 bg-whoop-elevated/40 border border-dashed border-whoop-border rounded-lg">
          <div className="w-12 h-12 rounded-lg bg-whoop-elevated border border-whoop-border flex items-center justify-center mx-auto text-whoop-textMuted">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              NO ACTIVE LOT ON AUCTION FLOOR
            </h3>
            <p className="font-mono text-xs text-whoop-textDim max-w-sm mx-auto">
              Select draw mode below (Guest Mode or Auto Sequential) to load the next player onto the block.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
