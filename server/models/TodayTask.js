const mongoose = require('mongoose');

const TodayTaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
  subjectKey: { type: String },
  topic: { type: String },
  reflection: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TodayTask', TodayTaskSchema);
