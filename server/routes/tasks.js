const express = require('express');
const router = express.Router();
const TodayTask = require('../models/TodayTask');
const TopicProgress = require('../models/TopicProgress');
const DayLog = require('../models/DayLog');
const DailyTask = require('../models/DailyTask');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { syncTasksToDayLog, getDateStringFromDay } = require('../utils/syncHelpers');

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

// Get ALL tasks across all dates (for timeline view)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const tasks = await TodayTask.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Fetch all tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks for a specific date (and sync daily templates)
router.get('/', authMiddleware, async (req, res) => {
  const date = req.query.date || getLocalDateString();
  try {
    // 1. Fetch all templates for daily tasks
    const templates = await DailyTask.find({ userId: req.user._id });
    
    // 2. Fetch existing tasks for this date
    const existingTasks = await TodayTask.find({ userId: req.user._id, date });
    
    let createdNew = false;
    for (const template of templates) {
      const alreadyGenerated = existingTasks.some(
        t => t.dailyTaskId && t.dailyTaskId.toString() === template._id.toString()
      );
      if (!alreadyGenerated) {
        const newDaily = new TodayTask({
          userId: req.user._id,
          date,
          text: template.text,
          done: false,
          subjectKey: template.subjectKey,
          topic: template.topic,
          dailyTaskId: template._id,
          customMessage: template.customMessage,
          isDaily: true
        });
        await newDaily.save();
        createdNew = true;
      }
    }
    
    let finalTasks = existingTasks;
    if (createdNew) {
      await syncTasksToDayLog(req.user._id, date, req.user);
      finalTasks = await TodayTask.find({ userId: req.user._id, date });
    }
    
    res.json(finalTasks);
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

  const { text, date, subjectKey, topic, isDaily, specificDayNum, customMessage, taskType, questionCount } = req.body;
  
  let taskDate = date || getLocalDateString();
  if (specificDayNum !== undefined && specificDayNum !== null) {
    const computedDate = getDateStringFromDay(req.user.startDate, Number(specificDayNum));
    if (computedDate) {
      taskDate = computedDate;
    }
  }

  try {
    let dailyTaskId = undefined;
    if (isDaily) {
      const template = new DailyTask({
        userId: req.user._id,
        text,
        subjectKey: subjectKey || undefined,
        topic: topic || undefined,
        customMessage: customMessage || undefined
      });
      await template.save();
      dailyTaskId = template._id;
    }

    const newTask = new TodayTask({
      userId: req.user._id,
      date: taskDate,
      text,
      done: false,
      subjectKey: subjectKey || undefined,
      topic: topic || undefined,
      dailyTaskId,
      customMessage: customMessage || undefined,
      isDaily: isDaily ? true : false,
      specificDayNum: (specificDayNum !== undefined && specificDayNum !== null) ? Number(specificDayNum) : undefined,
      taskType: taskType || 'custom',
      questionCount: questionCount ? Number(questionCount) : 0
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
  const { done, text, reflection, studyTime, questions, customMessage } = req.body;
  try {
    let task = await TodayTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (done !== undefined) task.done = done;
    if (text !== undefined) task.text = text;
    if (reflection !== undefined) task.reflection = reflection;
    if (studyTime !== undefined) task.studyTime = studyTime;
    if (customMessage !== undefined) task.customMessage = customMessage;

    await task.save();

    // If it has a dailyTaskId, update the DailyTask template too!
    if (task.dailyTaskId && (text !== undefined || customMessage !== undefined)) {
      const updateData = {};
      if (text !== undefined) updateData.text = text;
      if (customMessage !== undefined) updateData.customMessage = customMessage;
      await DailyTask.updateOne({ _id: task.dailyTaskId, userId: req.user._id }, updateData);
    }

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
        // ── Topic task: update dailyCheck done + questions ──
        if (task.taskType !== 'question_practice') {
          const checkIndex = progress.dailyChecks.findIndex(c => c.day === currentDay);
          if (checkIndex > -1) {
            progress.dailyChecks[checkIndex].done = done;
            if (reflection) progress.dailyChecks[checkIndex].note = reflection;
            if (questions !== undefined) progress.dailyChecks[checkIndex].questions = Number(questions);
          } else {
            progress.dailyChecks.push({
              day: currentDay,
              done: done,
              note: reflection || '',
              questions: Number(questions) || 0
            });
          }

          // If marked done, ensure overall status shows "In Progress" if not started
          if (done && progress.status === 'Not Started') {
            progress.status = 'In Progress';
          }
        }

        // ── Question Practice task: ADD questions solved to dailyChecks questions ──
        if (task.taskType === 'question_practice' && done) {
          // Use the questions param from request (user may have edited count in modal), fall back to stored questionCount
          const solvedCount = questions !== undefined ? Number(questions) : Number(task.questionCount || 0);
          if (solvedCount > 0) {
            const checkIndex = progress.dailyChecks.findIndex(c => c.day === currentDay);
            if (checkIndex > -1) {
              progress.dailyChecks[checkIndex].questions = (progress.dailyChecks[checkIndex].questions || 0) + solvedCount;
              if (reflection) progress.dailyChecks[checkIndex].note = reflection;
            } else {
              progress.dailyChecks.push({
                day: currentDay,
                done: false,
                note: reflection || '',
                questions: solvedCount
              });
            }
          }
        }

        await progress.save();
        updatedProgress = progress;

        // Recalculate completed topics for active day (only for topic tasks)
        if (task.taskType !== 'question_practice') {
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
    const task = await TodayTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // If it's a daily template task, delete the DailyTask template too
    if (task.dailyTaskId) {
      await DailyTask.deleteOne({ _id: task.dailyTaskId, userId: req.user._id });
    }

    await TodayTask.deleteOne({ _id: task._id });
    await syncTasksToDayLog(req.user._id, task.date, req.user);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
