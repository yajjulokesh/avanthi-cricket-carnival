import React, { useState, useMemo } from 'react';
import { parseRollNumber, derivePlayerType, validateSkillProfile, CURRENT_ACADEMIC_YEAR } from '../../core/parser.js';
import { PlayerSkillProfile } from '../../core/types.js';
import { CheckCircle2, AlertTriangle, UserCheck, Flame, Shield } from 'lucide-react';

const BASE_PRICE_LADDER = [20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 230, 250];

export const RegisterView: React.FC = () => {
  // Primary Info
  const [rollNumber, setRollNumber] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [basePrice, setBasePrice] = useState(40);
  const [detainedFlag, setDetainedFlag] = useState(false);

  // CricHeroes (§5.2)
  const [cricHeroesUrl, setCricHeroesUrl] = useState('');
  const [cricHeroesMobile, setCricHeroesMobile] = useState('');
  const [cricHeroesPending, setCricHeroesPending] = useState(false);

  // ACC Reference Program
  const [referredFranchiseId, setReferredFranchiseId] = useState('');

  // Branching Skill Profile (§5.1)
  const [skills, setSkills] = useState<PlayerSkillProfile>({
    isSkilledBatter: true,
    battingStyle: 'Aggressive batter',
    preferredBattingPosition: 'Top order',
    battingArm: 'Right',

    isSkilledBowler: false,
    bowlingArm: 'Right',
    bowlingType: 'Fast',
    paceVariety: 'Swing',
    bowlingRoles: [],

    isWicketKeeper: false,
    fieldingZone: 'Infield',
    preferredFieldingPosition: 'Cover',

    highestLevelPlayed: 'Inter-college',
    playedPreviousACC: false,
    isFielderOnlyConfirmed: false,
  });

  const [submissionResult, setSubmissionResult] = useState<{ success: boolean; message: string } | null>(null);

  // Real-time roll number parsing
  const parsedRoll = useMemo(() => {
    if (!rollNumber.trim()) return null;
    return parseRollNumber(rollNumber.trim(), CURRENT_ACADEMIC_YEAR);
  }, [rollNumber]);

  // Derived player type
  const derivedType = useMemo(() => {
    return derivePlayerType(skills);
  }, [skills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionResult(null);

    if (!parsedRoll || !parsedRoll.isValid) {
      setSubmissionResult({ success: false, message: 'Please enter a valid student roll number.' });
      return;
    }

    if (!cricHeroesPending && (!cricHeroesUrl || !cricHeroesMobile)) {
      setSubmissionResult({
        success: false,
        message: 'CricHeroes profile URL and registered mobile are required, or check "Creation Pending".',
      });
      return;
    }

    const skillValidation = validateSkillProfile(skills);
    if (!skillValidation.isValid) {
      setSubmissionResult({ success: false, message: skillValidation.error || 'Invalid skill profile.' });
      return;
    }

    try {
      const res = await fetch('/api/players/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber,
          name,
          mobile,
          photoUrl,
          cricHeroesProfileUrl: cricHeroesUrl,
          cricHeroesMobile,
          cricHeroesPending,
          skills,
          basePrice,
          referredFranchiseId: referredFranchiseId || null,
          detainedFlag,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmissionResult({ success: false, message: data.error || 'Registration failed.' });
      } else {
        setSubmissionResult({
          success: true,
          message: `Registration successful! Assigned to Bucket ${data.bucket} (Bucket Lot #${data.bucketNumber}). Note: Fee is collected offline.`,
        });
        // Reset form
        setRollNumber('');
        setName('');
        setMobile('');
      }
    } catch (e: any) {
      setSubmissionResult({ success: false, message: e.message });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black font-chakra text-white tracking-wide">
          PLAYER AUCTION REGISTRATION
        </h2>
        <p className="text-xs text-slate-400 font-mono">
          Phase 1: Registration Window (1–10 October) • Authoritative Roll Number Validation
        </p>
      </div>

      {submissionResult && (
        <div
          className={`p-4 rounded-2xl border text-xs font-mono flex items-center justify-between ${
            submissionResult.success
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500 text-rose-300'
          }`}
        >
          <span>{submissionResult.message}</span>
          <button onClick={() => setSubmissionResult(null)} className="underline ml-2">Dismiss</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-8 shadow-xl">
        {/* Section 1: Academic & Roll Number */}
        <div className="space-y-4">
          <h3 className="text-sm font-chakra font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            1. Student Identification & Authoritative Roll Parsing (§4.1)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-300">Roll Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 25811A0403 or 25815A0403"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                className="w-full mt-1 bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300">Full Name *</label>
              <input
                type="text"
                required
                placeholder="As per college ID"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300">Mobile Number (Private Login Key) *</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full mt-1 bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 font-mono"
              />
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                🔒 Strictly private. Used alongside Roll Number to log in. Never displayed publicly.
              </p>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300">Photograph URL</label>
              <input
                type="url"
                placeholder="Direct link to photo"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full mt-1 bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 font-mono"
              />
            </div>
          </div>

          {/* Real-time Parsed Roll Number Card */}
          {parsedRoll && (
            <div
              className={`p-4 rounded-2xl border text-xs font-mono ${
                parsedRoll.isValid
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
              }`}
            >
              {parsedRoll.isValid ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-white">{parsedRoll.program}</span> ({parsedRoll.branch}) •{' '}
                    <span>Study Year: {parsedRoll.yearOfStudy}</span> •{' '}
                    <span className="text-amber-400 font-bold">Bucket: {parsedRoll.bucket}</span>
                    {parsedRoll.isLateral && <span className="ml-2 text-cyan-400 font-bold">(Lateral Entry)</span>}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{parsedRoll.error}</span>
                </div>
              )}
            </div>
          )}

          {/* ACC Reference Program question (§5.2) */}
          {parsedRoll?.isReferenceEligible && (
            <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-2">
              <label className="text-xs font-chakra font-bold text-amber-300">
                ACC Reference Program Declaration (§5.2)
              </label>
              <p className="text-[11px] text-slate-300">
                You were admitted in the current academic year ({CURRENT_ACADEMIC_YEAR}). Did you join Avanthi through the ACC reference program?
              </p>
              <input
                type="text"
                placeholder="If referred by a franchise, enter team name here..."
                value={referredFranchiseId}
                onChange={(e) => setReferredFranchiseId(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-700"
              />
            </div>
          )}
        </div>

        {/* Section 2: Branching Skill Profile (§5.1) */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-chakra font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4" />
              2. Branching Skill Profile (§5.1)
            </h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              Derived: {derivedType}
            </span>
          </div>

          {/* Section A - Batting */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Do you consider yourself a skilled batter?</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSkills({ ...skills, isSkilledBatter: true })}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                    skills.isSkilledBatter ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setSkills({ ...skills, isSkilledBatter: false })}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                    !skills.isSkilledBatter ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Branching Batting Questions */}
            {skills.isSkilledBatter && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Batting Style</label>
                  <select
                    value={skills.battingStyle}
                    onChange={(e) => setSkills({ ...skills, battingStyle: e.target.value as any })}
                    className="w-full mt-1 bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-700"
                  >
                    <option value="Strike rotator">Strike rotator</option>
                    <option value="Aggressive batter">Aggressive batter</option>
                    <option value="Big hitter">Big hitter</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Preferred Position</label>
                  <select
                    value={skills.preferredBattingPosition}
                    onChange={(e) => setSkills({ ...skills, preferredBattingPosition: e.target.value as any })}
                    className="w-full mt-1 bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-700"
                  >
                    <option value="Opener">Opener</option>
                    <option value="Top order">Top order</option>
                    <option value="Middle order">Middle order</option>
                    <option value="Finisher">Finisher</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section B - Bowling */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Do you consider yourself a skilled bowler?</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSkills({ ...skills, isSkilledBowler: true })}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                    skills.isSkilledBowler ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setSkills({ ...skills, isSkilledBowler: false })}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                    !skills.isSkilledBowler ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Branching Bowling Questions */}
            {skills.isSkilledBowler && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Bowling Type</label>
                  <select
                    value={skills.bowlingType}
                    onChange={(e) => setSkills({ ...skills, bowlingType: e.target.value as any })}
                    className="w-full mt-1 bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-700"
                  >
                    <option value="Fast">Fast</option>
                    <option value="Spin">Spin</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400">Variety</label>
                  {skills.bowlingType === 'Fast' ? (
                    <select
                      value={skills.paceVariety}
                      onChange={(e) => setSkills({ ...skills, paceVariety: e.target.value as any })}
                      className="w-full mt-1 bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-700"
                    >
                      <option value="Swing">Swing</option>
                      <option value="Seam">Seam</option>
                      <option value="Express pace">Express pace</option>
                    </select>
                  ) : (
                    <select
                      value={skills.spinVariety}
                      onChange={(e) => setSkills({ ...skills, spinVariety: e.target.value as any })}
                      className="w-full mt-1 bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-700"
                    >
                      <option value="Off-spin">Off-spin</option>
                      <option value="Leg-spin">Leg-spin</option>
                      <option value="Left-arm orthodox">Left-arm orthodox</option>
                      <option value="Left-arm wrist spin">Left-arm wrist spin</option>
                    </select>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section C - Wicket-keeping */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Are you a wicket-keeper?</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSkills({ ...skills, isWicketKeeper: true })}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                    skills.isWicketKeeper ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setSkills({ ...skills, isWicketKeeper: false })}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                    !skills.isWicketKeeper ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          {/* Fielder Only Guard (§5.1) */}
          {!skills.isSkilledBatter && !skills.isSkilledBowler && !skills.isWicketKeeper && (
            <div className="p-4 bg-rose-950/30 border border-rose-600/50 rounded-2xl space-y-2 text-xs">
              <span className="font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Validation Rule (§5.1): No Cricketing Skills Declared
              </span>
              <p className="text-slate-300">
                You have declared No to batter, No to bowler, and No to wicket-keeper. Franchises need to know your role before bidding.
              </p>
              <label className="flex items-center space-x-2 text-white font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={skills.isFielderOnlyConfirmed || false}
                  onChange={(e) => setSkills({ ...skills, isFielderOnlyConfirmed: e.target.checked })}
                  className="rounded border-slate-700"
                />
                <span>I explicitly confirm that I am registering as a FIELDER ONLY.</span>
              </label>
            </div>
          )}
        </div>

        {/* Section 3: CricHeroes & Base Price */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-chakra font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4" />
            3. CricHeroes Profile & Base Price Ladder (§5.2)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-300">CricHeroes Profile URL</label>
              <input
                type="url"
                disabled={cricHeroesPending}
                placeholder="https://cricheroes.in/player-profile/..."
                value={cricHeroesUrl}
                onChange={(e) => setCricHeroesUrl(e.target.value)}
                className="w-full mt-1 bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 font-mono disabled:opacity-40"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300">CricHeroes-Registered Mobile</label>
              <input
                type="tel"
                disabled={cricHeroesPending}
                placeholder="Phone keyed to CricHeroes"
                value={cricHeroesMobile}
                onChange={(e) => setCricHeroesMobile(e.target.value)}
                className="w-full mt-1 bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 font-mono disabled:opacity-40"
              />
            </div>
          </div>

          <label className="flex items-center space-x-2 text-xs text-amber-300 cursor-pointer">
            <input
              type="checkbox"
              checked={cricHeroesPending}
              onChange={(e) => setCricHeroesPending(e.target.checked)}
              className="rounded border-slate-700"
            />
            <span>Profile creation pending (allow registration now; must resolve before being marked paid)</span>
          </label>

          <div>
            <label className="text-xs font-mono text-slate-300">Base Price Ladder (Credits) *</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-1">
              {BASE_PRICE_LADDER.map((price) => (
                <button
                  type="button"
                  key={price}
                  onClick={() => setBasePrice(price)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition-colors ${
                    basePrice === price
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {price}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl font-chakra tracking-wide"
        >
          SUBMIT PLAYER REGISTRATION
        </button>
      </form>
    </div>
  );
};
