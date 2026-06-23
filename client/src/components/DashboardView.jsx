import React, { useState } from 'react';
import { useApp, getLocalDateString } from '../context/AppContext';
import { Flame, Calendar, CheckSquare, Award, Clock, BookOpen, Quote, Grid, Sparkles, Timer, Pencil, Info, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import FlipClock from './FlipClock';

export default function DashboardView() {
  const navigate = useNavigate();
  const { 
    user, 
    currentDay, 
    streak, 
    dailyQuote, 
    subjects, 
    topicProgress, 
    dayLogs, 
    updateDayLog,
    todayTasks,
    addTodayTask,
    editTodayTask,
    toggleTodayTask,
    deleteTodayTask,
    activeStudyTaskId,
    activeStudySeconds,
    isStudyTimerRunning
  } = useApp();


  const [activeRecallTask, setActiveRecallTask] = useState(null);
  const [recallText, setRecallText] = useState('');
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [questionsSolved, setQuestionsSolved] = useState(0);

  // Filter and edit states
  const [filterType, setFilterType] = useState('all');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editCustomMessage, setEditCustomMessage] = useState('');

  const formatStudyDuration = (totalSeconds) => {
    if (!totalSeconds) return '';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const pad = (n) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Filtered Tasks
  const filteredTasks = todayTasks.filter(task => {
    if (filterType === 'all') return true;
    if (filterType === 'daily') return task.isDaily || !!task.dailyTaskId;
    if (filterType === 'specific') return task.specificDayNum !== undefined && task.specificDayNum !== null;
    if (filterType === 'one-off') return !(task.isDaily || !!task.dailyTaskId) && (task.specificDayNum === undefined || task.specificDayNum === null);
    return true;
  });

  // Line colors for each subject key
  const subjectLineColors = {
    quant: '#10B981',      // Emerald-500
    reasoning: '#A855F7',  // Purple-500
    english: '#3B82F6',    // Blue-500
    ga: '#F43F5E',         // Rose-500
    cs: '#F59E0B'          // Amber-500
  };

  // Generate day-by-day question count per subject
  const subjectsList = subjects && subjects.length > 0 ? subjects : [
    { key: 'quant', name: 'Quant' },
    { key: 'reasoning', name: 'Reasoning' },
    { key: 'english', name: 'English' },
    { key: 'ga', name: 'General Awareness' },
    { key: 'cs', name: 'Comp Sci' }
  ];

  // List days from Day 1 to currentDay
  const chartDaysCount = Math.max(1, currentDay);
  const questionsChartData = Array.from({ length: chartDaysCount }, (_, idx) => {
    const dayNum = idx + 1;
    const dataObj = { name: `Day ${dayNum}` };
    subjectsList.forEach(sub => {
      // Find sum of questions solved in this subject on this day
      const qs = topicProgress
        .filter(p => p.subjectKey === sub.key)
        .reduce((sum, p) => {
          const dailyCheck = p.dailyChecks.find(c => c.day === dayNum);
          return sum + (dailyCheck ? (dailyCheck.questions || 0) : 0);
        }, 0);
      dataObj[sub.name] = qs;
    });
    return dataObj;
  });

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



  const handleDashboardTaskCheck = (task) => {
    if (!task.done) {
      setActiveRecallTask(task);
      setRecallText('');
      setQuestionsSolved(0);
      setIsRecallModalOpen(true);
    } else {
      toggleTodayTask(task._id, false);
    }
  };

  const handleRecallSubmit = async (e) => {
    e.preventDefault();
    if (recallText.trim().length < 15) {
      toast.error('Please write a slightly more detailed explanation (minimum 15 characters).');
      return;
    }

    const reflectionText = recallText.trim();
    setIsRecallModalOpen(false);
    
    // Toggle task in DB and save feynman reflection & questions
    await toggleTodayTask(activeRecallTask._id, true, reflectionText, questionsSolved);
    
    setActiveRecallTask(null);
    setRecallText('');
    setQuestionsSolved(0);
  };

  const getIntensityClass = (hours) => {
    if (!hours || hours === 0) return 'bg-zinc-100 dark:bg-zinc-800/60 border border-border/20';
    if (hours <= 2) return 'bg-emerald-500/20 dark:bg-emerald-500/10';
    if (hours <= 4) return 'bg-emerald-500/40 dark:bg-emerald-500/30';
    if (hours <= 7) return 'bg-emerald-500/70 dark:bg-emerald-500/60';
    return 'bg-emerald-500 dark:bg-emerald-400';
  };

  const getDayNumberFromDate = (date) => {
    if (!user?.startDate) return null;
    const start = new Date(user.startDate);
    start.setHours(0, 0, 0, 0);
    const current = new Date(date);
    current.setHours(0, 0, 0, 0);
    const diffTime = current.getTime() - start.getTime();
    if (diffTime < 0) return null;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const getHeatmapDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();

    // End date is Saturday of the current week
    const gridEndDate = new Date(today);
    gridEndDate.setDate(today.getDate() + (6 - dayOfWeek));

    const totalDaysToShow = 18 * 7; // 18 weeks fits perfectly in the width
    const items = [];

    for (let i = totalDaysToShow - 1; i >= 0; i--) {
      const date = new Date(gridEndDate);
      date.setDate(gridEndDate.getDate() - i);
      
      const isFuture = date.getTime() > today.getTime();
      items.push({
        date,
        isFuture,
        key: date.toISOString().split('T')[0]
      });
    }

    return items;
  };

  const getDayDateString = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const heatmapItems = getHeatmapDays();
  const activeDaysCount = heatmapItems.reduce((count, item) => {
    if (item.isFuture) return count;
    const dayNum = getDayNumberFromDate(item.date);
    if (dayNum) {
      const log = dayLogs.find(l => l.day === dayNum);
      if (log && log.hours > 0) {
        return count + 1;
      }
    }
    return count;
  }, 0);

  // Quick Stats Grid calculations
  const todayLog = dayLogs.find(l => l.day === currentDay) || { hours: 0 };
  const todaysHours = todayLog ? todayLog.hours : 0;

  return (
    <div className="space-y-4 text-foreground">
      
      {/* Top Banner with Quote, Clock & Day counter */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Day & Progress */}
        <div className="md:col-span-2 lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
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

        {/* Flipper Clock */}
        <div className="md:col-span-1 lg:col-span-2">
          <FlipClock />
        </div>

        {/* Motivational Quote */}
        <div className="md:col-span-1 lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        
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

        {/* Today's Hours Studied */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none">Today's Study</p>
            <p className="text-xl font-bold font-outfit mt-1">{todaysHours} Hrs</p>
          </div>
        </div>

        {/* Total Hours Studied */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none">Total Hours</p>
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
            <p className="text-xs text-muted-foreground leading-none">Days Left</p>
            <p className="text-xl font-bold font-outfit mt-1">{Math.max(0, targetDays - currentDay)} Days</p>
          </div>
        </div>

      </div>

      {/* Today's Tasks & Compact Heatmap Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Today's Targets Checklist */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-lg font-outfit flex items-center gap-2 text-foreground">
                <CheckSquare className="w-5 h-5 text-primary" />
                Today's Targets
              </h3>
              <button 
                onClick={() => navigate('/today')}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Tick off your study targets for Day {currentDay}. Linked syllabus topics will update your progress.
            </p>

            {/* Task Filters */}
            {todayTasks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4 border-b border-border/40 pb-3">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-all border ${
                    filterType === 'all' 
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                      : 'border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  All ({todayTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('daily')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-all border ${
                    filterType === 'daily' 
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                      : 'border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  Daily ({todayTasks.filter(t => t.isDaily || !!t.dailyTaskId).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('specific')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-all border ${
                    filterType === 'specific' 
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                      : 'border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  Spec Day ({todayTasks.filter(t => t.specificDayNum !== undefined && t.specificDayNum !== null).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('one-off')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-all border ${
                    filterType === 'one-off' 
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                      : 'border-border hover:bg-muted text-muted-foreground'
                  }`}
                >
                  One-off ({todayTasks.filter(t => !(t.isDaily || !!t.dailyTaskId) && (t.specificDayNum === undefined || t.specificDayNum === null)).length})
                </button>
              </div>
            )}

            {/* Today Tasks Checklist List */}
            <div className="space-y-2.5">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/80 rounded-xl bg-muted/5">
                  <p className="text-xs font-semibold">No targets scheduled for today.</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Quickly add a custom task or visit Today's Tasks to link syllabus topics.</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/80 rounded-xl bg-muted/5">
                  <Info className="w-5 h-5 mx-auto mb-1 text-muted-foreground/60" />
                  <p className="text-xs font-semibold">No tasks match this filter.</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Try selecting a different option above.</p>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const isTopicTask = !!task.subjectKey;
                  const subjectColors = {
                    quant: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
                    reasoning: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400',
                    english: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
                    ga: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
                    cs: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  };
                  const subColor = isTopicTask ? subjectColors[task.subjectKey] || 'bg-muted border-border text-muted-foreground' : null;
                  const isActiveTask = activeStudyTaskId === task._id;
                  const isEditing = editingTaskId === task._id;

                  return (
                    <div 
                      key={task._id} 
                      className={`flex flex-col p-3 border rounded-xl bg-card transition-all ${
                        task.done 
                          ? 'border-primary/20 bg-primary/5/10 shadow-sm shadow-primary/5' 
                          : isActiveTask
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 animate-[pulse_3s_infinite]'
                            : 'border-border hover:border-border/80 hover:bg-muted/10'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3 p-1">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Edit Task Text</label>
                            <input
                              type="text"
                              value={editTaskText}
                              onChange={(e) => setEditTaskText(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Edit Custom Message</label>
                            <input
                              type="text"
                              placeholder="Optional message..."
                              value={editCustomMessage}
                              onChange={(e) => setEditCustomMessage(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1 border-t border-border/40 mt-2">
                            <button
                              type="button"
                              onClick={() => setEditingTaskId(null)}
                              className="px-2.5 py-1 text-[10px] font-bold border border-border hover:bg-secondary text-muted-foreground rounded transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!editTaskText.trim()) return;
                                await editTodayTask(task._id, editTaskText.trim(), editCustomMessage.trim() || undefined);
                                setEditingTaskId(null);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/95 rounded shadow-sm transition-all"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleDashboardTaskCheck(task)}
                                className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                  task.done 
                                    ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20' 
                                    : 'border-border hover:border-primary/50 text-transparent bg-background'
                                }`}
                              >
                                <span className="text-[9px] leading-none font-bold">✓</span>
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {isTopicTask && (
                                    <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${subColor}`}>
                                      {task.subjectKey.toUpperCase()}
                                    </span>
                                  )}

                                  {/* Badges for Daily and Specific Day */}
                                  {(task.isDaily || !!task.dailyTaskId) && (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 shrink-0">
                                      Daily
                                    </span>
                                  )}
                                  {task.specificDayNum !== undefined && task.specificDayNum !== null && (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
                                      Day {task.specificDayNum}
                                    </span>
                                  )}

                                  <span className={`text-xs font-semibold truncate ${task.done ? 'text-muted-foreground line-through font-medium' : 'text-foreground'}`}>
                                    {task.text}
                                  </span>

                                  {/* Study time badge */}
                                  {task.studyTime > 0 && !isActiveTask && (
                                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0 flex items-center gap-1">
                                      <Timer className="w-3 h-3 text-muted-foreground/80" />
                                      <span>{task.done ? 'Studied: ' : ''}{formatStudyDuration(task.studyTime)}</span>
                                    </span>
                                  )}

                                  {isActiveTask && (
                                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${isStudyTimerRunning ? 'bg-primary/10 text-primary animate-pulse border border-primary/20' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${isStudyTimerRunning ? 'bg-primary animate-ping' : 'bg-yellow-500'} inline-block`}></span>
                                      <span>{isStudyTimerRunning ? 'Studying: ' : 'Paused: '}{formatTimer(activeStudySeconds)}</span>
                                    </span>
                                  )}
                                </div>

                                {/* Custom Message Display */}
                                {task.customMessage && (
                                  <div className="mt-0.5 text-[10px] text-muted-foreground font-medium border-l-2 border-primary/30 pl-2">
                                    {task.customMessage}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTaskId(task._id);
                                  setEditTaskText(task.text);
                                  setEditCustomMessage(task.customMessage || '');
                                }}
                                className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground rounded transition-colors"
                                title="Edit task"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTodayTask(task._id)}
                                className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                                title="Delete task"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {task.done && task.reflection && (
                            <div className="mt-2 text-[10px] bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/10 dark:border-amber-500/20 p-2 rounded text-muted-foreground italic font-medium leading-relaxed font-outfit">
                              "{task.reflection}"
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Compact Activity Heatmap */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between relative min-h-[290px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-outfit">
                Activity Calendar
              </span>
              <span className="text-xs font-bold text-primary font-outfit">
                {activeDaysCount} active days
              </span>
            </div>

            {/* Heatmap cells aligned in a 7-row calendar grid */}
            <div className="flex items-center justify-start py-2 overflow-x-auto">
              <div className="grid grid-flow-col grid-rows-7 gap-1.5">
                {heatmapItems.map((item) => {
                  if (item.isPadding) {
                    return <div key={item.key} className="w-3.5 h-3.5 bg-transparent" />;
                  }

                  const dayNum = getDayNumberFromDate(item.date);
                  const log = dayNum ? getDayLog(dayNum) : { hours: 0, completed: false };
                  const intensity = getIntensityClass(log.hours);
                  const isToday = dayNum === currentDay;
                  const dateStr = getDayDateString(item.date);

                  return (
                    <div
                      key={item.key}
                      className="relative group"
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-[3px] transition-all duration-100 cursor-pointer ${intensity} ${
                          isToday 
                            ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-background' 
                            : ''
                        }`}
                      />
                      
                      {/* CSS Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block bg-zinc-900 dark:bg-zinc-950 border border-zinc-800/80 text-white text-[10px] font-semibold py-1 px-2 rounded-md shadow-2xl whitespace-nowrap z-50 pointer-events-none transition-all duration-200">
                        {dateStr}: {log.hours || 0} activities
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="border-t border-border/40 my-3" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="truncate pr-2 font-medium">
                Consistency tracker logs
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px]">Less</span>
                <div className="w-2.5 h-2.5 rounded-sm bg-zinc-100 dark:bg-zinc-800/60 border border-border/20"></div>
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 dark:bg-emerald-500/10"></div>
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 dark:bg-emerald-500/30"></div>
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70 dark:bg-emerald-500/60"></div>
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400"></div>
                <span className="text-[9px]">More</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Subject-wise Questions Solved Chart */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <h3 className="font-bold text-lg font-outfit mb-1 flex items-center gap-2 text-foreground">
          <TrendingUp className="w-5 h-5 text-primary" />
          Subject-wise Questions Solved
        </h3>
        <p className="text-xs text-muted-foreground mb-6">
          Track the actual quantity of practice questions solved per subject day-by-day.
        </p>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={questionsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
              <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {subjectsList.map(sub => (
                <Line 
                  key={sub.key}
                  type="monotone" 
                  dataKey={sub.name} 
                  stroke={subjectLineColors[sub.key] || '#888888'} 
                  strokeWidth={2.5} 
                  activeDot={{ r: 6 }} 
                  dot={{ r: 4 }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
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
                
                <div
                  className={`mt-3 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                    log.completed 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-border/60 text-transparent bg-muted/20'
                  }`}
                  title={log.completed ? "Day target completed!" : "Pending target tasks"}
                >
                  ✓
                </div>
                
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
                onClick={() => navigate('/subjects')}
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

      {/* Feynman Active Recall Modal */}
      {isRecallModalOpen && activeRecallTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Active Learning Check
              </span>
              <h3 className="text-lg font-bold font-outfit text-foreground mt-1">
                Feynman Technique Verification
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Explain what you learned in <strong className="text-foreground">"{activeRecallTask.text.replace('Review Topic: ', '')}"</strong> in your own words. Explaining it simply is the ultimate proof of mastery.
              </p>
            </div>

            <form onSubmit={handleRecallSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Your Explanation (Min 15 chars)
                </label>
                <textarea
                  required
                  placeholder="Write a 1-2 sentence core summary of concepts, formulas, or rules you learned..."
                  value={recallText}
                  onChange={(e) => setRecallText(e.target.value)}
                  className="w-full h-24 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1 px-1">
                  <span>Be simple, clear, and concise.</span>
                  <span className={recallText.trim().length >= 15 ? 'text-primary font-semibold' : 'text-red-500 font-semibold'}>
                    {recallText.trim().length} / 15 chars min
                  </span>
                </div>
              </div>

              {/* Show questions input if it is a topic-based task */}
              {activeRecallTask.subjectKey && (
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Questions Solved Today
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={questionsSolved}
                    onChange={(e) => setQuestionsSolved(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold"
                  />
                  <span className="block text-[9px] text-muted-foreground mt-1 px-1">
                    Enter the number of practice questions completed for this topic study block.
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecallModalOpen(false);
                    setActiveRecallTask(null);
                  }}
                  className="flex-1 py-2 border border-border hover:bg-secondary text-muted-foreground text-xs font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recallText.trim().length < 15}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Lock In Study Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
