import React, { useState, useEffect } from 'react';
import { LotState, PublicFranchise } from '../../core/types.js';
import { calculateMaxBid, calculateNextBid, isBucketEligible } from '../../core/rules.js';
import { Smartphone, AlertCircle, ShieldAlert, CheckCircle2, ChevronRight, Lock } from 'lucide-react';

interface FranchiseViewProps {
  lotState: LotState | null;
  franchises: PublicFranchise[];
  onPlaceBid: (franchiseId: string, amount?: number) => Promise<{ success: boolean; error?: string }>;
  onPassLot: (franchiseId: string) => void;
  secondsLeft: number;
}

export const FranchiseView: React.FC<FranchiseViewProps> = ({
  lotState,
  franchises,
  onPlaceBid,
  onPassLot,
  secondsLeft,
}) => {
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>(() => {
    return localStorage.getItem('acc_selected_franchise') || (franchises[0]?.id ?? '');
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFranchiseId) {
      localStorage.setItem('acc_selected_franchise', selectedFranchiseId);
    }
  }, [selectedFranchiseId]);

  const franchise = franchises.find((f) => f.id === selectedFranchiseId);
  const currentPrice = lotState?.currentPrice || 0;
  const nextBid = calculateNextBid(currentPrice);

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
      const res = await onPlaceBid(selectedFranchiseId);
      if (!res.success) {
        setFeedbackError(res.error || 'Bid rejected by server');
      }
    } catch (e: any) {
      setFeedbackError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePass = () => {
    if (!lotState?.player || lotState.status !== 'ACTIVE') return;
    onPassLot(selectedFranchiseId);
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 select-none pb-20 bg-spengle-carbon text-spengle-titanium min-h-screen">
      {/* Franchise Switcher Bar: Swiss Telemetry Hardware Selector */}
      <div className="spengle-box p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-3.5 h-3.5 text-spengle-gold" />
          <span className="text-[10px] font-mono tracking-widest-tech uppercase text-spengle-muted">
            DEVICE ASSIGNMENT:
          </span>
        </div>
        <select
          value={selectedFranchiseId}
          onChange={(e) => {
            setSelectedFranchiseId(e.target.value);
            setFeedbackError(null);
          }}
          className="bg-spengle-surface text-spengle-titanium text-xs px-2.5 py-1 border border-spengle-border font-mono font-bold uppercase outline-none focus:border-spengle-gold"
        >
          {franchises.map((f) => (
            <option key={f.id} value={f.id} className="bg-spengle-carbon">
              {f.name} ({f.currentPurse} PTS)
            </option>
          ))}
        </select>
      </div>

      {/* Franchise Status Overview Cards: Machined Gauges */}
      {franchise && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-spengle-chassis border border-spengle-border p-3 text-center">
            <div className="text-[9px] text-spengle-dim font-mono tracking-widest uppercase">AVAILABLE PURSE</div>
            <div className="text-xl font-black text-spengle-gold font-mono mt-0.5">{franchise.currentPurse}</div>
          </div>
          <div className="bg-spengle-chassis border border-spengle-border p-3 text-center">
            <div className="text-[9px] text-spengle-dim font-mono tracking-widest uppercase">AUCTION BUYS</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{franchise.auctionPurchasesCount} / 15</div>
          </div>
          <div className="bg-spengle-chassis border border-spengle-border p-3 text-center">
            <div className="text-[9px] text-spengle-dim font-mono tracking-widest uppercase">MAX BID (§12.1)</div>
            <div className="text-xl font-black text-spengle-emerald font-mono mt-0.5">{maxBid}</div>
          </div>
        </div>
      )}

      {/* Active Lot Bidding Pad */}
      {lotState?.player && lotState.status === 'ACTIVE' ? (
        <div className="spengle-box border-2 border-spengle-border p-5 shadow-2xl space-y-4 relative overflow-hidden">
          {/* Top Lot Header */}
          <div className="flex items-center justify-between border-b border-spengle-border pb-3">
            <span className="text-[10px] font-mono tracking-widest-tech uppercase px-2 py-0.5 bg-spengle-surface border border-spengle-border text-spengle-gold">
              LOT #{lotState.lotNumber} • {lotState.bucket}
            </span>
            <span className={`text-xs font-mono font-bold flex items-center gap-1 ${secondsLeft <= 5 ? 'text-spengle-crimson animate-pulse-fast' : 'text-spengle-gold'}`}>
              CHRONO: 00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
            </span>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">{lotState.player.name}</h3>
            <p className="text-xs text-spengle-muted font-mono tracking-wider">
              {lotState.player.program} • {lotState.player.branch} • {lotState.player.derivedType}
            </p>
          </div>

          {/* Current Live Bid Monolith */}
          <div className="bg-spengle-surface p-4 border border-spengle-border text-center">
            <div className="text-[10px] font-mono tracking-widest-tech uppercase text-spengle-dim">
              CURRENT HIGHEST BID
            </div>
            <div className="text-4xl font-black text-spengle-gold font-mono my-1 tracking-tight">
              {currentPrice} <span className="text-sm font-normal text-spengle-muted">PTS</span>
            </div>
            <div className="text-xs font-mono font-semibold uppercase tracking-wider">
              {lotState.highestBidderFranchiseName ? (
                <span className={isLeading ? 'text-spengle-emerald font-bold' : 'text-spengle-muted'}>
                  {isLeading ? '✓ LEADING WITH YOUR FRANCHISE' : `LEADING: ${lotState.highestBidderFranchiseName}`}
                </span>
              ) : (
                <span className="text-spengle-dim">OPENING AT BASE PRICE</span>
              )}
            </div>
          </div>

          {/* Rule Enforcement Alerts */}
          {feedbackError && (
            <div className="p-3 bg-spengle-surface border border-spengle-crimson text-xs text-spengle-crimson flex items-start gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{feedbackError}</span>
            </div>
          )}

          {isBlockedBySlot && (
            <div className="p-3 bg-spengle-surface border border-spengle-crimson text-xs text-spengle-crimson flex items-start gap-2 font-mono">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>§12.2 BLOCK:</strong> Mandatory bucket quotas require reserving remaining purchase slots!
              </span>
            </div>
          )}

          {isBlockedByPurse && !isBlockedBySlot && (
            <div className="p-3 bg-spengle-surface border border-spengle-gold/60 text-xs text-spengle-gold flex items-start gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>§12.1 BLOCK:</strong> Bid of {nextBid} exceeds Max Bid of {maxBid} (must preserve 20 pts per remaining slot).
              </span>
            </div>
          )}

          {/* Primary Action Button: Spengle Tactile Bidding Trigger */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleBid}
              disabled={isBlocked || isLeading || isSubmitting}
              className={`w-full py-4 font-mono font-black text-lg uppercase tracking-wider transition-all flex flex-col items-center justify-center border ${
                isLeading
                  ? 'bg-spengle-surface border-spengle-emerald text-spengle-emerald cursor-default shadow-sm'
                  : isBlocked
                  ? 'bg-spengle-surface border-spengle-border text-spengle-dim cursor-not-allowed opacity-50'
                  : 'bg-spengle-gold hover:bg-spengle-goldHover text-spengle-carbon active:scale-[0.99] border-spengle-goldLight'
              }`}
            >
              {isLeading ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>CURRENTLY LEADING LOT</span>
                  </div>
                  <span className="text-[10px] font-normal text-spengle-emerald/80 tracking-widest mt-0.5">
                    AWAITING COUNTER-BID OR HAMMER
                  </span>
                </>
              ) : isBlocked ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>BID BLOCKED BY RULE</span>
                  </div>
                  <span className="text-[10px] font-normal text-spengle-dim tracking-widest mt-0.5">
                    INELIGIBLE PURSE OR SLOTS
                  </span>
                </>
              ) : (
                <>
                  <span>RAISE BID TO {nextBid} PTS</span>
                  <span className="text-[10px] font-bold text-spengle-carbon/80 tracking-widest mt-0.5">
                    (+{nextBid - currentPrice} PTS STEP INCREMENT)
                  </span>
                </>
              )}
            </button>

            {/* Pass / Re-enter Toggle (§11) */}
            <button
              onClick={handleTogglePass}
              className={`w-full py-2.5 text-xs font-mono font-bold tracking-widest uppercase transition-colors border ${
                isPassed
                  ? 'bg-spengle-surface border-spengle-gold text-spengle-gold'
                  : 'bg-spengle-surface hover:bg-spengle-chassis border-spengle-border text-spengle-muted'
              }`}
            >
              {isPassed ? '↩ PASSED (TAP TO RE-ENTER BIDDING)' : 'PASS LOT (VOLUNTARY)'}
            </button>
          </div>
        </div>
      ) : (
        <div className="spengle-box p-8 text-center text-spengle-muted font-mono text-xs tracking-wider uppercase">
          <p>NO ACTIVE LOT ON THE BLOCK. STAND BY FOR AUCTIONEER DRAW.</p>
        </div>
      )}

      {/* Bucket Quota Checklist: Swiss Telemetry Matrix */}
      {franchise && (
        <div className="spengle-box p-4 space-y-2">
          <div className="text-[10px] font-mono tracking-widest-tech uppercase text-spengle-muted border-b border-spengle-border pb-1.5">
            MANDATORY BUCKET QUOTAS (MINIMUM 2 PER BUCKET)
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-xs">
            {(['B1', 'B2', 'B3', 'B4', 'B5'] as const).map((b) => {
              const count = franchise.bucketCounts[b] || 0;
              const isMet = count >= 2;
              return (
                <div
                  key={b}
                  className={`p-2 border ${
                    isMet
                      ? 'bg-spengle-surface border-spengle-emerald text-spengle-emerald'
                      : 'bg-spengle-surface border-spengle-border text-spengle-muted'
                  }`}
                >
                  <div className="font-bold text-[11px]">{b}</div>
                  <div className="text-[10px] mt-0.5">{count} / 2</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
