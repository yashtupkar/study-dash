const express = require('express');
const router = express.Router();
const MockTest = require('../models/MockTest');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get mocks
router.get('/', authMiddleware, async (req, res) => {
  try {
    const mocks = await MockTest.find({ userId: req.user._id }).sort({ date: 1 });
    res.json(mocks);
  } catch (error) {
    console.error('Fetch mocks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create mock
router.post('/', [
  authMiddleware,
  body('name', 'Name is required').notEmpty().trim(),
  body('score', 'Score must be a number').isNumeric(),
  body('accuracy', 'Accuracy must be a number between 0 and 100').isFloat({ min: 0, max: 100 }),
  body('timeTaken', 'Time taken must be a number').isNumeric()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, date, score, accuracy, timeTaken } = req.body;

  try {
    const newMock = new MockTest({
      userId: req.user._id,
      name,
      date: date || new Date(),
      score,
      accuracy,
      timeTaken
    });

    await newMock.save();
    res.status(201).json(newMock);
  } catch (error) {
    console.error('Create mock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete mock
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const mock = await MockTest.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!mock) {
      return res.status(404).json({ message: 'Mock test not found' });
    }
    res.json({ message: 'Mock test deleted successfully' });
  } catch (error) {
    console.error('Delete mock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
