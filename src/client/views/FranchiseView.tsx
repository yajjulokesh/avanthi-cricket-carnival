import React, { useState } from 'react';
import { LotState, PublicFranchise } from '../../core/types.js';
import { calculateNextBid, calculateMaxBid, isBucketEligible } from '../../core/rules.js';
import { Smartphone, Trophy, ShieldAlert, CheckCircle2, DollarSign, Users, AlertCircle } from 'lucide-react';

interface FranchiseViewProps {
  lotState: LotState | null;
  franchises: PublicFranchise[];
  secondsLeft: number;
  onPlaceBid: (franchiseId: string, amount?: number) => Promise<{ success: boolean; error?: string; newPrice?: number }>;
  onPassLot: (franchiseId: string) => void;
}

export const FranchiseView: React.FC<FranchiseViewProps> = ({
  lotState,
  franchises,
  secondsLeft,
  onPlaceBid,
  onPassLot,
}) => {
  // Logged-in franchise state
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>('team-1');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [isAuth, setIsAuth] = useState<boolean>(true); // Pre-selected for demo ease
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const franchise = franchises.find((f) => f.id === selectedFranchiseId);

  // Calculate Next Allowable Increment
  const currentPrice = lotState?.currentPrice || 0;
  const nextBid = lotState?.highestBidderFranchiseId ? calculateNextBid(currentPrice) : currentPrice;

  // Real-time calculations of §12.1 and §12.2 for this franchise
  let maxBid = 1000;
  let slotEligibility: { eligible: boolean; reason?: string } = { eligible: true, reason: '' };

  if (franchise && lotState?.bucket) {
    maxBid = calculateMaxBid(
      franchise.currentPurse,
      franchise.auctionPurchasesCount,
      franchise.bucketCounts,
      lotState.bucket
    );
    slotEligibility = isBucketEligible(
      franchise.auctionPurchasesCount,
      franchise.bucketCounts,
      lotState.bucket
    );
  }

  const isLeading = lotState?.highestBidderFranchiseId === selectedFranchiseId;
  const isPassed = lotState?.passedFranchiseIds?.includes(selectedFranchiseId);
  const isBlockedBySlot = !slotEligibility.eligible;
  const isBlockedByPurse = nextBid > maxBid;
  const isBlocked = isBlockedBySlot || isBlockedByPurse;

  const handleBid = async () => {
    if (isBlocked || isLeading || !lotState?.player || lotState.status !== 'ACTIVE') return;

    setIsSubmitting(true);
    setFeedbackError(null);
    try {
      const res = await onPlaceBid(selectedFranchiseId, nextBid);
      if (!res.success) {
        setFeedbackError(res.error || 'Bid rejected by server.');
      }
    } catch (e: any) {
      setFeedbackError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePass = () => {
    onPassLot(selectedFranchiseId);
  };

  const handlePhoneLogin = async () => {
    if (!phoneInput) return;
    try {
      const res = await fetch('/api/auth/franchise-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phoneInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackError(data.error);
      } else {
        setSelectedFranchiseId(data.franchiseId);
        setIsAuth(true);
        setFeedbackError(null);
      }
    } catch (e: any) {
      setFeedbackError(e.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 select-none pb-20">
      {/* Franchise Switcher Bar (For Demo & Multi-Captain Phone Testing) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono text-slate-400">Team Device:</span>
        </div>
        <select
          value={selectedFranchiseId}
          onChange={(e) => {
            setSelectedFranchiseId(e.target.value);
            setFeedbackError(null);
          }}
          className="bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-semibold"
        >
          {franchises.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.currentPurse} pts)
            </option>
          ))}
        </select>
      </div>

      {/* Franchise Status Overview Cards */}
      {franchise && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Available Purse</div>
            <div className="text-lg font-black text-amber-400 font-mono">{franchise.currentPurse}</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Auction Buys</div>
            <div className="text-lg font-black text-white font-mono">{franchise.auctionPurchasesCount} / 15</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Max Bid (§12.1)</div>
            <div className="text-lg font-black text-emerald-400 font-mono">{maxBid}</div>
          </div>
        </div>
      )}

      {/* Active Lot Bidding Pad */}
      {lotState?.player && lotState.status === 'ACTIVE' ? (
        <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
          {/* Top Lot Info */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-chakra font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300">
              LOT #{lotState.lotNumber} • {lotState.bucket}
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
              ⏳ {secondsLeft}s
            </span>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-black font-chakra text-white tracking-wide">{lotState.player.name}</h3>
            <p className="text-xs text-slate-400 font-mono">
              {lotState.player.program} • {lotState.player.branch} • {lotState.player.derivedType}
            </p>
          </div>

          {/* Current Live Bid Display */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-center">
            <div className="text-[11px] font-mono text-slate-400">Current Highest Bid</div>
            <div className="text-4xl font-black text-amber-400 font-mono my-1">
              {currentPrice} <span className="text-sm text-slate-500">pts</span>
            </div>
            <div className="text-xs font-semibold text-slate-300">
              {lotState.highestBidderFranchiseName ? (
                <span className={isLeading ? 'text-emerald-400' : 'text-slate-300'}>
                  {isLeading ? '🔥 YOU ARE LEADING' : `Leading: ${lotState.highestBidderFranchiseName}`}
                </span>
              ) : (
                'Opening at Base Price'
              )}
            </div>
          </div>

          {/* Blocked / Error Alerts */}
          {feedbackError && (
            <div className="p-3 bg-rose-950/40 border border-rose-600 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{feedbackError}</span>
            </div>
          )}

          {isBlockedBySlot && (
            <div className="p-3 bg-rose-950/40 border border-rose-600 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                <strong>§12.2 Block:</strong> Must reserve remaining slots for unfilled mandatory bucket quotas!
              </span>
            </div>
          )}

          {isBlockedByPurse && !isBlockedBySlot && (
            <div className="p-3 bg-amber-950/40 border border-amber-600 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>§12.1 Block:</strong> Bid of {nextBid} exceeds Max Permissible Bid of {maxBid} (must retain 20 pts per remaining slot).
              </span>
            </div>
          )}

          {/* Primary Action Button: 1-Tap Rapid Bid */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleBid}
              disabled={isBlocked || isLeading || isSubmitting}
              className={`w-full py-5 rounded-2xl font-black text-xl font-chakra tracking-wide shadow-xl transition-all flex flex-col items-center justify-center ${
                isLeading
                  ? 'bg-emerald-600 text-white cursor-default'
                  : isBlocked
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 active:scale-[0.98] shadow-amber-500/20'
              }`}
            >
              {isLeading ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>YOU ARE CURRENTLY LEADING</span>
                  </div>
                  <span className="text-xs font-mono font-normal opacity-80">Waiting for other bids or hammer</span>
                </>
              ) : isBlocked ? (
                <>
                  <span>BID BLOCKED</span>
                  <span className="text-xs font-mono font-normal opacity-80">Cannot legally place this bid</span>
                </>
              ) : (
                <>
                  <span>BID {nextBid} PTS</span>
                  <span className="text-xs font-mono font-bold opacity-80">
                    (+{nextBid - currentPrice} Increment)
                  </span>
                </>
              )}
            </button>

            {/* Pass / Re-enter Toggle (§11: Pass is reversible at any time before hammer) */}
            <button
              onClick={handleTogglePass}
              className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono transition-colors ${
                isPassed
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            >
              {isPassed ? '↩️ PASSED (TAP TO RE-ENTER BIDDING)' : '🏳️ PASS LOT'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-mono text-xs">
          <p>No active lot. Stand by for the auctioneer to draw next player.</p>
        </div>
      )}

      {/* Bucket Quota Checklist */}
      {franchise && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="text-xs font-chakra font-bold text-slate-300 uppercase">
            Mandatory Bucket Quotas (At least 2 each)
          </div>
          <div className="grid grid-cols-5 gap-1 text-center font-mono text-xs">
            {(['B1', 'B2', 'B3', 'B4', 'B5'] as const).map((b) => {
              const count = franchise.bucketCounts[b] || 0;
              const isMet = count >= 2;
              return (
                <div
                  key={b}
                  className={`p-2 rounded-lg border ${
                    isMet ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold">{b}</div>
                  <div className="text-[11px] mt-0.5">{count} / 2</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
