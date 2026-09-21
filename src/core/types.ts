export type AcademicCourse = 'UG' | 'Diploma' | 'PG';

export type UGBranch = 'EEE' | 'ME' | 'ECE' | 'CSE' | 'CSM' | 'CSD';
export type DiplomaBranch = 'CM' | 'EC' | 'EE' | 'M';

export type Bucket = 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'PG';

export type DerivedPlayerType =
  | 'Wicket-keeper batter'
  | 'Wicket-keeper'
  | 'All-rounder'
  | 'Batter'
  | 'Bowler'
  | 'Fielder';

export type BattingStyle = 'Strike rotator' | 'Aggressive batter' | 'Big hitter';
export type BattingPosition = 'Opener' | 'Top order' | 'Middle order' | 'Finisher';
export type BattingArm = 'Right' | 'Left';

export type BowlingArm = 'Right' | 'Left';
export type BowlingType = 'Fast' | 'Spin';
export type PaceVariety = 'Swing' | 'Seam' | 'Express pace';
export type SpinVariety = 'Off-spin' | 'Leg-spin' | 'Left-arm orthodox' | 'Left-arm wrist spin';
export type BowlingRole = 'Powerplay specialist' | 'Economical bowler' | 'Death-over specialist' | 'Wicket-taking bowler';

export type FieldingZone = 'Infield' | 'Outfield';
export type FieldingPosition =
  | 'Slip'
  | 'Point'
  | 'Cover'
  | 'Mid-off'
  | 'Mid-on'
  | 'Mid-wicket'
  | 'Square leg'
  | 'Third man'
  | 'Fine leg'
  | 'Long-on'
  | 'Long-off'
  | 'Deep midwicket';

export type HighestLevel = 'District or above' | 'Inter-college' | 'School or intra-college' | 'Recreational only';

export interface PlayerSkillProfile {
  // Section A - Batting
  isSkilledBatter: boolean;
  battingStyle?: BattingStyle;
  preferredBattingPosition?: BattingPosition;
  battingArm: BattingArm;

  // Section B - Bowling
  isSkilledBowler: boolean;
  bowlingArm?: BowlingArm;
  bowlingType?: BowlingType;
  paceVariety?: PaceVariety;
  spinVariety?: SpinVariety;
  bowlingRoles?: BowlingRole[];

  // Section C - Fielding & WK
  isWicketKeeper: boolean;
  fieldingZone?: FieldingZone;
  preferredFieldingPosition?: FieldingPosition;

  // Section D - Experience
  highestLevelPlayed: HighestLevel;
  playedPreviousACC: boolean;
  previousTeamName?: string;

  // Fielder-only explicit confirmation if all three are false
  isFielderOnlyConfirmed?: boolean;
}

export interface CricHeroesStats {
  matches: number;
  runs: number;
  battingAverage: number;
  strikeRate: number;
  highestScore: string;
  wickets: number;
  bowlingAverage: number;
  economy: number;
  bestBowling: string;
  catches: number;
  stumpings: number;
}

export type PlayerStatus =
  | 'REGISTERED'
  | 'RETAINED'
  | 'REFERRED'
  | 'AUCTIONABLE'
  | 'SOLD'
  | 'ALLOTTED'
  | 'UNSOLD'
  | 'SKIPPED';

export interface Player {
  id: string;
  rollNumber: string;
  name: string;
  mobile: string; // STRICTLY PRIVATE
  photoUrl: string;
  cricHeroesProfileUrl: string;
  cricHeroesMobile: string; // STRICTLY PRIVATE
  cricHeroesPending: boolean;
  course: AcademicCourse;
  program: string;
  branch: string;
  admissionYear: number;
  yearOfStudy: number;
  isLateral: boolean;
  bucket: Bucket;
  derivedType: DerivedPlayerType;
  skills: PlayerSkillProfile;
  stats: CricHeroesStats;
  basePrice: number;
  referredFranchiseId?: string;
  isPaid: boolean;
  isDetainedOverride: boolean;
  status: PlayerStatus;
  bucketNumber?: number; // Scoped random number within bucket
  editingLocked: boolean;
  assignedFranchiseId?: string;
  soldPrice?: number;
}

// Public-safe player projection (phone numbers physically stripped)
export type PublicPlayer = Omit<Player, 'mobile' | 'cricHeroesMobile'>;

export interface Franchise {
  id: string;
  name: string;
  logoUrl: string;
  coordName: string;
  coordDepartment: string;
  coordPhotoUrl: string;
  coordPhone: string; // STRICTLY PRIVATE
  captainPhone?: string; // STRICTLY PRIVATE
  captainPlayerId?: string;
  viceCaptainPlayerId?: string;
  startingPurse: number;
  currentPurse: number;
  squadCount: number;
  auctionPurchasesCount: number;
  bucketCounts: Record<Bucket, number>;
}

export type PublicFranchise = Omit<Franchise, 'coordPhone' | 'captainPhone'>;

export interface AuctionSaleRecord {
  id: string;
  lotNumber: number;
  playerId: string;
  franchiseId: string;
  amount: number;
  bucket: Bucket;
  status: 'CONFIRMED' | 'UNDONE';
  undoneAt?: string;
  undoneBy?: string;
  undoReason?: string;
  createdAt: string;
}

export interface LotState {
  lotNumber: number;
  player: PublicPlayer | null;
  currentPrice: number;
  highestBidderFranchiseId: string | null;
  highestBidderFranchiseName: string | null;
  timerSecondsRemaining: number;
  timerEndsAt: number | null; // Milliseconds timestamp
  status: 'IDLE' | 'ACTIVE' | 'PAUSED' | 'SOLD' | 'UNSOLD';
  inPlayFranchiseIds: string[]; // Franchises currently in play
  passedFranchiseIds: string[]; // Franchises that pressed pass
  blockedFranchiseIds: string[]; // Franchises structurally blocked
  bucket: Bucket | null;
  drawMode: 'GUEST' | 'AUTO';
  round: 1 | 2;
}

export interface ScarcityStatus {
  bucket: Bucket;
  unsoldSupply: number;
  totalDemand: number;
  isScarcityWarning: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: 'SUPER_ADMIN' | 'OPERATOR' | 'SYSTEM';
  actorId: string;
  action: string;
  details: Record<string, any>;
}
