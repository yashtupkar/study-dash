const express = require('express');
const router = express.Router();
const TodayTask = require('../models/TodayTask');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Helper to get local date in YYYY-MM-DD
function getLocalDateString() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

// Get tasks for a specific date
router.get('/', authMiddleware, async (req, res) => {
  const date = req.query.date || getLocalDateString();
  try {
    const tasks = await TodayTask.find({ userId: req.user._id, date });
    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', [
  authMiddleware,
  body('text', 'Task text is required').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { text, date } = req.body;
  const taskDate = date || getLocalDateString();

  try {
    const newTask = new TodayTask({
      userId: req.user._id,
      date: taskDate,
      text,
      done: false
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle task check or update text
router.patch('/:id', authMiddleware, async (req, res) => {
  const { done, text } = req.body;
  try {
    let task = await TodayTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (done !== undefined) task.done = done;
    if (text !== undefined) task.text = text;

    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await TodayTask.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
