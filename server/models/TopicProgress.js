const mongoose = require('mongoose');

const TopicProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectKey: { type: String, required: true },
  topic: { type: String, required: true },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Revision', 'Completed'], default: 'Not Started' },
  questions: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  rev1: { type: Boolean, default: false },
  rev2: { type: Boolean, default: false },
  rev3: { type: Boolean, default: false },
  dailyChecks: [{
    day: { type: Number, required: true },
    done: { type: Boolean, default: false },
    note: { type: String, default: '' }
  }]
}, { timestamps: true });

TopicProgressSchema.index({ userId: 1, subjectKey: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model('TopicProgress', TopicProgressSchema);
