import path from 'node:path';
import fs from 'node:fs';

// @ts-ignore
const sqliteModule = await import('node:sqlite');
const DB_PATH = path.resolve(process.cwd(), 'carnival.db');
export const db = new sqliteModule.DatabaseSync(DB_PATH);

export function initDatabase() {
  // Enable WAL mode for high concurrency
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Tournaments
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      academic_year INTEGER NOT NULL,
      status TEXT DEFAULT 'REGISTRATION',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Franchises
  db.exec(`
    CREATE TABLE IF NOT EXISTS franchises (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      coord_name TEXT NOT NULL,
      coord_department TEXT,
      coord_photo_url TEXT,
      coord_phone TEXT NOT NULL,
      captain_phone TEXT,
      captain_player_id TEXT,
      vice_captain_player_id TEXT,
      starting_purse INTEGER DEFAULT 1000,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Players
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      roll_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      photo_url TEXT,
      cricheroes_url TEXT,
      cricheroes_mobile TEXT,
      cricheroes_pending INTEGER DEFAULT 0,
      course TEXT NOT NULL,
      program TEXT NOT NULL,
      branch TEXT NOT NULL,
      admission_year INTEGER NOT NULL,
      year_of_study INTEGER NOT NULL,
      is_lateral INTEGER DEFAULT 0,
      bucket TEXT NOT NULL,
      derived_type TEXT NOT NULL,
      skills_json TEXT NOT NULL,
      stats_json TEXT NOT NULL,
      base_price INTEGER NOT NULL,
      referred_franchise_id TEXT,
      is_paid INTEGER DEFAULT 0,
      is_detained_override INTEGER DEFAULT 0,
      status TEXT DEFAULT 'REGISTERED',
      bucket_number INTEGER,
      editing_locked INTEGER DEFAULT 0,
      assigned_franchise_id TEXT,
      sold_price INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Auction Sales Ledger (Immutable Event Sourcing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS auction_sales (
      id TEXT PRIMARY KEY,
      lot_number INTEGER NOT NULL,
      player_id TEXT NOT NULL,
      franchise_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      bucket TEXT NOT NULL,
      status TEXT DEFAULT 'CONFIRMED',
      undone_at TEXT,
      undone_by TEXT,
      undo_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Audit Logs (Accountability & Non-repudiation)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      actor_role TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details_json TEXT NOT NULL
    );
  `);

  // Bucket Minimum Quotas (Configurable per tournament, uniform relaxation)
  db.exec(`
    CREATE TABLE IF NOT EXISTS bucket_minimums (
      bucket TEXT PRIMARY KEY,
      minimum_required INTEGER NOT NULL
    );
  `);

  // Settings & Integrations (Google Sheets sync, etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert default bucket minimums if not present
  const count = db.prepare('SELECT count(*) as cnt FROM bucket_minimums').get() as { cnt: number };
  if (count.cnt === 0) {
    const insert = db.prepare('INSERT INTO bucket_minimums (bucket, minimum_required) VALUES (?, ?)');
    insert.run('B1', 2);
    insert.run('B2', 2);
    insert.run('B3', 2);
    insert.run('B4', 2);
    insert.run('B5', 2);
    insert.run('PG', 0);
  }
}
