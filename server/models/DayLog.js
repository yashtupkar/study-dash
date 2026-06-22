const mongoose = require('mongoose');

const DayLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  topics: { type: Number, default: 0 },
  hours: { type: Number, default: 0 },
  revision: { type: Boolean, default: false },
  mockTest: { type: Boolean, default: false },
  notes: { type: String, default: '' }
}, { timestamps: true });

DayLogSchema.index({ userId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('DayLog', DayLogSchema);
