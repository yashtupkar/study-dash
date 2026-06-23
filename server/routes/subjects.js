const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const TopicProgress = require('../models/TopicProgress');
const TodayTask = require('../models/TodayTask');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all Subjects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const subjects = await Subject.find({});
    res.json(subjects);
  } catch (error) {
    console.error('Fetch subjects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new Subject
router.post('/', [
  authMiddleware,
  body('name', 'Subject name is required').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name } = req.body;
  // Slugify name to create key
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '');

  try {
    let subjectExists = await Subject.findOne({ key });
    if (subjectExists) {
      return res.status(400).json({ message: 'Subject key already exists. Use a different name.' });
    }

    const newSubject = new Subject({
      name,
      key,
      topics: []
    });

    await newSubject.save();
    res.status(201).json(newSubject);
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Subject name and/or key
router.patch('/:id', [
  authMiddleware,
  body('name', 'Subject name is required').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name } = req.body;
  const newKey = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '');

  try {
    let subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const oldKey = subject.key;

    // Check if new key conflicts with another subject
    if (newKey !== oldKey) {
      const conflict = await Subject.findOne({ key: newKey });
      if (conflict) {
        return res.status(400).json({ message: 'Another subject with this name/key already exists.' });
      }
    }

    subject.name = name;
    subject.key = newKey;
    await subject.save();

    // Cascade update subjectKey in other collections
    if (newKey !== oldKey) {
      await TopicProgress.updateMany({ subjectKey: oldKey }, { subjectKey: newKey });
      await TodayTask.updateMany({ subjectKey: oldKey }, { subjectKey: newKey });
    }

    res.json(subject);
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Subject (Cascading delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const subjectKey = subject.key;

    // Delete matching progress and tasks
    await TopicProgress.deleteMany({ subjectKey });
    await TodayTask.deleteMany({ subjectKey });
    
    // Delete the subject
    await Subject.findByIdAndDelete(req.params.id);

    res.json({ message: 'Subject deleted successfully and associated data cleared.' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Topic to Subject
router.post('/:id/topics', [
  authMiddleware,
  body('topic', 'Topic name is required').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { topic } = req.body;

  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (subject.topics.includes(topic)) {
      return res.status(400).json({ message: 'Topic already exists in this subject.' });
    }

    subject.topics.push(topic);
    await subject.save();

    res.json(subject);
  } catch (error) {
    console.error('Add topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Rename Topic in Subject (Cascading update)
router.patch('/:id/topics', [
  authMiddleware,
  body('oldTopic', 'Old topic name is required').notEmpty().trim(),
  body('newTopic', 'New topic name is required').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { oldTopic, newTopic } = req.body;

  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const topicIndex = subject.topics.indexOf(oldTopic);
    if (topicIndex === -1) {
      return res.status(404).json({ message: 'Topic not found in subject.' });
    }

    // Check if newTopic already exists
    if (subject.topics.includes(newTopic) && newTopic !== oldTopic) {
      return res.status(400).json({ message: 'The new topic name already exists in this subject.' });
    }

    subject.topics[topicIndex] = newTopic;
    await subject.save();

    // Cascade update TopicProgress and TodayTask
    await TopicProgress.updateMany({ subjectKey: subject.key, topic: oldTopic }, { topic: newTopic });
    await TodayTask.updateMany(
      { subjectKey: subject.key, topic: oldTopic },
      { text: `Review Topic: ${newTopic}`, topic: newTopic }
    );

    res.json(subject);
  } catch (error) {
    console.error('Rename topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Topic from Subject (Cascading delete)
router.delete('/:id/topics/:topicName', authMiddleware, async (req, res) => {
  const { topicName } = req.params;

  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const topicIndex = subject.topics.indexOf(topicName);
    if (topicIndex === -1) {
      return res.status(404).json({ message: 'Topic not found in subject.' });
    }

    subject.topics.splice(topicIndex, 1);
    await subject.save();

    // Cascade delete associated TopicProgress and TodayTask
    await TopicProgress.deleteMany({ subjectKey: subject.key, topic: topicName });
    await TodayTask.deleteMany({ subjectKey: subject.key, topic: topicName });

    res.json(subject);
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
