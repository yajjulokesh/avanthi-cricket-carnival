import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { sanitizeFranchisesForPublic } from '../serializers.js';
import { auctionEngine } from '../state.js';

export const franchisesRouter = Router();

/**
 * Register Franchise (§6)
 */
franchisesRouter.post('/register', (req: Request, res: Response) => {
  const { name, logoUrl, coordName, coordDepartment, coordPhotoUrl, coordPhone, captainPhone } = req.body;

  if (!name || !coordName || !coordPhone) {
    return res.status(400).json({ error: 'Team name, coordinator name, and coordinator phone are required.' });
  }

  const existingName = db.prepare('SELECT id FROM franchises WHERE name = ?').get(name.trim());
  if (existingName) {
    return res.status(409).json({ error: `Team name "${name}" is already registered.` });
  }

  const id = `franchise-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  db.prepare(`
    INSERT INTO franchises (
      id, name, logoUrl, coord_name, coord_department, coord_photo_url,
      coord_phone, captain_phone, starting_purse
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1000)
  `).run(
    id,
    name.trim(),
    logoUrl || '/assets/default-team.png',
    coordName.trim(),
    coordDepartment || '',
    coordPhotoUrl || '/assets/default-coord.png',
    coordPhone.trim(),
    captainPhone ? captainPhone.trim() : null
  );

  return res.status(201).json({ message: 'Franchise registered successfully', franchiseId: id });
});

/**
 * Public List of Franchises (Phone numbers stripped)
 */
franchisesRouter.get('/public-list', (req: Request, res: Response) => {
  const franchises = auctionEngine.getFranchises();
  return res.json(sanitizeFranchisesForPublic(franchises));
});

/**
 * Assign Retained Captain & Vice-Captain (§6)
 */
franchisesRouter.post('/:id/assign-retained', (req: Request, res: Response) => {
  const { id } = req.params;
  const { captainPlayerId, viceCaptainPlayerId } = req.body;

  const franchise = db.prepare('SELECT * FROM franchises WHERE id = ?').get(id) as any;
  if (!franchise) return res.status(404).json({ error: 'Franchise not found' });

  // Verify exclusivity: Neither player can be claimed by another franchise
  if (captainPlayerId) {
    const existingCap = db
      .prepare('SELECT name FROM franchises WHERE id != ? AND (captain_player_id = ? OR vice_captain_player_id = ?)')
      .get(id, captainPlayerId, captainPlayerId) as any;
    if (existingCap) {
      return res.status(409).json({ error: `Selected captain is already retained by ${existingCap.name}.` });
    }
  }

  if (viceCaptainPlayerId) {
    const existingVC = db
      .prepare('SELECT name FROM franchises WHERE id != ? AND (captain_player_id = ? OR vice_captain_player_id = ?)')
      .get(id, viceCaptainPlayerId, viceCaptainPlayerId) as any;
    if (existingVC) {
      return res.status(409).json({ error: `Selected vice-captain is already retained by ${existingVC.name}.` });
    }
  }

  db.prepare(`
    UPDATE franchises 
    SET captain_player_id = ?, vice_captain_player_id = ? 
    WHERE id = ?
  `).run(captainPlayerId || null, viceCaptainPlayerId || null, id);

  // Update players status to RETAINED
  if (captainPlayerId) {
    db.prepare("UPDATE players SET status = 'RETAINED', assigned_franchise_id = ? WHERE id = ?").run(id, captainPlayerId);
  }
  if (viceCaptainPlayerId) {
    db.prepare("UPDATE players SET status = 'RETAINED', assigned_franchise_id = ? WHERE id = ?").run(id, viceCaptainPlayerId);
  }

  return res.json({ success: true, message: 'Captain and Vice-Captain assigned.' });
});

/**
 * Surface and Assign Referred Players (§6)
 */
franchisesRouter.get('/referral-conflicts', (req: Request, res: Response) => {
  // Find all players where referred_franchise_id is set
  const referrals = db.prepare(`
    SELECT p.id, p.name, p.roll_number, p.admission_year, p.referred_franchise_id, f.name as franchise_name
    FROM players p
    JOIN franchises f ON p.referred_franchise_id = f.id
    WHERE p.status = 'REGISTERED'
  `).all();

  return res.json(referrals);
});

franchisesRouter.post('/confirm-referral', (req: Request, res: Response) => {
  const { playerId, franchiseId } = req.body;

  // Check that franchise doesn't exceed 5 referrals
  const count = db
    .prepare("SELECT count(*) as cnt FROM players WHERE assigned_franchise_id = ? AND status = 'REFERRED'")
    .get(franchiseId) as { cnt: number };
  if (count.cnt >= 5) {
    return res.status(400).json({ error: 'Franchise already has maximum 5 referred players.' });
  }

  db.prepare(`
    UPDATE players 
    SET status = 'REFERRED', assigned_franchise_id = ? 
    WHERE id = ?
  `).run(franchiseId, playerId);

  return res.json({ success: true, message: 'Referral confirmed by Super Admin.' });
});
