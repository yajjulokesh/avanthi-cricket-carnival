import React, { useState } from 'react';
import { LotState, PublicFranchise, ScarcityStatus, Bucket } from '../../core/types.js';
import { AdminHeader } from './admin/AdminHeader.js';
import { ActiveLotConsole } from './admin/ActiveLotConsole.js';
import { DrawController } from './admin/DrawController.js';
import { ProxyBiddingTerminal } from './admin/ProxyBiddingTerminal.js';
import { ScarcityTelemetryMatrix } from './admin/ScarcityTelemetryMatrix.js';
import { SafeUndoModal } from './admin/SafeUndoModal.js';
import { BucketRelaxationModal } from './admin/BucketRelaxationModal.js';
import { GoogleSheetsSyncModal } from './admin/GoogleSheetsSyncModal.js';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface AdminViewProps {
  lotState: LotState | null;
  franchises: PublicFranchise[];
  scarcities: ScarcityStatus[];
  secondsLeft: number;
}

interface ActionFeedback {
  type: 'SUCCESS' | 'ERROR' | 'INFO';
  message: string;
}

/**
 * AdminView - The Whoop-Inspired Operations Flight Deck
 * High-performance, data-dense, modular operations terminal:
 * - Sub-millisecond responsive layout for single-laptop control
 * - Zero AI dashboard clichés: matte carbon surfaces, crisp wireframe borders, chiseled telemetry typography
 * - Zero mock data: binds strictly to live tournament database and state machine
 */
export const AdminView: React.FC<AdminViewProps> = ({
  lotState,
  franchises,
  scarcities,
  secondsLeft,
}) => {
  // Modal states
  const [isUndoModalOpen, setIsUndoModalOpen] = useState<boolean>(false);
  const [isRelaxModalOpen, setIsRelaxModalOpen] = useState<boolean>(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);

  // Status feedback toast
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

  // Handlers for state machine operations
  const handleHammer = async () => {
    try {
      const res = await fetch('/api/auction/hammer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'SUPER_ADMIN' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'ERROR', message: data.error || 'Hammer action rejected.' });
      } else {
        setFeedback({
          type: 'SUCCESS',
          message: `Hammer executed. Lot status resolved as ${data.result}.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'ERROR', message: err.message || 'Network communication error.' });
    }
  };

  const handleSkip = async () => {
    try {
      const res = await fetch('/api/auction/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'SUPER_ADMIN' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'ERROR', message: data.error || 'Skip action rejected.' });
      } else {
        setFeedback({
          type: 'INFO',
          message: 'Player skipped (§10). Recalled at the end of the bucket or in Round 2.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'ERROR', message: err.message || 'Network communication error.' });
    }
  };

  const handlePauseResume = async (isPause: boolean) => {
    const endpoint = isPause ? '/api/auction/pause' : '/api/auction/resume';
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'SUPER_ADMIN' }),
      });
      setFeedback({
        type: 'INFO',
        message: isPause ? 'Auction paused by operator.' : 'Auction clock resumed.',
      });
    } catch (err: any) {
      setFeedback({ type: 'ERROR', message: err.message });
    }
  };

  const handleLoadLot = async (isGuest: boolean, bucket?: Bucket, bucketNumber?: number) => {
    try {
      const payload: any = { actor: 'SUPER_ADMIN' };
      if (isGuest && bucket && bucketNumber) {
        payload.bucket = bucket;
        payload.bucketNumber = bucketNumber;
      }

      const res = await fetch('/api/auction/load-lot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'ERROR', message: data.error || 'Failed to load player.' });
      } else {
        setFeedback({
          type: 'SUCCESS',
          message: `Lot #${data.lotNumber} mounted successfully (${data.player?.name} // Base: ${data.currentPrice} pts).`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'ERROR', message: err.message });
    }
  };

  const handleProxyBid = async (franchiseId: string) => {
    try {
      const res = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchiseId,
          actor: 'SUPER_ADMIN_PROXY',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'ERROR', message: data.error || 'Proxy bid blocked by rule engine.' });
      } else {
        setFeedback({
          type: 'SUCCESS',
          message: `Proxy bid confirmed at ${data.newPrice} pts for franchise.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'ERROR', message: err.message });
    }
  };

  const handleConfirmSafeUndo = async (saleId: string, reason: string) => {
    const res = await fetch('/api/auction/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saleId,
        reason,
        actor: 'SUPER_ADMIN',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error };
    }
    setFeedback({
      type: 'SUCCESS',
      message: `Sale ${saleId} reversed. Purse refunded, slot reopened, and limits recalculated without drift.`,
    });
    return { success: true };
  };

  const handleConfirmRelax = async (bucket: Bucket, newMinimum: number) => {
    const res = await fetch('/api/auction/relax-bucket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket,
        newMinimum,
        actor: 'SUPER_ADMIN',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error };
    }
    setFeedback({
      type: 'SUCCESS',
      message: `Bucket ${bucket} quota relaxed uniformly to ${newMinimum} for all 11 franchises.`,
    });
    return { success: true };
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      {/* System Telemetry Header */}
      <AdminHeader
        actorRole="SUPER_ADMIN"
        onOpenUndo={() => setIsUndoModalOpen(true)}
        onOpenRelax={() => setIsRelaxModalOpen(true)}
        onOpenSheetsSync={() => setIsSheetsModalOpen(true)}
        isLotActive={lotState?.status === 'ACTIVE'}
      />

      {/* Action Notification Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border font-mono text-xs flex items-center justify-between shadow-md transition-all ${
            feedback.type === 'ERROR'
              ? 'bg-red-950/40 border-red-900/60 text-red-300'
              : feedback.type === 'SUCCESS'
              ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
              : 'bg-whoop-elevated border-whoop-border text-zinc-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'ERROR' ? (
              <AlertCircle className="w-4 h-4 text-whoop-strain shrink-0" />
            ) : feedback.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-whoop-recovery shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-whoop-highlight shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>

          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-white ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Operational Cockpit: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Flight Deck (7 Columns): Active Lot Console & Draw Controller */}
        <div className="lg:col-span-7 space-y-6">
          <ActiveLotConsole
            lotState={lotState}
            secondsLeft={secondsLeft}
            onHammer={handleHammer}
            onSkip={handleSkip}
            onPauseResume={handlePauseResume}
          />

          <DrawController
            onLoadLot={handleLoadLot}
            isLotActive={lotState?.status === 'ACTIVE'}
          />
        </div>

        {/* Right Flight Deck (5 Columns): Proxy Bidding & Dynamic Scarcity Engine */}
        <div className="lg:col-span-5 space-y-6">
          <ProxyBiddingTerminal
            franchises={franchises}
            lotState={lotState}
            onProxyBid={handleProxyBid}
          />

          <ScarcityTelemetryMatrix
            scarcities={scarcities}
            onOpenRelax={() => setIsRelaxModalOpen(true)}
          />
        </div>
      </div>

      {/* Modals for Reversible Operations */}
      <SafeUndoModal
        isOpen={isUndoModalOpen}
        onClose={() => setIsUndoModalOpen(false)}
        onConfirmUndo={handleConfirmSafeUndo}
      />

      <BucketRelaxationModal
        isOpen={isRelaxModalOpen}
        onClose={() => setIsRelaxModalOpen(false)}
        onConfirmRelax={handleConfirmRelax}
      />

      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </div>
  );
};
