import { Router, Request, Response } from 'express';
import { googleSheetsService } from '../services/sheets.js';
import fs from 'node:fs';
import path from 'node:path';

export const sheetsRouter = Router();

/**
 * Get current Google Sheets integration configuration & status
 */
sheetsRouter.get('/config', (req: Request, res: Response) => {
  const config = googleSheetsService.getConfig();
  return res.json(config);
});

/**
 * Update Google Sheets integration settings
 */
sheetsRouter.post('/config', (req: Request, res: Response) => {
  const { webhookUrl, autoSyncEnabled, syncIntervalMinutes } = req.body;
  const updated = googleSheetsService.updateConfig({
    webhookUrl,
    autoSyncEnabled: typeof autoSyncEnabled === 'boolean' ? autoSyncEnabled : undefined,
    syncIntervalMinutes: typeof syncIntervalMinutes === 'number' ? syncIntervalMinutes : undefined,
  });
  return res.json(updated);
});

/**
 * Trigger immediate Pull from Google Sheets into Tournament Database
 */
sheetsRouter.post('/pull', async (req: Request, res: Response) => {
  const result = await googleSheetsService.pullPlayersFromSheet();
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

/**
 * Push all database players to the Google Sheet (Initial population or overwrite)
 */
sheetsRouter.post('/push-all', async (req: Request, res: Response) => {
  const result = await googleSheetsService.pushAllPlayersToSheet();
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

/**
 * Get the Google Apps Script code for 1-click copy-paste
 */
sheetsRouter.get('/script-code', (req: Request, res: Response) => {
  try {
    const scriptPath = path.resolve(process.cwd(), 'src/server/services/google-apps-script.js');
    const code = fs.readFileSync(scriptPath, 'utf8');
    return res.json({ code });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to read script code template.' });
  }
});
