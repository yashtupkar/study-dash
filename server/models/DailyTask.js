const mongoose = require('mongoose');

const DailyTaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  subjectKey: { type: String },
  topic: { type: String },
  customMessage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DailyTask', DailyTaskSchema);
