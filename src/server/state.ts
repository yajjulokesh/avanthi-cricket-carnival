import {
  Bucket,
  LotState,
  Player,
  PublicPlayer,
  Franchise,
  AuctionSaleRecord,
  ScarcityStatus,
  AuditLogEntry,
} from '../core/types.js';
import {
  calculateMaxBid,
  calculateNextBid,
  isBucketEligible,
  checkBucketScarcity,
  DEFAULT_BUCKET_MINIMUMS,
} from '../core/rules.js';
import { deriveFranchiseState, undoSale } from '../core/ledger.js';
import { sanitizePlayerForPublic } from './serializers.js';
import { db } from './db.js';

export const BUCKET_DRAW_SEQUENCE: Bucket[] = ['B3', 'B4', 'B2', 'B5', 'B1', 'PG'];

export class AuctionEngine {
  private currentLot: LotState;
  private timerInterval: NodeJS.Timeout | null = null;
  private onStateChange: ((state: LotState) => void) | null = null;
  private onScarcityChange: ((scarcities: ScarcityStatus[]) => void) | null = null;
  private onSaleFinalized: ((sale: AuctionSaleRecord) => void) | null = null;
  private onPlayerStatusChange: ((player: PublicPlayer) => void) | null = null;

  // Skipped players bucket queues
  private skippedPlayersBucketQueue: Record<Bucket, Player[]> = {
    B1: [],
    B2: [],
    B3: [],
    B4: [],
    B5: [],
    PG: [],
  };

  constructor() {
    this.currentLot = {
      lotNumber: 0,
      player: null,
      currentPrice: 0,
      highestBidderFranchiseId: null,
      highestBidderFranchiseName: null,
      timerSecondsRemaining: 30,
      timerEndsAt: null,
      status: 'IDLE',
      inPlayFranchiseIds: [],
      passedFranchiseIds: [],
      blockedFranchiseIds: [],
      bucket: null,
      drawMode: 'AUTO',
      round: 1,
    };
  }

  public registerListeners(listeners: {
    onStateChange: (state: LotState) => void;
    onScarcityChange: (scarcities: ScarcityStatus[]) => void;
    onSaleFinalized: (sale: AuctionSaleRecord) => void;
    onPlayerStatusChange: (player: PublicPlayer) => void;
  }) {
    this.onStateChange = listeners.onStateChange;
    this.onScarcityChange = listeners.onScarcityChange;
    this.onSaleFinalized = listeners.onSaleFinalized;
    this.onPlayerStatusChange = listeners.onPlayerStatusChange;
  }

  public getLotState(): LotState {
    return { ...this.currentLot };
  }

  public setDrawMode(mode: 'GUEST' | 'AUTO', actor: string) {
    this.currentLot.drawMode = mode;
    this.logAudit(actor, 'SET_DRAW_MODE', { mode });
    this.broadcastState();
  }

