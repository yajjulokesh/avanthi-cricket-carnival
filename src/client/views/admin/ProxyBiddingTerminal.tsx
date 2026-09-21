import React, { useState } from 'react';
import { PublicFranchise, LotState } from '../../../core/types.js';
import { calculateNextBid, calculateMaxBid, isBucketEligible } from '../../../core/rules.js';
import { ShieldCheck, ArrowUpRight, AlertTriangle } from 'lucide-react';

interface ProxyBiddingTerminalProps {
  franchises: PublicFranchise[];
  lotState: LotState | null;
  onProxyBid: (franchiseId: string) => void;
}

/**
 * ProxyBiddingTerminal - Floor Proxy Bidding Tool (§16)
 * Built to Whoop telemetry standards:
 * - Direct override fallback when a franchise's phone loses signal or battery
 * - Live purse & slot indicator for each team
 * - Proactively evaluates §12.1 and §12.2 rules before placing proxy bid
 */
export const ProxyBiddingTerminal: React.FC<ProxyBiddingTerminalProps> = ({
  franchises,
  lotState,
  onProxyBid,
}) => {
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>('');

  const isLotActive = lotState?.status === 'ACTIVE';
  const currentPrice = lotState?.currentPrice || 0;
  const nextIncrementPrice = lotState?.highestBidderFranchiseId
    ? calculateNextBid(currentPrice)
    : currentPrice;

  // Selected franchise telemetry
  const selectedFranchise = franchises.find((f) => f.id === selectedFranchiseId);

  let maxPermissibleBid = 0;
  let slotEligibility: { eligible: boolean; reason?: string } = { eligible: true, reason: '' };

  if (selectedFranchise && lotState?.bucket) {
    maxPermissibleBid = calculateMaxBid(
      selectedFranchise.currentPurse,
      selectedFranchise.auctionPurchasesCount,
      selectedFranchise.bucketCounts,
      lotState.bucket
    );
    slotEligibility = isBucketEligible(
      selectedFranchise.auctionPurchasesCount,
      selectedFranchise.bucketCounts,
      lotState.bucket
    );
  }

  const isBlockedByPurse = nextIncrementPrice > maxPermissibleBid;
  const isBlockedBySlot = !slotEligibility.eligible;
  const isSelfOutbid = lotState?.highestBidderFranchiseId === selectedFranchiseId;
  const canPlaceProxy =
    isLotActive &&
    selectedFranchiseId !== '' &&
    !isBlockedByPurse &&
    !isBlockedBySlot &&
    !isSelfOutbid;

  const handleProxySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPlaceProxy) return;
    onProxyBid(selectedFranchiseId);
  };

  return (
    <section className="bg-whoop-surface border border-whoop-border rounded-xl p-5 lg:p-6 shadow-sm space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-whoop-borderMuted pb-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-whoop-highlight" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-whoop-textMuted uppercase font-bold">
            OVERRIDE // FLOOR PROXY BID (§16)
          </span>
        </div>
        <span className="font-mono text-[10px] text-whoop-textMuted uppercase">
          HARDWARE FAILOVER
        </span>
      </div>

      <p className="font-mono text-[11px] text-whoop-textDim leading-relaxed">
        If a franchise table experiences network timeout or hardware failure, the operator registers their shouted bid authoritatively. All §12 invariants remain strictly enforced.
      </p>

      {/* Franchise Selector & Telemetry */}
      <form onSubmit={handleProxySubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-[10px] text-whoop-textMuted uppercase mb-1 font-bold">
            SELECT BIDDING FRANCHISE
          </label>
          <select
            value={selectedFranchiseId}
            onChange={(e) => setSelectedFranchiseId(e.target.value)}
            className="w-full bg-whoop-carbon text-white font-mono text-xs p-3 rounded-lg border border-whoop-border focus:outline-none focus:border-zinc-500 font-medium"
          >
            <option value="">-- Choose calling franchise --</option>
            {franchises.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} (Purse: {f.currentPurse} pts // Buys: {f.auctionPurchasesCount}/15)
              </option>
            ))}
          </select>
        </div>

        {/* Selected Franchise Telemetry Status Card */}
        {selectedFranchise && (
          <div className="bg-whoop-elevated/80 border border-whoop-border rounded-lg p-3.5 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-whoop-borderMuted pb-2">
              <span className="text-white font-bold">{selectedFranchise.name}</span>
              <span className="text-whoop-textMuted text-[10px]">
                {selectedFranchise.auctionPurchasesCount} / 15 SQUAD PURCHASES
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-whoop-textMuted block text-[10px] uppercase">Available Purse</span>
                <span className="text-white font-bold text-sm">{selectedFranchise.currentPurse} pts</span>
              </div>
              <div>
                <span className="text-whoop-textMuted block text-[10px] uppercase">Max Permissible Bid (§12.1)</span>
                <span className="text-whoop-recovery font-bold text-sm">{maxPermissibleBid} pts</span>
              </div>
            </div>

            {/* Violation warnings */}
            {isBlockedBySlot && (
              <div className="p-2 rounded bg-red-950/40 border border-red-900/50 text-red-400 text-[10px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>§12.2 INVARIANT: Remaining slots reserved for mandatory bucket quotas!</span>
              </div>
            )}
            {isBlockedByPurse && !isBlockedBySlot && (
              <div className="p-2 rounded bg-amber-950/40 border border-amber-900/50 text-amber-400 text-[10px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>§12.1 INVARIANT: Bid of {nextIncrementPrice} exceeds max permissible {maxPermissibleBid} pts!</span>
              </div>
            )}
            {isSelfOutbid && (
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px]">
                Franchise is already the highest bidder for this lot.
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={!canPlaceProxy}
          className="w-full py-3 px-4 bg-whoop-elevated hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white border border-whoop-border font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:translate-y-[1px] flex items-center justify-center space-x-2"
        >
          <ArrowUpRight className="w-4 h-4 text-whoop-recovery" />
          <span>SUBMIT PROXY BID ({nextIncrementPrice} PTS)</span>
        </button>
      </form>
    </section>
  );
};
