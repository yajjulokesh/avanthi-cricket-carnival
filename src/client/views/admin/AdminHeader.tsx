import React from 'react';
import { Download, Sliders, RotateCcw, Activity } from 'lucide-react';

interface AdminHeaderProps {
  actorRole: 'SUPER_ADMIN' | 'OPERATOR';
  onOpenUndo: () => void;
  onOpenRelax: () => void;
  isLotActive: boolean;
}

/**
 * AdminHeader - System Telemetry Bar
 * Built with the Whoop precision-engineered aesthetic:
 * - High-contrast matte background with subtle wireframe border
 * - Monospace telemetry badges with wide tracking
 * - Heavy, tactile action buttons
 */
export const AdminHeader: React.FC<AdminHeaderProps> = ({
  actorRole,
  onOpenUndo,
  onOpenRelax,
  isLotActive,
}) => {
  return (
    <header className="bg-whoop-surface border border-whoop-border rounded-xl p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
      {/* System Identification & Liveness */}
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-lg bg-whoop-elevated border border-whoop-border flex items-center justify-center shrink-0">
          <Activity className={`w-5 h-5 ${isLotActive ? 'text-whoop-recovery animate-pulse' : 'text-whoop-textMuted'}`} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-whoop-textMuted uppercase font-bold">
              ACC 2026 // FLIGHT DECK
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-whoop-elevated border border-whoop-border text-white">
              {actorRole === 'SUPER_ADMIN' ? 'SUPER ADMIN AUTHORIZED' : 'OPERATOR ACTIVE'}
            </span>
          </div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-white mt-0.5">
            AUCTION OPERATIONS TERMINAL
          </h1>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="/api/auction/export-excel"
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-whoop-elevated hover:bg-zinc-800 text-zinc-200 hover:text-white border border-whoop-border rounded-lg text-xs font-mono font-semibold transition-all active:translate-y-[1px]"
          title="Download complete database as an Excel workbook (§16)"
        >
          <Download className="w-3.5 h-3.5 text-whoop-highlight" />
          <span>EXPORT DB</span>
        </a>

        <button
          type="button"
          onClick={onOpenRelax}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-whoop-elevated hover:bg-zinc-800 text-zinc-200 hover:text-white border border-whoop-border rounded-lg text-xs font-mono font-semibold transition-all active:translate-y-[1px]"
          title="Uniformly relax bucket minimums for all 11 franchises (§7, §13)"
        >
          <Sliders className="w-3.5 h-3.5 text-whoop-telemetry" />
          <span>RELAX MINIMUMS</span>
        </button>

        <button
          type="button"
          onClick={onOpenUndo}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-whoop-elevated hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/40 rounded-lg text-xs font-mono font-semibold transition-all active:translate-y-[1px]"
          title="Safely reverse any historical sale record without counter drift (§12.4)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-whoop-strain" />
          <span>SAFE UNDO</span>
        </button>
      </div>
    </header>
  );
};
