const TodayTask = require('../models/TodayTask');
const TopicProgress = require('../models/TopicProgress');
const DayLog = require('../models/DayLog');

// Helper to convert date string (YYYY-MM-DD) to day number (1-based)
function getDayNumberFromDate(startDate, dateStr) {
  if (!startDate) return null;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const current = new Date(dateStr);
  current.setHours(0, 0, 0, 0);
  const diffTime = current.getTime() - start.getTime();
  if (diffTime < 0) return null;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

// Helper to convert day number to YYYY-MM-DD date string
function getDateStringFromDay(startDate, dayNum) {
  if (!startDate) return null;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const targetDate = new Date(start);
  targetDate.setDate(start.getDate() + (dayNum - 1));
  const offset = targetDate.getTimezoneOffset();
  const localDate = new Date(targetDate.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

// Sync Today's Tasks status to DayLog completed status
async function syncTasksToDayLog(userId, dateStr, user) {
  try {
    const dayNum = getDayNumberFromDate(user.startDate, dateStr);
    if (!dayNum || dayNum < 1 || dayNum > user.targetDays) {
      return;
    }

    const tasks = await TodayTask.find({ userId, date: dateStr });
    
    const updateData = {};
    if (tasks.length > 0) {
      const allDone = tasks.every(t => t.done);
      updateData.completed = allDone;

      // Sum studyTime of all tasks for this date (in seconds) and convert to hours
      const totalSeconds = tasks.reduce((sum, t) => sum + (t.studyTime || 0), 0);
      const totalHours = Number((totalSeconds / 3600).toFixed(2));
      updateData.hours = totalHours;
    } else {
      updateData.completed = false;
      updateData.hours = 0;
    }

    await DayLog.findOneAndUpdate(
      { userId, day: dayNum },
      updateData,
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error in syncTasksToDayLog:', error);
  }
}

// Sync DayLog completed status to Today's Tasks and Syllabus Topic Progress
async function syncDayLogToTasks(userId, dayNum, completed, user) {
  try {
    const dateStr = getDateStringFromDay(user.startDate, dayNum);
    if (!dateStr) return;

    // 1. Update all today tasks for this date
    await TodayTask.updateMany(
      { userId, date: dateStr },
      { done: completed }
    );

    // 2. Fetch all today tasks for this date to sync topic progress
    const tasks = await TodayTask.find({ userId, date: dateStr });
    
    // Sync topic progress for each topic task
    for (const task of tasks) {
      if (task.subjectKey && task.topic) {
        let progress = await TopicProgress.findOne({
          userId,
          subjectKey: task.subjectKey,
          topic: task.topic
        });

        if (progress) {
          const checkIndex = progress.dailyChecks.findIndex(c => c.day === dayNum);
          if (checkIndex > -1) {
            progress.dailyChecks[checkIndex].done = completed;
            if (completed && task.reflection) {
              progress.dailyChecks[checkIndex].note = task.reflection;
            }
          } else {
            progress.dailyChecks.push({
              day: dayNum,
              done: completed,
              note: (completed ? task.reflection : '') || ''
            });
          }

          progress.completed = completed;
          progress.status = completed ? 'Completed' : 'In Progress';
          await progress.save();
        }
      }
    }

    // 3. Recalculate completed topics count for this day
    const allUserProgress = await TopicProgress.find({ userId });
    let completedTopicsCount = 0;
    for (const prog of allUserProgress) {
      const dayCheck = prog.dailyChecks.find(c => c.day === dayNum);
      if (dayCheck && dayCheck.done) {
        completedTopicsCount++;
      }
    }

    // Update DayLog topics count
    await DayLog.findOneAndUpdate(
      { userId, day: dayNum },
      { topics: completedTopicsCount },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error in syncDayLogToTasks:', error);
  }
}

module.exports = {
  getDayNumberFromDate,
  getDateStringFromDay,
  syncTasksToDayLog,
  syncDayLogToTasks
};
