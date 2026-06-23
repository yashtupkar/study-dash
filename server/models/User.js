const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  targetDays: { type: Number, default: 60 },
  startDate: { type: Date, default: () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }},
  exam: { type: String, default: 'SSC CGL & Coal India' },
  ollamaUrl: { type: String, default: 'http://localhost:11434' },
  ollamaModel: { type: String, default: 'qwen2.5:0.5b' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
