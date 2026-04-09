/**
 * BATTLEZONE — BGMI Tournament Platform
 * Backend Server (Node.js + Express)
 * 
 * Run: npm install && node server.js
 * Server starts on http://localhost:3000
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors()); // Allow cross-origin requests from frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// ─── Routes ──────────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const tournamentRoutes  = require('./routes/tournaments');
const registrationRoutes = require('./routes/registrations');
const chatRoutes        = require('./routes/chat');
const resultRoutes      = require('./routes/results');

app.use('/api/auth',          authRoutes);
app.use('/api/tournaments',   tournamentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/results',       resultRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BATTLEZONE API is running 🎮', timestamp: new Date() });
});

// ─── Root redirect ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.redirect('/frontend/index.html');
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎮 BATTLEZONE Server running at http://localhost:${PORT}`);
  console.log(`📋 Admin Panel: http://localhost:${PORT}/admin/admin.html`);
  console.log(`🌐 Frontend:    http://localhost:${PORT}/frontend/index.html`);
  console.log(`📡 API Base:    http://localhost:${PORT}/api\n`);
});

module.exports = app;
