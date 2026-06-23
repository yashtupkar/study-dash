const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const TopicProgress = require('../models/TopicProgress');
const authMiddleware = require('../middleware/auth');
const { generateQuizFromOllama } = require('../utils/ollama');

// POST /api/quizzes/generate
// Generate an AI MCQ Quiz on a specific topic
router.post('/generate', authMiddleware, async (req, res) => {
  const { subjectKey, topic, reflection } = req.body;

  if (!subjectKey || !topic || !reflection) {
    return res.status(400).json({ message: 'subjectKey, topic, and reflection are required.' });
  }

  try {
    const user = req.user;
    const url = user.ollamaUrl || 'http://localhost:11434';
    const model = user.ollamaModel || 'llama3';
    const exam = user.exam || 'SSC CGL & Coal India';

    // 1. Generate questions using Ollama client helper
    const questions = await generateQuizFromOllama({
      url,
      model,
      subjectKey,
      topic,
      reflection,
      exam
    });

    // 2. Save Quiz to Database
    const quiz = new Quiz({
      userId: user._id,
      subjectKey,
      topic,
      exam,
      questions
    });

    await quiz.save();

    // 3. Find/Create TopicProgress and add as a 'quiz' resource
    let progress = await TopicProgress.findOne({
      userId: user._id,
      subjectKey,
      topic
    });

    if (!progress) {
      progress = new TopicProgress({
        userId: user._id,
        subjectKey,
        topic,
        resources: []
      });
    }

    const quizResourceId = `quiz-${quiz._id}`;
    
    // Check if resource already exists (avoid duplicates)
    const exists = progress.resources.some(r => r.id === quizResourceId);
    if (!exists) {
      progress.resources.push({
        id: quizResourceId,
        name: `AI Quiz: ${topic}`,
        type: 'quiz',
        url: quiz._id.toString(),
        parentId: null,
        userId: user._id
      });
      await progress.save();
    }

    // Return quiz questions (for immediate taking, we can omit correctAnswer/explanation to prevent devtools cheating)
    const quizResponse = quiz.toObject();
    quizResponse.questions = quizResponse.questions.map(q => {
      const { correctAnswer, explanation, ...rest } = q;
      return rest;
    });

    res.status(201).json({
      quiz: quizResponse,
      message: 'Quiz generated successfully and saved to topic resources.'
    });
  } catch (error) {
    console.error('Quiz generation route error:', error);
    res.status(500).json({
      message: 'Failed to generate quiz via local Ollama. Make sure Ollama is running and has the correct model installed.',
      details: error.message
    });
  }
});

// GET /api/quizzes/attempts
// Get all quiz attempts for current user
router.get('/attempts', authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user._id })
      .sort({ date: -1 })
      .populate('quizId', 'exam');
    res.json(attempts);
  } catch (error) {
    console.error('Fetch quiz attempts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/quizzes/attempts/by-topic/:subjectKey/:topic
// Get quiz attempts for a specific topic
router.get('/attempts/by-topic/:subjectKey/:topic', authMiddleware, async (req, res) => {
  const { subjectKey, topic } = req.params;
  try {
    const attempts = await QuizAttempt.find({
      userId: req.user._id,
      subjectKey,
      topic: decodeURIComponent(topic)
    }).sort({ date: -1 });
    res.json(attempts);
  } catch (error) {
    console.error('Fetch topic quiz attempts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/quizzes/:id
// Get quiz details by ID (hiding answers for active quiz taking)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const mode = req.query.mode; // 'review' or default (exam)
    const quizObj = quiz.toObject();

    if (mode !== 'review') {
      // Strip answers and explanations
      quizObj.questions = quizObj.questions.map(q => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
      });
    }

    res.json(quizObj);
  } catch (error) {
    console.error('Fetch quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/quizzes/:id/submit
// Submit quiz answers and score the attempt
router.post('/:id/submit', authMiddleware, async (req, res) => {
  const { answers, timeTaken } = req.body; // answers: [ { questionIndex: Number, selectedOption: String } ]

  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: 'answers must be an array.' });
  }

  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    let score = 0;
    const gradedAnswers = quiz.questions.map((q, index) => {
      const submission = answers.find(a => a.questionIndex === index);
      const selectedOption = submission ? submission.selectedOption.toUpperCase() : '';
      const isCorrect = selectedOption === q.correctAnswer;

      if (isCorrect) {
        score++;
      }

      return {
        questionIndex: index,
        selectedOption,
        isCorrect
      };
    });

    const totalQuestions = quiz.questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    // Save attempt
    const attempt = new QuizAttempt({
      userId: req.user._id,
      quizId: quiz._id,
      subjectKey: quiz.subjectKey,
      topic: quiz.topic,
      score,
      totalQuestions,
      accuracy,
      timeTaken: timeTaken || 0,
      answers: gradedAnswers
    });

    await attempt.save();

    // Increment questions solved in TopicProgress for this topic (bonus tracking)
    const progress = await TopicProgress.findOne({
      userId: req.user._id,
      subjectKey: quiz.subjectKey,
      topic: quiz.topic
    });
    if (progress) {
      progress.questions = (progress.questions || 0) + totalQuestions;
      await progress.save();
    }

    res.status(201).json({
      attempt,
      quiz, // Return full quiz details (with correct answers and explanations) for review
      message: 'Quiz submitted and graded.'
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/quizzes/attempts/:id
// Delete a quiz attempt
router.delete('/attempts/:id', authMiddleware, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found.' });
    }
    res.json({ message: 'Quiz attempt deleted successfully.' });
  } catch (error) {
    console.error('Delete quiz attempt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
