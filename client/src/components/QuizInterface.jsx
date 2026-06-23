import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Award, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  Loader2, 
  Check, 
  ArrowRight,
  BookOpen,
  Calendar,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function QuizInterface({ quizId, mode = 'take', attemptDetails = null, onClose }) {
  const { fetchQuiz, submitQuiz } = useApp();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Test Taking States
  const [screen, setScreen] = useState(mode === 'review' ? 'results' : 'intro'); // 'intro' | 'quiz' | 'results'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionIndex]: optionSelected }
  
  // Timer State
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  // Grading State
  const [submitting, setSubmitting] = useState(false);
  const [gradedResult, setGradedResult] = useState(attemptDetails); // Holds the attempt data

  // Load quiz details
  useEffect(() => {
    const loadQuizDetails = async () => {
      setLoading(true);
      // If we are reviewing, load quiz with answers, otherwise load standard
      const fetchMode = mode === 'review' ? 'review' : 'take';
      const data = await fetchQuiz(quizId, fetchMode);
      if (data) {
        setQuiz(data);
      } else {
        toast.error('Could not load quiz details.');
        onClose();
      }
      setLoading(false);
    };

    if (quizId) {
      loadQuizDetails();
    }
  }, [quizId, mode]);

  // Handle timer
  useEffect(() => {
    if (screen === 'quiz') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [screen]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-outfit">
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 max-w-sm w-full shadow-2xl">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-semibold text-foreground">Syncing quiz details...</p>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const totalQuestions = quiz.questions?.length || 0;
  const currentQuestion = quiz.questions?.[currentIdx];

  const handleSelectOption = (optionKey) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentIdx]: optionKey
    }));
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmitTest = async () => {
    const answeredCount = Object.keys(userAnswers).length;
    
    // Warn user if questions are unanswered
    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(`You have only answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit the test?`);
      if (!confirmSubmit) return;
    } else {
      const confirmSubmit = window.confirm("Are you sure you want to submit your answers and score the test?");
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    
    // Prepare answers payload
    const formattedAnswers = Array.from({ length: totalQuestions }).map((_, idx) => ({
      questionIndex: idx,
      selectedOption: userAnswers[idx] || ''
    }));

    try {
      const result = await submitQuiz(quiz._id, formattedAnswers, elapsedTime);
      if (result) {
        // Submit returns { attempt, quiz } where quiz has correct answers/explanations
        setGradedResult(result.attempt);
        setQuiz(result.quiz); // Update quiz state with explanations/solutions
        setScreen('results');
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred while grading your test.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Screens
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-outfit">
      
      {/* Intro Screen */}
      {screen === 'intro' && (
        <div className="bg-card border border-border w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 text-foreground relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
              <Award className="w-4 h-4" />
              Practice Evaluation Test
            </span>
            <h2 className="text-2xl font-bold tracking-tight font-outfit">
              AI Quiz: {quiz.topic}
            </h2>
            <div className="flex flex-wrap gap-2 pt-1.5">
              <span className="bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase">
                {quiz.subjectKey}
              </span>
              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Exam: {quiz.exam}
              </span>
              <span className="bg-secondary border border-border text-muted-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {totalQuestions} MCQ Questions
              </span>
            </div>
          </div>

          <div className="border border-border/80 bg-muted/20 rounded-xl p-4 space-y-3.5 text-sm">
            <h3 className="font-bold flex items-center gap-1.5 text-foreground leading-none">
              <Info className="w-4 h-4 text-primary" />
              Instructions for the Test:
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
              <li>The quiz consists of <strong className="text-foreground">{totalQuestions} multiple choice questions</strong> generated specifically for your exam syllabus.</li>
              <li>Questions cover various patterns, and include step-by-step logic and solutions.</li>
              <li>A timer will start once you click start. Take your time to calculate the answers.</li>
              <li>After submission, you will see your score, accuracy rate, and explanations.</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-border hover:bg-secondary text-muted-foreground text-sm font-bold rounded-xl transition-all"
            >
              Cancel & Exit
            </button>
            <button
              onClick={() => setScreen('quiz')}
              className="flex-1 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-bold rounded-xl shadow-md shadow-primary/15 transition-all flex items-center justify-center gap-1"
            >
              <span>Start Evaluation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Test-Taking Screen */}
      {screen === 'quiz' && currentQuestion && (
        <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-foreground">
          
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-foreground truncate pr-2" title={quiz.topic}>
                Topic Quiz: {quiz.topic}
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                Targeting: {quiz.exam}
              </p>
            </div>
            
            {/* Timer Widget */}
            <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg border border-border font-mono text-xs font-bold text-foreground shrink-0 shadow-sm">
              <Timer className="w-3.5 h-3.5 text-primary" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary h-1.5 relative">
            <div 
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>

          {/* Main Quiz Body */}
          <div className="p-6 flex-1 space-y-6 overflow-y-auto max-h-[60vh]">
            
            {/* Question Text Panel */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                Question {currentIdx + 1} of {totalQuestions}
              </span>
              <h4 className="text-base font-bold leading-relaxed text-foreground whitespace-pre-line">
                {currentQuestion.questionText}
              </h4>
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(currentQuestion.options || {}).map(([key, text]) => {
                const isSelected = userAnswers[currentIdx] === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectOption(key)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-3 group ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm shadow-primary/5'
                        : 'border-border hover:border-border/80 hover:bg-muted/10 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 font-bold text-xs transition-all ${
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border group-hover:border-primary/40 bg-background text-muted-foreground'
                      }`}>
                        {key}
                      </span>
                      <span className="text-sm truncate pr-1" title={text}>{text}</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 border-t border-border bg-muted/15 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-4 py-2 border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIdx === totalQuestions - 1 ? (
              <button
                type="button"
                onClick={handleSubmitTest}
                disabled={submitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-muted text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Grading...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Test</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results & Detailed Review Screen */}
      {screen === 'results' && gradedResult && (
        <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-foreground">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Evaluation Results
              </span>
              <h3 className="font-bold text-base text-foreground mt-0.5">
                AI Quiz: {quiz.topic}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-xs font-bold text-primary-foreground rounded-lg shadow-sm transition-all shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Review</span>
            </button>
          </div>

          {/* Main Results Dashboard Scroll Body */}
          <div className="p-6 flex-1 space-y-6 overflow-y-auto max-h-[75vh]">
            
            {/* Score Stats Ring Dashboard */}
            <div className="bg-muted/15 border border-border/80 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              
              {/* Score Circular ring */}
              <div className="md:col-span-1 flex flex-col items-center justify-center text-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  {/* Circular visualizer ring */}
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="hsl(var(--secondary))" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth="6" 
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - (gradedResult.score / gradedResult.totalQuestions))}
                    />
                  </svg>
                  <div className="text-center select-none">
                    <span className="text-2xl font-bold font-outfit text-foreground">{gradedResult.score}</span>
                    <span className="text-muted-foreground text-xs font-medium block border-t border-border/50 pt-0.5">/ {gradedResult.totalQuestions}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-2">Questions Correct</span>
              </div>

              {/* Statistics Grid */}
              <div className="md:col-span-3 grid grid-cols-3 gap-3">
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Accuracy</span>
                  <span className="text-xl font-bold font-outfit text-primary mt-1 block">
                    {gradedResult.accuracy}%
                  </span>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Time Taken</span>
                  <span className="text-xl font-bold font-outfit text-primary mt-1 block">
                    {formatTime(gradedResult.timeTaken)}
                  </span>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Exam Pattern</span>
                  <span className="text-xs font-bold text-foreground mt-2 block truncate px-1" title={quiz.exam}>
                    {quiz.exam}
                  </span>
                </div>
              </div>

            </div>

            {/* Questions detailed review registry */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm font-outfit uppercase tracking-widest text-muted-foreground pb-1 border-b border-border/40">
                Detailed Solutions & Reviews
              </h4>

              <div className="space-y-4">
                {quiz.questions.map((q, idx) => {
                  const attemptAnswer = gradedResult.answers?.find(a => a.questionIndex === idx);
                  const selectedOption = attemptAnswer ? attemptAnswer.selectedOption : '';
                  const isCorrect = attemptAnswer ? attemptAnswer.isCorrect : false;
                  const correctAnswer = q.correctAnswer;
                  
                  // Component state for toggling explanation inside list mapping
                  return (
                    <QuestionReviewItem 
                      key={idx}
                      index={idx}
                      question={q}
                      selectedOption={selectedOption}
                      correctAnswer={correctAnswer}
                      isCorrect={isCorrect}
                    />
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer close button */}
          <div className="px-6 py-4 border-t border-border bg-muted/15 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              Done & Return
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

// Sub-Component to manage separate open/close states for each explanation block in lists
function QuestionReviewItem({ index, question, selectedOption, correctAnswer, isCorrect }) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all bg-card ${
      selectedOption === ''
        ? 'border-border bg-muted/5'
        : isCorrect 
          ? 'border-emerald-500/20 bg-emerald-500/5/5 hover:bg-emerald-500/5/10' 
          : 'border-rose-500/20 bg-rose-500/5/5 hover:bg-rose-500/5/10'
    }`}>
      
      {/* Header bar showing question status */}
      <div 
        onClick={() => setShowExplanation(!showExplanation)}
        className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none"
      >
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
              selectedOption === ''
                ? 'bg-muted border-border text-muted-foreground'
                : isCorrect 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}>
              Q{index + 1}: {selectedOption === '' ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              Correct Answer: {correctAnswer}
            </span>
          </div>
          <h5 className="font-bold text-sm text-foreground leading-relaxed whitespace-pre-line">
            {question.questionText}
          </h5>
        </div>

        <div className="shrink-0 flex items-center justify-center mt-0.5">
          {selectedOption === '' ? (
            <Info className="w-5 h-5 text-muted-foreground" />
          ) : isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-500" />
          )}
        </div>
      </div>

      {/* Collapsible detailed explanation block */}
      {showExplanation && (
        <div className="px-4 pb-4 pt-1.5 border-t border-border/40 bg-muted/10 space-y-4 animate-in slide-in-from-top-1 duration-150">
          
          {/* Options Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries(question.options || {}).map(([key, text]) => {
              const isUserChoice = selectedOption === key;
              const isCorrectChoice = correctAnswer === key;

              return (
                <div 
                  key={key}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    isCorrectChoice
                      ? 'border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-800 dark:text-emerald-400'
                      : isUserChoice
                        ? 'border-rose-500 bg-rose-500/10 font-semibold text-rose-800 dark:text-rose-400'
                        : 'border-border/60 bg-background text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded flex items-center justify-center font-bold border shrink-0 text-[10px] ${
                      isCorrectChoice
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isUserChoice
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : 'border-border bg-muted text-muted-foreground'
                    }`}>
                      {key}
                    </span>
                    <span className="truncate">{text}</span>
                  </div>
                  {isCorrectChoice && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {isUserChoice && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Explanation text */}
          <div className="bg-card border border-border p-3.5 rounded-lg text-xs space-y-2">
            <h6 className="font-bold text-foreground flex items-center gap-1.5 leading-none">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Solution & Explanation:
            </h6>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {question.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
