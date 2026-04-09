/**
 * Tournament Routes
 * GET    /api/tournaments        — List all tournaments (public)
 * GET    /api/tournaments/:id    — Get single tournament (public)
 * POST   /api/tournaments        — Create tournament (admin only)
 * PUT    /api/tournaments/:id    — Update tournament (admin only)
 * DELETE /api/tournaments/:id    — Delete tournament (admin only)
 */

const express = require('express');
const { tournaments, getNextTournamentId } = require('../data/store');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/tournaments ─────────────────────────────────────
// Public: anyone can list tournaments
router.get('/', (req, res) => {
  // Sort by id descending (newest first)
  const sorted = [...tournaments].sort((a, b) => b.id - a.id);
  res.json({ success: true, data: sorted, count: sorted.length });
});

// ─── GET /api/tournaments/:id ─────────────────────────────────
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const tournament = tournaments.find(t => t.id === id);

  if (!tournament) {
    return res.status(404).json({ success: false, message: 'Tournament not found.' });
  }

  res.json({ success: true, data: tournament });
});

// ─── POST /api/tournaments ────────────────────────────────────
// Admin only: create a new tournament
router.post('/', verifyAdmin, (req, res) => {
  const { name, date, time, map, fee, prize, total, status } = req.body;

  // Validation
  if (!name || !date || !time || !map || !fee || !prize || !total) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required: name, date, time, map, fee, prize, total slots.' 
    });
  }

  const id = getNextTournamentId();
  const newTournament = {
    id,
    num: `#T-${String(id).padStart(3, '0')}`,
    name: name.trim().toUpperCase(),
    date: date.trim(),
    time: time.trim(),
    map: map.trim(),
    fee: fee.trim(),
    prize: prize.trim(),
    slots: 0,           // Starts with 0 registrations
    total: parseInt(total),
    status: status || 'open',
    createdAt: new Date().toISOString()
  };

  tournaments.push(newTournament);

  res.status(201).json({ 
    success: true, 
    message: `Tournament "${newTournament.name}" created successfully! 🎮`,
    data: newTournament 
  });
});

// ─── PUT /api/tournaments/:id ─────────────────────────────────
// Admin only: update an existing tournament
router.put('/:id', verifyAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = tournaments.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Tournament not found.' });
  }

  const { name, date, time, map, fee, prize, total, slots, status } = req.body;

  // Merge updates (only update provided fields)
  const updated = {
    ...tournaments[index],
    ...(name  && { name: name.trim().toUpperCase() }),
    ...(date  && { date: date.trim() }),
    ...(time  && { time: time.trim() }),
    ...(map   && { map: map.trim() }),
    ...(fee   && { fee: fee.trim() }),
    ...(prize && { prize: prize.trim() }),
    ...(total !== undefined && { total: parseInt(total) }),
    ...(slots !== undefined && { slots: parseInt(slots) }),
    ...(status && { status }),
    updatedAt: new Date().toISOString()
  };

  // Auto-set status based on slots if not manually set
  if (slots !== undefined && !status) {
    const pct = parseInt(slots) / updated.total;
    if (pct >= 1) updated.status = 'full';
  }

  tournaments[index] = updated;

  res.json({ 
    success: true, 
    message: 'Tournament updated successfully! ✅',
    data: updated 
  });
});

// ─── DELETE /api/tournaments/:id ──────────────────────────────
// Admin only: delete a tournament
router.delete('/:id', verifyAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = tournaments.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Tournament not found.' });
  }

  const deleted = tournaments.splice(index, 1)[0];

  res.json({ 
    success: true, 
    message: `Tournament "${deleted.name}" deleted.`,
    data: deleted 
  });
});

module.exports = router;
