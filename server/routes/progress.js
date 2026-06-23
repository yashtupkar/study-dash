const express = require('express');
const router = express.Router();
const TopicProgress = require('../models/TopicProgress');
const DayLog = require('../models/DayLog');
const TodayTask = require('../models/TodayTask');
const Subject = require('../models/Subject');
const authMiddleware = require('../middleware/auth');
const { syncDayLogToTasks, syncTasksToDayLog } = require('../utils/syncHelpers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isCloudinaryConfigured, uploadFromBuffer, deleteFromCloudinary } = require('../utils/cloudinary');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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

// Get user's topic progress (and merge resources globally)
router.get('/topics', authMiddleware, async (req, res) => {
  try {
    // 1. Sync subjects to make sure progress documents exist
    const subjects = await Subject.find({});
    const existingProgress = await TopicProgress.find({ userId: req.user._id });
    
    const existingMap = new Set(existingProgress.map(p => `${p.subjectKey}-${p.topic}`));
    const newProgressList = [];
    
    for (const sub of subjects) {
      for (const topic of sub.topics) {
        const key = `${sub.key}-${topic}`;
        if (!existingMap.has(key)) {
          newProgressList.push({
            userId: req.user._id,
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
    }
    
    if (newProgressList.length > 0) {
      const inserted = await TopicProgress.insertMany(newProgressList);
      existingProgress.push(...inserted);
    }

    // 2. Fetch all progress records to merge resources from all users
    const allProgress = await TopicProgress.find({}).populate('resources.userId', 'name');
    
    const resourcesMap = {};
    for (const prog of allProgress) {
      if (prog.resources && prog.resources.length > 0) {
        const key = `${prog.subjectKey}-${prog.topic}`;
        if (!resourcesMap[key]) {
          resourcesMap[key] = [];
        }
        resourcesMap[key].push(...prog.resources);
      }
    }

    // 3. Merge resources into user's progress list
    const mergedProgress = existingProgress.map(p => {
      const key = `${p.subjectKey}-${p.topic}`;
      const pObj = p.toObject();
      pObj.resources = resourcesMap[key] || [];
      return pObj;
    });

    res.json(mergedProgress);
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

    // Return with merged resources
    const allProgressForTopic = await TopicProgress.find({ subjectKey, topic }).populate('resources.userId', 'name');
    const allResourcesForTopic = allProgressForTopic.flatMap(p => p.resources || []);
    
    const pObj = progress.toObject();
    pObj.resources = allResourcesForTopic;
    res.json(pObj);
  } catch (error) {
    console.error('Update topic progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle daily cell check or update note/questions
router.patch('/topics/:subjectKey/:topic/daily', authMiddleware, async (req, res) => {
  const { subjectKey, topic } = req.params;
  const { day, done, note, questions } = req.body;

  try {
    const currentDay = getCurrentDay(req.user.startDate, req.user.targetDays);

    let progress = await TopicProgress.findOne({
      userId: req.user._id,
      subjectKey,
      topic
    });

    if (!progress) {
      return res.status(404).json({ message: 'Topic progress not found' });
    }

    const checkIndex = progress.dailyChecks.findIndex(c => c.day === Number(day));
    const existingDone = checkIndex > -1 ? progress.dailyChecks[checkIndex].done : false;

    // 1. Prevent editing any logs for future days
    if (Number(day) > currentDay) {
      return res.status(403).json({
        message: `Cannot edit logs for future days (Day ${day} is locked).`
      });
    }

    // 2. Only lock done status toggling to the current active day
    if (done !== undefined && done !== existingDone && Number(day) !== currentDay) {
      return res.status(403).json({
        message: `Locked — only today's cell (Day ${currentDay}) can be checked/unchecked.`
      });
    }

    if (checkIndex > -1) {
      if (done !== undefined) progress.dailyChecks[checkIndex].done = done;
      if (note !== undefined) progress.dailyChecks[checkIndex].note = note;
      if (questions !== undefined) progress.dailyChecks[checkIndex].questions = Number(questions);
    } else {
      progress.dailyChecks.push({
        day: Number(day),
        done: done || false,
        note: note || '',
        questions: Number(questions) || 0
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

    // Sync corresponding TodayTask if it exists
    if (done !== undefined) {
      const d = new Date();
      const offset = d.getTimezoneOffset();
      const localDate = new Date(d.getTime() - (offset * 60 * 1000));
      const todayDateStr = localDate.toISOString().split('T')[0];

      await TodayTask.findOneAndUpdate(
        { userId: req.user._id, date: todayDateStr, subjectKey, topic },
        { done: done }
      );

      await syncTasksToDayLog(req.user._id, todayDateStr, req.user);
    }

    // Return with merged resources
    const allProgressForTopic = await TopicProgress.find({ subjectKey, topic }).populate('resources.userId', 'name');
    const allResourcesForTopic = allProgressForTopic.flatMap(p => p.resources || []);
    
    const pObj = progress.toObject();
    pObj.resources = allResourcesForTopic;
    res.json(pObj);
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

    // If completed state was updated, sync tasks & topics progress
    if (completed !== undefined) {
      await syncDayLogToTasks(req.user._id, Number(day), completed, req.user);
      dayLog = await DayLog.findOne({ userId: req.user._id, day: Number(day) });
    }

    res.json(dayLog);
  } catch (error) {
    console.error('Update day log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Recursive deletion helper for file explorer
async function deleteResourceRecursively(progress, resourceId) {
  const resource = progress.resources.find(r => r.id === resourceId);
  if (!resource) return;

  if (resource.type === 'file') {
    if (resource.publicId) {
      try {
        await deleteFromCloudinary(resource.publicId);
      } catch (cloudErr) {
        console.error('Error deleting from Cloudinary:', cloudErr);
      }
    } else if (resource.url && resource.url.startsWith('/uploads/')) {
      try {
        const filename = resource.url.substring('/uploads/'.length);
        const filePath = path.join(__dirname, '..', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fsErr) {
        console.error('Error deleting local file:', fsErr);
      }
    }
  } else if (resource.type === 'folder') {
    const children = progress.resources.filter(r => r.parentId === resourceId);
    for (const child of children) {
      await deleteResourceRecursively(progress, child.id);
    }
  }

  progress.resources = progress.resources.filter(r => r.id !== resourceId);
}

// Add a topic resource (folder, link, or file upload)
router.post('/topics/:subjectKey/:topic/resources', [
  authMiddleware,
  upload.single('file')
], async (req, res) => {
  const { subjectKey, topic } = req.params;
  const { id, name, type, parentId, url } = req.body;

  try {
    let progress = await TopicProgress.findOne({ userId: req.user._id, subjectKey, topic });
    if (!progress) {
      return res.status(404).json({ message: 'Topic progress not found' });
    }

    let finalUrl = url;
    let publicId = undefined;

    if (type === 'file' && req.file) {
      if (isCloudinaryConfigured) {
        try {
          const result = await uploadFromBuffer(req.file.buffer, 'study_dash');
          finalUrl = result.secure_url;
          publicId = result.public_id;
        } catch (cloudErr) {
          console.error('Cloudinary upload failed, falling back to local:', cloudErr);
          const filename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
          const localPath = path.join(__dirname, '..', 'uploads', filename);
          fs.writeFileSync(localPath, req.file.buffer);
          finalUrl = `/uploads/${filename}`;
        }
      } else {
        const filename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
        const localPath = path.join(__dirname, '..', 'uploads', filename);
        fs.writeFileSync(localPath, req.file.buffer);
        finalUrl = `/uploads/${filename}`;
      }
    }

    const newResource = {
      id: id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || (req.file ? req.file.originalname : 'Untitled'),
      type,
      url: finalUrl,
      publicId,
      parentId: parentId || null,
      userId: req.user._id
    };

    progress.resources.push(newResource);
    await progress.save();

    // Return with merged resources
    const allProgressForTopic = await TopicProgress.find({ subjectKey, topic }).populate('resources.userId', 'name');
    const allResourcesForTopic = allProgressForTopic.flatMap(p => p.resources || []);
    
    const pObj = progress.toObject();
    pObj.resources = allResourcesForTopic;
    res.json(pObj);
  } catch (error) {
    console.error('Add resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update resource (Rename name or Move parentId)
router.patch('/topics/:subjectKey/:topic/resources/:id', authMiddleware, async (req, res) => {
  const { subjectKey, topic, id } = req.params;
  const { name, parentId } = req.body;

  try {
    let progress = await TopicProgress.findOne({ userId: req.user._id, subjectKey, topic });
    if (!progress) {
      return res.status(404).json({ message: 'Topic progress not found' });
    }

    const resourceIndex = progress.resources.findIndex(r => r.id === id);
    if (resourceIndex === -1) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (name !== undefined) progress.resources[resourceIndex].name = name;
    if (parentId !== undefined) progress.resources[resourceIndex].parentId = parentId || null;

    await progress.save();

    // Return with merged resources
    const allProgressForTopic = await TopicProgress.find({ subjectKey, topic }).populate('resources.userId', 'name');
    const allResourcesForTopic = allProgressForTopic.flatMap(p => p.resources || []);
    
    const pObj = progress.toObject();
    pObj.resources = allResourcesForTopic;
    res.json(pObj);
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete resource (Recursive folder deletion)
router.delete('/topics/:subjectKey/:topic/resources/:id', authMiddleware, async (req, res) => {
  const { subjectKey, topic, id } = req.params;

  try {
    let progress = await TopicProgress.findOne({ userId: req.user._id, subjectKey, topic });
    if (!progress) {
      return res.status(404).json({ message: 'Topic progress not found' });
    }

    await deleteResourceRecursively(progress, id);
    await progress.save();

    // Return with merged resources
    const allProgressForTopic = await TopicProgress.find({ subjectKey, topic }).populate('resources.userId', 'name');
    const allResourcesForTopic = allProgressForTopic.flatMap(p => p.resources || []);
    
    const pObj = progress.toObject();
    pObj.resources = allResourcesForTopic;
    res.json(pObj);
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
