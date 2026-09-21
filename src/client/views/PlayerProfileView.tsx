import React, { useState } from 'react';
import { Player } from '../../core/types.js';
import { UserCheck, ShieldCheck, Flame, Trophy, Lock, AlertCircle } from 'lucide-react';

export const PlayerProfileView: React.FC = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [player, setPlayer] = useState<Player | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/player-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, mobile }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Authentication failed.');
      } else {
        setPlayer(data.player);
      }
    } catch (e: any) {
      setLoginError(e.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 lg:p-8 space-y-6">
      {!player ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold font-chakra text-white">PLAYER PORTAL LOGIN</h2>
            <p className="text-xs text-slate-400 font-mono">
              Strict Authentication via Authoritative Roll No. & Registered Mobile
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-950/40 border border-rose-600 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-300">Roll Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 25811A0403"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                className="w-full mt-1 bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300">Registered Mobile Number</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile registered on form"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full mt-1 bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs rounded-xl font-chakra tracking-wide shadow"
            >
              AUTHENTICATE & VIEW PROFILE
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-300">
                {player.bucket} • Lot Number #{player.bucketNumber || 'TBD'}
              </span>
              <h3 className="text-2xl font-black font-chakra text-white mt-2">{player.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {player.rollNumber} • {player.program} ({player.branch}) • Year {player.yearOfStudy}
              </p>
            </div>

            <button
              onClick={() => setPlayer(null)}
              className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg"
            >
              Logout
            </button>
          </div>

          {/* Status Badges */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[10px]">Fee Status</div>
              <div className={player.isPaid ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {player.isPaid ? '✅ Paid (Auctionable)' : '⏳ Offline Fee Pending'}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[10px]">Auction Outcome</div>
              <div className="text-white font-bold">{player.status}</div>
            </div>
          </div>

          {player.assignedFranchiseId && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-400 font-chakra font-bold">ACQUIRED BY FRANCHISE</div>
                <div className="text-lg font-bold text-white mt-0.5">{player.assignedFranchiseId}</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs text-slate-400">Winning Bid</div>
                <div className="text-xl font-bold text-amber-400">{player.soldPrice || player.basePrice} pts</div>
              </div>
            </div>
          )}

          {/* CricHeroes Details */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
            <div className="text-slate-400 font-bold">CricHeroes Link:</div>
            {player.cricHeroesProfileUrl ? (
              <a
                href={player.cricHeroesProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 underline block truncate"
              >
                {player.cricHeroesProfileUrl}
              </a>
            ) : (
              <span className="text-amber-400">Creation Pending</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
