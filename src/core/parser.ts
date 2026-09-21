import {
  AcademicCourse,
  Bucket,
  DerivedPlayerType,
  DiplomaBranch,
  PlayerSkillProfile,
  UGBranch,
} from './types.js';

export const CURRENT_ACADEMIC_YEAR = 26; // 2026-27 academic session (Rollover is 1 July)

export interface ParsedRollNumber {
  isValid: boolean;
  error?: string;
  course?: AcademicCourse;
  program?: string;
  branch?: string;
  admissionYear?: number;
  yearOfStudy?: number;
  isLateral?: boolean;
  bucket?: Bucket;
  isReferenceEligible?: boolean;
}

const UG_BRANCH_MAP: Record<string, UGBranch> = {
  '02': 'EEE',
  '03': 'ME',
  '04': 'ECE',
  '05': 'CSE',
  '42': 'CSM',
  '44': 'CSD',
};

const DIPLOMA_BRANCH_MAP: Record<string, DiplomaBranch> = {
  CM: 'CM',
  EC: 'EC',
  EE: 'EE',
  M: 'M',
};

/**
 * Parses authoritative student roll number per §4.1
 * Never allows year of study to be self-reported.
 */
export function parseRollNumber(
  rawRoll: string,
  currentYear: number = CURRENT_ACADEMIC_YEAR
): ParsedRollNumber {
  const roll = rawRoll.trim().toUpperCase();

  // 1. Check B.Tech Regular: YY811Abbnn (e.g. 25811A0403)
  const btechRegularRegex = /^(\d{2})811(1?A)(\d{2})([0-9A-Z]{2})$/;
  const regMatch = roll.match(btechRegularRegex);
  if (regMatch) {
    const admissionYear = parseInt(regMatch[1], 10);
    const branchCode = regMatch[3];
    const branch = UG_BRANCH_MAP[branchCode];

    if (!branch) {
      return { isValid: false, error: `Unknown UG branch code: ${branchCode}` };
    }

    const yearOfStudy = currentYear - admissionYear + 1;
    if (yearOfStudy < 1 || yearOfStudy > 4) {
      return { isValid: false, error: `Calculated year of study ${yearOfStudy} out of valid range (1-4)` };
    }

    const bucket: Bucket = `B${yearOfStudy}` as Bucket;
    const isReferenceEligible = admissionYear === currentYear;

    return {
      isValid: true,
      course: 'UG',
      program: 'B.Tech',
      branch,
      admissionYear,
      yearOfStudy,
      isLateral: false,
      bucket,
      isReferenceEligible,
    };
  }

  // 2. Check B.Tech Lateral Entry: YY815Abbnn (e.g. 25815A0403)
  const btechLateralRegex = /^(\d{2})815(1?A)(\d{2})([0-9A-Z]{2})$/;
  const latMatch = roll.match(btechLateralRegex);
  if (latMatch) {
    const admissionYear = parseInt(latMatch[1], 10);
    const branchCode = latMatch[3];
    const branch = UG_BRANCH_MAP[branchCode];

    if (!branch) {
      return { isValid: false, error: `Unknown UG lateral branch code: ${branchCode}` };
    }

    // Lateral entrants join directly in second year
    const yearOfStudy = currentYear - admissionYear + 2;
    if (yearOfStudy < 2 || yearOfStudy > 4) {
      return { isValid: false, error: `Calculated lateral year of study ${yearOfStudy} out of valid range (2-4)` };
    }

    const bucket: Bucket = `B${yearOfStudy}` as Bucket;
    const isReferenceEligible = admissionYear === currentYear;

    return {
      isValid: true,
      course: 'UG',
      program: 'B.Tech (Lateral Entry)',
      branch,
      admissionYear,
      yearOfStudy,
      isLateral: true,
      bucket,
      isReferenceEligible,
    };
  }

  // 3. Check Diploma: YY597-BB-nnn (e.g. 24597-CM-015, 26597-M-041)
  const diplomaRegex = /^(\d{2})597-([A-Z]{1,2})-(\d{3})$/;
  const dipMatch = roll.match(diplomaRegex);
  if (dipMatch) {
    const admissionYear = parseInt(dipMatch[1], 10);
    const branchCode = dipMatch[2];
    const branch = DIPLOMA_BRANCH_MAP[branchCode];

    if (!branch) {
      return { isValid: false, error: `Unknown Diploma branch code: ${branchCode}` };
    }

    const yearOfStudy = currentYear - admissionYear + 1;
    if (yearOfStudy < 1 || yearOfStudy > 3) {
      return { isValid: false, error: `Calculated diploma year ${yearOfStudy} out of valid range (1-3)` };
    }

    // All diploma years map strictly to Bucket B5
    const bucket: Bucket = 'B5';
    const isReferenceEligible = admissionYear === currentYear;

    return {
      isValid: true,
      course: 'Diploma',
      program: 'Polytechnic Diploma',
      branch,
      admissionYear,
      yearOfStudy,
      isLateral: false,
      bucket,
      isReferenceEligible,
    };
  }

  // 4. Check Postgraduate format (e.g. PG prefix or custom format)
  // §4.1: "The roll number is recorded, but program and specialisation are selected by the student and verified manually. PG players carry no squad requirement."
  const pgRegex = /^(\d{2})(PG|MTECH|MBA|MCA)[0-9A-Z]+$/;
  const pgMatch = roll.match(pgRegex);
  if (pgMatch) {
    const admissionYear = parseInt(pgMatch[1], 10);
    const yearOfStudy = currentYear - admissionYear + 1;
    return {
      isValid: true,
      course: 'PG',
      program: 'Postgraduate',
      branch: 'Various',
      admissionYear,
      yearOfStudy: Math.min(Math.max(yearOfStudy, 1), 2),
      isLateral: false,
      bucket: 'PG',
      isReferenceEligible: admissionYear === currentYear,
    };
  }

  return {
    isValid: false,
    error: 'Unrecognized roll number format. Must match B.Tech (YY811A...), B.Tech Lateral (YY815A...), Diploma (YY597-BB-nnn), or PG format.',
  };
}

/**
 * Derives player type from skill questionnaire per §5.1
 */
export function derivePlayerType(skills: PlayerSkillProfile): DerivedPlayerType {
  const { isSkilledBatter, isSkilledBowler, isWicketKeeper } = skills;

  if (isWicketKeeper && isSkilledBatter) {
    return 'Wicket-keeper batter';
  }
  if (isWicketKeeper && !isSkilledBatter) {
    return 'Wicket-keeper';
  }
  if (isSkilledBatter && isSkilledBowler) {
    return 'All-rounder';
  }
  if (isSkilledBatter && !isSkilledBowler) {
    return 'Batter';
  }
  if (!isSkilledBatter && isSkilledBowler) {
    return 'Bowler';
  }
  return 'Fielder';
}

/**
 * Validates player skill profile per §5.1
 * A player who answers No to batter, bowler, and WK must explicitly confirm fielder only.
 */
export function validateSkillProfile(skills: PlayerSkillProfile): { isValid: boolean; error?: string } {
  const { isSkilledBatter, isSkilledBowler, isWicketKeeper, isFielderOnlyConfirmed } = skills;

  if (!isSkilledBatter && !isSkilledBowler && !isWicketKeeper) {
    if (!isFielderOnlyConfirmed) {
      return {
        isValid: false,
        error: 'You have declared no batting, bowling, or wicket-keeping skills. Please declare at least one skill or explicitly confirm registering as a fielder only.',
      };
    }
  }

  return { isValid: true };
}
