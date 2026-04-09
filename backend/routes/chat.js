/**
 * Chat Routes (Firebase Firestore)
 * GET    /api/chat         — Get recent messages (public)
 * POST   /api/chat         — Send a message (public)
 * DELETE /api/chat/:id     — Delete a message (admin only)
 */

const express = require('express');
const { db, COLLECTIONS, getNextId } = require('../data/store');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();
const col = () => db.collection(COLLECTIONS.chatMessages);

// Profanity filter list
const PROFANITY = ['fuck', 'shit', 'bastard', 'bitch', 'ass'];

function filterProfanity(text) {
  let result = text;
  PROFANITY.forEach(word => {
    const re = new RegExp(word, 'gi');
    result = result.replace(re, '*'.repeat(word.length));
  });
  return result;
}

function getTime() {
  const now = new Date();
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}

// ─── GET /api/chat ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const snapshot = await col().orderBy('createdAt', 'desc').limit(50).get();
    const data = snapshot.docs
      .map(doc => ({ _docId: doc.id, ...doc.data() }))
      .reverse(); // Oldest first for display
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    console.error('GET /chat error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
});

// ─── POST /api/chat ───────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { user, text, color, initials } = req.body;

    if (!user || !text) {
      return res.status(400).json({ success: false, message: 'user and text are required.' });
    }

    if (text.trim().length > 200) {
      return res.status(400).json({ success: false, message: 'Message too long (max 200 chars).' });
    }

    const id = await getNextId('chatMessages');
    const message = {
      id,
      user: user.trim(),
      text: filterProfanity(text.trim()),
      color: color || '#ff7800',
      initials: initials || user.slice(0, 2).toUpperCase(),
      time: getTime(),
      own: false,
      createdAt: new Date().toISOString()
    };

    await col().add(message);

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error('POST /chat error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

// ─── DELETE /api/chat/:id ─────────────────────────────────────
// Admin only: moderate/delete a message
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const snapshot = await col().where('id', '==', id).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const doc = snapshot.docs[0];
    const deleted = doc.data();
    await doc.ref.delete();

    res.json({ 
      success: true, 
      message: 'Message deleted.',
      data: deleted 
    });
  } catch (err) {
    console.error('DELETE /chat/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
});

module.exports = router;
