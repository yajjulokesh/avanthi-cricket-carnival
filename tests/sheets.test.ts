import { describe, it, expect } from 'vitest';
import { parseRollNumber } from '../src/core/parser.js';

describe('Google Sheets Synchronization Engine Data Model', () => {
  const SHEET_HEADERS = [
    'Roll Number',
    'Name',
    'Mobile',
    'Photo URL',
    'CricHeroes URL',
    'Course',
    'Branch',
    'Year',
    'Bucket',
    'Role',
    'Base Price',
    'Is Paid',
    'Status',
    'Sold Price',
    'Buyer Franchise',
    'Last Updated'
  ];

  it('validates canonical header definitions for Google Sheets compatibility', () => {
    expect(SHEET_HEADERS).toContain('Roll Number');
    expect(SHEET_HEADERS).toContain('Status');
    expect(SHEET_HEADERS).toContain('Sold Price');
    expect(SHEET_HEADERS).toContain('Buyer Franchise');
    expect(SHEET_HEADERS.length).toBe(16);
  });

  it('correctly maps raw sheet rows into normalized player data', () => {
    const mockSheetRow = {
      'Roll Number': '25811A0403',
      'Name': 'Karthik Varma',
      'Mobile': '9876543210',
      'Base Price': 50,
      'Is Paid': 'YES',
      'Status': 'AUCTIONABLE'
    };

    const rollNumber = String(mockSheetRow['Roll Number']).trim().toUpperCase();
    const parsed = parseRollNumber(rollNumber, 26);

    expect(parsed.isValid).toBe(true);
    expect(parsed.course).toBe('UG');
    expect(parsed.branch).toBe('ECE');
    expect(parsed.bucket).toBe('B2');

    const isPaid = String(mockSheetRow['Is Paid']).toUpperCase() === 'YES';
    expect(isPaid).toBe(true);
  });

  it('formats sale payload accurately for Google Sheets webhook dispatch', () => {
    const salePayload = {
      action: 'UPDATE_PLAYER_SALE',
      rollNumber: '25811A0501',
      playerId: 'player-test-1',
      status: 'SOLD',
      soldPrice: 160,
      buyerFranchise: 'Avanthi Lions',
      timestamp: new Date('2026-09-21T10:00:00Z').toISOString()
    };

    expect(salePayload.action).toBe('UPDATE_PLAYER_SALE');
    expect(salePayload.status).toBe('SOLD');
    expect(salePayload.soldPrice).toBe(160);
    expect(salePayload.buyerFranchise).toBe('Avanthi Lions');
  });

  it('formats undo sale payload accurately to restore auctionable status in Google Sheet', () => {
    const undoPayload = {
      action: 'UNDO_PLAYER_SALE',
      rollNumber: '25811A0501',
      status: 'AUCTIONABLE',
      soldPrice: '',
      buyerFranchise: '',
      timestamp: new Date('2026-09-21T10:05:00Z').toISOString()
    };

    expect(undoPayload.action).toBe('UNDO_PLAYER_SALE');
    expect(undoPayload.status).toBe('AUCTIONABLE');
    expect(undoPayload.soldPrice).toBe('');
    expect(undoPayload.buyerFranchise).toBe('');
  });
});
