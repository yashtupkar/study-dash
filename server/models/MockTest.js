const mongoose = require('mongoose');

const MockTestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  score: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  timeTaken: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('MockTest', MockTestSchema);
