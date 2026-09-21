import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { sanitizePlayerForPublic, sanitizeFranchiseForPublic } from '../serializers.js';

export const authRouter = Router();

// Hardcoded tournament admin secrets (can also be configured via environment variables)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'avanthi_admin_2026';
const OPERATOR_PASSWORD = process.env.OPERATOR_PASSWORD || 'operator_2026';

/**
 * Strict Player Login:
 * Authenticates using authoritative Roll Number + Registered Phone Number.
 */
authRouter.post('/player-login', (req: Request, res: Response) => {
  const { rollNumber, mobile } = req.body;

  if (!rollNumber || !mobile) {
    return res.status(400).json({ error: 'Roll number and mobile number are both required.' });
  }

  const cleanRoll = rollNumber.trim().toUpperCase();
  const cleanMobile = mobile.trim();

  const playerRow = db
    .prepare('SELECT * FROM players WHERE roll_number = ? AND mobile = ?')
    .get(cleanRoll, cleanMobile) as any;

  if (!playerRow) {
    return res.status(401).json({ error: 'Invalid roll number or unregistered mobile number.' });
  }

  const player = {
    ...playerRow,
    skills: JSON.parse(playerRow.skills_json),
    stats: JSON.parse(playerRow.stats_json),
    isPaid: Boolean(playerRow.is_paid),
    isLateral: Boolean(playerRow.is_lateral),
    isDetainedOverride: Boolean(playerRow.is_detained_override),
    editingLocked: Boolean(playerRow.editing_locked),
  };

  return res.json({
    role: 'PLAYER',
    token: `player-${player.id}`,
    player,
  });
});

/**
 * Franchise Login:
 * Authenticates using either the Faculty Coordinator's Mobile or Captain's Mobile.
 */
authRouter.post('/franchise-login', (req: Request, res: Response) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ error: 'Mobile number is required.' });
  }

  const cleanMobile = mobile.trim();

  const franchiseRow = db
    .prepare('SELECT * FROM franchises WHERE coord_phone = ? OR captain_phone = ?')
    .get(cleanMobile, cleanMobile) as any;

  if (!franchiseRow) {
    return res.status(401).json({ error: 'No franchise registered with this mobile number.' });
  }

  const isCaptainLogin = cleanMobile === franchiseRow.captain_phone;

  return res.json({
    role: 'FRANCHISE',
    franchiseId: franchiseRow.id,
    franchiseName: franchiseRow.name,
    isCaptain: isCaptainLogin,
    franchise: sanitizeFranchiseForPublic(franchiseRow),
  });
});

/**
 * Super Admin & Operator Login:
 */
authRouter.post('/admin-login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === ADMIN_PASSWORD) {
    return res.json({
      role: 'SUPER_ADMIN',
      token: 'admin-session-token',
      name: 'Super Admin (Organizer)',
    });
  }

  if (username === 'operator' && password === OPERATOR_PASSWORD) {
    return res.json({
      role: 'OPERATOR',
      token: 'operator-session-token',
      name: 'Auction Operator',
    });
  }

  return res.status(401).json({ error: 'Invalid admin or operator credentials.' });
});
