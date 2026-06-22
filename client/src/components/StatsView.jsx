import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3 } from 'lucide-react';

export default function StatsView() {
  const { topicProgress, dayLogs, mockTests } = useApp();

  const totalHours = dayLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
  const totalQuestions = topicProgress.reduce((sum, topic) => sum + (topic.questions || 0), 0);

  const completedTopics = topicProgress.filter(t => t.completed).length;
  const totalTopics = topicProgress.length;
  const overallPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const avgAccuracy = mockTests.length > 0 
    ? Math.round(mockTests.reduce((sum, m) => sum + m.accuracy, 0) / mockTests.length)
    : 0;

  const avgScore = mockTests.length > 0
    ? Math.round(mockTests.reduce((sum, m) => sum + m.score, 0) / mockTests.length)
    : 0;

  const getSubjectCompletionStats = () => {
    const subjectsList = [
      { key: 'quant', name: 'Quantitative Aptitude' },
      { key: 'reasoning', name: 'Reasoning Ability' },
      { key: 'english', name: 'English Language' },
      { key: 'ga', name: 'General Awareness' },
      { key: 'cs', name: 'Computer Science' }
    ];

    return subjectsList.map(sub => {
      const subProg = topicProgress.filter(t => t.subjectKey === sub.key);
      const total = subProg.length;
      const completed = subProg.filter(t => t.completed).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...sub, total, completed, percentage };
    });
  };

  const subjectStats = getSubjectCompletionStats();

  return (
    <div className="space-y-6 text-foreground">
      
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-primary" />
          Study Metrics & Statistics
        </h2>
        <p className="text-xs text-muted-foreground">
          Detailed overview of your preparation status. Tracks subject progress, question counts, and exam averages.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Hours Logged</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-outfit">{totalHours}</span>
            <span className="text-xs text-muted-foreground">hours</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Questions Solved</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-outfit">{totalQuestions}</span>
            <span className="text-xs text-muted-foreground">MCQs</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Mock Accuracy</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-outfit">{avgAccuracy}%</span>
            <span className="text-xs text-muted-foreground">avg: {avgScore}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Overall syllabus</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-outfit">{overallPercentage}%</span>
            <span className="text-xs text-muted-foreground">{completedTopics}/{totalTopics}</span>
          </div>
        </div>
      </div>

      {/* Subject completion bars */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm font-outfit uppercase tracking-widest text-muted-foreground">
          Subject Completion Breakdown
        </h3>
        
        <div className="space-y-4">
          {subjectStats.map(sub => (
            <div key={sub.key} className="space-y-1">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-foreground">{sub.name}</span>
                <span className="text-primary">{sub.percentage}% ({sub.completed}/{sub.total})</span>
              </div>
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${sub.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
