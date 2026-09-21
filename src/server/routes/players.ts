import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { parseRollNumber, derivePlayerType, validateSkillProfile, CURRENT_ACADEMIC_YEAR } from '../../core/parser.js';
import { sanitizePlayersForPublic, sanitizePlayerForPublic } from '../serializers.js';
import { Bucket, CricHeroesStats, Player, PlayerSkillProfile } from '../../core/types.js';

export const playersRouter = Router();

const ALLOWED_BASE_PRICES = [20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 230, 250];

/**
 * Register Player (§5)
 */
playersRouter.post('/register', (req: Request, res: Response) => {
  const {
    rollNumber,
    name,
    mobile,
    photoUrl,
    cricHeroesProfileUrl,
    cricHeroesMobile,
    cricHeroesPending,
    skills,
    stats,
    basePrice,
    referredFranchiseId,
    detainedFlag,
  } = req.body;

  if (!rollNumber || !name || !mobile) {
    return res.status(400).json({ error: 'Roll number, name, and mobile number are required.' });
  }

  // Parse authoritative roll number
  const parsed = parseRollNumber(rollNumber, CURRENT_ACADEMIC_YEAR);
  if (!parsed.isValid) {
    return res.status(400).json({ error: parsed.error });
  }

  // Validate Base Price from ladder
  if (!ALLOWED_BASE_PRICES.includes(Number(basePrice))) {
    return res.status(400).json({
      error: `Invalid base price. Allowed ladder: ${ALLOWED_BASE_PRICES.join(', ')}`,
    });
  }

  // Validate Skill Profile (§5.1)
  const skillValidation = validateSkillProfile(skills as PlayerSkillProfile);
  if (!skillValidation.isValid) {
    return res.status(400).json({ error: skillValidation.error });
  }

  const derivedType = derivePlayerType(skills as PlayerSkillProfile);

  // Check unique roll number
  const cleanRoll = rollNumber.trim().toUpperCase();
  const existingRoll = db.prepare('SELECT id FROM players WHERE roll_number = ?').get(cleanRoll);
  if (existingRoll) {
    return res.status(409).json({ error: `Player with roll number ${cleanRoll} is already registered.` });
  }

  // Check unique mobile
  const cleanMobile = mobile.trim();
  const existingMobile = db.prepare('SELECT id FROM players WHERE mobile = ?').get(cleanMobile);
  if (existingMobile) {
    return res.status(409).json({ error: `Mobile number ${cleanMobile} is already registered.` });
  }

  // Generate bucket-scoped random number (§10)
  const bucketCount = db
    .prepare('SELECT count(*) as cnt FROM players WHERE bucket = ?')
    .get(parsed.bucket!) as { cnt: number };
  const bucketNumber = bucketCount.cnt + 1;

  const id = `player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const defaultStats: CricHeroesStats = stats || {
    matches: 0,
    runs: 0,
    battingAverage: 0,
    strikeRate: 0,
    highestScore: '0',
    wickets: 0,
    bowlingAverage: 0,
    economy: 0,
    bestBowling: '0/0',
    catches: 0,
    stumpings: 0,
  };

  db.prepare(`
    INSERT INTO players (
      id, roll_number, name, mobile, photo_url, cricheroes_url, cricheroes_mobile,
      cricheroes_pending, course, program, branch, admission_year, year_of_study,
      is_lateral, bucket, derived_type, skills_json, stats_json, base_price,
      referred_franchise_id, is_paid, is_detained_override, status, bucket_number, editing_locked
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'REGISTERED', ?, 0
    )
  `).run(
    id,
    cleanRoll,
    name.trim(),
    cleanMobile,
    photoUrl || '/assets/default-avatar.png',
    cricHeroesProfileUrl || '',
    cricHeroesMobile || '',
    cricHeroesPending ? 1 : 0,
    parsed.course!,
    parsed.program!,
    parsed.branch!,
    parsed.admissionYear!,
    parsed.yearOfStudy!,
    parsed.isLateral ? 1 : 0,
    parsed.bucket!,
    derivedType,
    JSON.stringify(skills),
    JSON.stringify(defaultStats),
    Number(basePrice),
    referredFranchiseId || null,
    detainedFlag ? 1 : 0,
    bucketNumber
  );

  return res.status(201).json({
    message: 'Registration successful',
    playerId: id,
    bucket: parsed.bucket,
    bucketNumber,
    isReferenceEligible: parsed.isReferenceEligible,
  });
});

/**
 * Public Player List (Phone numbers stripped)
 */
playersRouter.get(['/', '/public-list'], (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM players ORDER BY name ASC').all() as any[];
  const players: Player[] = rows.map((r) => ({
    id: r.id,
    rollNumber: r.roll_number,
    name: r.name,
    mobile: r.mobile,
    photoUrl: r.photo_url,
    cricHeroesProfileUrl: r.cricheroes_url,
    cricHeroesMobile: r.cricheroes_mobile,
    cricHeroesPending: Boolean(r.cricheroes_pending),
    course: r.course,
    program: r.program,
    branch: r.branch,
    admissionYear: r.admission_year,
    yearOfStudy: r.year_of_study,
    isLateral: Boolean(r.is_lateral),
    bucket: r.bucket,
    derivedType: r.derived_type,
    skills: JSON.parse(r.skills_json),
    stats: JSON.parse(r.stats_json),
    basePrice: r.base_price,
    referredFranchiseId: r.referred_franchise_id,
    isPaid: Boolean(r.is_paid),
    isDetainedOverride: Boolean(r.is_detained_override),
    status: r.status,
    bucketNumber: r.bucket_number,
    editingLocked: Boolean(r.editing_locked),
    assignedFranchiseId: r.assigned_franchise_id,
    soldPrice: r.sold_price,
  }));

  return res.json(sanitizePlayersForPublic(players));
});

/**
 * Admin: Mark as Paid (§5) - Only paid players become AUCTIONABLE
 */
playersRouter.patch('/:id/mark-paid', (req: Request, res: Response) => {
  const { id } = req.params;
  const { isPaid } = req.body;

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(id) as any;
  if (!player) return res.status(404).json({ error: 'Player not found' });

  // Disallow marking paid if CricHeroes profile is still pending
  if (isPaid && player.cricheroes_pending && !player.cricheroes_url) {
    return res.status(400).json({
      error: 'Cannot mark player as paid while CricHeroes profile is still pending.',
    });
  }

  const newStatus = isPaid ? 'AUCTIONABLE' : 'REGISTERED';
  db.prepare('UPDATE players SET is_paid = ?, status = ? WHERE id = ?').run(isPaid ? 1 : 0, newStatus, id);

  return res.json({ success: true, isPaid: Boolean(isPaid), status: newStatus });
});

/**
 * Admin: Override Year / Detained Student (§4.1)
 */
playersRouter.patch('/:id/override-year', (req: Request, res: Response) => {
  const { id } = req.params;
  const { yearOfStudy, bucket } = req.body;

  db.prepare(`
    UPDATE players 
    SET year_of_study = ?, bucket = ?, is_detained_override = 1 
    WHERE id = ?
  `).run(yearOfStudy, bucket, id);

  return res.json({ success: true });
});

/**
 * Admin: Lock Editing (§5.2)
 */
playersRouter.patch('/:id/lock-editing', (req: Request, res: Response) => {
  const { id } = req.params;
  const { locked } = req.body;

  db.prepare('UPDATE players SET editing_locked = ? WHERE id = ?').run(locked ? 1 : 0, id);
  return res.json({ success: true, editingLocked: Boolean(locked) });
});
