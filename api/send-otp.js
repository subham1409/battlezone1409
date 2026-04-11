const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { email, otp, expireTime } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP required' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: `"BATTLEZONE ⚔" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🎮 Your BATTLEZONE Login OTP',
      html: `
        <div style="background:#080a0e;padding:32px;font-family:sans-serif;max-width:480px;margin:0 auto;border-radius:12px;border:1px solid rgba(255,120,0,0.3)">
          <h2 style="color:#ff7800;letter-spacing:0.1em;margin-bottom:4px">⚔ BATTLEZONE</h2>
          <p style="color:#7a8699;font-size:13px;margin-bottom:24px">India's #1 BGMI Esports Arena</p>
          <p style="color:#f0f2f5;font-size:15px;margin-bottom:16px">Your One-Time Password:</p>
          <div style="background:#111620;border:2px solid rgba(255,120,0,0.4);border-radius:10px;padding:24px;text-align:center;margin-bottom:20px">
            <span style="font-size:42px;font-weight:900;letter-spacing:0.3em;color:#ff7800">${otp}</span>
          </div>
          <p style="color:#7a8699;font-size:12px">Valid until <strong style="color:#f0f2f5">${expireTime}</strong> (10 minutes)</p>
          <p style="color:#3d4a5c;font-size:11px;margin-top:24px">Do not share this OTP. BATTLEZONE will never ask for your OTP.</p>
        </div>
      `
    });

    return res.status(200).json({ success: true, message: 'OTP sent!' });
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}