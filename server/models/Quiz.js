const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true }
  },
  correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  explanation: { type: String, default: '' }
});

const QuizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectKey: { type: String, required: true },
  topic: { type: String, required: true },
  exam: { type: String, default: 'SSC CGL & Coal India' },
  questions: [QuestionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
