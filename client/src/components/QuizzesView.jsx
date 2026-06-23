import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Award, 
  Trash2, 
  BookOpen, 
  HelpCircle, 
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import QuizInterface from './QuizInterface';

const subjectColors = {
  quant: { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400', name: 'Quant' },
  reasoning: { bg: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400', name: 'Reasoning' },
  english: { bg: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400', name: 'English' },
  ga: { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400', name: 'General Awareness' },
  cs: { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400', name: 'Comp Sci' }
};

export default function QuizzesView() {
  const { quizAttempts, deleteQuizAttempt, fetchQuizAttempts } = useApp();
  
  // Selected quiz for review modal
  const [reviewQuizId, setReviewQuizId] = useState(null);
  const [reviewAttemptDetails, setReviewAttemptDetails] = useState(null);

  // Sync attempts list on mount
  useEffect(() => {
    fetchQuizAttempts();
  }, []);

  // Compute Stats
  const totalAttempts = quizAttempts.length;
  const avgAccuracy = totalAttempts > 0 
    ? Math.round(quizAttempts.reduce((acc, curr) => acc + curr.accuracy, 0) / totalAttempts) 
    : 0;
  
  const totalCorrect = quizAttempts.reduce((acc, curr) => acc + curr.score, 0);
  const totalQuestions = quizAttempts.reduce((acc, curr) => acc + curr.totalQuestions, 0);

  // Format Recharts data (reverse to display chronological order)
  const chartData = [...quizAttempts].reverse().map((attempt) => {
    const d = new Date(attempt.date);
    return {
      name: attempt.topic,
      dateStr: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
      Accuracy: attempt.accuracy,
      Score: attempt.score
    };
  });

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder}s`;
  };

  const handleReviewAttempt = (attempt) => {
    setReviewQuizId(attempt.quizId._id || attempt.quizId);
    setReviewAttemptDetails(attempt);
  };

  return (
    <div className="space-y-6 text-foreground font-outfit">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-primary" />
            Topic Evaluation Tests
          </h2>
          <p className="text-xs text-muted-foreground">
            Monitor scores, accuracy rate, and speed metrics for local Ollama-generated topic quizzes.
          </p>
        </div>
      </div>

      {/* Analytics widgets */}
      {totalAttempts > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Quizzes Taken</span>
            <span className="text-2xl font-bold font-outfit text-foreground mt-2 block">{totalAttempts}</span>
          </div>

          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Average Accuracy</span>
            <span className="text-2xl font-bold font-outfit text-primary mt-2 block">{avgAccuracy}%</span>
          </div>

          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Success Rate</span>
            <span className="text-2xl font-bold font-outfit text-emerald-600 dark:text-emerald-400 mt-2 block">
              {totalCorrect} <span className="text-xs text-muted-foreground font-normal">/ {totalQuestions} correct</span>
            </span>
          </div>

          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Performance Status</span>
            <span className="text-xs font-bold px-2 py-1 rounded-full text-center mt-2.5 self-start uppercase bg-primary/10 border border-primary/20 text-primary">
              {avgAccuracy >= 80 ? 'Mastered' : avgAccuracy >= 60 ? 'In Progress' : 'Needs Review'}
            </span>
          </div>
        </div>
      )}

      {/* Trend Graph Section */}
      {totalAttempts > 0 ? (
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 leading-none">
            <TrendingUp className="w-4 h-4 text-primary" />
            Accuracy & Understanding Trend
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 35, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                <XAxis dataKey="dateStr" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Accuracy" stroke="hsl(var(--primary))" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-2xl text-muted-foreground text-sm space-y-2">
          <FileCheck className="w-8 h-8 text-muted-foreground/60 mx-auto" />
          <p className="font-semibold text-foreground">No test scores recorded yet.</p>
          <p className="text-xs max-w-sm mx-auto">Complete a syllabus topic task and submit a Feynman active recall summary to generate and attempt quizzes.</p>
        </div>
      )}

      {/* History table */}
      {totalAttempts > 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
              Evaluations History Log
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground border-b border-border text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-4">Topic / Syllabus</th>
                  <th className="p-4">Attempt Date</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 text-center">Accuracy</th>
                  <th className="p-4 text-center">Time Spent</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {quizAttempts.map((attempt) => {
                  const d = new Date(attempt.date);
                  const subColor = subjectColors[attempt.subjectKey] || { bg: 'bg-muted text-muted-foreground border-border', name: attempt.subjectKey };
                  
                  return (
                    <tr key={attempt._id} className="hover:bg-muted/5 transition-colors">
                      <td className="p-4 min-w-[200px]">
                        <div className="space-y-1">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${subColor.bg}`}>
                            {subColor.name}
                          </span>
                          <span className="font-bold text-foreground block">{attempt.topic}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-center font-bold text-foreground">
                        {attempt.score} / {attempt.totalQuestions}
                      </td>
                      <td className={`p-4 text-center font-bold whitespace-nowrap ${
                        attempt.accuracy >= 80 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : attempt.accuracy >= 60 
                            ? 'text-amber-500' 
                            : 'text-rose-500'
                      }`}>
                        {attempt.accuracy}%
                      </td>
                      <td className="p-4 text-center text-muted-foreground whitespace-nowrap">
                        {formatDuration(attempt.timeTaken)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleReviewAttempt(attempt)}
                            className="px-2.5 py-1 hover:bg-primary hover:text-primary-foreground border border-primary/20 text-primary text-xs font-semibold rounded-lg transition-all"
                          >
                            Review Test
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Permanently delete this test attempt record?")) {
                                deleteQuizAttempt(attempt._id);
                              }
                            }}
                            className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal portal */}
      {reviewQuizId && (
        <QuizInterface 
          quizId={reviewQuizId}
          mode="review"
          attemptDetails={reviewAttemptDetails}
          onClose={() => {
            setReviewQuizId(null);
            setReviewAttemptDetails(null);
          }}
        />
      )}

    </div>
  );
}
