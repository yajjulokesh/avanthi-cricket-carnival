import { db, initDatabase } from './db.js';
import { CURRENT_ACADEMIC_YEAR, parseRollNumber } from '../core/parser.js';

export function seedDatabase() {
  initDatabase();

  const franchiseCount = db.prepare('SELECT count(*) as cnt FROM franchises').get() as { cnt: number };
  if (franchiseCount.cnt >= 11) {
    console.log('Database already seeded with franchises.');
    return;
  }

  console.log('Seeding initial franchises and players for Avanthi Cricket Carnival...');

  // 1. Create Tournament
  db.prepare(`
    INSERT OR REPLACE INTO tournaments (id, name, academic_year, status)
    VALUES ('acc-2026', 'Avanthi Cricket Carnival 2026', 26, 'AUCTION_R1')
  `).run();

  // 2. Create the 11 Franchises
  const franchises = [
    { id: 'team-1', name: 'Avanthi Titans', coord: 'Dr. K. Srinivas', dept: 'ECE', phone: '9848011111', capPhone: '9848011112' },
    { id: 'team-2', name: 'Royal Strikers', coord: 'Prof. M. Ramesh', dept: 'CSE', phone: '9848022221', capPhone: '9848022222' },
    { id: 'team-3', name: 'Deccan Warriors', coord: 'Dr. V. Prasad', dept: 'ME', phone: '9848033331', capPhone: '9848033332' },
    { id: 'team-4', name: 'Coastal Kings', coord: 'Prof. S. Rao', dept: 'EEE', phone: '9848044441', capPhone: '9848044442' },
    { id: 'team-5', name: 'Vizag Blasters', coord: 'Dr. P. Suresh', dept: 'CSM', phone: '9848055551', capPhone: '9848055552' },
    { id: 'team-6', name: 'Carnival Challengers', coord: 'Prof. A. Kumar', dept: 'CSD', phone: '9848066661', capPhone: '9848066662' },
    { id: 'team-7', name: 'Bay City Superstars', coord: 'Dr. B. Naidu', dept: 'ECE', phone: '9848077771', capPhone: '9848077772' },
    { id: 'team-8', name: 'Polytechnic Panthers', coord: 'Prof. G. Varma', dept: 'Diploma', phone: '9848088881', capPhone: '9848088882' },
    { id: 'team-9', name: 'East Coast Eagles', coord: 'Dr. T. Reddy', dept: 'CSE', phone: '9848099991', capPhone: '9848099992' },
    { id: 'team-10', name: 'Avanthi Lions', coord: 'Prof. N. Murthy', dept: 'ME', phone: '9848100001', capPhone: '9848100002' },
    { id: 'team-11', name: 'Apex Hurricanes', coord: 'Dr. H. Sharma', dept: 'ECE', phone: '9848111111', capPhone: '9848111112' },
  ];

  const insertFranchise = db.prepare(`
    INSERT OR REPLACE INTO franchises (
      id, name, logo_url, coord_name, coord_department, coord_phone, captain_phone, starting_purse
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1000)
  `);

  for (const f of franchises) {
    insertFranchise.run(
      f.id,
      f.name,
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(f.name)}`,
      f.coord,
      f.dept,
      f.phone,
      f.capPhone
    );
  }

  // 3. Seed Players across B1..B5 and PG
  const samplePlayers = [
    // B3 (B.Tech 3rd year regular & lateral)
    { roll: '25815A0403', name: 'K. Sai Teja', base: 40, batter: true, bowler: true, wk: false, stats: { m: 18, r: 420, sr: 135.5, w: 22, eco: 7.1 } },
    { roll: '24811A0501', name: 'P. Rohit Varma', base: 60, batter: true, bowler: false, wk: false, stats: { m: 24, r: 780, sr: 142.1, w: 0, eco: 0 } },
    { roll: '24811A0412', name: 'V. Nikhil', base: 50, batter: false, bowler: true, wk: false, stats: { m: 16, r: 45, sr: 90, w: 28, eco: 6.4 } },
    { roll: '24811A4204', name: 'S. Tarun', base: 70, batter: true, bowler: false, wk: true, stats: { m: 30, r: 890, sr: 138, w: 0, eco: 0 } },

    // B4 (B.Tech 4th year)
    { roll: '23811A4201', name: 'B. Manoj Kumar', base: 80, batter: true, bowler: true, wk: false, stats: { m: 42, r: 1120, sr: 148.2, w: 35, eco: 7.4 } },
    { roll: '23811A0515', name: 'G. Naveen', base: 50, batter: true, bowler: false, wk: false, stats: { m: 22, r: 540, sr: 125, w: 0, eco: 0 } },
    { roll: '23811A0201', name: 'K. Dinesh', base: 40, batter: false, bowler: true, wk: false, stats: { m: 26, r: 60, sr: 85, w: 32, eco: 6.8 } },
    { roll: '23811A0305', name: 'M. Santosh', base: 30, batter: false, bowler: true, wk: false, stats: { m: 14, r: 20, sr: 70, w: 18, eco: 7.9 } },

    // B2 (B.Tech 2nd year regular & lateral)
    { roll: '25811A0403', name: 'A. Harsha Vardhan', base: 50, batter: true, bowler: true, wk: false, stats: { m: 15, r: 380, sr: 132, w: 14, eco: 7.2 } },
    { roll: '25811A0545', name: 'R. Sandeep', base: 40, batter: true, bowler: false, wk: false, stats: { m: 12, r: 310, sr: 128, w: 0, eco: 0 } },
    { roll: '25811A4402', name: 'J. Pradeep', base: 30, batter: false, bowler: true, wk: false, stats: { m: 10, r: 15, sr: 60, w: 15, eco: 6.9 } },
    { roll: '26815A0403', name: 'D. Yashwanth (Lateral)', base: 40, batter: false, bowler: true, wk: false, stats: { m: 14, r: 30, sr: 80, w: 19, eco: 7.1 } },

    // B5 (Diploma)
    { roll: '24597-CM-015', name: 'Ch. Jagadeesh', base: 40, batter: true, bowler: false, wk: false, stats: { m: 16, r: 420, sr: 130, w: 0, eco: 0 } },
    { roll: '24597-EC-032', name: 'P. Bhanu Prakash', base: 30, batter: false, bowler: true, wk: false, stats: { m: 12, r: 18, sr: 75, w: 16, eco: 6.8 } },
    { roll: '25597-EE-005', name: 'T. Kalyan', base: 50, batter: true, bowler: true, wk: false, stats: { m: 20, r: 490, sr: 139, w: 21, eco: 7.3 } },
    { roll: '26597-M-041', name: 'S. Lokesh', base: 20, batter: false, bowler: false, wk: true, stats: { m: 10, r: 180, sr: 115, w: 0, eco: 0 } },

    // B1 (B.Tech 1st year)
    { roll: '26811A0501', name: 'N. Akhil (Freshman)', base: 30, batter: true, bowler: false, wk: false, stats: { m: 8, r: 210, sr: 122, w: 0, eco: 0 } },
    { roll: '26811A0410', name: 'E. Vivek', base: 20, batter: false, bowler: true, wk: false, stats: { m: 6, r: 10, sr: 50, w: 9, eco: 6.5 } },
    { roll: '26811A0205', name: 'B. Charan', base: 40, batter: true, bowler: true, wk: false, stats: { m: 9, r: 195, sr: 131, w: 11, eco: 7.0 } },
    { roll: '26811A4408', name: 'G. Hemanth', base: 20, batter: true, bowler: false, wk: true, stats: { m: 7, r: 140, sr: 110, w: 0, eco: 0 } },

    // PG (Postgraduate)
    { roll: '25MBA01', name: 'R. Vikram (MBA)', base: 40, batter: true, bowler: true, wk: false, stats: { m: 28, r: 650, sr: 140, w: 24, eco: 7.5 } },
    { roll: '26MCA05', name: 'K. Balaji (MCA)', base: 30, batter: false, bowler: true, wk: false, stats: { m: 18, r: 35, sr: 70, w: 22, eco: 6.7 } },
  ];

  const insertPlayer = db.prepare(`
    INSERT OR REPLACE INTO players (
      id, roll_number, name, mobile, photo_url, cricheroes_url, cricheroes_mobile,
      cricheroes_pending, course, program, branch, admission_year, year_of_study,
      is_lateral, bucket, derived_type, skills_json, stats_json, base_price,
      is_paid, status, bucket_number, editing_locked
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'AUCTIONABLE', ?, 0
    )
  `);

  let idx = 1;
  for (const p of samplePlayers) {
    const parsed = parseRollNumber(p.roll, CURRENT_ACADEMIC_YEAR);
    const id = `player-${idx}`;
    const skills = {
      isSkilledBatter: p.batter,
      battingStyle: p.batter ? 'Aggressive batter' : undefined,
      preferredBattingPosition: p.batter ? 'Top order' : undefined,
      battingArm: 'Right',
      isSkilledBowler: p.bowler,
      bowlingArm: p.bowler ? 'Right' : undefined,
      bowlingType: p.bowler ? 'Fast' : undefined,
      paceVariety: p.bowler ? 'Swing' : undefined,
      isWicketKeeper: p.wk,
      highestLevelPlayed: 'Inter-college',
      playedPreviousACC: true,
    };

    const stats = {
      matches: p.stats.m,
      runs: p.stats.r,
      battingAverage: Math.round((p.stats.r / Math.max(1, p.stats.m - 4)) * 10) / 10,
      strikeRate: p.stats.sr,
      highestScore: `${Math.round(p.stats.r / 5)}*`,
      wickets: p.stats.w,
      bowlingAverage: p.stats.w ? 18.5 : 0,
      economy: p.stats.eco,
      bestBowling: p.stats.w ? '4/18' : '0/0',
      catches: 8,
      stumpings: p.wk ? 4 : 0,
    };

    let derivedType = 'All-rounder';
    if (p.wk && p.batter) derivedType = 'Wicket-keeper batter';
    else if (p.wk) derivedType = 'Wicket-keeper';
    else if (p.batter && p.bowler) derivedType = 'All-rounder';
    else if (p.batter) derivedType = 'Batter';
    else if (p.bowler) derivedType = 'Bowler';

    insertPlayer.run(
      id,
      p.roll,
      p.name,
      `9876543${String(idx).padStart(3, '0')}`,
      `https://images.unsplash.com/photo-${1534528741775 + idx}?auto=format&fit=crop&w=400&q=80`,
      `https://cricheroes.in/player-profile/${idx}/${encodeURIComponent(p.name)}`,
      `9876543${String(idx).padStart(3, '0')}`,
      parsed.course || 'UG',
      parsed.program || 'B.Tech',
      parsed.branch || 'CSE',
      parsed.admissionYear || 24,
      parsed.yearOfStudy || 3,
      parsed.isLateral ? 1 : 0,
      parsed.bucket || 'B3',
      derivedType,
      JSON.stringify(skills),
      JSON.stringify(stats),
      p.base,
      idx
    );
    idx++;
  }

  console.log(`Successfully seeded 11 franchises and ${samplePlayers.length} auctionable players!`);
}
