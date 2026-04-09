/**
 * Results Routes (Firebase Firestore)
 * GET    /api/results         — Get all results (public)
 * GET    /api/results/:id     — Get single result with leaderboard
 * POST   /api/results         — Create result (admin only)
 * PUT    /api/results/:id     — Update result (admin only)
 * DELETE /api/results/:id     — Delete result (admin only)
 */

const express = require('express');
const { db, COLLECTIONS, getNextId } = require('../data/store');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();
const col = () => db.collection(COLLECTIONS.results);

// ─── GET /api/results ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const snapshot = await col().orderBy('createdAt', 'desc').get();
    const data = snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    console.error('GET /results error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch results.' });
  }
});

// ─── GET /api/results/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const snapshot = await col().where('id', '==', id).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Result not found.' });
    }

    const doc = snapshot.docs[0];
    res.json({ success: true, data: { _docId: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('GET /results/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch result.' });
  }
});

// ─── POST /api/results ────────────────────────────────────────
// Admin only: publish a match result
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { name, date, map, winner, teams, kills, prize, lb } = req.body;

    if (!name || !date || !map || !winner) {
      return res.status(400).json({ 
        success: false, 
        message: 'name, date, map, and winner are required.' 
      });
    }

    const id = await getNextId('results');
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

    await col().add(result);

    res.status(201).json({ 
      success: true, 
      message: 'Match result published! 🏆',
      data: result 
    });
  } catch (err) {
    console.error('POST /results error:', err);
    res.status(500).json({ success: false, message: 'Failed to publish result.' });
  }
});

// ─── PUT /api/results/:id ─────────────────────────────────────
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const snapshot = await col().where('id', '==', id).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Result not found.' });
    }

    const docRef = snapshot.docs[0].ref;
    const existing = snapshot.docs[0].data();
    const { name, date, map, winner, teams, kills, prize, lb } = req.body;

    const updates = {
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

    await docRef.update(updates);

    const updated = { ...existing, ...updates };
    res.json({ success: true, message: 'Result updated.', data: updated });
  } catch (err) {
    console.error('PUT /results/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to update result.' });
  }
});

// ─── DELETE /api/results/:id ──────────────────────────────────
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const snapshot = await col().where('id', '==', id).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Result not found.' });
    }

    const doc = snapshot.docs[0];
    const deleted = doc.data();
    await doc.ref.delete();

    res.json({ success: true, message: 'Result deleted.', data: deleted });
  } catch (err) {
    console.error('DELETE /results/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete result.' });
  }
});

module.exports = router;
