import React, { useState } from 'react';
import { Bucket } from '../../../core/types.js';
import { Sliders, X, AlertTriangle } from 'lucide-react';

interface BucketRelaxationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRelax: (bucket: Bucket, newMinimum: number) => Promise<{ success: boolean; error?: string }>;
}

const BUCKET_OPTIONS: Array<{ value: Bucket; label: string }> = [
  { value: 'B1', label: 'B1 // B.Tech 1st Year' },
  { value: 'B2', label: 'B2 // B.Tech 2nd Year' },
  { value: 'B3', label: 'B3 // B.Tech 3rd Year' },
  { value: 'B4', label: 'B4 // B.Tech 4th Year' },
  { value: 'B5', label: 'B5 // Polytechnic Diploma' },
];

/**
 * BucketRelaxationModal - Uniform Quota Relaxation Engine (§7, §13)
 * Engineered to Whoop precision standards:
 * - Solves bucket insolvency before or during the auction
 * - Invariant: Applied uniformly to all eleven franchises equally, NEVER to one
 */
export const BucketRelaxationModal: React.FC<BucketRelaxationModalProps> = ({
  isOpen,
  onClose,
  onConfirmRelax,
}) => {
  const [targetBucket, setTargetBucket] = useState<Bucket>('B5');
  const [newMinimum, setNewMinimum] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await onConfirmRelax(targetBucket, newMinimum);
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to update bucket minimum.');
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-whoop-surface border border-whoop-border max-w-md w-full rounded-xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-whoop-borderMuted pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-amber-950/50 border border-amber-900/60 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-whoop-telemetry" />
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] text-whoop-textMuted uppercase font-bold block">
                TOURNAMENT CONFIG // SQUAD RULES
              </span>
              <h3 className="text-base font-bold font-sans text-white tracking-tight">
                UNIFORM BUCKET RELAXATION (§7, §13)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-whoop-elevated hover:bg-zinc-800 text-zinc-400 hover:text-white border border-whoop-border flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rule Invariant Callout */}
        <div className="p-3.5 rounded-lg bg-whoop-elevated border border-whoop-border space-y-2 font-mono text-[11px] text-whoop-textDim leading-relaxed">
          <div className="flex items-center space-x-2 text-white font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-whoop-telemetry shrink-0" />
            <span>UNIVERSAL APPLICATION MANDATE</span>
          </div>
          <p>
            When a bucket suffers natural player supply shortages, the Super Admin relaxes the quota. This change applies uniformly to all eleven franchises, never to an individual team (§7).
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-400 font-mono text-xs">
            {errorMessage}
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] text-whoop-textMuted uppercase mb-1 font-bold">
              TARGET BUCKET QUOTA
            </label>
            <select
              value={targetBucket}
              onChange={(e) => setTargetBucket(e.target.value as Bucket)}
              className="w-full bg-whoop-carbon text-white font-mono text-xs p-3 rounded-lg border border-whoop-border focus:outline-none focus:border-zinc-500 font-medium"
            >
              {BUCKET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-whoop-textMuted uppercase mb-1 font-bold">
              NEW UNIFORM MINIMUM PER FRANCHISE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setNewMinimum(num)}
                  className={`py-2.5 rounded-lg font-mono text-xs font-bold transition-all border ${
                    newMinimum === num
                      ? 'bg-whoop-elevated text-white border-zinc-500 shadow-sm'
                      : 'bg-whoop-carbon text-whoop-textMuted border-whoop-border hover:text-white'
                  }`}
                >
                  {num} PLAYERS
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] text-whoop-textMuted mt-1.5">
              Default is 2 players per bucket (10 mandatory auction purchases).
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-whoop-borderMuted">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-whoop-elevated hover:bg-zinc-800 text-zinc-300 border border-whoop-border font-mono text-xs font-semibold rounded-lg transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 bg-whoop-telemetry hover:bg-amber-400 disabled:opacity-50 text-whoop-carbon font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:translate-y-[1px]"
            >
              {isProcessing ? 'APPLYING...' : 'APPLY UNIFORMLY'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
