// =====================================================================
// BATTLEZONE — Excel Save Routes
// Add these two routes to your backend/server.js (Express app)
//
// Required: npm install xlsx
// Then add at top of server.js:
//   const excelRoutes = require('./routes/excel');
//   app.use('/api', excelRoutes);
// =====================================================================

const express = require('express');
const router  = express.Router();
const xlsx    = require('xlsx');
const path    = require('path');
const fs      = require('fs');

// Base directory: BATTLEZONE/Exelfiles/
// Adjust ROOT_DIR if your server.js is not at the BATTLEZONE project root
const ROOT_DIR = path.resolve(__dirname, '..'); // goes up from /routes to BATTLEZONE/
const EXCEL_DIR = path.join(ROOT_DIR, 'Exelfiles');

// Ensure Exelfiles directory exists
if (!fs.existsSync(EXCEL_DIR)) {
  fs.mkdirSync(EXCEL_DIR, { recursive: true });
}

// ── Helper: sanitize a string for use as a filename ──────────────────
function safeFilename(name) {
  return (name || 'unknown')
    .replace(/[\\/:*?"<>|]/g, '_') // Windows/Unix unsafe chars
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

// ── Helper: read existing workbook or create a fresh one ─────────────
function loadOrCreate(filePath, headers) {
  if (fs.existsSync(filePath)) {
    return xlsx.readFile(filePath);
  }
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers]);

  // Style the header row (column widths)
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 18) }));

  xlsx.utils.book_append_sheet(wb, ws, 'Data');
  return wb;
}

// ── Helper: append a row to the first sheet ──────────────────────────
function appendRow(wb, rowData) {
  const ws = wb.Sheets[wb.SheetNames[0]];
  xlsx.utils.sheet_add_aoa(ws, [rowData], { origin: -1 }); // -1 = next empty row
}

// ── Helper: save workbook ────────────────────────────────────────────
function saveWorkbook(wb, filePath) {
  xlsx.writeFile(wb, filePath);
}


// =====================================================================
// POST /api/save-userdata
// Saves user registration data (no password) to:
//   BATTLEZONE/Exelfiles/userdata.xlsx
// =====================================================================
router.post('/save-userdata', (req, res) => {
  try {
    const { username, email, phone, bgmiId, googleUid, createdAt } = req.body;

    if (!email) return res.status(400).json({ success: false, error: 'email required' });

    const filePath = path.join(EXCEL_DIR, 'userdata.xlsx');

    const HEADERS = ['Username', 'Email', 'Phone', 'BGMI ID', 'Google UID', 'Registered At'];

    const wb  = loadOrCreate(filePath, HEADERS);
    const ws  = wb.Sheets[wb.SheetNames[0]];

    // Check if this email already exists — update in place instead of duplicating
    const range = xlsx.utils.decode_range(ws['!ref'] || 'A1');
    let existingRow = -1;
    for (let r = 1; r <= range.e.r; r++) { // skip header row 0
      const cell = ws[xlsx.utils.encode_cell({ r, c: 1 })]; // col 1 = Email
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
      // Overwrite existing row
      rowValues.forEach((val, c) => {
        ws[xlsx.utils.encode_cell({ r: existingRow, c })] = { v: val, t: 's' };
      });
    } else {
      appendRow(wb, rowValues);
    }

    // Recalculate sheet range after append
    xlsx.utils.sheet_add_aoa(wb.Sheets[wb.SheetNames[0]], [], { origin: -1 });

    saveWorkbook(wb, filePath);

    console.log(`[Excel] userdata.xlsx updated — ${email}`);
    res.json({ success: true });

  } catch (err) {
    console.error('[Excel] save-userdata error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// =====================================================================
// POST /api/save-tournament-excel
// Appends team registration to:
//   BATTLEZONE/Exelfiles/{tournamentName}.xlsx
// =====================================================================
router.post('/save-tournament-excel', (req, res) => {
  try {
    const {
      tournamentName,
      teamName,
      phone1, phone2,
      email1, email2,
      bgmiId1, bgmiId2, bgmiId3, bgmiId4,
      registeredAt
    } = req.body;

    if (!tournamentName) return res.status(400).json({ success: false, error: 'tournamentName required' });

    const filename  = safeFilename(tournamentName) + '.xlsx';
    const filePath  = path.join(EXCEL_DIR, filename);

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