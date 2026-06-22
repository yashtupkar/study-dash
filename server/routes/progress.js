const express = require('express');
const router = express.Router();
const TopicProgress = require('../models/TopicProgress');
const DayLog = require('../models/DayLog');
const authMiddleware = require('../middleware/auth');

// Helper to calculate current day
function getCurrentDay(startDate, targetDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const current = diffDays + 1;
  
  if (current < 1) return 1;
  if (current > targetDays) return targetDays;
  return current;
}

// Get user's topic progress
router.get('/topics', authMiddleware, async (req, res) => {
  try {
    const progress = await TopicProgress.find({ userId: req.user._id });
    res.json(progress);
  } catch (error) {
    console.error('Fetch topic progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update general topic progress fields
router.patch('/topics/:subjectKey/:topic', authMiddleware, async (req, res) => {
  const { subjectKey, topic } = req.params;
  const { completed, priority, difficulty, status, questions, notes, rev1, rev2, rev3 } = req.body;

  try {
    let progress = await TopicProgress.findOne({
      userId: req.user._id,
      subjectKey,
      topic
    });

    if (!progress) {
      progress = new TopicProgress({
        userId: req.user._id,
        subjectKey,
        topic
      });
    }

    if (completed !== undefined) progress.completed = completed;
    if (priority !== undefined) progress.priority = priority;
    if (difficulty !== undefined) progress.difficulty = difficulty;
    if (status !== undefined) progress.status = status;
    if (questions !== undefined) progress.questions = questions;
    if (notes !== undefined) progress.notes = notes;
    if (rev1 !== undefined) progress.rev1 = rev1;
    if (rev2 !== undefined) progress.rev2 = rev2;
    if (rev3 !== undefined) progress.rev3 = rev3;

    await progress.save();
    res.json(progress);
  } catch (error) {
    console.error('Update topic progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle daily cell check. VALIDATES day === currentDay
router.patch('/topics/:subjectKey/:topic/daily', authMiddleware, async (req, res) => {
  const { subjectKey, topic } = req.params;
  const { day, done, note } = req.body;

  try {
    const currentDay = getCurrentDay(req.user.startDate, req.user.targetDays);

    if (Number(day) !== currentDay) {
      return res.status(403).json({
        message: `Locked — only today's cell (Day ${currentDay}) is editable.`
      });
    }

    let progress = await TopicProgress.findOne({
      userId: req.user._id,
      subjectKey,
      topic
    });

    if (!progress) {
      return res.status(404).json({ message: 'Topic progress not found' });
    }

    const checkIndex = progress.dailyChecks.findIndex(c => c.day === Number(day));

    if (checkIndex > -1) {
      if (done !== undefined) progress.dailyChecks[checkIndex].done = done;
      if (note !== undefined) progress.dailyChecks[checkIndex].note = note;
    } else {
      progress.dailyChecks.push({
        day: Number(day),
        done: done || false,
        note: note || ''
      });
    }

    await progress.save();

    // Dynamically calculate topics studied on this day
    const allUserProgress = await TopicProgress.find({ userId: req.user._id });
    let completedTopicsCount = 0;
    for (const prog of allUserProgress) {
      const dayCheck = prog.dailyChecks.find(c => c.day === Number(day));
      if (dayCheck && dayCheck.done) {
        completedTopicsCount++;
      }
    }

    await DayLog.findOneAndUpdate(
      { userId: req.user._id, day: Number(day) },
      { topics: completedTopicsCount },
      { upsert: true, new: true }
    );

    res.json(progress);
  } catch (error) {
    console.error('Update daily check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's day logs
router.get('/days', authMiddleware, async (req, res) => {
  try {
    const dayLogs = await DayLog.find({ userId: req.user._id }).sort({ day: 1 });
    res.json(dayLogs);
  } catch (error) {
    console.error('Fetch day logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update day details
router.patch('/days/:day', authMiddleware, async (req, res) => {
  const { day } = req.params;
  const { completed, hours, revision, mockTest, notes } = req.body;

  try {
    let dayLog = await DayLog.findOne({
      userId: req.user._id,
      day: Number(day)
    });

    if (!dayLog) {
      dayLog = new DayLog({
        userId: req.user._id,
        day: Number(day)
      });
    }

    if (completed !== undefined) dayLog.completed = completed;
    if (hours !== undefined) dayLog.hours = hours;
    if (revision !== undefined) dayLog.revision = revision;
    if (mockTest !== undefined) dayLog.mockTest = mockTest;
    if (notes !== undefined) dayLog.notes = notes;

    await dayLog.save();
    res.json(dayLog);
  } catch (error) {
    console.error('Update day log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
