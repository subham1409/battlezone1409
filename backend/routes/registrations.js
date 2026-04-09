/**
 * Registration Routes
 * GET  /api/registrations              — All registrations (admin)
 * GET  /api/registrations/:tournamentId — Registrations for a tournament
 * POST /api/registrations              — Register a team (public)
 * DELETE /api/registrations/:id        — Remove registration (admin)
 */

const express = require('express');
const { registrations, tournaments, getNextRegistrationId } = require('../data/store');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/registrations ───────────────────────────────────
// Admin only: get all registrations
router.get('/', verifyAdmin, (req, res) => {
  const sorted = [...registrations].sort((a, b) => b.id - a.id);
  res.json({ success: true, data: sorted, count: sorted.length });
});

// ─── GET /api/registrations/tournament/:tournamentId ──────────
// Get registrations for a specific tournament (public)
router.get('/tournament/:tournamentId', (req, res) => {
  const tId = parseInt(req.params.tournamentId);
  const list = registrations.filter(r => r.tournamentId === tId);
  res.json({ success: true, data: list, count: list.length });
});

// ─── POST /api/registrations ──────────────────────────────────
// Public: register a team for a tournament
router.post('/', (req, res) => {
  const { tournamentId, teamName, players } = req.body;

  // Validate required fields
  if (!tournamentId || !teamName || !players || !Array.isArray(players)) {
    return res.status(400).json({ 
      success: false, 
      message: 'tournamentId, teamName, and players array are required.' 
    });
  }

  if (players.length < 2 || players.length > 4) {
    return res.status(400).json({ 
      success: false, 
      message: 'A team must have 2–4 players.' 
    });
  }

  // Check if tournament exists
  const tournament = tournaments.find(t => t.id === parseInt(tournamentId));
  if (!tournament) {
    return res.status(404).json({ success: false, message: 'Tournament not found.' });
  }

  // Check if tournament is full
  if (tournament.status === 'full' || tournament.slots >= tournament.total) {
    return res.status(400).json({ success: false, message: 'Tournament is full. Registration closed.' });
  }

  // Check for duplicate team name in this tournament
  const duplicate = registrations.find(
    r => r.tournamentId === parseInt(tournamentId) && 
         r.teamName.toLowerCase() === teamName.toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({ success: false, message: 'Team name already registered in this tournament.' });
  }

  // Create registration
  const id = getNextRegistrationId();
  const registration = {
    id,
    tournamentId: parseInt(tournamentId),
    tournamentName: tournament.name,
    teamName: teamName.trim(),
    players: players.map(p => p.trim()).filter(Boolean),
    registeredAt: new Date().toISOString(),
    status: 'confirmed'
  };

  registrations.push(registration);

  // Increment slot count on tournament
  tournament.slots += 1;
  if (tournament.slots >= tournament.total) {
    tournament.status = 'full';
  }

  res.status(201).json({ 
    success: true, 
    message: `Team "${registration.teamName}" registered! See you on the battlefield! 🎮`,
    data: registration 
  });
});

// ─── DELETE /api/registrations/:id ───────────────────────────
// Admin only: remove a registration
router.delete('/:id', verifyAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = registrations.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Registration not found.' });
  }

  const deleted = registrations.splice(index, 1)[0];

  // Decrement slot count
  const tournament = tournaments.find(t => t.id === deleted.tournamentId);
  if (tournament && tournament.slots > 0) {
    tournament.slots -= 1;
    if (tournament.status === 'full') tournament.status = 'open';
  }

  res.json({ 
    success: true, 
    message: `Registration for "${deleted.teamName}" removed.`,
    data: deleted 
  });
});

module.exports = router;
