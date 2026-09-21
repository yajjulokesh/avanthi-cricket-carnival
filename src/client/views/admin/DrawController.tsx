import React, { useState } from 'react';
import { Bucket } from '../../../core/types.js';
import { PlayCircle, Hash, Sparkles, Layers } from 'lucide-react';

interface DrawControllerProps {
  onLoadLot: (isGuest: boolean, bucket?: Bucket, bucketNumber?: number) => void;
  isLotActive: boolean;
}

/**
 * DrawController - Lot Selection & Draw Operations (§10)
 * Allows switching between:
 * - Guest Mode: Enter number called aloud by an honorary guest
 * - Auto Mode: Random draw within current bucket following canonical sequence:
 *   B3 -> B4 -> B2 -> B5 (Diploma) -> B1 -> PG
 */
export const DrawController: React.FC<DrawControllerProps> = ({
  onLoadLot,
  isLotActive,
}) => {
  const [activeTab, setActiveTab] = useState<'AUTO' | 'GUEST'>('AUTO');
  const [guestBucket, setGuestBucket] = useState<Bucket>('B3');
  const [guestNumberInput, setGuestNumberInput] = useState<string>('');

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestNumberInput.trim()) return;
    const num = parseInt(guestNumberInput, 10);
    if (isNaN(num)) return;
    onLoadLot(true, guestBucket, num);
    setGuestNumberInput('');
  };

  return (
    <section className="bg-whoop-surface border border-whoop-border rounded-xl p-5 lg:p-6 shadow-sm space-y-4">
      {/* Section Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-whoop-borderMuted pb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-whoop-highlight" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-whoop-textMuted uppercase font-bold">
            INGESTION // DRAW CONTROLLER (§10)
          </span>
        </div>

        {/* Tab Segmenter */}
        <div className="inline-flex bg-whoop-carbon border border-whoop-border rounded-lg p-0.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('AUTO')}
            className={`px-3 py-1 rounded-md transition-all font-bold ${
              activeTab === 'AUTO'
                ? 'bg-whoop-elevated text-white border border-whoop-border'
                : 'text-whoop-textMuted hover:text-zinc-300'
            }`}
          >
            AUTO SEQUENCE
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('GUEST')}
            className={`px-3 py-1 rounded-md transition-all font-bold ${
              activeTab === 'GUEST'
                ? 'bg-whoop-elevated text-white border border-whoop-border'
                : 'text-whoop-textMuted hover:text-zinc-300'
            }`}
          >
            GUEST CALLOUT
          </button>
        </div>
      </div>

      {/* Mode Body */}
      {activeTab === 'AUTO' ? (
        <div className="bg-whoop-elevated/60 border border-whoop-border rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-whoop-telemetry" />
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Canonical Draw Sequence (§10)
              </h4>
            </div>
            <p className="font-mono text-[11px] text-whoop-textDim">
              Order: <span className="text-white">B3 (3rd Yr)</span> → <span className="text-white">B4 (4th Yr)</span> → <span className="text-white">B2 (2nd Yr)</span> → <span className="text-white">B5 (Diploma)</span> → <span className="text-white">B1 (1st Yr)</span> → <span className="text-white">PG</span>
            </p>
          </div>

          <button
            type="button"
            disabled={isLotActive}
            onClick={() => onLoadLot(false)}
            className="w-full md:w-auto px-5 py-2.5 bg-whoop-elevated hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white border border-whoop-border font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:translate-y-[1px] flex items-center justify-center space-x-2 shrink-0"
          >
            <PlayCircle className="w-4 h-4 text-whoop-recovery" />
            <span>DRAW NEXT IN SEQUENCE</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleGuestSubmit} className="bg-whoop-elevated/60 border border-whoop-border rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <Hash className="w-3.5 h-3.5 text-whoop-telemetry" />
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Honorary Guest Callout (§10)
            </h4>
          </div>
          <p className="font-mono text-[11px] text-whoop-textDim">
            An honorary guest calls a number aloud from the target bucket pool. Enter the called index to mount the lot immediately.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-4">
              <label className="block font-mono text-[10px] text-whoop-textMuted uppercase mb-1 font-bold">
                TARGET BUCKET
              </label>
              <select
                value={guestBucket}
                onChange={(e) => setGuestBucket(e.target.value as Bucket)}
                className="w-full bg-whoop-carbon text-white font-mono text-xs p-2.5 rounded-lg border border-whoop-border focus:outline-none focus:border-zinc-500"
              >
                <option value="B3">B3 // B.Tech 3rd Year</option>
                <option value="B4">B4 // B.Tech 4th Year</option>
                <option value="B2">B2 // B.Tech 2nd Year</option>
                <option value="B5">B5 // Polytechnic Diploma</option>
                <option value="B1">B1 // B.Tech 1st Year</option>
                <option value="PG">PG // Postgraduate</option>
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block font-mono text-[10px] text-whoop-textMuted uppercase mb-1 font-bold">
                CALLED NUMBER
              </label>
              <input
                type="number"
                min={1}
                required
                placeholder="e.g. 7"
                value={guestNumberInput}
                onChange={(e) => setGuestNumberInput(e.target.value)}
                className="w-full bg-whoop-carbon text-white font-mono text-xs p-2.5 rounded-lg border border-whoop-border focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={isLotActive || !guestNumberInput}
                className="w-full py-2.5 px-4 bg-whoop-elevated hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white border border-whoop-border font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:translate-y-[1px]"
              >
                LOAD LOT
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
};
