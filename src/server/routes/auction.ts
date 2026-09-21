import { Router, Request, Response } from 'express';
import { auctionEngine } from '../state.js';
import { db } from '../db.js';
import { Bucket, Player } from '../../core/types.js';
import * as XLSX from 'xlsx';

export const auctionRouter = Router();

/**
 * Get current live lot state
 */
auctionRouter.get('/state', (req: Request, res: Response) => {
  const lotState = auctionEngine.getLotState();
  const franchises = auctionEngine.getFranchises();
  const scarcities = auctionEngine.checkAndBroadcastScarcity();
  return res.json({ lotState, franchises, scarcities });
});

/**
 * Admin: Load next lot (§10)
 */
auctionRouter.post('/load-lot', (req: Request, res: Response) => {
  const { bucket, bucketNumber, playerId, actor } = req.body;
  const result = auctionEngine.loadLot({ bucket, bucketNumber, playerId, actor: actor || 'SUPER_ADMIN' });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json(result.lot);
});

/**
 * Franchise / Proxy: Place Bid (§11, §12.1, §12.2, §16)
 */
auctionRouter.post('/bid', (req: Request, res: Response) => {
  const { franchiseId, amount, actor } = req.body;
  const result = auctionEngine.placeBid(franchiseId, amount, actor || franchiseId);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ success: true, newPrice: result.newPrice });
});

/**
 * Franchise: Pass (§11)
 */
auctionRouter.post('/pass', (req: Request, res: Response) => {
  const { franchiseId } = req.body;
  auctionEngine.passFranchise(franchiseId);
  return res.json({ success: true });
});

/**
 * Admin: Hammer (§11, §16)
 */
auctionRouter.post('/hammer', (req: Request, res: Response) => {
  const { actor } = req.body;
  const result = auctionEngine.pressHammer(actor || 'SUPER_ADMIN');
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json(result);
});

/**
 * Admin: Skip Lot (§10, §16)
 */
auctionRouter.post('/skip', (req: Request, res: Response) => {
  const { actor } = req.body;
  const result = auctionEngine.skipLot(actor || 'SUPER_ADMIN');
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ success: true });
});

/**
 * Admin: Safe Undo (§12.4, §16)
 */
auctionRouter.post('/undo', (req: Request, res: Response) => {
  const { saleId, actor, reason } = req.body;
  if (!saleId || !reason) {
    return res.status(400).json({ error: 'Sale ID and reason are strictly required for safe undo.' });
  }
  const result = auctionEngine.safeUndo(saleId, actor || 'SUPER_ADMIN', reason);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ success: true, undoneSale: result.undoneSale });
});

/**
 * Admin: Relax Bucket Minimum Uniformly (§7, §13, §16)
 */
auctionRouter.post('/relax-bucket', (req: Request, res: Response) => {
  const { bucket, newMinimum, actor } = req.body;
  auctionEngine.relaxBucketMinimum(bucket as Bucket, Number(newMinimum), actor || 'SUPER_ADMIN');
  return res.json({ success: true, bucket, newMinimum });
});

/**
 * Admin: Direct Assign (§16)
 */
auctionRouter.post('/direct-assign', (req: Request, res: Response) => {
  const { playerId, franchiseId, price, actor } = req.body;
  const result = auctionEngine.directAssign(playerId, franchiseId, Number(price), actor || 'SUPER_ADMIN');
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ success: true });
});

/**
 * Admin: Pause / Resume
 */
auctionRouter.post('/pause', (req: Request, res: Response) => {
  const { actor } = req.body;
  auctionEngine.pauseAuction(actor || 'SUPER_ADMIN');
  return res.json({ success: true });
});

auctionRouter.post('/resume', (req: Request, res: Response) => {
  const { actor } = req.body;
  auctionEngine.resumeAuction(actor || 'SUPER_ADMIN');
  return res.json({ success: true });
});

/**
 * Round 2 Auto-Allotment Cascade (§13)
 * Proposes or executes auto-allotment for teams with unfilled quotas:
 * Priority: Most unfilled slots first, ties broken by smallest remaining purse.
 */
