const mongoose = require('mongoose');

const UserAnswerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedOption: { type: String, default: '' }, // empty if skipped
  isCorrect: { type: Boolean, required: true }
});

const QuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  subjectKey: { type: String, required: true },
  topic: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  accuracy: { type: Number, required: true }, // percentage 0-100
  timeTaken: { type: Number, required: true }, // in seconds
  answers: [UserAnswerSchema],
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
