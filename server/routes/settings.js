const express = require('express');
const router = express.Router();
const User = require('../models/User');
const TopicProgress = require('../models/TopicProgress');
const DayLog = require('../models/DayLog');
const MockTest = require('../models/MockTest');
const Note = require('../models/Note');
const TodayTask = require('../models/TodayTask');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const authMiddleware = require('../middleware/auth');

// PATCH /api/settings
router.patch('/settings', authMiddleware, async (req, res) => {
  const { targetDays, startDate, exam, ollamaUrl, ollamaModel } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (startDate !== undefined) user.startDate = new Date(startDate);
    if (exam !== undefined) user.exam = exam;
    if (ollamaUrl !== undefined) user.ollamaUrl = ollamaUrl;
    if (ollamaModel !== undefined) user.ollamaModel = ollamaModel;
    
    if (targetDays !== undefined && Number(targetDays) > 0) {
      const oldTarget = user.targetDays;
      const newTarget = Number(targetDays);
      user.targetDays = newTarget;

      // Scale day logs if new targetDays is larger
      if (newTarget > oldTarget) {
        const extraLogs = [];
        for (let d = oldTarget + 1; d <= newTarget; d++) {
          const existing = await DayLog.findOne({ userId: user._id, day: d });
          if (!existing) {
            extraLogs.push({
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
        }
        if (extraLogs.length > 0) {
          await DayLog.insertMany(extraLogs);
        }
      }
    }

    await user.save();
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      targetDays: user.targetDays,
      startDate: user.startDate,
      exam: user.exam,
      ollamaUrl: user.ollamaUrl,
      ollamaModel: user.ollamaModel
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/export
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-passwordHash');
    const topicProgress = await TopicProgress.find({ userId });
    const dayLogs = await DayLog.find({ userId }).sort({ day: 1 });
    const mockTests = await MockTest.find({ userId }).sort({ date: 1 });
    const notes = await Note.find({ userId }).sort({ updatedAt: -1 });
    const todayTasks = await TodayTask.find({ userId });
    const quizzes = await Quiz.find({ userId });
    const quizAttempts = await QuizAttempt.find({ userId });

    res.json({
      user,
      topicProgress,
      dayLogs,
      mockTests,
      notes,
      todayTasks,
      quizzes,
      quizAttempts
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error during export' });
  }
});

// POST /api/import
router.post('/import', authMiddleware, async (req, res) => {
  const { user, topicProgress, dayLogs, mockTests, notes, todayTasks, quizzes, quizAttempts } = req.body;

  if (!topicProgress || !dayLogs) {
    return res.status(400).json({ message: 'Invalid import format. Check file content.' });
  }

  try {
    const userId = req.user._id;

    // 1. Update user details
    if (user) {
      const u = await User.findById(userId);
      if (user.targetDays !== undefined) u.targetDays = Number(user.targetDays);
      if (user.startDate !== undefined) u.startDate = new Date(user.startDate);
      if (user.exam !== undefined) u.exam = user.exam;
      if (user.ollamaUrl !== undefined) u.ollamaUrl = user.ollamaUrl;
      if (user.ollamaModel !== undefined) u.ollamaModel = user.ollamaModel;
      await u.save();
    }

    // 2. Wipe existing data
    await TopicProgress.deleteMany({ userId });
    await DayLog.deleteMany({ userId });
    await MockTest.deleteMany({ userId });
    await Note.deleteMany({ userId });
    await TodayTask.deleteMany({ userId });
    await Quiz.deleteMany({ userId });
    await QuizAttempt.deleteMany({ userId });

    // 3. Import new records
    if (Array.isArray(topicProgress)) {
      const preparedProgress = topicProgress.map(p => ({
        userId,
        subjectKey: p.subjectKey,
        topic: p.topic,
        completed: p.completed || false,
        priority: p.priority || 'Medium',
        difficulty: p.difficulty || 'Medium',
        status: p.status || 'Not Started',
        questions: p.questions || 0,
        notes: p.notes || '',
        rev1: p.rev1 || false,
        rev2: p.rev2 || false,
        rev3: p.rev3 || false,
        dailyChecks: p.dailyChecks || []
      }));
      await TopicProgress.insertMany(preparedProgress);
    }

    if (Array.isArray(dayLogs)) {
      const preparedLogs = dayLogs.map(l => ({
        userId,
        day: l.day,
        completed: l.completed || false,
        topics: l.topics || 0,
        hours: l.hours || 0,
        revision: l.revision || false,
        mockTest: l.mockTest || false,
        notes: l.notes || ''
      }));
      await DayLog.insertMany(preparedLogs);
    }

    if (Array.isArray(mockTests)) {
      const preparedMocks = mockTests.map(m => ({
        userId,
        name: m.name,
        date: m.date || new Date(),
        score: m.score,
        accuracy: m.accuracy,
        timeTaken: m.timeTaken
      }));
      await MockTest.insertMany(preparedMocks);
    }

    if (Array.isArray(notes)) {
      const preparedNotes = notes.map(n => ({
        userId,
        title: n.title,
        content: n.content,
        updatedAt: n.updatedAt || new Date()
      }));
      await Note.insertMany(preparedNotes);
    }

    if (Array.isArray(todayTasks)) {
      const preparedTasks = todayTasks.map(t => ({
        userId,
        date: t.date,
        text: t.text,
        done: t.done || false
      }));
      await TodayTask.insertMany(preparedTasks);
    }

    if (Array.isArray(quizzes)) {
      const preparedQuizzes = quizzes.map(q => ({
        _id: q._id,
        userId,
        subjectKey: q.subjectKey,
        topic: q.topic,
        exam: q.exam,
        questions: q.questions
      }));
      await Quiz.insertMany(preparedQuizzes);
    }

    if (Array.isArray(quizAttempts)) {
      const preparedAttempts = quizAttempts.map(a => ({
        _id: a._id,
        userId,
        quizId: a.quizId,
        subjectKey: a.subjectKey,
        topic: a.topic,
        score: a.score,
        totalQuestions: a.totalQuestions,
        accuracy: a.accuracy,
        timeTaken: a.timeTaken,
        answers: a.answers,
        date: a.date || new Date()
      }));
      await QuizAttempt.insertMany(preparedAttempts);
    }

    const updatedUser = await User.findById(userId);
    res.json({
      message: 'Data imported successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        targetDays: updatedUser.targetDays,
        startDate: updatedUser.startDate,
        exam: updatedUser.exam,
        ollamaUrl: updatedUser.ollamaUrl,
        ollamaModel: updatedUser.ollamaModel
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error during import' });
  }
});

// DELETE /api/reset
router.delete('/reset', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete mocks, notes, and today's tasks
    await MockTest.deleteMany({ userId });
    await Note.deleteMany({ userId });
    await TodayTask.deleteMany({ userId });
    await Quiz.deleteMany({ userId });
    await QuizAttempt.deleteMany({ userId });

    // Reset topic progresses
    await TopicProgress.updateMany(
      { userId },
      {
        completed: false,
        priority: 'Medium',
        difficulty: 'Medium',
        status: 'Not Started',
        questions: 0,
        notes: '',
        rev1: false,
        rev2: false,
        rev3: false,
        dailyChecks: []
      }
    );

    // Reset day logs
    await DayLog.updateMany(
      { userId },
      {
        completed: false,
        topics: 0,
        hours: 0,
        revision: false,
        mockTest: false,
        notes: ''
      }
    );

    // Reset user settings back to default values
    const user = await User.findById(userId);
    user.targetDays = 60;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    user.startDate = today;
    user.exam = 'SSC CGL & Coal India';
    user.ollamaUrl = 'http://localhost:11434';
    user.ollamaModel = 'qwen2.5:0.5b';
    await user.save();

    res.json({
      message: 'Progress reset successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        targetDays: user.targetDays,
        startDate: user.startDate,
        exam: user.exam,
        ollamaUrl: user.ollamaUrl,
        ollamaModel: user.ollamaModel
      }
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ message: 'Server error during reset' });
  }
});

module.exports = router;
