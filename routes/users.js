const express = require('express');
const router = express.Router();
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

// GET /api/users — admin: all users
router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-googleId').sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
