import React from 'react';
import { ScarcityStatus, Bucket } from '../../../core/types.js';
import { AlertTriangle, Sliders, CheckCircle2 } from 'lucide-react';

interface ScarcityTelemetryMatrixProps {
  scarcities: ScarcityStatus[];
  onOpenRelax: () => void;
}

const BUCKET_LABELS: Record<Bucket, string> = {
  B1: 'B1 // B.Tech 1st Year',
  B2: 'B2 // B.Tech 2nd Year',
  B3: 'B3 // B.Tech 3rd Year',
  B4: 'B4 // B.Tech 4th Year',
  B5: 'B5 // Polytechnic Diploma',
  PG: 'PG // Postgraduate Pool',
};

/**
 * ScarcityTelemetryMatrix - Dynamic Scarcity & Quota Tracker (§12.3)
 * Designed to Whoop telemetry standards:
 * - Monitors aggregate demand across all 11 franchises against available unsold supply
 * - Broadcasts telemetry warning when UnsoldSupply <= TotalDemand
 * - Clear, high-visibility warning states without distorting free market bidding
 */
export const ScarcityTelemetryMatrix: React.FC<ScarcityTelemetryMatrixProps> = ({
  scarcities,
  onOpenRelax,
}) => {
  const activeScarcityCount = scarcities.filter((s) => s.isScarcityWarning).length;

  return (
    <section className="bg-whoop-surface border border-whoop-border rounded-xl p-5 lg:p-6 shadow-sm space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-whoop-borderMuted pb-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className={`w-4 h-4 ${activeScarcityCount > 0 ? 'text-whoop-telemetry animate-pulse' : 'text-whoop-highlight'}`} />
          <span className="font-mono text-[10px] tracking-[0.2em] text-whoop-textMuted uppercase font-bold">
            SCARCITY TELEMETRY // QUOTA MATRIX (§12.3)
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenRelax}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-whoop-elevated hover:bg-zinc-800 text-zinc-300 border border-whoop-border rounded text-[11px] font-mono transition-all active:translate-y-[1px]"
        >
          <Sliders className="w-3 h-3 text-whoop-telemetry" />
          <span>ADJUST QUOTAS</span>
        </button>
      </div>

      <p className="font-mono text-[11px] text-whoop-textDim leading-relaxed">
        Continuously tracks unsold supply against aggregate mandatory quota demand across all eleven franchises. Bidding remains unrestricted (§12.3); warnings inform auctioneer and audience telemetry.
      </p>

      {/* 5-Bucket Telemetry Grid */}
      <div className="space-y-2 font-mono text-xs">
        {scarcities.length > 0 ? (
          scarcities.map((item) => {
            const isWarning = item.isScarcityWarning;
            const isExhausted = item.unsoldSupply === 0 && item.totalDemand > 0;

            return (
              <div
                key={item.bucket}
                className={`p-3 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isExhausted
                    ? 'bg-red-950/20 border-red-800/50 text-red-300'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-800/50 text-amber-300'
                    : 'bg-whoop-elevated/70 border-whoop-border text-zinc-300'
                }`}
              >
                {/* Bucket Identification */}
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isExhausted
                        ? 'bg-whoop-strain animate-ping'
                        : isWarning
                        ? 'bg-whoop-telemetry animate-pulse'
                        : 'bg-whoop-recovery'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-white text-xs">{item.bucket}</div>
                    <div className="text-[10px] text-whoop-textMuted">{BUCKET_LABELS[item.bucket]}</div>
                  </div>
                </div>

                {/* Supply vs Demand Figures */}
                <div className="flex items-center space-x-4 self-end sm:self-center text-[11px]">
                  <div>
                    <span className="text-whoop-textMuted text-[10px] block sm:inline mr-1">UNSOLD SUPPLY:</span>
                    <strong className="text-white font-bold">{item.unsoldSupply}</strong>
                  </div>
                  <div>
                    <span className="text-whoop-textMuted text-[10px] block sm:inline mr-1">TOTAL DEMAND:</span>
                    <strong
                      className={`font-bold ${
                        isWarning ? 'text-whoop-telemetry' : 'text-whoop-recovery'
                      }`}
                    >
                      {item.totalDemand}
                    </strong>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      isExhausted
                        ? 'bg-red-950/40 border-red-800 text-red-400'
                        : isWarning
                        ? 'bg-amber-950/40 border-amber-800 text-amber-400'
                        : 'bg-emerald-950/30 border-emerald-900 text-emerald-400'
                    }`}
                  >
                    {isExhausted ? 'EXHAUSTED' : isWarning ? 'SCARCITY ALERT' : 'NOMINAL'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 rounded-lg bg-whoop-elevated/40 border border-dashed border-whoop-border text-center text-whoop-textMuted text-[11px]">
            No bucket scarcity metrics reported yet. Stand by for auction initialization.
          </div>
        )}
      </div>

      {activeScarcityCount === 0 && scarcities.length > 0 && (
        <div className="flex items-center space-x-2 text-[11px] font-mono text-whoop-recovery pt-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ALL BUCKET QUOTAS NOMINAL // NO ACTIVE SUPPLY CONSTRAINTS DETECTED</span>
        </div>
      )}
    </section>
  );
};
