const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'lavishleora@gmail.com').toLowerCase().trim();

// ─── helpers ────────────────────────────────────────────────────────────────

function makeToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name, picture: user.picture || '' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, picture: user.picture || '' };
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are all required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    const assignedRole = normalizedEmail === ADMIN_EMAIL ? 'admin' : 'user';
    console.log(`[Auth] Register — email: ${normalizedEmail} | ADMIN_EMAIL: ${ADMIN_EMAIL} | role: ${assignedRole}`);

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      role: assignedRole,
    });

    const token = makeToken(user);
    console.log(`[Auth] Registered: ${user.email} (role: ${user.role})`);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (error) {
    console.error('[Auth] Register error:', error.message);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // No account or Google-only account
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = makeToken(user);
    console.log(`[Auth] Logged in: ${user.email} (role: ${user.role})`);
    res.json({ token, user: safeUser(user) });
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// ─── POST /api/auth/google ────────────────────────────────────────────────────

router.post('/google', async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error('[Auth] ❌ GOOGLE_CLIENT_ID is not set in backend .env');
    return res.status(500).json({
      message: 'Server config error: GOOGLE_CLIENT_ID is missing in backend .env file. Add it and restart the server.',
    });
  }
  if (!process.env.JWT_SECRET) {
    console.error('[Auth] ❌ JWT_SECRET is not set in backend .env');
    return res.status(500).json({ message: 'Server config error: JWT_SECRET is missing in backend .env file.' });
  }

  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential token is required.' });

    console.log('[Auth] Verifying Google credential...');

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('Google returned an empty token payload.');

    const { sub: googleId, email, name, picture } = payload;
    const normalizedEmail = email.toLowerCase();
    console.log(`[Auth] ✅ Google token verified — ${normalizedEmail}`);

    let user = await User.findOne({ email: normalizedEmail });

    const isAdmin = normalizedEmail === ADMIN_EMAIL;
    console.log(`[Auth] Google — email: ${normalizedEmail} | ADMIN_EMAIL: ${ADMIN_EMAIL} | isAdmin: ${isAdmin}`);

    if (!user) {
      user = await User.create({
        googleId,
        email: normalizedEmail,
        name,
        picture,
        role: isAdmin ? 'admin' : 'user',
      });
      console.log(`[Auth] New user created: ${normalizedEmail} (role: ${user.role})`);
    } else {
      user.googleId = googleId;
      user.picture = picture;
      user.role = isAdmin ? 'admin' : 'user';
      await user.save();
      console.log(`[Auth] Existing user updated: ${normalizedEmail} (role: ${user.role})`);
    }

    const token = makeToken(user);
    console.log(`[Auth] JWT issued for ${normalizedEmail}`);
    res.json({ token, user: safeUser(user) });
  } catch (error) {
    console.error('[Auth] ❌ Google auth error:', error.message);

    if (error.message.includes('audience')) {
      return res.status(400).json({
        message: 'Token audience mismatch: GOOGLE_CLIENT_ID in backend .env must match the frontend VITE_GOOGLE_CLIENT_ID exactly.',
      });
    }
    if (error.message.includes('expired') || error.message.includes('Token used too late')) {
      return res.status(400).json({ message: 'Google token expired. Please sign in again.' });
    }
    if (error.name === 'MongoServerError') {
      return res.status(500).json({ message: 'Database error — check MONGO_URI in backend .env.' });
    }

    res.status(400).json({ message: `Google login failed: ${error.message}` });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -googleId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
