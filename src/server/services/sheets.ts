import { db } from '../db.js';
import { parseRollNumber, derivePlayerType, CURRENT_ACADEMIC_YEAR } from '../../core/parser.js';
import { Player, PlayerSkillProfile, CricHeroesStats, Bucket, PlayerStatus } from '../../core/types.js';
import { auctionEngine } from '../state.js';
import * as XLSX from 'xlsx';

export interface GoogleSheetsConfig {
  webhookUrl: string;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  lastSyncTime: string | null;
  lastSyncStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
  lastSyncMessage: string | null;
}

export interface SheetRowPlayer {
  rollNumber: string;
  name: string;
  mobile?: string;
  photoUrl?: string;
  cricHeroesProfileUrl?: string;
  role?: string;
  basePrice?: number;
  isPaid?: boolean | number | string;
  status?: string;
  soldPrice?: number;
  buyerFranchise?: string;
}

class GoogleSheetsService {
  private autoSyncTimer: NodeJS.Timeout | null = null;

  public getConfig(): GoogleSheetsConfig {
    const getSetting = (key: string, defaultVal: string = '') => {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
      return row ? row.value : defaultVal;
    };

    return {
      webhookUrl: getSetting('google_sheets_webhook_url', ''),
      autoSyncEnabled: getSetting('google_sheets_auto_sync', '0') === '1',
      syncIntervalMinutes: parseInt(getSetting('google_sheets_sync_interval', '5'), 10) || 5,
      lastSyncTime: getSetting('google_sheets_last_sync_time', null as any),
      lastSyncStatus: (getSetting('google_sheets_last_sync_status', 'IDLE') as any) || 'IDLE',
      lastSyncMessage: getSetting('google_sheets_last_sync_message', null as any),
    };
  }

  public updateConfig(config: Partial<GoogleSheetsConfig>): GoogleSheetsConfig {
    const setSetting = (key: string, value: string) => {
      db.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run(key, value);
    };

    if (config.webhookUrl !== undefined) {
      setSetting('google_sheets_webhook_url', config.webhookUrl.trim());
    }
    if (config.autoSyncEnabled !== undefined) {
      setSetting('google_sheets_auto_sync', config.autoSyncEnabled ? '1' : '0');
    }
    if (config.syncIntervalMinutes !== undefined) {
      setSetting('google_sheets_sync_interval', String(config.syncIntervalMinutes));
    }

    const updated = this.getConfig();
    this.restartAutoSyncTimer();
    return updated;
  }

  public setSyncStatus(status: 'SUCCESS' | 'ERROR', message: string) {
    const now = new Date().toISOString();
    const setSetting = (key: string, value: string) => {
      db.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run(key, value);
    };

    setSetting('google_sheets_last_sync_time', now);
    setSetting('google_sheets_last_sync_status', status);
    setSetting('google_sheets_last_sync_message', message);
  }

  /**
   * Pull and sync player edits from Google Sheets into the tournament database
   */
  public async pullPlayersFromSheet(): Promise<{ success: boolean; updatedCount: number; insertedCount: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webhookUrl) {
      return { success: false, updatedCount: 0, insertedCount: 0, error: 'Google Sheets Webhook URL is not configured.' };
    }

    try {
      let fetchUrl = config.webhookUrl.trim();

      // Check if user entered a standard Google Sheets spreadsheet link instead of Web App
      const sheetMatch = fetchUrl.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetMatch) {
        const sheetId = sheetMatch[1];
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }

      const response = await fetch(fetchUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'Accept': 'application/json, text/csv, text/plain, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`Google Sheets responded with HTTP status ${response.status}`);
      }

      const text = await response.text();

      // Check if Google redirected to a Google Account login page
      if (
        text.includes('accounts.google.com') ||
        text.includes('AccountsSignInUi') ||
        text.trim().startsWith('<!doctype') ||
        text.trim().startsWith('<html')
      ) {
        throw new Error(
          'Google Access Blocked (Login Required): In your Google Apps Script, go to Deploy > Manage deployments > click the Edit (pencil) icon, change "Who has access" to "Anyone" (not "Only myself"), and click Deploy. If you provided a spreadsheet URL, ensure General Access is set to "Anyone with the link".'
        );
      }

