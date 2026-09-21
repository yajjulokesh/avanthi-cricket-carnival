import { Bucket, Franchise } from './types.js';

export const DEFAULT_BUCKET_MINIMUMS: Record<Bucket, number> = {
  B1: 2,
  B2: 2,
  B3: 2,
  B4: 2,
  B5: 2,
  PG: 0,
};

export const MIN_PURCHASE_PRICE = 20;
export const MANDATORY_AUCTION_PURCHASES = 15;
export const MAX_SQUAD_SIZE = 22;

/**
 * Calculates the next allowable bid price based on the strict increment ladder (§11, Appendix A.6)
 * - +10 below 100
 * - +20 from 100 to 199
 * - +30 at 200 and above
 */
export function calculateNextBid(currentPrice: number): number {
  if (currentPrice < 100) {
    return currentPrice + 10;
  }
  if (currentPrice < 200) {
    return currentPrice + 20;
  }
  return currentPrice + 30;
}

/**
 * Problem 1 (§12.1): Calculates the Maximum Permissible Bid for a franchise on a player.
 * A franchise must be structurally incapable of spending itself into an incomplete squad.
 *
 * @param purse Current available credits
 * @param boughtCount Total auction purchases made so far
 * @param bucketCounts Map of player counts per bucket currently held
 * @param targetBucket The bucket of the player being bid on
 * @param bucketMinimums Current required counts per bucket (default 2 each)
 */
export function calculateMaxBid(
  purse: number,
  boughtCount: number,
  bucketCounts: Record<Bucket, number>,
  targetBucket: Bucket,
  bucketMinimums: Record<Bucket, number> = DEFAULT_BUCKET_MINIMUMS
): number {
  // If franchise has already met mandatory 15 purchases and all bucket quotas,
  // they can spend their entire remaining purse on additional players (up to max squad 22).
  const isTargetMandatoryBucket = targetBucket !== 'PG';
  const targetCurrentCount = bucketCounts[targetBucket] || 0;
  const targetRequiredCount = bucketMinimums[targetBucket] || 0;

  // Simulate buying this player
  const simulatedBoughtCount = boughtCount + 1;

  // Calculate remaining unfilled mandatory bucket quotas after winning this player
  let remainingMandatorySlots = 0;
  const buckets: Bucket[] = ['B1', 'B2', 'B3', 'B4', 'B5'];

  for (const b of buckets) {
    const required = bucketMinimums[b] || 0;
    const current = bucketCounts[b] || 0;
    const countAfterWin = b === targetBucket ? current + 1 : current;
    const unmet = Math.max(0, required - countAfterWin);
    remainingMandatorySlots += unmet;
  }

  // Number of remaining players the franchise MUST still buy to reach 15 purchases
  const slotsRemainingTo15 = Math.max(0, MANDATORY_AUCTION_PURCHASES - simulatedBoughtCount);

  // The actual minimum number of purchases still required
  const remainingPurchasesNeeded = Math.max(slotsRemainingTo15, remainingMandatorySlots);

  // Reserve required at 20 credits per needed player
  const requiredReserve = remainingPurchasesNeeded * MIN_PURCHASE_PRICE;

  const maxBid = purse - requiredReserve;
  return Math.max(0, maxBid);
}

/**
 * Problem 2 (§12.2): Checks if bidding on a player preserves the fillability of mandatory slots.
 * A franchise with 1 slot left needing a diploma player must NOT be allowed to spend that slot on anyone else.
 *
 * @param boughtCount Total auction purchases made so far
 * @param bucketCounts Map of player counts per bucket currently held
 * @param targetBucket The bucket of the player being bid on
 * @param bucketMinimums Current required counts per bucket
 */
export function isBucketEligible(
  boughtCount: number,
  bucketCounts: Record<Bucket, number>,
  targetBucket: Bucket,
  bucketMinimums: Record<Bucket, number> = DEFAULT_BUCKET_MINIMUMS
): { eligible: boolean; reason?: string } {
  // Check if squad is already at max capacity (22 players total)
  if (boughtCount >= MAX_SQUAD_SIZE) {
    return { eligible: false, reason: 'Maximum squad size of 22 reached.' };
  }

  // Calculate remaining mandatory unfilled slots after this prospective purchase
  let simulatedUnfilledMandatory = 0;
  const buckets: Bucket[] = ['B1', 'B2', 'B3', 'B4', 'B5'];

  for (const b of buckets) {
    const required = bucketMinimums[b] || 0;
    const current = bucketCounts[b] || 0;
    const countAfterWin = b === targetBucket ? current + 1 : current;
    const unmet = Math.max(0, required - countAfterWin);
    simulatedUnfilledMandatory += unmet;
  }

  // After this purchase, how many open slots remain until reaching mandatory 15 purchases?
  const remainingSlotsAfterPurchase = MANDATORY_AUCTION_PURCHASES - (boughtCount + 1);

  // If remaining slots to reach 15 is fewer than the mandatory bucket quotas still needed,
  // this purchase would leave an impossible deficit!
  if (remainingSlotsAfterPurchase < simulatedUnfilledMandatory) {
    return {
      eligible: false,
      reason: `Blocked: Purchasing this player leaves only ${remainingSlotsAfterPurchase} slot(s) to 15, but ${simulatedUnfilledMandatory} mandatory bucket slot(s) remain unfilled.`,
    };
  }

  return { eligible: true };
}

/**
 * Problem 3 (§12.3): Calculates scarcity for a bucket.
 * Compares unsold supply against total aggregate demand across all franchises.
 * Raises a warning when unsold supply <= total players still needed.
 * Never blocks a franchise from bidding.
 */
export function checkBucketScarcity(
  unsoldSupply: number,
  franchises: Array<{ bucketCounts: Record<Bucket, number> }>,
  bucket: Bucket,
  bucketMinimums: Record<Bucket, number> = DEFAULT_BUCKET_MINIMUMS
): {
  unsoldSupply: number;
  totalDemand: number;
  isScarcityWarning: boolean;
  isExhausted: boolean;
} {
  const targetMin = bucketMinimums[bucket] || 0;
  if (targetMin === 0) {
    return { unsoldSupply, totalDemand: 0, isScarcityWarning: false, isExhausted: false };
  }

  // Total players needed across ALL franchises
  let totalDemand = 0;
  for (const f of franchises) {
    const held = f.bucketCounts[bucket] || 0;
    const needed = Math.max(0, targetMin - held);
    totalDemand += needed;
  }

  const isScarcityWarning = totalDemand > 0 && unsoldSupply <= totalDemand;
  const isExhausted = unsoldSupply === 0 && totalDemand > 0;

  return {
    unsoldSupply,
    totalDemand,
    isScarcityWarning,
    isExhausted,
  };
}
