import React from 'react';
import { useApp } from '../context/AppContext';
import { Flame, Calendar, CheckSquare, Award, Clock, BookOpen, Quote } from 'lucide-react';

export default function DashboardView({ setActiveTab }) {
  const { user, currentDay, streak, dailyQuote, subjects, topicProgress, dayLogs, updateDayLog } = useApp();

  // 1. Calculate overall stats
  const totalTopics = topicProgress.length;
  const completedTopics = topicProgress.filter(t => t.completed).length;
  const overallPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const totalHours = dayLogs.reduce((sum, log) => sum + (log.hours || 0), 0);

  // 2. Calculate subject progress
  const getSubjectStats = (subKey) => {
    const subProgress = topicProgress.filter(t => t.subjectKey === subKey);
    const total = subProgress.length;
    const completed = subProgress.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  // 3. Weekly Strip (7 days ending today)
  // Let's generate a list of day numbers from (currentDay - 6) to (currentDay). Clamped between 1 and targetDays.
  const targetDays = user?.targetDays || 60;
  const startDay = Math.max(1, currentDay - 6);
  const weeklyDays = Array.from({ length: 7 }, (_, i) => {
    const d = startDay + i;
    return d <= targetDays ? d : null;
  }).filter(Boolean);

  const getDayLog = (dayNum) => {
    return dayLogs.find(l => l.day === dayNum) || {
      day: dayNum,
      completed: false,
      hours: 0,
      topics: 0
    };
  };

  const handleToggleDayComplete = async (dayNum, currentStatus) => {
    await updateDayLog(dayNum, { completed: !currentStatus });
  };

  return (
    <div className="space-y-6 text-foreground">
      
      {/* Top Banner with Quote & Day counter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Day & Progress */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full pointer-events-none"></div>
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Calendar className="w-4 h-4" />
              <span>SSC CGL & Coal India MT 2026</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mt-2 font-outfit">
              Day {currentDay} <span className="text-muted-foreground font-medium text-lg">/ {targetDays}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Keep pushing! You have completed {completedTopics} of {totalTopics} syllabus topics.
            </p>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-1.5">
              <span>OVERALL CURRICULUM PROGRESS</span>
              <span className="text-primary">{overallPercentage}%</span>
            </div>
            <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${overallPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative">
          <div className="text-primary/20 absolute right-4 top-4">
            <Quote className="w-10 h-10 fill-current" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">DAILY MOTIVATION</span>
            <p className="text-sm italic font-medium leading-relaxed text-foreground/90 font-outfit">
              "{dailyQuote}"
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-4 border-t border-border/40 pt-2">
            Rotates automatically every calendar day.
          </p>
        </div>

      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Streak */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none">Current Streak</p>
            <p className="text-xl font-bold font-outfit mt-1">{streak} Days</p>
          </div>
        </div>

        {/* Hours Studied */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none">Total Study Hours</p>
            <p className="text-xl font-bold font-outfit mt-1">{totalHours} Hrs</p>
          </div>
        </div>

        {/* Completed Topics */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none">Topics Solved</p>
            <p className="text-xl font-bold font-outfit mt-1">{completedTopics}</p>
          </div>
        </div>

        {/* Target Timeline */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none">Days Remaining</p>
            <p className="text-xl font-bold font-outfit mt-1">{Math.max(0, targetDays - currentDay)} Days</p>
          </div>
        </div>

      </div>

      {/* Weekly Progress Strip */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-lg font-outfit mb-1 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          Weekly Checklist
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Log study consistency. Check the day box when you complete your daily target.
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {weeklyDays.map(dayNum => {
            const log = getDayLog(dayNum);
            const isToday = dayNum === currentDay;
            return (
              <div 
                key={dayNum} 
                className={`border rounded-xl p-3 flex flex-col justify-between items-center transition-all ${
                  isToday 
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' 
                    : 'border-border bg-muted/20'
                }`}
              >
                <div className="text-center">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Day</span>
                  <span className={`text-lg font-bold font-outfit ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {dayNum} {isToday && '(Today)'}
                  </span>
                </div>
                
                <button
                  onClick={() => handleToggleDayComplete(dayNum, log.completed)}
                  className={`mt-3 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                    log.completed 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-border hover:border-primary/50 text-transparent'
                  }`}
                >
                  ✓
                </button>
                
                <span className="text-[10px] text-muted-foreground mt-2 font-medium">
                  {log.hours || 0} hrs studied
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subjects Progress Cards */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg font-outfit flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Syllabus Subject Completion
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(sub => {
            const stats = getSubjectStats(sub.key);
            return (
              <div 
                key={sub.key} 
                onClick={() => setActiveTab('subjects')}
                className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold font-outfit text-foreground group-hover:text-primary transition-colors text-base truncate pr-2">
                    {sub.name}
                  </span>
                  <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                    {stats.percentage}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completed} of {stats.total} topics mastered
                </p>
                <div className="mt-4 w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${stats.percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
