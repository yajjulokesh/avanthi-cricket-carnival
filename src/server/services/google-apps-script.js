/**
 * =========================================================================
 * AVANTHI CRICKET CARNIVAL 2026 — GOOGLE APPS SCRIPT WEBHOOK
 * =========================================================================
 * 
 * INSTRUCTIONS FOR USE:
 * 1. Open your Google Sheet.
 * 2. In the top menu, click: Extensions > Apps Script.
 * 3. Replace any code in the editor with this entire file.
 * 4. Click the blue "Deploy" button (top-right) -> "New deployment".
 * 5. Select type: "Web app".
 * 6. Set Description: "ACC 2026 Auction Sync".
 * 7. Set "Execute as": "Me".
 * 8. Set "Who has access": "Anyone" (allows the local/production server to sync).
 * 9. Click "Deploy", authorize permissions, and COPY the Web App URL.
 * 10. Paste that Web App URL into the ACC Admin Flight Deck (SHEETS SYNC modal).
 */

const HEADERS = [
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

/**
 * Handle GET request: Export all sheet rows as JSON to the Auction server
 */
function doGet(e) {
  const sheet = getOrCreatePlayersSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', players: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data[0].map(h => String(h).trim());
  const players = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const player = {};
    let hasData = false;

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const val = row[j];
      player[header] = val;
      if (val !== '' && val !== null && val !== undefined) {
        hasData = true;
      }
    }

    if (hasData && player['Roll Number']) {
      players.push(player);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', players: players }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST request: Update player sale status, or bulk-replace players
 */
function doPost(e) {
  try {
    const sheet = getOrCreatePlayersSheet();
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === 'UPDATE_PLAYER_SALE' || action === 'UNDO_PLAYER_SALE') {
      const rollNumber = String(payload.rollNumber).trim().toUpperCase();
      const data = sheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      
      const rollColIdx = headers.indexOf('Roll Number');
      const statusColIdx = headers.indexOf('Status');
      const soldPriceColIdx = headers.indexOf('Sold Price');
      const buyerColIdx = headers.indexOf('Buyer Franchise');
      const updatedColIdx = headers.indexOf('Last Updated');

      let found = false;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][rollColIdx]).trim().toUpperCase() === rollNumber) {
          if (statusColIdx !== -1) sheet.getRange(i + 1, statusColIdx + 1).setValue(payload.status);
          if (soldPriceColIdx !== -1) sheet.getRange(i + 1, soldPriceColIdx + 1).setValue(payload.soldPrice || '');
          if (buyerColIdx !== -1) sheet.getRange(i + 1, buyerColIdx + 1).setValue(payload.buyerFranchise || '');
          if (updatedColIdx !== -1) sheet.getRange(i + 1, updatedColIdx + 1).setValue(new Date().toISOString());
          found = true;
          break;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, updated: found }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'REPLACE_ALL_PLAYERS' && Array.isArray(payload.players)) {
      sheet.clearContents();
      sheet.appendRow(HEADERS);

      const rows = payload.players.map(p => [
        p.rollNumber,
        p.name,
        p.mobile || '',
        p.photoUrl || '',
        p.cricHeroesProfileUrl || '',
        p.course || '',
        p.branch || '',
        p.yearOfStudy || '',
        p.bucket || '',
        p.derivedType || '',
        p.basePrice || 20,
        p.isPaid || 'NO',
        p.status || 'REGISTERED',
        p.soldPrice || '',
        p.buyerFranchise || '',
        new Date().toISOString()
      ]);

      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, count: rows.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action: ' + action }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreatePlayersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Players');
  if (!sheet) {
    sheet = ss.insertSheet('Players');
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#1f2937').setFontColor('#f9fafb');
    sheet.setFrozenRows(1);
  }
  return sheet;
}
