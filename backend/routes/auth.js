/**
 * Auth Routes (Firebase Firestore)
 * POST /api/auth/login  — Admin login, returns JWT
 * POST /api/auth/verify — Verify token validity
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { ADMIN_CREDENTIALS, JWT_SECRET } = require('../data/store');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password are required.' 
    });
  }

  // Check credentials
  if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials. Access denied.' 
    });
  }

  // Generate JWT token (expires in 24 hours)
  const token = jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    message: 'Login successful. Welcome, Commander! 🎮',
    token,
    admin: { username, role: 'admin' }
  });
});

// ─── POST /api/auth/verify ────────────────────────────────────
// Check if a token is still valid (used on admin panel load)
router.post('/verify', verifyAdmin, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Token is valid.',
    admin: req.admin 
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────
// Client just needs to delete the token — but we acknowledge it
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
