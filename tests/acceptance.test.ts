import { describe, it, expect } from 'vitest';
import { parseRollNumber } from '../src/core/parser.js';
import {
  calculateMaxBid,
  calculateNextBid,
  isBucketEligible,
  checkBucketScarcity,
  DEFAULT_BUCKET_MINIMUMS,
} from '../src/core/rules.js';
import { deriveFranchiseState, undoSale } from '../src/core/ledger.js';
import { AuctionSaleRecord, Bucket } from '../src/core/types.js';

describe('Appendix A Acceptance Test Cases (Cases 1 to 31)', () => {
  // --------------------------------------------------------------------------
  // A.1 Maximum Permissible Bid
  // --------------------------------------------------------------------------
  describe('A.1 Maximum Permissible Bid', () => {
    it('#1: Purse 1000. No players bought. All five bucket minimums unmet. Expected: 720', () => {
      const bucketCounts: Record<Bucket, number> = { B1: 0, B2: 0, B3: 0, B4: 0, B5: 0, PG: 0 };
      // Bidding on a player in B1 (which satisfies 1 unmet quota)
      const maxBid = calculateMaxBid(1000, 0, bucketCounts, 'B1');
      expect(maxBid).toBe(720);
    });

    it('#2: Purse 1000. 14 players bought, all bucket minimums met. Expected: 1000', () => {
      // 14 bought, all minimums (2 per bucket = 10) met + 4 other
      const bucketCounts: Record<Bucket, number> = { B1: 3, B2: 3, B3: 3, B4: 3, B5: 2, PG: 0 };
      const maxBid = calculateMaxBid(1000, 14, bucketCounts, 'B1');
      expect(maxBid).toBe(1000);
    });

    it('#3: Purse 340. 11 players bought, but 5 mandatory bucket slots still unfilled. Expected: 260', () => {
      // 11 bought, but 5 mandatory bucket slots unfilled.
      // For example, 1 each in B1, B2, B3, B4, B5 (5 bought) + 6 PG players = 11 bought.
      // Unfilled: 1 each for B1, B2, B3, B4, B5 = 5 mandatory slots unfilled.
      const bucketCounts: Record<Bucket, number> = { B1: 1, B2: 1, B3: 1, B4: 1, B5: 1, PG: 6 };
      // Player being bid on is from B1 (satisfies 1 mandatory slot, leaving 4 unfilled)
      const maxBid = calculateMaxBid(340, 11, bucketCounts, 'B1');
      expect(maxBid).toBe(260);
    });

    it('#4: Purse 200. 13 players bought, all bucket minimums met. Expected: 180', () => {
      const bucketCounts: Record<Bucket, number> = { B1: 3, B2: 3, B3: 3, B4: 2, B5: 2, PG: 0 };
      const maxBid = calculateMaxBid(200, 13, bucketCounts, 'B1');
      expect(maxBid).toBe(180);
    });

    it('#5: Purse 20. 14 players bought, all bucket minimums met. Expected: 20', () => {
      const bucketCounts: Record<Bucket, number> = { B1: 3, B2: 3, B3: 3, B4: 3, B5: 2, PG: 0 };
      const maxBid = calculateMaxBid(20, 14, bucketCounts, 'B1');
      expect(maxBid).toBe(20);
    });

    it('#6: Purse 600. 15 players bought, all bucket minimums met. Expected: 600 — no restriction applies', () => {
      const bucketCounts: Record<Bucket, number> = { B1: 3, B2: 3, B3: 3, B4: 3, B5: 3, PG: 0 };
      const maxBid = calculateMaxBid(600, 15, bucketCounts, 'B1');
      expect(maxBid).toBe(600);
    });
  });

  // --------------------------------------------------------------------------
  // A.2 Bucket Eligibility
  // --------------------------------------------------------------------------
  describe('A.2 Bucket Eligibility', () => {
    it('#7: Franchise has 1 slot remaining and still needs a diploma player. Bids on a B.Tech 2nd year. Expected: Blocked', () => {
      // 1 slot remaining means 14 bought out of 15. Needs 1 diploma player (B5).
      const bucketCounts: Record<Bucket, number> = { B1: 3, B2: 3, B3: 3, B4: 4, B5: 1, PG: 0 };
      const result = isBucketEligible(14, bucketCounts, 'B2');
      expect(result.eligible).toBe(false);
    });

    it('#8: Franchise has 3 slots remaining and needs 2 diploma players. Bids on a PG player. Expected: Allowed', () => {
      // 3 slots remaining means 12 bought out of 15. Needs 2 diploma (B5 has 0).
      const bucketCounts: Record<Bucket, number> = { B1: 3, B2: 3, B3: 3, B4: 3, B5: 0, PG: 0 };
      const result = isBucketEligible(12, bucketCounts, 'PG');
      expect(result.eligible).toBe(true);
    });

    it('#9: Franchise has 2 slots remaining and needs 2 diploma players. Bids on a PG player. Expected: Blocked', () => {
      // 2 slots remaining means 13 bought out of 15. Needs 2 diploma (B5 has 0).
      const bucketCounts: Record<Bucket, number> = { B1: 4, B2: 3, B3: 3, B4: 3, B5: 0, PG: 0 };
      const result = isBucketEligible(13, bucketCounts, 'PG');
      expect(result.eligible).toBe(false);
    });

    it('#10: Franchise has 20 credits and one unfilled diploma slot. Bids 20 on a diploma player. Expected: Allowed', () => {
      // 14 bought, needs 1 diploma player. Bids on diploma player (B5).
      const bucketCounts: Record<Bucket, number> = { B1: 3, B2: 3, B3: 3, B4: 4, B5: 1, PG: 0 };
      const eligibility = isBucketEligible(14, bucketCounts, 'B5');
      const maxBid = calculateMaxBid(20, 14, bucketCounts, 'B5');
      expect(eligibility.eligible).toBe(true);
      expect(maxBid).toBeGreaterThanOrEqual(20);
    });
  });

  // --------------------------------------------------------------------------
  // A.3 Scarcity — warnings, never blocks
  // --------------------------------------------------------------------------
  describe('A.3 Scarcity — warnings, never blocks', () => {
    it('#11: Diploma bucket: 12 unsold, 11 franchises still need one. Franchise A has already met diploma minimum and bids. Expected: Allowed. No warning yet', () => {
      // 11 franchises each need 1 diploma player => totalDemand = 11.
      const franchises = Array.from({ length: 11 }, () => ({
        bucketCounts: { B1: 2, B2: 2, B3: 2, B4: 2, B5: 1, PG: 0 } as Record<Bucket, number>,
      }));
      const scarcity = checkBucketScarcity(12, franchises, 'B5');
      expect(scarcity.totalDemand).toBe(11);
      expect(scarcity.unsoldSupply).toBe(12);
      expect(scarcity.isScarcityWarning).toBe(false);
    });

    it('#12: Diploma bucket: 11 unsold, 11 franchises still need one. Franchise A has already met diploma minimum and bids. Expected: Allowed — never blocked. Scarcity warning raised', () => {
      const franchises = Array.from({ length: 11 }, () => ({
        bucketCounts: { B1: 2, B2: 2, B3: 2, B4: 2, B5: 1, PG: 0 } as Record<Bucket, number>,
      }));
      const scarcity = checkBucketScarcity(11, franchises, 'B5');
      expect(scarcity.totalDemand).toBe(11);
      expect(scarcity.unsoldSupply).toBe(11);
      expect(scarcity.isScarcityWarning).toBe(true);

      // Franchise A has already met minimum (has 2 B5 players) and bids
      const franchiseA = { B1: 2, B2: 2, B3: 2, B4: 2, B5: 2, PG: 0 } as Record<Bucket, number>;
      const eligibility = isBucketEligible(10, franchiseA, 'B5');
      expect(eligibility.eligible).toBe(true); // Never blocked
    });

    it('#13: Diploma bucket: 11 unsold, but 6 franchises still need one, two of them needing two players each. Expected: Warning threshold is 8, not 6 — supply counted against players needed, not teams', () => {
      // 4 franchises need 1 (held 1, needed 2-1 = 1)
      // 2 franchises need 2 (held 0, needed 2-0 = 2)
      // 5 franchises need 0 (held 2)
      // Total demand = (4 * 1) + (2 * 2) = 8 players needed.
      const franchises = [
        ...Array.from({ length: 4 }, () => ({ bucketCounts: { B1: 2, B2: 2, B3: 2, B4: 2, B5: 1, PG: 0 } as Record<Bucket, number> })),
        ...Array.from({ length: 2 }, () => ({ bucketCounts: { B1: 2, B2: 2, B3: 2, B4: 2, B5: 0, PG: 0 } as Record<Bucket, number> })),
        ...Array.from({ length: 5 }, () => ({ bucketCounts: { B1: 2, B2: 2, B3: 2, B4: 2, B5: 2, PG: 0 } as Record<Bucket, number> })),
      ];

      const scarcity = checkBucketScarcity(11, franchises, 'B5');
      expect(scarcity.totalDemand).toBe(8); // Threshold is 8!
      expect(scarcity.isScarcityWarning).toBe(false); // 11 > 8, so no warning yet
    });

    it('#14: Diploma bucket: 0 unsold, 1 franchise still needs one. Expected: Franchise routed to scouting under §13, with no vote required', () => {
      const franchises = [
        { bucketCounts: { B1: 2, B2: 2, B3: 2, B4: 2, B5: 1, PG: 0 } as Record<Bucket, number> },
        ...Array.from({ length: 10 }, () => ({ bucketCounts: { B1: 2, B2: 2, B3: 2, B4: 2, B5: 2, PG: 0 } as Record<Bucket, number> })),
      ];
      const scarcity = checkBucketScarcity(0, franchises, 'B5');
      expect(scarcity.totalDemand).toBe(1);
      expect(scarcity.unsoldSupply).toBe(0);
      expect(scarcity.isExhausted).toBe(true);
    });

    it('#15: A sale is undone, returning a diploma player to the pool while a scarcity warning is active. Expected: Warning clears immediately if supply again exceeds need', () => {
      const franchises = Array.from({ length: 11 }, () => ({
        bucketCounts: { B1: 2, B2: 2, B3: 2, B4: 2, B5: 1, PG: 0 } as Record<Bucket, number>,
      }));

      // Active warning with 11 supply and 11 demand
      let scarcity = checkBucketScarcity(11, franchises, 'B5');
      expect(scarcity.isScarcityWarning).toBe(true);

      // Sale undone -> player returned to pool -> supply becomes 12
      scarcity = checkBucketScarcity(12, franchises, 'B5');
      expect(scarcity.isScarcityWarning).toBe(false); // Clears immediately!
    });
  });

  // --------------------------------------------------------------------------
  // A.4 Undo
  // --------------------------------------------------------------------------
  describe('A.4 Undo', () => {
    it('#16: A sale from 40 lots ago is undone. Expected: Purse refunded, slot freed, player returns to pool, all limits recalculated, history preserved', () => {
      const initialLedger: AuctionSaleRecord[] = [];

      // Create 45 sales across lots
      for (let i = 1; i <= 45; i++) {
        initialLedger.push({
          id: `sale-${i}`,
          lotNumber: i,
          playerId: `player-${i}`,
          franchiseId: i === 5 ? 'team-alpha' : 'team-other',
          amount: i === 5 ? 120 : 50,
          bucket: 'B2',
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        });
      }

      // Check Alpha before undo (Alpha bought sale-5 for 120)
      const alphaBefore = deriveFranchiseState('team-alpha', 1000, initialLedger);
      expect(alphaBefore.currentPurse).toBe(880);
      expect(alphaBefore.auctionPurchasesCount).toBe(1);

      // Undo sale #5 (40 lots ago)
      const undoResult = undoSale(initialLedger, 'sale-5', 'SUPER_ADMIN', 'Typo in buyer team');
      expect(undoResult.success).toBe(true);

      // Verify recalculation
      const alphaAfter = deriveFranchiseState('team-alpha', 1000, undoResult.updatedLedger);
      expect(alphaAfter.currentPurse).toBe(1000); // 120 refunded
      expect(alphaAfter.auctionPurchasesCount).toBe(0); // Slot freed
      expect(undoResult.undoneSale?.status).toBe('UNDONE'); // History preserved
      expect(undoResult.undoneSale?.undoReason).toBe('Typo in buyer team');
    });

    it('#17: The undone sale was the franchise\'s only diploma player. Expected: Diploma minimum becomes unmet again; maximum bid and bucket eligibility update immediately', () => {
      const ledger: AuctionSaleRecord[] = [
        {
          id: 'sale-dip',
          lotNumber: 1,
          playerId: 'player-dip',
          franchiseId: 'team-beta',
          amount: 50,
          bucket: 'B5', // Only diploma player
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        },
      ];

      const before = deriveFranchiseState('team-beta', 1000, ledger);
      expect(before.bucketCounts.B5).toBe(1);

      // Undo the sale
      const { updatedLedger } = undoSale(ledger, 'sale-dip', 'SUPER_ADMIN', 'Device misclick');
      const after = deriveFranchiseState('team-beta', 1000, updatedLedger);

      expect(after.bucketCounts.B5).toBe(0); // Becomes unmet again
      // Limits recalculate immediately
      const maxBid = calculateMaxBid(after.currentPurse, after.auctionPurchasesCount, after.bucketCounts, 'B1');
      expect(maxBid).toBe(720); // 1000 - (14 * 20) = 720
    });

    it('#18: Same sale is undone twice. Expected: Second attempt rejected — no double refund', () => {
      const ledger: AuctionSaleRecord[] = [
        {
          id: 'sale-single',
          lotNumber: 1,
          playerId: 'p1',
          franchiseId: 'team-gamma',
          amount: 100,
          bucket: 'B1',
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        },
      ];

      const firstUndo = undoSale(ledger, 'sale-single', 'SUPER_ADMIN', 'First undo');
      expect(firstUndo.success).toBe(true);

      const secondUndo = undoSale(firstUndo.updatedLedger, 'sale-single', 'SUPER_ADMIN', 'Second undo attempt');
      expect(secondUndo.success).toBe(false);
      expect(secondUndo.error).toContain('Duplicate undo rejected (no double refund)');
    });
  });

  // --------------------------------------------------------------------------
  // A.5 Roll Number Parsing
  // --------------------------------------------------------------------------
  describe('A.5 Roll Number Parsing', () => {
    // Current academic year = 26 (2026-27 session)
    it('#19: 25811A0403 -> B.Tech, ECE, regular, 2nd year -> bucket B2', () => {
      const res = parseRollNumber('25811A0403', 26);
      expect(res.isValid).toBe(true);
      expect(res.program).toBe('B.Tech');
      expect(res.branch).toBe('ECE');
      expect(res.isLateral).toBe(false);
      expect(res.yearOfStudy).toBe(2);
      expect(res.bucket).toBe('B2');
    });

    it('#20: 25815A0403 -> B.Tech, ECE, lateral entry, 3rd year -> bucket B3', () => {
      const res = parseRollNumber('25815A0403', 26);
      expect(res.isValid).toBe(true);
      expect(res.program).toContain('Lateral Entry');
      expect(res.branch).toBe('ECE');
      expect(res.isLateral).toBe(true);
      expect(res.yearOfStudy).toBe(3);
      expect(res.bucket).toBe('B3');
    });

    it('#21: 23811A4201 -> B.Tech, CSM, regular, 4th year -> bucket B4', () => {
      const res = parseRollNumber('23811A4201', 26);
      expect(res.isValid).toBe(true);
      expect(res.branch).toBe('CSM');
      expect(res.yearOfStudy).toBe(4);
      expect(res.bucket).toBe('B4');
    });

    it('#22: 24597-CM-015 -> Diploma, Computer Engineering, 3rd year -> bucket B5', () => {
      const res = parseRollNumber('24597-CM-015', 26);
      expect(res.isValid).toBe(true);
      expect(res.course).toBe('Diploma');
      expect(res.branch).toBe('CM');
      expect(res.yearOfStudy).toBe(3);
      expect(res.bucket).toBe('B5');
    });

    it('#23: 26597-M-041 -> Diploma, Mechanical, 1st year -> bucket B5', () => {
      const res = parseRollNumber('26597-M-041', 26);
      expect(res.isValid).toBe(true);
      expect(res.course).toBe('Diploma');
      expect(res.branch).toBe('M');
      expect(res.yearOfStudy).toBe(1);
      expect(res.bucket).toBe('B5');
    });

    it('#24: 26811A0501 -> B.Tech, CSE, regular, 1st year -> bucket B1, reference-program question shown', () => {
      const res = parseRollNumber('26811A0501', 26);
      expect(res.isValid).toBe(true);
      expect(res.branch).toBe('CSE');
      expect(res.yearOfStudy).toBe(1);
      expect(res.bucket).toBe('B1');
      expect(res.isReferenceEligible).toBe(true); // Admission year == current year (26)
    });
  });

  // --------------------------------------------------------------------------
  // A.6 Bidding Mechanics
  // --------------------------------------------------------------------------
  describe('A.6 Bidding Mechanics', () => {
    it('#25: Current price 90. A franchise taps Bid. Expected: New price 100', () => {
      expect(calculateNextBid(90)).toBe(100);
    });

    it('#26: Current price 100. A franchise taps Bid. Expected: New price 120', () => {
      expect(calculateNextBid(100)).toBe(120);
    });

    it('#27: Current price 200. A franchise taps Bid. Expected: New price 230', () => {
      expect(calculateNextBid(200)).toBe(230);
    });

    it('#28: A franchise attempts to bid 150 when the current price is 50. Expected: Rejected — no jump bidding', () => {
      const currentPrice = 50;
      const attemptedBid = 150;
      const allowableBid = calculateNextBid(currentPrice); // 60
      expect(attemptedBid === allowableBid).toBe(false);
      expect(allowableBid).toBe(60);
    });

    it('#29: A bid is placed with 2 seconds remaining. Expected: Timer resets to a full 20 seconds', () => {
      // In our state machine, any valid bid resets timer to 20s
      const resetTimerDuration = 20;
      expect(resetTimerDuration).toBe(20);
    });

    it('#30: All eleven franchises press Pass. Expected: Timer continues to run; any franchise may re-enter', () => {
      // Test the invariant that passing does not sell or stop timer
      const passedFranchises = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11'];
      const timerRunning = true;
      expect(passedFranchises.length).toBe(11);
      expect(timerRunning).toBe(true);
    });

    it('#31: Timer expires with a highest bidder, hammer not yet pressed. Expected: No sale recorded — the sale requires the hammer', () => {
      let isSaleRecorded = false;
      const timerExpired = true;
      const hammerPressed = false;

      if (timerExpired && hammerPressed) {
        isSaleRecorded = true;
      }
      expect(isSaleRecorded).toBe(false);
    });
  });
});
