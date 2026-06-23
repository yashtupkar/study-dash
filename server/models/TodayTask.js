const mongoose = require('mongoose');

const TodayTaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
  subjectKey: { type: String },
  topic: { type: String },
  reflection: { type: String },
  studyTime: { type: Number, default: 0 }, // study time in seconds
  dailyTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyTask' },
  customMessage: { type: String },
  isDaily: { type: Boolean, default: false },
  specificDayNum: { type: Number },
  taskType: { type: String, enum: ['custom', 'topic', 'question_practice'], default: 'custom' },
  questionCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('TodayTask', TodayTaskSchema);
