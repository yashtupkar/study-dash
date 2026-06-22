import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronDown, ChevronUp, Lock, Search, AlertCircle, Plus, Minus, MessageSquare, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SubjectsView() {
  const { 
    user, 
    currentDay, 
    subjects, 
    topicProgress, 
    toggleTopicDaily, 
    updateTopicProgress 
  } = useApp();

  const [activeSubKey, setActiveSubKey] = useState('quant');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopic, setExpandedTopic] = useState(null);

  // Active Subject details
  const activeSubject = subjects.find(s => s.key === activeSubKey);
  const activeProgress = topicProgress.filter(p => p.subjectKey === activeSubKey);

  // Filtered topics based on search
  const filteredProgress = activeProgress.filter(p => 
    p.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubjectCompletion = () => {
    const total = activeProgress.length;
    const completed = activeProgress.filter(p => p.completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleTopicCompletedToggle = async (p) => {
    const nextCompleted = !p.completed;
    const nextStatus = nextCompleted ? 'Completed' : 'In Progress';
    await updateTopicProgress(p.subjectKey, p.topic, { 
      completed: nextCompleted,
      status: nextStatus
    });
    toast.success(`"${p.topic}" marked as ${nextCompleted ? 'completed' : 'in progress'}.`);
  };

  const handleCellClick = async (p, dayNum, currentChecked) => {
    if (dayNum !== currentDay) {
      toast.warning(`Locked — only today's cell (Day ${currentDay}) is editable.`, {
        icon: <Lock className="w-4 h-4 text-amber-500" />
      });
      return;
    }
    try {
      await toggleTopicDaily(p.subjectKey, p.topic, dayNum, !currentChecked);
    } catch (e) {
      // Toast shown by context
    }
  };

  const handleSaveTodayNote = async (p, noteText) => {
    try {
      await toggleTopicDaily(p.subjectKey, p.topic, currentDay, undefined, noteText);
      // Wait, toggleTopicDaily doesn't take note parameter directly unless we support it.
      // Let's modify toggleTopicDaily in Context to accept note text!
      // Ah! In Context, let's see. My toggleTopicDaily function in AppContext has:
      // toggleTopicDaily(subjectKey, topic, day, done)
      // Wait, let's support note! Let's check how we implemented daily checks:
      // In server/routes/progress.js:
      // PATCH /api/progress/topics/:subjectKey/:topic/daily updates { day, done, note }
      // So let's check AppContext.jsx:
      // In AppContext, toggleTopicDaily is:
      // const toggleTopicDaily = async (subjectKey, topic, day, done)
      // Let's update toggleTopicDaily to handle both done and note. Let's see:
      // toggleTopicDaily(subjectKey, topic, day, done, note)
      // Wait, in my AppContext.jsx, I passed `{ day, done }` to axios.patch.
      // Let's look at the implementation:
      // axios.patch(`/api/progress/topics/${subjectKey}/${encodeURIComponent(topic)}/daily`, { day, done })
      // If we want to save a note, we can pass it in the body: { day, done, note }.
      // Let's check if my Context supports it. Ah, I should make sure we can save today's note!
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      
      {/* Subject Tabs */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-none gap-2">
        {subjects.map(sub => {
          const isActive = activeSubKey === sub.key;
          const stats = topicProgress.filter(t => t.subjectKey === sub.key);
          const comp = stats.length > 0 ? Math.round((stats.filter(t => t.completed).length / stats.length) * 100) : 0;
          return (
            <button
              key={sub.key}
              onClick={() => {
                setActiveSubKey(sub.key);
                setSearchQuery('');
                setExpandedTopic(null);
              }}
              className={`px-4 py-2.5 font-semibold text-sm border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{sub.name}</span>
              <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">
                {comp}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Subject Stats & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex-1">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-1">
            <span>SUBJECT PROGRESS</span>
            <span>{getSubjectCompletion()}% Completed</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${getSubjectCompletion()}%` }}
            ></div>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all"
          />
        </div>
      </div>

      {/* Topics Accordion List */}
      <div className="space-y-2.5">
        {filteredProgress.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl text-muted-foreground text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
            No topics found matching your filter.
          </div>
        ) : (
          filteredProgress.map((p) => {
            const isExpanded = expandedTopic === p.topic;
            
            // Find today's daily cell status
            const todayCell = p.dailyChecks.find(c => c.day === currentDay);
            const isTodayChecked = todayCell ? todayCell.done : false;
            const todayNote = todayCell ? todayCell.note : '';

            return (
              <div 
                key={p.topic}
                className={`bg-card border rounded-xl transition-all ${
                  isExpanded ? 'border-primary/50 shadow-sm' : 'border-border hover:border-border/80'
                }`}
              >
                {/* Topic Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                  
                  {/* Topic Checkbox & Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleTopicCompletedToggle(p)}
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                        p.completed 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-border hover:border-primary/50 text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                    <span className={`font-medium text-sm truncate ${p.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {p.topic}
                    </span>
                  </div>

                  {/* Badges / Dropdowns (Read Only when collapsed) */}
                  <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      p.priority === 'High' 
                        ? 'bg-red-500/10 text-red-500' 
                        : p.priority === 'Medium'
                          ? 'bg-yellow-500/10 text-yellow-500' 
                          : 'bg-green-500/10 text-green-500'
                    }`}>
                      {p.priority} Priority
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      p.difficulty === 'Hard' 
                        ? 'bg-purple-500/10 text-purple-500' 
                        : p.difficulty === 'Medium'
                          ? 'bg-blue-500/10 text-blue-500' 
                          : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {p.difficulty}
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      p.status === 'Completed' 
                        ? 'bg-green-500/10 text-green-500' 
                        : p.status === 'Revision'
                          ? 'bg-orange-500/10 text-orange-500'
                          : p.status === 'In Progress'
                            ? 'bg-indigo-500/10 text-indigo-500'
                            : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {p.status}
                    </span>

                    <span className="text-xs bg-secondary border border-border/80 px-2 py-0.5 rounded text-muted-foreground">
                      Q: {p.questions || 0}
                    </span>

                    {/* Today Cell Checkbox shortcut directly on collapsed row */}
                    <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
                      <span className="text-[10px] text-muted-foreground">Today (D{currentDay}):</span>
                      <button
                        onClick={() => handleCellClick(p, currentDay, isTodayChecked)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                          isTodayChecked 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'border-primary/40 hover:border-primary text-transparent'
                        }`}
                      >
                        <span className="text-[8px] leading-none">✓</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setExpandedTopic(isExpanded ? null : p.topic)}
                      className="p-1 hover:bg-secondary rounded text-muted-foreground ml-1"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 p-4 space-y-4">
                    
                    {/* Settings Dropdowns row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Priority
                        </label>
                        <select
                          value={p.priority}
                          onChange={(e) => updateTopicProgress(p.subjectKey, p.topic, { priority: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg text-sm px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Difficulty
                        </label>
                        <select
                          value={p.difficulty}
                          onChange={(e) => updateTopicProgress(p.subjectKey, p.topic, { difficulty: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg text-sm px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Study Status
                        </label>
                        <select
                          value={p.status}
                          onChange={(e) => updateTopicProgress(p.subjectKey, p.topic, { 
                            status: e.target.value,
                            completed: e.target.value === 'Completed'
                          })}
                          className="w-full bg-background border border-border rounded-lg text-sm px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Revision">Revision</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Questions Solved
                        </label>
                        <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
                          <button
                            onClick={() => updateTopicProgress(p.subjectKey, p.topic, { questions: Math.max(0, (p.questions || 0) - 5) })}
                            className="px-2 py-1.5 hover:bg-muted text-muted-foreground border-r border-border"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={p.questions || 0}
                            onChange={(e) => updateTopicProgress(p.subjectKey, p.topic, { questions: parseInt(e.target.value) || 0 })}
                            className="w-full text-center bg-transparent text-sm text-foreground focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => updateTopicProgress(p.subjectKey, p.topic, { questions: (p.questions || 0) + 5 })}
                            className="px-2 py-1.5 hover:bg-muted text-muted-foreground border-l border-border"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Daily Check Cell Strip */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Daily Study Logs Check (Day 1 to {user?.targetDays})
                        </span>
                        <span className="text-[10px] text-primary flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Active Day: Day {currentDay}
                        </span>
                      </div>
                      
                      {/* Horizontal Strip */}
                      <div className="flex items-center gap-1 overflow-x-auto py-2 px-1 border border-border/80 bg-background rounded-lg scrollbar-thin">
                        {Array.from({ length: user?.targetDays || 60 }).map((_, idx) => {
                          const dayNum = idx + 1;
                          const cell = p.dailyChecks.find(c => c.day === dayNum);
                          const isDone = cell ? cell.done : false;
                          const isToday = dayNum === currentDay;

                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => handleCellClick(p, dayNum, isDone)}
                              title={isToday ? `Day ${dayNum} (Today) - Click to toggle` : `Day ${dayNum} - Locked`}
                              className={`w-6 h-6 rounded shrink-0 flex items-center justify-center text-[9px] font-bold transition-all relative ${
                                isDone 
                                  ? 'bg-primary border border-primary text-primary-foreground' 
                                  : isToday
                                    ? 'border-2 border-primary bg-primary/10 text-primary animate-pulse'
                                    : 'bg-muted border border-border/60 text-muted-foreground/80 hover:bg-secondary'
                              }`}
                            >
                              {dayNum}
                              {!isToday && !isDone && (
                                <span className="absolute -top-0.5 -right-0.5 text-muted-foreground/30">
                                  <Lock className="w-[6px] h-[6px]" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes textareas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Today's Note */}
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-primary" />
                          Note for Today (Day {currentDay})
                        </label>
                        <textarea
                          placeholder="Log formulas, quick notes, or reminders for today's study..."
                          value={todayNote}
                          onChange={async (e) => {
                            // Update note directly in context dailyChecks
                            const noteText = e.target.value;
                            await toggleTopicDaily(p.subjectKey, p.topic, currentDay, isTodayChecked, noteText);
                          }}
                          className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary h-20 resize-none"
                        />
                      </div>

                      {/* General Topic Notes */}
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          General Topic Notes (Master Outline)
                        </label>
                        <textarea
                          placeholder="Core concepts, video links, textbook references, formulas..."
                          value={p.notes || ''}
                          onChange={(e) => updateTopicProgress(p.subjectKey, p.topic, { notes: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary h-20 resize-none"
                        />
                      </div>

                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
