/**
 * Excel Routes — BATTLEZONE
 * POST /api/save-userdata          — Save user registration to userdata.xlsx
 * POST /api/save-tournament-excel  — Save team registration to {tournamentName}.xlsx
 */

const express = require('express');
const router  = express.Router();
const xlsx    = require('xlsx');
const path    = require('path');
const fs      = require('fs');

// Goes up from backend/routes/ → backend/ → BATTLEZONE/
const ROOT_DIR  = path.resolve(__dirname, '../..');
const EXCEL_DIR = path.join(ROOT_DIR, 'Exelfiles');

// Ensure Exelfiles directory exists on startup
if (!fs.existsSync(EXCEL_DIR)) {
  fs.mkdirSync(EXCEL_DIR, { recursive: true });
}

function safeFilename(name) {
  return (name || 'unknown')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

function loadOrCreate(filePath, headers) {
  if (fs.existsSync(filePath)) {
    return xlsx.readFile(filePath);
  }
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers]);
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 18) }));
  xlsx.utils.book_append_sheet(wb, ws, 'Data');
  return wb;
}

function appendRow(wb, rowData) {
  const ws = wb.Sheets[wb.SheetNames[0]];
  xlsx.utils.sheet_add_aoa(ws, [rowData], { origin: -1 });
}

function saveWorkbook(wb, filePath) {
  xlsx.writeFile(wb, filePath);
}

// ─── POST /api/save-userdata ──────────────────────────────────
router.post('/save-userdata', (req, res) => {
  try {
    const { username, email, phone, bgmiId, googleUid, createdAt } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'email is required.' });
    }

    const filePath = path.join(EXCEL_DIR, 'userdata.xlsx');
    const HEADERS  = ['Username', 'Email', 'Phone', 'BGMI ID', 'Google UID', 'Registered At'];
    const wb       = loadOrCreate(filePath, HEADERS);
    const ws       = wb.Sheets[wb.SheetNames[0]];

    const range = xlsx.utils.decode_range(ws['!ref'] || 'A1');
    let existingRow = -1;
    for (let r = 1; r <= range.e.r; r++) {
      const cell = ws[xlsx.utils.encode_cell({ r, c: 1 })];
      if (cell && cell.v === email) { existingRow = r; break; }
    }

    const rowValues = [
      username  || '',
      email     || '',
      phone     || '',
      bgmiId    || '',
      googleUid || '',
      createdAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    ];

    if (existingRow >= 0) {
      rowValues.forEach((val, c) => {
        ws[xlsx.utils.encode_cell({ r: existingRow, c })] = { v: val, t: 's' };
      });
    } else {
      appendRow(wb, rowValues);
    }

    saveWorkbook(wb, filePath);
    console.log(`[Excel] userdata.xlsx updated — ${email}`);
    res.json({ success: true });

  } catch (err) {
    console.error('[Excel] save-userdata error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/save-tournament-excel ─────────────────────────
router.post('/save-tournament-excel', (req, res) => {
  try {
    const {
      tournamentName, teamName,
      phone1, phone2, email1, email2,
      bgmiId1, bgmiId2, bgmiId3, bgmiId4,
      registeredAt
    } = req.body;

    if (!tournamentName) {
      return res.status(400).json({ success: false, error: 'tournamentName is required.' });
    }

    const filename = safeFilename(tournamentName) + '.xlsx';
    const filePath = path.join(EXCEL_DIR, filename);

    const HEADERS = [
      'Team Name',
      'Phone 1', 'Phone 2',
      'Email 1', 'Email 2',
      'BGMI ID 1', 'BGMI ID 2', 'BGMI ID 3', 'BGMI ID 4',
      'Registered At'
    ];

    const wb = loadOrCreate(filePath, HEADERS);

    appendRow(wb, [
      teamName     || '',
      phone1       || '',
      phone2       || '',
      email1       || '',
      email2       || '',
      bgmiId1      || '',
      bgmiId2      || '',
      bgmiId3      || '',
      bgmiId4      || '',
      registeredAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    ]);

    saveWorkbook(wb, filePath);
    console.log(`[Excel] ${filename} updated — team: ${teamName}`);
    res.json({ success: true });

  } catch (err) {
    console.error('[Excel] save-tournament-excel error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;