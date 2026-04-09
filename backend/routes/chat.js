/**
 * Chat Routes
 * GET    /api/chat         — Get recent messages (public)
 * POST   /api/chat         — Send a message (public)
 * DELETE /api/chat/:id     — Delete a message (admin only)
 */

const express = require('express');
const { chatMessages, getNextChatId } = require('../data/store');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

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
router.get('/', (req, res) => {
  // Return last 50 messages
  const recent = chatMessages.slice(-50);
  res.json({ success: true, data: recent, count: recent.length });
});

// ─── POST /api/chat ───────────────────────────────────────────
router.post('/', (req, res) => {
  const { user, text, color, initials } = req.body;

  if (!user || !text) {
    return res.status(400).json({ success: false, message: 'user and text are required.' });
  }

  if (text.trim().length > 200) {
    return res.status(400).json({ success: false, message: 'Message too long (max 200 chars).' });
  }

  const id = getNextChatId();
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

  chatMessages.push(message);

  // Keep only last 200 messages in memory
  if (chatMessages.length > 200) {
    chatMessages.splice(0, chatMessages.length - 200);
  }

  res.status(201).json({ success: true, data: message });
});

// ─── DELETE /api/chat/:id ─────────────────────────────────────
// Admin only: moderate/delete a message
router.delete('/:id', verifyAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const index = chatMessages.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Message not found.' });
  }

  const deleted = chatMessages.splice(index, 1)[0];

  res.json({ 
    success: true, 
    message: 'Message deleted.',
    data: deleted 
  });
});

module.exports = router;
