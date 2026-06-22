const express = require('express');
const router = express.Router();
const TodayTask = require('../models/TodayTask');
const TopicProgress = require('../models/TopicProgress');
const DayLog = require('../models/DayLog');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { syncTasksToDayLog } = require('../utils/syncHelpers');

// Helper to get local date in YYYY-MM-DD
function getLocalDateString() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

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

  const { text, date, subjectKey, topic } = req.body;
  const taskDate = date || getLocalDateString();

  try {
    const newTask = new TodayTask({
      userId: req.user._id,
      date: taskDate,
      text,
      done: false,
      subjectKey: subjectKey || undefined,
      topic: topic || undefined
    });

    await newTask.save();
    await syncTasksToDayLog(req.user._id, taskDate, req.user);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle task check or update text
router.patch('/:id', authMiddleware, async (req, res) => {
  const { done, text, reflection, studyTime } = req.body;
  try {
    let task = await TodayTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (done !== undefined) task.done = done;
    if (text !== undefined) task.text = text;
    if (reflection !== undefined) task.reflection = reflection;
    if (studyTime !== undefined) task.studyTime = studyTime;

    await task.save();

    let updatedProgress = null;

    // Sync task state to topic progress & daily check if it is a topic-based task
    if (done !== undefined && task.subjectKey && task.topic) {
      const currentDay = getCurrentDay(req.user.startDate, req.user.targetDays);

      let progress = await TopicProgress.findOne({
        userId: req.user._id,
        subjectKey: task.subjectKey,
        topic: task.topic
      });

      if (progress) {
        // Update daily check for today
        const checkIndex = progress.dailyChecks.findIndex(c => c.day === currentDay);
        if (checkIndex > -1) {
          progress.dailyChecks[checkIndex].done = done;
          if (reflection) progress.dailyChecks[checkIndex].note = reflection;
        } else {
          progress.dailyChecks.push({
            day: currentDay,
            done: done,
            note: reflection || ''
          });
        }

        // Update overall topic completion
        progress.completed = done;
        progress.status = done ? 'Completed' : 'In Progress';

        await progress.save();
        updatedProgress = progress;

        // Recalculate completed topics for active day
        const allUserProgress = await TopicProgress.find({ userId: req.user._id });
        let completedTopicsCount = 0;
        for (const prog of allUserProgress) {
          const dayCheck = prog.dailyChecks.find(c => c.day === currentDay);
          if (dayCheck && dayCheck.done) {
            completedTopicsCount++;
          }
        }

        // Update DayLog topics count
        await DayLog.findOneAndUpdate(
          { userId: req.user._id, day: currentDay },
          { topics: completedTopicsCount },
          { upsert: true }
        );
      }
    }

    await syncTasksToDayLog(req.user._id, task.date, req.user);

    if (updatedProgress) {
      res.json({ task, topicProgress: updatedProgress });
    } else {
      res.json(task);
    }
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
    await syncTasksToDayLog(req.user._id, task.date, req.user);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