auctionRouter.post('/round2-auto-allot', (req: Request, res: Response) => {
  const { bucket, execute } = req.body;
  const franchises = auctionEngine.getFranchises();
  const bucketMins = auctionEngine.getBucketMinimums();
  const reqCount = bucketMins[bucket as Bucket] || 0;

  // Filter franchises needing this bucket
  const needingFranchises = franchises
    .filter((f) => (f.bucketCounts[bucket as Bucket] || 0) < reqCount)
    .map((f) => ({
      franchise: f,
      unfilledSlots: 15 - f.auctionPurchasesCount,
      unfilledBucket: reqCount - (f.bucketCounts[bucket as Bucket] || 0),
      purse: f.currentPurse,
    }))
    .sort((a, b) => {
      // 1. Most unfilled slots first
      if (b.unfilledSlots !== a.unfilledSlots) {
        return b.unfilledSlots - a.unfilledSlots;
      }
      // 2. Smallest remaining purse first
      return a.purse - b.purse;
    });

  // Find unsold players in this bucket
  const availablePlayers = db
    .prepare(
      "SELECT * FROM players WHERE bucket = ? AND is_paid = 1 AND status IN ('AUCTIONABLE', 'UNSOLD', 'SKIPPED')"
    )
    .all(bucket) as any[];

  const proposedAssignments: Array<{ player: any; franchise: any; cost: number }> = [];

  let playerIdx = 0;
  for (const item of needingFranchises) {
    for (let k = 0; k < item.unfilledBucket; k++) {
      if (playerIdx < availablePlayers.length) {
        proposedAssignments.push({
          player: availablePlayers[playerIdx],
          franchise: item.franchise,
          cost: 20, // §13: Fixed 20 credits each
        });
        playerIdx++;
      }
    }
  }

  if (execute) {
    // Commit allotments to DB
    for (const assignment of proposedAssignments) {
      const saleId = `allot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT INTO auction_sales (id, lot_number, player_id, franchise_id, amount, bucket, status)
        VALUES (?, 9999, ?, ?, 20, ?, 'CONFIRMED')
      `).run(saleId, assignment.player.id, assignment.franchise.id, bucket);

      db.prepare(`
        UPDATE players 
        SET status = 'ALLOTTED', assigned_franchise_id = ?, sold_price = 20 
        WHERE id = ?
      `).run(assignment.franchise.id, assignment.player.id);
    }
    auctionEngine.checkAndBroadcastScarcity();
    return res.json({ success: true, executedCount: proposedAssignments.length });
  }

  return res.json({
    proposedAssignments: proposedAssignments.map((p) => ({
      playerId: p.player.id,
      playerName: p.player.name,
      franchiseId: p.franchise.id,
      franchiseName: p.franchise.name,
      cost: p.cost,
    })),
    shortfall: Math.max(0, needingFranchises.reduce((sum, f) => sum + f.unfilledBucket, 0) - availablePlayers.length),
  });
});

/**
 * Export Complete Tournament Database to Excel Spreadsheet (§16)
 */
auctionRouter.get('/export-excel', (req: Request, res: Response) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Franchises
  const franchises = auctionEngine.getFranchises();
  const franchiseData = franchises.map((f) => ({
    'Team Name': f.name,
    'Coordinator Name': f.coordName,
    'Department': f.coordDepartment,
    'Starting Purse': f.startingPurse,
    'Current Purse': f.currentPurse,
    'Auction Buys': f.auctionPurchasesCount,
    'Total Squad Size': f.squadCount,
    'B1 (1st Yr)': f.bucketCounts.B1,
    'B2 (2nd Yr)': f.bucketCounts.B2,
    'B3 (3rd Yr)': f.bucketCounts.B3,
    'B4 (4th Yr)': f.bucketCounts.B4,
    'B5 (Diploma)': f.bucketCounts.B5,
    'PG': f.bucketCounts.PG,
  }));
  const wsFranchises = XLSX.utils.json_to_sheet(franchiseData);
  XLSX.utils.book_append_sheet(wb, wsFranchises, 'Franchises');

  // Sheet 2: Players
  const players = db.prepare('SELECT * FROM players ORDER BY name ASC').all() as any[];
  const playerData = players.map((p) => ({
    'Roll Number': p.roll_number,
    'Name': p.name,
    'Course': p.course,
    'Program': p.program,
    'Branch': p.branch,
    'Year of Study': p.year_of_study,
    'Bucket': p.bucket,
    'Player Type': p.derived_type,
    'Base Price': p.base_price,
    'Status': p.status,
    'Sold / Allotted Price': p.sold_price || 'N/A',
    'Assigned Team ID': p.assigned_franchise_id || 'N/A',
    'Paid': p.is_paid ? 'YES' : 'NO',
  }));
  const wsPlayers = XLSX.utils.json_to_sheet(playerData);
  XLSX.utils.book_append_sheet(wb, wsPlayers, 'Players');

  // Sheet 3: Sales Ledger
  const sales = auctionEngine.getAllSales();
  const salesData = sales.map((s) => ({
    'Sale ID': s.id,
    'Lot Number': s.lotNumber,
    'Player ID': s.playerId,
    'Franchise ID': s.franchiseId,
    'Amount': s.amount,
    'Bucket': s.bucket,
    'Status': s.status,
    'Undo Reason': s.undoReason || '',
    'Timestamp': s.createdAt,
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Ledger');

  // Sheet 4: Audit Logs
  const auditRows = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC').all() as any[];
  const auditData = auditRows.map((a) => ({
    'ID': a.id,
    'Timestamp': a.timestamp,
    'Actor Role': a.actor_role,
    'Actor ID': a.actor_id,
    'Action': a.action,
    'Details': a.details_json,
  }));
  const wsAudit = XLSX.utils.json_to_sheet(auditData);
  XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit Trail');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="Avanthi_Cricket_Carnival_2026.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buffer);
});
