/**
 * OTP Routes
 * POST /api/otp/send   — Generate & email a 6-digit OTP
 * POST /api/otp/verify — Verify the OTP entered by user
 */

const express = require('express');
const nodemailer = require('nodemailer');
const { db } = require('./firebase');

const router = express.Router();

// ─── Nodemailer transporter ───────────────────────────────────
// Uses Gmail SMTP — set these in environment variables on Vercel
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,   // e.g. battlezonegamerz@gmail.com
    pass: process.env.GMAIL_PASS    // Gmail App Password (not your real password)
  }
});

// ─── POST /api/otp/send ───────────────────────────────────────
router.post('/send', async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Valid email is required.' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  const emailKey = email.replace(/[.#$[\]]/g, '_');

  try {
    // Store OTP in Firebase
    await db.ref('otp/' + emailKey).set({ otp, expiry });

    // Send email
    const expireTime = new Date(expiry).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });

    await transporter.sendMail({
      from: `"BATTLEZONE ⚔" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🎮 Your BATTLEZONE Login OTP',
      html: `
        <div style="background:#080a0e;padding:32px;font-family:sans-serif;max-width:480px;margin:0 auto;border-radius:12px">
          <h2 style="color:#ff7800;letter-spacing:0.1em;margin-bottom:8px">⚔ BATTLEZONE</h2>
          <p style="color:#7a8699;font-size:13px;margin-bottom:24px">India's #1 BGMI Esports Arena</p>
          <p style="color:#f0f2f5;font-size:15px;margin-bottom:16px">Your One-Time Password:</p>
          <div style="background:#111620;border:1px solid rgba(255,120,0,0.3);border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
            <span style="font-size:36px;font-weight:900;letter-spacing:0.25em;color:#ff7800">${otp}</span>
          </div>
          <p style="color:#7a8699;font-size:12px">Valid until <strong style="color:#f0f2f5">${expireTime}</strong> (10 minutes)</p>
          <p style="color:#3d4a5c;font-size:11px;margin-top:24px">Do not share this OTP with anyone. BATTLEZONE will never ask for your OTP.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'OTP sent successfully!' });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP: ' + err.message });
  }
});

// ─── POST /api/otp/verify ─────────────────────────────────────
router.post('/verify', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const emailKey = email.replace(/[.#$[\]]/g, '_');

  try {
    const snap = await db.ref('otp/' + emailKey).once('value');
    const data = snap.val();

    if (!data) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (Date.now() > data.expiry) {
      await db.ref('otp/' + emailKey).remove();
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (data.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: 'Wrong OTP. Try again.' });
    }

    // OTP correct — delete it
    await db.ref('otp/' + emailKey).remove();
    res.json({ success: true, message: 'OTP verified successfully!' });

  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ success: false, message: 'Verification failed: ' + err.message });
  }
});

module.exports = router;