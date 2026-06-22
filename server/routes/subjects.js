const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const authMiddleware = require('../middleware/auth');

// Get Seeded Subjects and Topics
router.get('/', authMiddleware, async (req, res) => {
  try {
    const subjects = await Subject.find({});
    res.json(subjects);
  } catch (error) {
    console.error('Fetch subjects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
