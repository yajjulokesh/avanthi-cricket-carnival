import React, { useState } from 'react';
import { RotateCcw, X, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface SafeUndoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmUndo: (saleId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * SafeUndoModal - Event-Sourced Historical Sale Reversal (§12.4)
 * Engineered to Whoop precision telemetry standards:
 * - Reverses any historical sale from any lot index
 * - Strictly requires a non-empty audit log reason for non-repudiation
 * - Recalculates purse, slots, and quotas dynamically from the ledger with zero counter drift
 */
export const SafeUndoModal: React.FC<SafeUndoModalProps> = ({
  isOpen,
  onClose,
  onConfirmUndo,
}) => {
  const [saleIdInput, setSaleIdInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleIdInput.trim() || !reasonInput.trim()) {
      setErrorMessage('Sale ID and mandatory reversal reason are both required.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await onConfirmUndo(saleIdInput.trim(), reasonInput.trim());
      if (!result.success) {
        setErrorMessage(result.error || 'Undo operation was rejected by server.');
      } else {
        setSaleIdInput('');
        setReasonInput('');
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during undo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-whoop-surface border border-whoop-border max-w-lg w-full rounded-xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-whoop-borderMuted pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-red-950/50 border border-red-900/60 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-whoop-strain" />
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] text-whoop-textMuted uppercase font-bold block">
                AUDIT LOG // RECOVERY ENGINE
              </span>
              <h3 className="text-base font-bold font-sans text-white tracking-tight">
                SAFE HISTORICAL SALE REVERSAL (§12.4)
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

        {/* Informational Guidance */}
        <div className="p-3.5 rounded-lg bg-whoop-elevated border border-whoop-border space-y-2 font-mono text-[11px] text-whoop-textDim leading-relaxed">
          <div className="flex items-center space-x-2 text-white font-bold">
            <AlertOctagon className="w-3.5 h-3.5 text-whoop-strain shrink-0" />
            <span>AUTHORITATIVE NON-DRIFTING TRANSACTION ROLLBACK</span>
          </div>
          <p>
            Reversing a sale refunds the credits immediately, reopens the franchise squad slot, returns the player to the auctionable pool, and recalculates all §12 invariants dynamically. Duplicate undo attempts are strictly blocked.
          </p>
        </div>

        {/* Error Display */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-400 font-mono text-xs flex items-start space-x-2">
            <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] text-whoop-textMuted uppercase mb-1 font-bold">
              SALE IDENTIFIER // TRANSACTION ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. sale-1789902088500-1"
              value={saleIdInput}
              onChange={(e) => setSaleIdInput(e.target.value)}
              className="w-full bg-whoop-carbon text-white font-mono text-xs p-3 rounded-lg border border-whoop-border focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-whoop-textMuted uppercase mb-1 font-bold">
              MANDATORY REVERSAL REASON (AUDIT LOGGED) *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Operator misclick during hammer; bid credited to incorrect franchise table; device lag..."
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              className="w-full bg-whoop-carbon text-white font-sans text-xs p-3 rounded-lg border border-whoop-border focus:outline-none focus:border-zinc-500"
            />
            <p className="font-mono text-[10px] text-whoop-textMuted mt-1">
              Every undo action is permanently timestamped with the acting account credentials (§16).
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
              className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:translate-y-[1px] flex items-center space-x-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'REVERSING...' : 'CONFIRM SAFE REVERSAL'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