  /**
   * Loads all active sales from DB ledger
   */
  public getAllSales(): AuctionSaleRecord[] {
    const rows = db.prepare('SELECT * FROM auction_sales ORDER BY created_at ASC').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      lotNumber: r.lot_number,
      playerId: r.player_id,
      franchiseId: r.franchise_id,
      amount: r.amount,
      bucket: r.bucket as Bucket,
      status: r.status as 'CONFIRMED' | 'UNDONE',
      undoneAt: r.undone_at,
      undoneBy: r.undone_by,
      undoReason: r.undo_reason,
      createdAt: r.created_at,
    }));
  }

  /**
   * Gets current bucket minimums from DB
   */
  public getBucketMinimums(): Record<Bucket, number> {
    const rows = db.prepare('SELECT * FROM bucket_minimums').all() as { bucket: Bucket; minimum_required: number }[];
    const map = { ...DEFAULT_BUCKET_MINIMUMS };
    for (const r of rows) {
      map[r.bucket] = r.minimum_required;
    }
    return map;
  }

  /**
   * Sets uniform bucket minimum for all 11 teams (§7 & §13)
   */
  public relaxBucketMinimum(bucket: Bucket, newMinimum: number, actor: string) {
    db.prepare('UPDATE bucket_minimums SET minimum_required = ? WHERE bucket = ?').run(newMinimum, bucket);
    this.logAudit(actor, 'RELAX_BUCKET_MINIMUM', { bucket, newMinimum });
    this.refreshAllFranchiseEligibility();
    this.checkAndBroadcastScarcity();
  }

  /**
   * Derives franchise states directly from ledger
   */
  public getFranchises(): Franchise[] {
    const franchiseRows = db.prepare('SELECT * FROM franchises ORDER BY name ASC').all() as any[];
    const sales = this.getAllSales();

    return franchiseRows.map((f) => {
      const derived = deriveFranchiseState(f.id, f.starting_purse, sales);
      return {
        id: f.id,
        name: f.name,
        logoUrl: f.logo_url,
        coordName: f.coord_name,
        coordDepartment: f.coord_department,
        coordPhotoUrl: f.coord_photo_url,
        coordPhone: f.coord_phone,
        captainPhone: f.captain_phone,
        captainPlayerId: f.captain_player_id,
        viceCaptainPlayerId: f.vice_captain_player_id,
        startingPurse: f.starting_purse,
        currentPurse: derived.currentPurse,
        squadCount: derived.auctionPurchasesCount + (f.captain_player_id ? 1 : 0) + (f.vice_captain_player_id ? 1 : 0),
        auctionPurchasesCount: derived.auctionPurchasesCount,
        bucketCounts: derived.bucketCounts,
      };
    });
  }

  /**
   * Checks and broadcasts scarcity for all buckets (§12.3)
   */
  public checkAndBroadcastScarcity(): ScarcityStatus[] {
    const franchises = this.getFranchises();
    const bucketMins = this.getBucketMinimums();
    const buckets: Bucket[] = ['B1', 'B2', 'B3', 'B4', 'B5'];

    const scarcities: ScarcityStatus[] = buckets.map((bucket) => {
      // Unsold paid auctionable players
      const unsold = db
        .prepare(
          "SELECT count(*) as cnt FROM players WHERE bucket = ? AND is_paid = 1 AND status = 'AUCTIONABLE'"
        )
        .get(bucket) as { cnt: number };

      const scarcity = checkBucketScarcity(unsold.cnt, franchises, bucket, bucketMins);
      return {
        bucket,
        unsoldSupply: scarcity.unsoldSupply,
        totalDemand: scarcity.totalDemand,
        isScarcityWarning: scarcity.isScarcityWarning,
      };
    });

    if (this.onScarcityChange) {
      this.onScarcityChange(scarcities);
    }
    return scarcities;
  }

  /**
   * Recalculates blocked franchises for the current lot
   */
  public refreshAllFranchiseEligibility() {
    if (!this.currentLot.player || !this.currentLot.bucket) return;

    const franchises = this.getFranchises();
    const bucketMins = this.getBucketMinimums();
    const nextBid = calculateNextBid(this.currentLot.currentPrice);

    const blocked: string[] = [];
    const inPlay: string[] = [];

    for (const f of franchises) {
      // 1. Mandatory slot fillability check (§12.2)
      const slotEligibility = isBucketEligible(f.auctionPurchasesCount, f.bucketCounts, this.currentLot.bucket, bucketMins);

      // 2. Maximum permissible bid check (§12.1)
      const maxBid = calculateMaxBid(f.currentPurse, f.auctionPurchasesCount, f.bucketCounts, this.currentLot.bucket, bucketMins);

      const canAffordNextBid = nextBid <= maxBid;

      if (!slotEligibility.eligible || !canAffordNextBid) {
        blocked.push(f.id);
      } else if (!this.currentLot.passedFranchiseIds.includes(f.id)) {
        inPlay.push(f.id);
      }
    }

    this.currentLot.blockedFranchiseIds = blocked;
    this.currentLot.inPlayFranchiseIds = inPlay;
  }

  /**
   * Draws and loads the next player lot (§10)
   */
  public loadLot(options: {
    bucket?: Bucket;
    bucketNumber?: number;
    playerId?: string;
    actor: string;
  }): { success: boolean; error?: string; lot?: LotState } {
    if (this.currentLot.status === 'ACTIVE') {
      return { success: false, error: 'Cannot load new lot while current lot is active. Hammer or skip first.' };
    }

    let targetPlayerRow: any = null;

    if (options.playerId) {
      targetPlayerRow = db
        .prepare("SELECT * FROM players WHERE id = ? AND is_paid = 1 AND status IN ('AUCTIONABLE', 'SKIPPED')")
        .get(options.playerId);
    } else if (options.bucketNumber && options.bucket) {
      // Guest mode (§10): honorary guest calls a number aloud
      targetPlayerRow = db
        .prepare(
          "SELECT * FROM players WHERE bucket = ? AND bucket_number = ? AND is_paid = 1 AND status IN ('AUCTIONABLE', 'SKIPPED')"
        )
        .get(options.bucket, options.bucketNumber);
    } else {
      // Auto mode: draw random player in sequence
      const sequence = BUCKET_DRAW_SEQUENCE;
      for (const b of sequence) {
        targetPlayerRow = db
          .prepare(
            "SELECT * FROM players WHERE bucket = ? AND is_paid = 1 AND status = 'AUCTIONABLE' ORDER BY RANDOM() LIMIT 1"
          )
          .get(b);
        if (targetPlayerRow) break;
      }

      // If no normal auctionable players remain, check skipped queue
      if (!targetPlayerRow) {
        targetPlayerRow = db
          .prepare("SELECT * FROM players WHERE is_paid = 1 AND status = 'SKIPPED' ORDER BY RANDOM() LIMIT 1")
          .get();
      }
    }

    if (!targetPlayerRow) {
      return { success: false, error: 'No available players found to auction.' };
    }

    const player: Player = {
      id: targetPlayerRow.id,
      rollNumber: targetPlayerRow.roll_number,
      name: targetPlayerRow.name,
      mobile: targetPlayerRow.mobile,
      photoUrl: targetPlayerRow.photo_url,
      cricHeroesProfileUrl: targetPlayerRow.cricheroes_url,
      cricHeroesMobile: targetPlayerRow.cricheroes_mobile,
      cricHeroesPending: Boolean(targetPlayerRow.cricheroes_pending),
      course: targetPlayerRow.course,
      program: targetPlayerRow.program,
      branch: targetPlayerRow.branch,
      admissionYear: targetPlayerRow.admission_year,
      yearOfStudy: targetPlayerRow.year_of_study,
      isLateral: Boolean(targetPlayerRow.is_lateral),
      bucket: targetPlayerRow.bucket,
      derivedType: targetPlayerRow.derived_type,
      skills: JSON.parse(targetPlayerRow.skills_json),
      stats: JSON.parse(targetPlayerRow.stats_json),
      basePrice: targetPlayerRow.base_price,
      isPaid: Boolean(targetPlayerRow.is_paid),
      isDetainedOverride: Boolean(targetPlayerRow.is_detained_override),
      status: targetPlayerRow.status,
      bucketNumber: targetPlayerRow.bucket_number,
      editingLocked: Boolean(targetPlayerRow.editing_locked),
    };

    const nextLotNumber = this.currentLot.lotNumber + 1;
    const duration = 30; // §11: 30 seconds for first bid
    const endsAt = Date.now() + duration * 1000;

    const allFranchises = this.getFranchises();

    this.currentLot = {
      lotNumber: nextLotNumber,
      player: sanitizePlayerForPublic(player),
      currentPrice: player.basePrice,
      highestBidderFranchiseId: null,
      highestBidderFranchiseName: null,
      timerSecondsRemaining: duration,
      timerEndsAt: endsAt,
      status: 'ACTIVE',
      inPlayFranchiseIds: allFranchises.map((f) => f.id),
      passedFranchiseIds: [],
      blockedFranchiseIds: [],
      bucket: player.bucket,
      drawMode: options.bucketNumber ? 'GUEST' : 'AUTO',
      round: 1,
    };

    this.refreshAllFranchiseEligibility();
    this.startServerTimer();
    this.logAudit(options.actor, 'LOAD_LOT', { lotNumber: nextLotNumber, playerId: player.id });
    this.broadcastState();

    return { success: true, lot: this.getLotState() };
  }

  /**
   * Places a bid with strict increment validation & race condition handling (§11, §12.1, §12.2)
   */
  public placeBid(
    franchiseId: string,
    amount?: number,
    actor: string = franchiseId
  ): { success: boolean; error?: string; newPrice?: number } {
    if (this.currentLot.status !== 'ACTIVE') {
      return { success: false, error: 'No active lot currently in progress.' };
    }

    if (!this.currentLot.player || !this.currentLot.bucket) {
      return { success: false, error: 'No player currently on auction.' };
    }

    const franchises = this.getFranchises();
    const franchise = franchises.find((f) => f.id === franchiseId);
    if (!franchise) {
      return { success: false, error: 'Franchise not found.' };
    }

    // Bidder cannot bid against themselves
    if (this.currentLot.highestBidderFranchiseId === franchiseId) {
      return { success: false, error: 'You are already the highest bidder.' };
    }

    // Determine target price: either first bid at base price, or next increment
    let targetPrice: number;
    if (this.currentLot.highestBidderFranchiseId === null) {
      // First bid opens at base price
      targetPrice = this.currentLot.currentPrice;
    } else {
      targetPrice = calculateNextBid(this.currentLot.currentPrice);
    }

    // Strict No Jump Bidding (§11, Appendix A.6 #28)
    if (amount !== undefined && amount !== targetPrice) {
      return {
        success: false,
        error: `Jump bidding rejected. Next allowable bid is exactly ${targetPrice}.`,
      };
    }

    // §12.2 Mandatory slot fillability check
    const bucketMins = this.getBucketMinimums();
    const slotCheck = isBucketEligible(
      franchise.auctionPurchasesCount,
      franchise.bucketCounts,
      this.currentLot.bucket,
      bucketMins
    );
    if (!slotCheck.eligible) {
      return { success: false, error: slotCheck.reason };
    }

    // §12.1 Maximum permissible bid check
    const maxBid = calculateMaxBid(
      franchise.currentPurse,
      franchise.auctionPurchasesCount,
      franchise.bucketCounts,
      this.currentLot.bucket,
      bucketMins
    );
    if (targetPrice > maxBid) {
      return {
        success: false,
        error: `Bid of ${targetPrice} exceeds maximum permissible bid of ${maxBid}. You must reserve enough credits to finish your squad.`,
      };
    }

    // Accept the bid!
    this.currentLot.currentPrice = targetPrice;
    this.currentLot.highestBidderFranchiseId = franchise.id;
    this.currentLot.highestBidderFranchiseName = franchise.name;

    // Remove from passed list if re-entering
    this.currentLot.passedFranchiseIds = this.currentLot.passedFranchiseIds.filter((id) => id !== franchiseId);

    // §11 & Appendix A.6 #29: Reset timer to full 20 seconds
    const duration = 20;
    this.currentLot.timerSecondsRemaining = duration;
    this.currentLot.timerEndsAt = Date.now() + duration * 1000;

    this.refreshAllFranchiseEligibility();
    this.logAudit(actor, 'BID_PLACED', { franchiseId, amount: targetPrice, lotNumber: this.currentLot.lotNumber });
    this.broadcastState();

    return { success: true, newPrice: targetPrice };
  }

  /**
   * Franchise Pass / Reversible Pass (§11, Appendix A.6 #30)
   */
  public passFranchise(franchiseId: string) {
    if (this.currentLot.status !== 'ACTIVE') return;
    if (!this.currentLot.passedFranchiseIds.includes(franchiseId)) {
      this.currentLot.passedFranchiseIds.push(franchiseId);
      this.currentLot.inPlayFranchiseIds = this.currentLot.inPlayFranchiseIds.filter((id) => id !== franchiseId);
      this.broadcastState();
    }
  }

  /**
   * Hammer Action (§11, Appendix A.6 #31)
   * Sale completes ONLY when hammer is pressed by Super Admin / Operator.
   */
  public pressHammer(actor: string): { success: boolean; result: 'SOLD' | 'UNSOLD' | 'ERROR'; sale?: AuctionSaleRecord; error?: string } {
    if (this.currentLot.status !== 'ACTIVE') {
      return { success: false, result: 'ERROR', error: 'No active lot to hammer.' };
    }

    this.stopServerTimer();

    const player = this.currentLot.player;
    if (!player) {
      return { success: false, result: 'ERROR', error: 'No player attached to lot.' };
    }

    if (this.currentLot.highestBidderFranchiseId) {
      // SOLD!
      const saleId = `sale-${Date.now()}-${this.currentLot.lotNumber}`;
      const amount = this.currentLot.currentPrice;
      const franchiseId = this.currentLot.highestBidderFranchiseId;

      // Commit to DB sales ledger
      db.prepare(`
        INSERT INTO auction_sales (id, lot_number, player_id, franchise_id, amount, bucket, status)
        VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')
      `).run(saleId, this.currentLot.lotNumber, player.id, franchiseId, amount, player.bucket);

      // Update player status in DB
      db.prepare(`
        UPDATE players SET status = 'SOLD', assigned_franchise_id = ?, sold_price = ? WHERE id = ?
      `).run(franchiseId, amount, player.id);

      const saleRecord: AuctionSaleRecord = {
        id: saleId,
        lotNumber: this.currentLot.lotNumber,
        playerId: player.id,
        franchiseId,
        amount,
        bucket: player.bucket,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
      };

      this.currentLot.status = 'SOLD';
      this.logAudit(actor, 'HAMMER_SOLD', { saleId, playerId: player.id, franchiseId, amount });

      if (this.onSaleFinalized) this.onSaleFinalized(saleRecord);
      if (this.onPlayerStatusChange) {
        this.onPlayerStatusChange({ ...player, status: 'SOLD', assignedFranchiseId: franchiseId, soldPrice: amount });
      }

      this.checkAndBroadcastScarcity();
      this.broadcastState();

      return { success: true, result: 'SOLD', sale: saleRecord };
    } else {
      // UNSOLD!
      db.prepare("UPDATE players SET status = 'UNSOLD' WHERE id = ?").run(player.id);
      this.currentLot.status = 'UNSOLD';
      this.logAudit(actor, 'HAMMER_UNSOLD', { playerId: player.id });

      if (this.onPlayerStatusChange) {
        this.onPlayerStatusChange({ ...player, status: 'UNSOLD' });
      }

      this.checkAndBroadcastScarcity();
      this.broadcastState();

      return { success: true, result: 'UNSOLD' };
    }
  }

  /**
   * Skips player (§10): recalled at end of bucket at base price or Round 2
   */
  public skipLot(actor: string): { success: boolean; error?: string } {
    if (this.currentLot.status !== 'ACTIVE' || !this.currentLot.player) {
      return { success: false, error: 'No active player to skip.' };
    }

    this.stopServerTimer();
    const player = this.currentLot.player;

    db.prepare("UPDATE players SET status = 'SKIPPED' WHERE id = ?").run(player.id);
    this.currentLot.status = 'IDLE';
    this.currentLot.player = null;

    this.logAudit(actor, 'SKIP_PLAYER', { playerId: player.id });
    if (this.onPlayerStatusChange) {
      this.onPlayerStatusChange({ ...player, status: 'SKIPPED' });
    }

    this.broadcastState();
    return { success: true };
  }

  /**
   * Safe Undo of any historical sale (§12.4, Appendix A.4 #16, #17, #18)
   */
  public safeUndo(saleId: string, actor: string, reason: string): { success: boolean; error?: string; undoneSale?: AuctionSaleRecord } {
    const allSales = this.getAllSales();
    const result = undoSale(allSales, saleId, actor, reason);

    if (!result.success || !result.undoneSale) {
      return { success: false, error: result.error };
    }

    // Update database record for this sale
    db.prepare(`
      UPDATE auction_sales 
      SET status = 'UNDONE', undone_at = ?, undone_by = ?, undo_reason = ? 
      WHERE id = ?
    `).run(result.undoneSale.undoneAt || new Date().toISOString(), actor, reason, saleId);

    // Return player to AUCTIONABLE pool
    db.prepare(`
      UPDATE players 
      SET status = 'AUCTIONABLE', assigned_franchise_id = NULL, sold_price = NULL 
      WHERE id = ?
    `).run(result.undoneSale.playerId);

    this.logAudit(actor, 'SAFE_UNDO', { saleId, reason });

    // Refresh scarcity and all franchise states
    this.checkAndBroadcastScarcity();
    this.refreshAllFranchiseEligibility();
    this.broadcastState();

    return { success: true, undoneSale: result.undoneSale };
  }

  /**
   * Direct assign player by Super Admin (§16)
   */
  public directAssign(
    playerId: string,
    franchiseId: string,
    price: number,
    actor: string
  ): { success: boolean; error?: string } {
    const playerRow = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId) as any;
    if (!playerRow) return { success: false, error: 'Player not found' };

    const saleId = `direct-${Date.now()}`;
    const nextLotNumber = this.currentLot.lotNumber + 1;

    db.prepare(`
      INSERT INTO auction_sales (id, lot_number, player_id, franchise_id, amount, bucket, status)
      VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')
    `).run(saleId, nextLotNumber, playerId, franchiseId, price, playerRow.bucket);

    db.prepare(`
      UPDATE players SET status = 'SOLD', assigned_franchise_id = ?, sold_price = ? WHERE id = ?
    `).run(franchiseId, price, playerId);

    this.logAudit(actor, 'DIRECT_ASSIGN', { playerId, franchiseId, price });
    this.checkAndBroadcastScarcity();
    this.broadcastState();

    return { success: true };
  }

  public pauseAuction(actor: string) {
    if (this.currentLot.status === 'ACTIVE') {
      this.currentLot.status = 'PAUSED';
      this.stopServerTimer();
      this.logAudit(actor, 'PAUSE_AUCTION', {});
      this.broadcastState();
    }
  }

  public resumeAuction(actor: string) {
    if (this.currentLot.status === 'PAUSED') {
      this.currentLot.status = 'ACTIVE';
      this.currentLot.timerEndsAt = Date.now() + this.currentLot.timerSecondsRemaining * 1000;
      this.startServerTimer();
      this.logAudit(actor, 'RESUME_AUCTION', {});
      this.broadcastState();
    }
  }

  private startServerTimer() {
    this.stopServerTimer();
    this.timerInterval = setInterval(() => {
      if (this.currentLot.status !== 'ACTIVE' || !this.currentLot.timerEndsAt) return;

      const remaining = Math.max(0, Math.ceil((this.currentLot.timerEndsAt - Date.now()) / 1000));
      this.currentLot.timerSecondsRemaining = remaining;

      // Note: We do NOT spam WebSocket clients every second. Clients compute countdown locally from timerEndsAt!
      if (remaining === 0) {
        // §11 & Appendix A.6 #31: Timer expiring does NOT hammer. Auctioneer talks the room into re-entering.
        this.stopServerTimer();
      }
    }, 1000);
  }

  private stopServerTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private broadcastState() {
    if (this.onStateChange) {
      this.onStateChange(this.getLotState());
    }
  }

  private logAudit(actor: string, action: string, details: Record<string, any>) {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO audit_logs (id, actor_role, actor_id, action, details_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      actor === 'SUPER_ADMIN' || actor === 'OPERATOR' ? actor : 'FRANCHISE',
      actor,
      action,
      JSON.stringify(details)
    );
  }
}

export const auctionEngine = new AuctionEngine();
