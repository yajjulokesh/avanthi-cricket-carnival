import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Upload, Download, Copy, Check, FileSpreadsheet, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SheetConfig {
  webhookUrl: string;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  lastSyncTime: string | null;
  lastSyncStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
  lastSyncMessage: string | null;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<SheetConfig>({
    webhookUrl: '',
    autoSyncEnabled: false,
    syncIntervalMinutes: 5,
    lastSyncTime: null,
    lastSyncStatus: 'IDLE',
    lastSyncMessage: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scriptCode, setScriptCode] = useState<string>('');
  const [showScript, setShowScript] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      loadScriptCode();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/sheets/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadScriptCode = async () => {
    try {
      const res = await fetch('/api/sheets/script-code');
      if (res.ok) {
        const data = await res.json();
        setScriptCode(data.code || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: config.webhookUrl,
          autoSyncEnabled: config.autoSyncEnabled,
          syncIntervalMinutes: config.syncIntervalMinutes,
        }),
      });
      const data = await res.json();
      setConfig(data);
      setActionFeedback({ type: 'SUCCESS', message: 'Google Sheets configuration updated successfully.' });
    } catch (err: any) {
      setActionFeedback({ type: 'ERROR', message: err.message || 'Failed to update configuration.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullNow = async () => {
    setIsPulling(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/sheets/pull', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Pull failed');
      }
      setActionFeedback({
        type: 'SUCCESS',
        message: `Success! Synced ${data.updatedCount} players updated, ${data.insertedCount} new players registered.`,
      });
      loadConfig();
    } catch (err: any) {
      setActionFeedback({ type: 'ERROR', message: err.message || 'Failed to pull from Google Sheets.' });
    } finally {
      setIsPulling(false);
    }
  };

  const handlePushAll = async () => {
    if (!window.confirm('Are you sure you want to push all database players to your Google Sheet? This will overwrite existing sheet data with current database records.')) {
      return;
    }
    setIsPushing(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/sheets/push-all', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Push failed');
      }
      setActionFeedback({
        type: 'SUCCESS',
        message: `Success! Pushed ${data.count} players to Google Sheet.`,
      });
      loadConfig();
    } catch (err: any) {
      setActionFeedback({ type: 'ERROR', message: err.message || 'Failed to push players to Google Sheets.' });
    } finally {
      setIsPushing(false);
    }
  };

  const copyScriptToClipboard = () => {
    if (!scriptCode) return;
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="spengle-box w-full max-w-2xl bg-spengle-chassis border-2 border-spengle-border text-spengle-titanium shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 lg:p-5 border-b border-spengle-border flex items-center justify-between bg-spengle-surface">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-spengle-carbon border border-spengle-gold/60 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-spengle-gold" />
            </div>
            <div>
              <div className="text-[9px] font-mono tracking-super-tech uppercase text-spengle-gold">
                SPENGLE // TWO-WAY CLOUD TELEMETRY
              </div>
              <h3 className="text-base font-bold uppercase tracking-wide text-white">
                GOOGLE SHEETS SYNCHRONIZATION
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-spengle-muted hover:text-white p-1 hover:bg-spengle-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 lg:p-6 overflow-y-auto space-y-6 text-xs font-mono">
          {/* Status Feedback Banner */}
          {actionFeedback && (
            <div
              className={`p-3 border flex items-start gap-2 ${
                actionFeedback.type === 'SUCCESS'
                  ? 'bg-spengle-surface border-spengle-emerald text-spengle-emerald'
                  : 'bg-spengle-surface border-spengle-crimson text-spengle-crimson'
              }`}
            >
              {actionFeedback.type === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          {/* Telemetry Status Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-spengle-surface p-3 border border-spengle-border text-[11px]">
            <div>
              <div className="text-spengle-dim uppercase">LAST SYNC STATUS</div>
              <div className="font-bold mt-0.5 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 ${
                    config.lastSyncStatus === 'SUCCESS'
                      ? 'bg-spengle-emerald'
                      : config.lastSyncStatus === 'ERROR'
                      ? 'bg-spengle-crimson'
                      : 'bg-spengle-dim'
                  }`}
                />
                <span className={config.lastSyncStatus === 'SUCCESS' ? 'text-spengle-emerald' : 'text-spengle-muted'}>
                  {config.lastSyncStatus}
                </span>
              </div>
            </div>
            <div>
              <div className="text-spengle-dim uppercase">LAST SYNCED AT</div>
              <div className="text-white font-bold mt-0.5 truncate">
                {config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleTimeString() : 'NEVER'}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-spengle-dim uppercase">AUTO-SYNC</div>
              <div className="font-bold mt-0.5 text-spengle-gold">
                {config.autoSyncEnabled ? `ACTIVE (${config.syncIntervalMinutes}m)` : 'DISABLED'}
              </div>
            </div>
          </div>

          {/* Webhook Configuration Form */}
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-[10px] text-spengle-muted tracking-widest-tech uppercase mb-1.5">
                GOOGLE APPS SCRIPT WEBHOOK URL:
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                className="w-full bg-spengle-surface text-spengle-titanium p-2.5 border border-spengle-border focus:border-spengle-gold outline-none tracking-wider text-xs"
              />
              <p className="text-[10px] text-spengle-dim mt-1">
                Deploy the companion Apps Script (below) as Web App (Access: Anyone) and paste the URL here.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoSyncEnabled}
                  onChange={(e) => setConfig({ ...config, autoSyncEnabled: e.target.checked })}
                  className="w-4 h-4 rounded-none accent-amber-500 bg-spengle-surface border-spengle-border"
                />
                <span className="text-spengle-titanium text-[11px] uppercase tracking-wider">
                  Enable Periodic Auto-Sync (Every 5 mins)
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-spengle-surface hover:bg-spengle-elevated border border-spengle-border hover:border-spengle-gold text-spengle-titanium font-bold uppercase tracking-widest transition-all"
              >
                {isLoading ? 'SAVING...' : 'SAVE CONFIG'}
              </button>
            </div>
          </form>

          {/* Action Operations: Pull & Push */}
          <div className="border-t border-spengle-border pt-5 space-y-3">
            <div className="text-[10px] text-spengle-muted tracking-widest-tech uppercase">
              MANUAL SYNCHRONIZATION ACTIONS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePullNow}
                disabled={isPulling || !config.webhookUrl}
                className={`p-3 border flex items-center justify-center space-x-2 uppercase font-bold tracking-wider transition-all ${
                  !config.webhookUrl
                    ? 'border-spengle-border bg-spengle-surface text-spengle-dim cursor-not-allowed opacity-50'
                    : 'border-spengle-gold bg-spengle-goldMuted text-spengle-gold hover:bg-spengle-gold hover:text-spengle-carbon'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                <span>{isPulling ? 'SYNCING...' : 'PULL EDITS FROM SHEET'}</span>
              </button>

              <button
                type="button"
                onClick={handlePushAll}
                disabled={isPushing || !config.webhookUrl}
                className={`p-3 border flex items-center justify-center space-x-2 uppercase font-bold tracking-wider transition-all ${
                  !config.webhookUrl
                    ? 'border-spengle-border bg-spengle-surface text-spengle-dim cursor-not-allowed opacity-50'
                    : 'border-spengle-border bg-spengle-surface hover:bg-spengle-elevated text-spengle-titanium'
                }`}
              >
                <Upload className={`w-4 h-4 text-spengle-muted ${isPushing ? 'animate-bounce' : ''}`} />
                <span>{isPushing ? 'PUSHING...' : 'PUSH ALL PLAYERS TO SHEET'}</span>
              </button>
            </div>
          </div>

          {/* Setup Companion Code */}
          <div className="border-t border-spengle-border pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-spengle-muted tracking-widest-tech uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-spengle-gold" />
                <span>GOOGLE APPS SCRIPT WEBHOOK SETUP (1-CLICK)</span>
              </div>
              <button
                type="button"
                onClick={copyScriptToClipboard}
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-spengle-surface border border-spengle-gold text-spengle-gold text-[10px] uppercase font-bold hover:bg-spengle-gold hover:text-spengle-carbon transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY SCRIPT CODE'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1 text-spengle-muted text-[11px] bg-spengle-surface p-3 border border-spengle-border">
              <li>Open your Google Sheet ➔ Click <strong>Extensions ➔ Apps Script</strong>.</li>
              <li>Paste the copied script code into the script editor.</li>
              <li>Click <strong>Deploy ➔ New deployment</strong> ➔ Select <strong>Web app</strong>.</li>
              <li>Set <em>Execute as</em>: <strong>Me</strong> and <em>Who has access</em>: <strong>Anyone</strong>.</li>
              <li>Deploy and paste the generated Web App URL into the field above!</li>
            </ol>

            <button
              type="button"
              onClick={() => setShowScript(!showScript)}
              className="text-[10px] text-spengle-gold hover:underline uppercase tracking-wider"
            >
              {showScript ? 'Hide Script Code' : 'View Script Code'}
            </button>

            {showScript && (
              <pre className="p-3 bg-spengle-carbon border border-spengle-border text-[10px] overflow-x-auto text-spengle-muted max-h-48">
                {scriptCode}
              </pre>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-spengle-border bg-spengle-surface flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-spengle-elevated hover:bg-spengle-surface border border-spengle-border text-spengle-titanium uppercase text-xs tracking-widest font-mono font-bold"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
