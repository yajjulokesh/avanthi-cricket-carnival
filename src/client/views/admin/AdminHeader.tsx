import React from 'react';
import { Download, Sliders, RotateCcw, Activity, FileSpreadsheet } from 'lucide-react';

interface AdminHeaderProps {
  actorRole: 'SUPER_ADMIN' | 'OPERATOR';
  onOpenUndo: () => void;
  onOpenRelax: () => void;
  onOpenSheetsSync?: () => void;
  isLotActive: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  actorRole,
  onOpenUndo,
  onOpenRelax,
  onOpenSheetsSync,
  isLotActive,
}) => {
  return (
    <header className="spengle-box p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
      {/* System Identification & Liveness */}
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-spengle-surface border border-spengle-border flex items-center justify-center shrink-0">
          <Activity className={`w-5 h-5 ${isLotActive ? 'text-spengle-gold animate-pulse' : 'text-spengle-dim'}`} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[9px] tracking-super-tech text-spengle-gold uppercase font-bold">
              SPENGLE // SWISS FLIGHT DECK
            </span>
            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-mono font-bold bg-spengle-surface border border-spengle-border text-white tracking-widest uppercase">
              {actorRole === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'OPERATOR'}
            </span>
          </div>
          <h1 className="text-lg lg:text-xl font-black uppercase tracking-tight text-white mt-0.5">
            AUCTION OPERATIONS TERMINAL
          </h1>
        </div>
      </div>

      {/* Primary Actions Grid: Precision Tactile Swiss Hardware Buttons */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        {onOpenSheetsSync && (
          <button
            type="button"
            onClick={onOpenSheetsSync}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-spengle-surface hover:bg-spengle-elevated text-spengle-gold border border-spengle-gold/50 transition-all uppercase tracking-wider"
            title="Google Sheets Two-Way Synchronization"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-spengle-gold" />
            <span>SHEETS SYNC</span>
          </button>
        )}

        <a
          href="/api/auction/export-excel"
          className="inline-flex items-center space-x-2 px-3 py-2 bg-spengle-surface hover:bg-spengle-elevated text-spengle-titanium border border-spengle-border transition-all uppercase tracking-wider"
          title="Download complete database as an Excel workbook (§16)"
        >
          <Download className="w-3.5 h-3.5 text-spengle-muted" />
          <span>EXPORT DB</span>
        </a>

        <button
          type="button"
          onClick={onOpenRelax}
          className="inline-flex items-center space-x-2 px-3 py-2 bg-spengle-surface hover:bg-spengle-elevated text-spengle-titanium border border-spengle-border transition-all uppercase tracking-wider"
          title="Uniformly relax mandatory bucket quota minimums (§7, §13)"
        >
          <Sliders className="w-3.5 h-3.5 text-spengle-gold" />
          <span>RELAX MINIMA</span>
        </button>

        <button
          type="button"
          onClick={onOpenUndo}
          className="inline-flex items-center space-x-2 px-3 py-2 bg-spengle-surface hover:bg-spengle-crimsonMuted text-spengle-crimson border border-spengle-crimson/50 transition-all uppercase tracking-wider"
          title="Audit-logged historical lot reversal (§12.4, §16)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>SAFE UNDO</span>
        </button>
      </div>
    </header>
  );
};
