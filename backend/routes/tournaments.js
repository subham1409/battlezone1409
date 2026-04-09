/**
 * Tournament Routes (Firebase Firestore)
 * GET    /api/tournaments        — List all tournaments (public)
 * GET    /api/tournaments/:id    — Get single tournament (public)
 * POST   /api/tournaments        — Create tournament (admin only)
 * PUT    /api/tournaments/:id    — Update tournament (admin only)
 * DELETE /api/tournaments/:id    — Delete tournament (admin only)
 */

const express = require('express');
const { db, COLLECTIONS, getNextId } = require('../data/store');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();
const col = () => db.collection(COLLECTIONS.tournaments);

// ─── GET /api/tournaments ─────────────────────────────────────
// Public: anyone can list tournaments
router.get('/', async (req, res) => {
  try {
    const snapshot = await col().orderBy('createdAt', 'desc').get();
    const data = snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    console.error('GET /tournaments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tournaments.' });
  }
});

// ─── GET /api/tournaments/:id ─────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const snapshot = await col().where('id', '==', id).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    const doc = snapshot.docs[0];
    res.json({ success: true, data: { _docId: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('GET /tournaments/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tournament.' });
  }
});

// ─── POST /api/tournaments ────────────────────────────────────
// Admin only: create a new tournament
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { name, date, time, map, fee, prize, total, status } = req.body;

    // Validation
    if (!name || !date || !time || !map || !fee || !prize || !total) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: name, date, time, map, fee, prize, total slots.' 
      });
    }

    const id = await getNextId('tournaments');
    const newTournament = {
      id,
      num: `#T-${String(id).padStart(3, '0')}`,
      name: name.trim().toUpperCase(),
      date: date.trim(),
      time: time.trim(),
      map: map.trim(),
      fee: fee.trim(),
      prize: prize.trim(),
      slots: 0,
      total: parseInt(total),
      status: status || 'open',
      createdAt: new Date().toISOString()
    };

    await col().add(newTournament);

    res.status(201).json({ 
      success: true, 
      message: `Tournament "${newTournament.name}" created successfully! 🎮`,
      data: newTournament 
    });
  } catch (err) {
    console.error('POST /tournaments error:', err);
    res.status(500).json({ success: false, message: 'Failed to create tournament.' });
  }
});

// ─── PUT /api/tournaments/:id ─────────────────────────────────
// Admin only: update an existing tournament
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const snapshot = await col().where('id', '==', id).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    const docRef = snapshot.docs[0].ref;
    const existing = snapshot.docs[0].data();
    const { name, date, time, map, fee, prize, total, slots, status } = req.body;

    // Merge updates (only update provided fields)
    const updates = {
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
      const totalVal = updates.total || existing.total;
      const pct = parseInt(slots) / totalVal;
      if (pct >= 1) updates.status = 'full';
    }

    await docRef.update(updates);

    const updated = { ...existing, ...updates };
    res.json({ 
      success: true, 
      message: 'Tournament updated successfully! ✅',
      data: updated 
    });
  } catch (err) {
    console.error('PUT /tournaments/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to update tournament.' });
  }
});

// ─── DELETE /api/tournaments/:id ──────────────────────────────
// Admin only: delete a tournament
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const snapshot = await col().where('id', '==', id).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    const doc = snapshot.docs[0];
    const deleted = doc.data();
    await doc.ref.delete();

    res.json({ 
      success: true, 
      message: `Tournament "${deleted.name}" deleted.`,
      data: deleted 
    });
  } catch (err) {
    console.error('DELETE /tournaments/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete tournament.' });
  }
});

module.exports = router;
