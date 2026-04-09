/**
 * Registration Routes (Firebase Firestore)
 * GET  /api/registrations              — All registrations (admin)
 * GET  /api/registrations/tournament/:tournamentId — Registrations for a tournament
 * POST /api/registrations              — Register a team (public)
 * DELETE /api/registrations/:id        — Remove registration (admin)
 */

const express = require('express');
const { db, COLLECTIONS, getNextId } = require('../data/store');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();
const col = () => db.collection(COLLECTIONS.registrations);
const tCol = () => db.collection(COLLECTIONS.tournaments);

// ─── GET /api/registrations ───────────────────────────────────
// Admin only: get all registrations
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const snapshot = await col().orderBy('registeredAt', 'desc').get();
    const data = snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    console.error('GET /registrations error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch registrations.' });
  }
});

// ─── GET /api/registrations/tournament/:tournamentId ──────────
// Get registrations for a specific tournament (public)
router.get('/tournament/:tournamentId', async (req, res) => {
  try {
    const tId = parseInt(req.params.tournamentId);
    const snapshot = await col().where('tournamentId', '==', tId).get();
    const data = snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    console.error('GET /registrations/tournament/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch registrations.' });
  }
});

// ─── POST /api/registrations ──────────────────────────────────
// Public: register a team for a tournament
router.post('/', async (req, res) => {
  try {
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
    const tSnapshot = await tCol().where('id', '==', parseInt(tournamentId)).limit(1).get();
    if (tSnapshot.empty) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    const tDoc = tSnapshot.docs[0];
    const tournament = tDoc.data();

    // Check if tournament is full
    if (tournament.status === 'full' || tournament.slots >= tournament.total) {
      return res.status(400).json({ success: false, message: 'Tournament is full. Registration closed.' });
    }

    // Check for duplicate team name in this tournament
    const dupSnapshot = await col()
      .where('tournamentId', '==', parseInt(tournamentId))
      .get();
    
    const duplicate = dupSnapshot.docs.find(
      doc => doc.data().teamName.toLowerCase() === teamName.toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Team name already registered in this tournament.' });
    }

    // Create registration
    const id = await getNextId('registrations');
    const registration = {
      id,
      tournamentId: parseInt(tournamentId),
      tournamentName: tournament.name,
      teamName: teamName.trim(),
      players: players.map(p => p.trim()).filter(Boolean),
      registeredAt: new Date().toISOString(),
      status: 'confirmed'
    };

    await col().add(registration);

    // Increment slot count on tournament
    const newSlots = (tournament.slots || 0) + 1;
    const updateData = { slots: newSlots };
    if (newSlots >= tournament.total) {
      updateData.status = 'full';
    }
    await tDoc.ref.update(updateData);

    res.status(201).json({ 
      success: true, 
      message: `Team "${registration.teamName}" registered! See you on the battlefield! 🎮`,
      data: registration 
    });
  } catch (err) {
    console.error('POST /registrations error:', err);
    res.status(500).json({ success: false, message: 'Failed to register team.' });
  }
});

// ─── DELETE /api/registrations/:id ───────────────────────────
// Admin only: remove a registration
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const snapshot = await col().where('id', '==', id).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    const doc = snapshot.docs[0];
    const deleted = doc.data();
    await doc.ref.delete();

    // Decrement slot count on tournament
    const tSnapshot = await tCol().where('id', '==', deleted.tournamentId).limit(1).get();
    if (!tSnapshot.empty) {
      const tDoc = tSnapshot.docs[0];
      const tournament = tDoc.data();
      const newSlots = Math.max(0, (tournament.slots || 0) - 1);
      const updateData = { slots: newSlots };
      if (tournament.status === 'full') updateData.status = 'open';
      await tDoc.ref.update(updateData);
    }

    res.json({ 
      success: true, 
      message: `Registration for "${deleted.teamName}" removed.`,
      data: deleted 
    });
  } catch (err) {
    console.error('DELETE /registrations/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove registration.' });
  }
});

module.exports = router;
