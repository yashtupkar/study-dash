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
  }}
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