      let rawRows: any[] = [];
      const trimmed = text.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const data = JSON.parse(trimmed);
        rawRows = Array.isArray(data) ? data : data.players || data.rows || [];
      } else {
        // Parse CSV export
        const workbook = XLSX.read(trimmed, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        if (sheetName) {
          rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }
      }

      if (!Array.isArray(rawRows)) {
        throw new Error('Invalid response format: expected an array of player objects.');
      }

      let updatedCount = 0;
      let insertedCount = 0;

      for (const row of rawRows) {
        const rollNumber = String(
          row['Roll Number'] || row['rollNumber'] || row['roll_number'] || row['Roll'] || ''
        ).trim().toUpperCase();

        if (!rollNumber) continue;

        const name = String(row['Name'] || row['name'] || '').trim();
        const mobile = String(row['Mobile'] || row['mobile'] || row['Phone'] || row['phone'] || '0000000000').trim();
        const photoUrl = String(row['Photo URL'] || row['photoUrl'] || row['photo_url'] || '').trim();
        const cricHeroesUrl = String(row['CricHeroes URL'] || row['cricHeroesProfileUrl'] || row['cricheroes_url'] || '').trim();
        const basePrice = parseInt(String(row['Base Price'] || row['basePrice'] || row['base_price'] || '20'), 10) || 20;
        
        const isPaidRaw = row['Is Paid'] ?? row['isPaid'] ?? row['is_paid'] ?? row['Paid'];
        const isPaid = isPaidRaw === true || isPaidRaw === 1 || String(isPaidRaw).toLowerCase() === 'yes' || String(isPaidRaw).toLowerCase() === 'true';

        const statusRaw = String(row['Status'] || row['status'] || '').trim().toUpperCase();

        // Check if player already exists in DB
        const existing = db.prepare('SELECT * FROM players WHERE roll_number = ?').get(rollNumber) as any;

        if (existing) {
          // Do not overwrite assigned franchise or sold price of an already SOLD player unless sheet explicitly asks
          let newStatus = existing.status;
          if (statusRaw && ['REGISTERED', 'AUCTIONABLE', 'UNSOLD', 'SKIPPED'].includes(statusRaw)) {
            newStatus = statusRaw;
          } else if (isPaid && existing.status === 'REGISTERED') {
            newStatus = 'AUCTIONABLE';
          }

          db.prepare(`
            UPDATE players 
            SET name = COALESCE(NULLIF(?, ''), name),
                photo_url = COALESCE(NULLIF(?, ''), photo_url),
                cricheroes_url = COALESCE(NULLIF(?, ''), cricheroes_url),
                base_price = ?,
                is_paid = ?,
                status = ?
            WHERE roll_number = ?
          `).run(name, photoUrl, cricHeroesUrl, basePrice, isPaid ? 1 : 0, newStatus, rollNumber);

          updatedCount++;
        } else if (name) {
          // New player row found in Google Sheet -> Register student
          const parsed = parseRollNumber(rollNumber, CURRENT_ACADEMIC_YEAR);
          if (parsed.isValid && parsed.bucket && parsed.course) {
            const bucketCount = db
              .prepare('SELECT count(*) as cnt FROM players WHERE bucket = ?')
              .get(parsed.bucket) as { cnt: number };
            const bucketNumber = bucketCount.cnt + 1;
            const newId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

            const initialSkills: PlayerSkillProfile = {
              isSkilledBatter: true,
              battingArm: 'Right',
              isSkilledBowler: false,
              isWicketKeeper: false,
              highestLevelPlayed: 'Recreational only',
              playedPreviousACC: false,
            };

            const initialStats: CricHeroesStats = {
              matches: 0,
              runs: 0,
              battingAverage: 0,
              strikeRate: 0,
              highestScore: '0',
              wickets: 0,
              bowlingAverage: 0,
              economy: 0,
              bestBowling: '0/0',
              catches: 0,
              stumpings: 0,
            };

            const newStatus = isPaid ? 'AUCTIONABLE' : 'REGISTERED';

            db.prepare(`
              INSERT INTO players (
                id, roll_number, name, mobile, photo_url, cricheroes_url, cricheroes_mobile,
                cricheroes_pending, course, program, branch, admission_year, year_of_study,
                is_lateral, bucket, derived_type, skills_json, stats_json, base_price,
                is_paid, is_detained_override, status, bucket_number, editing_locked
              ) VALUES (?, ?, ?, ?, ?, ?, '', 0, ?, ?, ?, ?, ?, ?, ?, 'Batter', ?, ?, ?, ?, 0, ?, ?, 0)
            `).run(
              newId,
              rollNumber,
              name,
              mobile,
              photoUrl || '/assets/default-avatar.png',
              cricHeroesUrl,
              parsed.course,
              parsed.program || '',
              parsed.branch || '',
              parsed.admissionYear || 0,
              parsed.yearOfStudy || 1,
              parsed.isLateral ? 1 : 0,
              parsed.bucket,
              JSON.stringify(initialSkills),
              JSON.stringify(initialStats),
              basePrice,
              isPaid ? 1 : 0,
              newStatus,
              bucketNumber
            );

            insertedCount++;
          }
        }
      }

      // Refresh auction telemetry and broadcast to clients
      auctionEngine.checkAndBroadcastScarcity();
      auctionEngine.broadcastState();

      const message = `Synced from Google Sheets: ${updatedCount} players updated, ${insertedCount} players inserted.`;
      this.setSyncStatus('SUCCESS', message);

      return { success: true, updatedCount, insertedCount };
    } catch (err: any) {
      const errorMsg = `Google Sheets Sync failed: ${err.message}`;
      this.setSyncStatus('ERROR', errorMsg);
      return { success: false, updatedCount: 0, insertedCount: 0, error: errorMsg };
    }
  }

  /**
   * Push auction sale result to Google Sheets when a player is hammered SOLD / UNSOLD
   */
  public async syncSaleToSheet(params: {
    playerId: string;
    rollNumber: string;
    status: 'SOLD' | 'UNSOLD';
    soldPrice?: number;
    buyerFranchiseName?: string;
  }): Promise<void> {
    const config = this.getConfig();
    if (!config.webhookUrl) return;

    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PLAYER_SALE',
          rollNumber: params.rollNumber,
          playerId: params.playerId,
          status: params.status,
          soldPrice: params.soldPrice || 0,
          buyerFranchise: params.buyerFranchiseName || '',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Failed to dispatch sale update to Google Sheets webhook:', err);
    }
  }

  /**
   * Push status reversal to Google Sheets when an admin executes Safe Undo
   */
  public async syncUndoToSheet(rollNumber: string): Promise<void> {
    const config = this.getConfig();
    if (!config.webhookUrl) return;

    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UNDO_PLAYER_SALE',
          rollNumber,
          status: 'AUCTIONABLE',
          soldPrice: '',
          buyerFranchise: '',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Failed to dispatch undo update to Google Sheets webhook:', err);
    }
  }

  /**
   * Push all current players in database to Google Sheet
   */
  public async pushAllPlayersToSheet(): Promise<{ success: boolean; count: number; error?: string }> {
    const config = this.getConfig();
    if (!config.webhookUrl) {
      return { success: false, count: 0, error: 'Google Sheets Webhook URL is not configured.' };
    }

    try {
      const rows = db.prepare(`
        SELECT p.*, f.name as franchise_name 
        FROM players p 
        LEFT JOIN franchises f ON p.assigned_franchise_id = f.id
        ORDER BY p.name ASC
      `).all() as any[];

      const payload = rows.map((p) => ({
        rollNumber: p.roll_number,
        name: p.name,
        mobile: p.mobile,
        photoUrl: p.photo_url,
        cricHeroesProfileUrl: p.cricheroes_url,
        course: p.course,
        branch: p.branch,
        yearOfStudy: p.year_of_study,
        bucket: p.bucket,
        derivedType: p.derived_type,
        basePrice: p.base_price,
        isPaid: p.is_paid === 1 ? 'YES' : 'NO',
        status: p.status,
        soldPrice: p.sold_price || '',
        buyerFranchise: p.franchise_name || '',
      }));

      const res = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPLACE_ALL_PLAYERS',
          players: payload,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error(`Google Sheets responded with HTTP status ${res.status}`);
      }

      this.setSyncStatus('SUCCESS', `Pushed ${payload.length} players to Google Sheet.`);
      return { success: true, count: payload.length };
    } catch (err: any) {
      const errorMsg = `Push to Google Sheet failed: ${err.message}`;
      this.setSyncStatus('ERROR', errorMsg);
      return { success: false, count: 0, error: errorMsg };
    }
  }

  public restartAutoSyncTimer() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }

    const config = this.getConfig();
    if (config.autoSyncEnabled && config.webhookUrl) {
      const intervalMs = Math.max(1, config.syncIntervalMinutes) * 60 * 1000;
      this.autoSyncTimer = setInterval(() => {
        this.pullPlayersFromSheet().catch((e) => console.error('AutoSync Error:', e));
      }, intervalMs);
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
