/**
 * Results Routes
 * GET    /api/results         — Get all results (public)
 * GET    /api/results/:id     — Get single result with leaderboard
 * POST   /api/results         — Create result (admin only)
 * PUT    /api/results/:id     — Update result (admin only)
 * DELETE /api/results/:id     — Delete result (admin only)
 */

const express = require('express');
const { results, getNextResultId } = require('../data/store');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/results ─────────────────────────────────────────
router.get('/', (req, res) => {
  const sorted = [...results].sort((a, b) => b.id - a.id);
  res.json({ success: true, data: sorted, count: sorted.length });
});

// ─── GET /api/results/:id ─────────────────────────────────────
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const result = results.find(r => r.id === id);

  if (!result) {
    return res.status(404).json({ success: false, message: 'Result not found.' });
  }

  res.json({ success: true, data: result });
});

// ─── POST /api/results ────────────────────────────────────────
// Admin only: publish a match result
router.post('/', verifyAdmin, (req, res) => {
  const { name, date, map, winner, teams, kills, prize, lb } = req.body;

  if (!name || !date || !map || !winner) {
    return res.status(400).json({ 
      success: false, 
      message: 'name, date, map, and winner are required.' 
    });
  }

  const id = getNextResultId();
  const result = {
    id,
    name: name.trim(),
    date: date.trim(),
    map: map.trim(),
    winner: winner.trim(),
    teams: teams || 0,
    kills: kills || '0 kills',
    prize: prize || '₹0',
    lb: lb || [],
    createdAt: new Date().toISOString()
  };

  results.push(result);

  res.status(201).json({ 
    success: true, 
    message: 'Match result published! 🏆',
    data: result 
  });
});

// ─── PUT /api/results/:id ─────────────────────────────────────
router.put('/:id', verifyAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = results.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Result not found.' });
  }

  const { name, date, map, winner, teams, kills, prize, lb } = req.body;
  const updated = {
    ...results[index],
    ...(name   && { name: name.trim() }),
    ...(date   && { date: date.trim() }),
    ...(map    && { map: map.trim() }),
    ...(winner && { winner: winner.trim() }),
    ...(teams  !== undefined && { teams }),
    ...(kills  && { kills }),
    ...(prize  && { prize }),
    ...(lb     && { lb }),
    updatedAt: new Date().toISOString()
  };

  results[index] = updated;

  res.json({ success: true, message: 'Result updated.', data: updated });
});

// ─── DELETE /api/results/:id ──────────────────────────────────
router.delete('/:id', verifyAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = results.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Result not found.' });
  }

  const deleted = results.splice(index, 1)[0];
  res.json({ success: true, message: 'Result deleted.', data: deleted });
});

module.exports = router;
