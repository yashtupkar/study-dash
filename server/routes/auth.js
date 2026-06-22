const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const Subject = require('../models/Subject');
const TopicProgress = require('../models/TopicProgress');
const DayLog = require('../models/DayLog');

// Register User
router.post('/register', [
  body('name', 'Name is required').notEmpty().trim(),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password must be 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      passwordHash
    });

    await user.save();

    // Generate topic progress for all topics in the database
    const subjects = await Subject.find({});
    const progressList = [];
    for (const sub of subjects) {
      for (const topic of sub.topics) {
        progressList.push({
          userId: user._id,
          subjectKey: sub.key,
          topic: topic,
          completed: false,
          priority: 'Medium',
          difficulty: 'Medium',
          status: 'Not Started',
          questions: 0,
          notes: '',
          dailyChecks: []
        });
      }
    }
    if (progressList.length > 0) {
      await TopicProgress.insertMany(progressList);
    }

    // Generate day logs for days 1 to targetDays
    const dayLogs = [];
    for (let d = 1; d <= user.targetDays; d++) {
      dayLogs.push({
        userId: user._id,
        day: d,
        completed: false,
        topics: 0,
        hours: 0,
        revision: false,
        mockTest: false,
        notes: ''
      });
    }
    await DayLog.insertMany(dayLogs);

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecretstudydashkey123', {
      expiresIn: '30d'
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        theme: user.theme,
        targetDays: user.targetDays,
        startDate: user.startDate
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login User
router.post('/login', [
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecretstudydashkey123', {
      expiresIn: '30d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        theme: user.theme,
        targetDays: user.targetDays,
        startDate: user.startDate
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get User Profile
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    theme: req.user.theme,
    targetDays: req.user.targetDays,
    startDate: req.user.startDate
  });
});

module.exports = router;
