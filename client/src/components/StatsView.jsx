import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import {
  CalendarDays,
  CheckCircle,
  Circle,
  Timer,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
  Flame,
  ClipboardList,
} from 'lucide-react';

const subjectColors = {
  quant:     { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400', name: 'Quant' },
  reasoning: { bg: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400',   name: 'Reasoning' },
  english:   { bg: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',           name: 'English' },
  ga:        { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',           name: 'General Awareness' },
  cs:        { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',       name: 'Comp Sci' },
};

const formatStudyDuration = (totalSeconds) => {
  if (!totalSeconds) return null;
  const hrs  = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs  > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const date      = new Date(dateStr + 'T00:00:00');
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const d         = new Date(date); d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime())     return 'Today';
  if (d.getTime() === yesterday.getTime()) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

/* ─── Full Task Card (mirrors TodayView style exactly) ─── */
function TaskCard({ task, topicProgress }) {
  const isTopicTask = !!task.subjectKey;
  const subColor    = isTopicTask
    ? (subjectColors[task.subjectKey] || { bg: 'bg-muted border-border text-muted-foreground', name: 'Task' })
    : null;
  const topicDetail = isTopicTask
    ? topicProgress.find(p => p.subjectKey === task.subjectKey && p.topic === task.topic)
    : null;

  return (
    <div
      className={`flex flex-col p-3 border rounded-xl bg-card transition-all ${
        task.done
          ? 'border-primary/20 bg-white shadow-sm shadow-primary/5'
          : 'border-border hover:border-border/80 hover:bg-muted/10'
      }`}
    >
      {/* ── Row 1: checkbox‑icon  +  badges  +  text ── */}
      <div className="flex items-start gap-3 min-w-0">
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          {task.done
            ? <CheckCircle className="w-5 h-5 text-primary" />
            : <Circle      className="w-5 h-5 text-muted-foreground/30" />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {isTopicTask && subColor && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${subColor.bg}`}>
                {subColor.name}
              </span>
            )}

            {(task.isDaily || !!task.dailyTaskId) && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 shrink-0">
                Daily
              </span>
            )}

            {task.specificDayNum !== undefined && task.specificDayNum !== null && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
                Day {task.specificDayNum}
              </span>
            )}

            {task.taskType === 'question_practice' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shrink-0 flex items-center gap-0.5">
                🎯 {task.questionCount}Q Practice
              </span>
            )}

            {/* Task text inline with badges */}
            <span className={`text-sm font-semibold leading-snug ${
              task.done ? 'line-through text-muted-foreground font-medium' : 'text-foreground'
            }`}>
              {task.text}
            </span>
          </div>

          {/* Custom message note */}
          {task.customMessage && (
            <div className="mt-1 text-[11px] text-muted-foreground font-medium border-l-2 border-primary/30 pl-2">
              {task.customMessage}
            </div>
          )}

          {/* Topic priority / difficulty chips */}
          {isTopicTask && topicDetail && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[8px] font-bold px-1 rounded-sm uppercase tracking-wider ${
                topicDetail.priority === 'High'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : topicDetail.priority === 'Medium'
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    : 'bg-green-500/10 text-green-500 border border-green-500/20'
              }`}>
                {topicDetail.priority} Priority
              </span>
              <span className={`text-[8px] font-bold px-1 rounded-sm uppercase tracking-wider ${
                topicDetail.difficulty === 'Hard'
                  ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                  : topicDetail.difficulty === 'Medium'
                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
              }`}>
                {topicDetail.difficulty}
              </span>
              <span className="text-[9px] text-muted-foreground">• Synced</span>
            </div>
          )}

          {/* Study time badge */}
          {task.studyTime > 0 && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              <Timer className="w-3 h-3 text-muted-foreground/80" />
              {task.done ? 'Studied: ' : ''}{formatStudyDuration(task.studyTime)}
            </span>
          )}
        </div>
      </div>

      {/* ── Feynman recall card (if done + has reflection) ── */}
      {task.done && task.reflection && (
        <div className="mt-2.5 text-xs bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/10 dark:border-amber-500/20 p-2.5 rounded-lg text-muted-foreground italic font-medium leading-relaxed font-outfit relative">
          <span className="absolute -top-1.5 left-3 bg-card px-1.5 text-[8px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold border border-amber-500/10 dark:border-amber-500/20 rounded-sm">
            Feynman Active Recall Card
          </span>
          "{task.reflection}"
        </div>
      )}
    </div>
  );
}

/* ─── Date Group with collapsible task list ─── */
function DateGroup({ dateStr, tasks, topicProgress, isExpanded, onToggle, user }) {
  const completedCount  = tasks.filter(t => t.done).length;
  const totalCount      = tasks.length;
  const completionPct   = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone         = totalCount > 0 && completedCount === totalCount;

  // Compute study-plan day number
  let dayNum = null;
  if (user?.startDate) {
    const start  = new Date(user.startDate); start.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00'); target.setHours(0, 0, 0, 0);
    const diff   = Math.round((target - start) / (1000 * 60 * 60 * 24));
    dayNum = diff + 1;
  }

  return (
    <div className="flex gap-3 sm:gap-4">
      {/* ── Timeline dot column ── */}
      <div className="flex flex-col items-center shrink-0 w-7 sm:w-8">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center z-10 border-2 shadow-sm transition-all ${
          allDone
            ? 'bg-primary border-primary text-primary-foreground shadow-primary/20'
            : completedCount > 0
              ? 'bg-primary/10 border-primary/40 text-primary'
              : 'bg-card border-border text-muted-foreground'
        }`}>
          {allDone
            ? <Flame      className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
            : <CalendarDays className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
        </div>
      </div>

      {/* ── Right content ── */}
      <div className="flex-1 min-w-0 pb-7 sm:pb-8">
        {/* Collapsible header */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/30 hover:border-border/70 transition-all shadow-sm group"
        >
          {/* Left: date info */}
          <div className="min-w-0 text-left flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-bold text-sm text-foreground font-outfit truncate">
                {formatDisplayDate(dateStr)}
              </span>
              {dayNum !== null && dayNum >= 1 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary shrink-0">
                  Day {dayNum}
                </span>
              )}
              {allDone && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                  ✓ All Done
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{formatShortDate(dateStr)}</span>
          </div>

          {/* Right: progress + chevron */}
          <div className="flex items-center gap-2 sm:gap-3 ml-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-16 sm:w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-primary"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
            <span className={`text-[10px] font-bold ${allDone ? 'text-primary' : 'text-muted-foreground'}`}>
              {completedCount}/{totalCount}
            </span>
            {isExpanded
              ? <ChevronUp   className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />}
          </div>
        </button>

        {/* Task cards — shown when expanded */}
        {isExpanded && (
          <div className="mt-2.5 sm:mt-3 space-y-2 sm:space-y-2.5 animate-[fadeIn_0.15s_ease]">
            {tasks.map(task => (
              <TaskCard key={task._id} task={task} topicProgress={topicProgress} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function StatsView() {
  const { topicProgress, user } = useApp();

  const [allTasks,      setAllTasks]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');   // 'all' | 'done' | 'pending'
  const [filterSubject, setFilterSubject] = useState('all');
  const [expandedDates, setExpandedDates] = useState(new Set());

  /* Fetch all tasks once */
  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/today-tasks/all');
        if (cancelled) return;
        const data = Array.isArray(res.data) ? res.data : [];
        setAllTasks(data);
        // Auto-expand the 3 most-recent dates
        const dates = [...new Set(data.map(t => t.date))].sort((a, b) => b.localeCompare(a));
        setExpandedDates(new Set(dates.slice(0, 3)));
      } catch (err) {
        console.error('Failed to fetch all tasks:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  /* Toggle a single date's expansion */
  const toggleDate = (dateStr) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr);
      return next;
    });
  };

  const expandAll  = () => setExpandedDates(new Set(allTasks.map(t => t.date)));
  const collapseAll = () => setExpandedDates(new Set());

  /* Filter */
  const filteredTasks = allTasks.filter(task => {
    const matchSearch  = !searchQuery.trim()
      || task.text.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchStatus  = filterStatus === 'all' ? true : filterStatus === 'done' ? task.done : !task.done;
    const matchSubject = filterSubject === 'all' ? true : task.subjectKey === filterSubject;
    return matchSearch && matchStatus && matchSubject;
  });

  /* Group by date (newest first) */
  const grouped     = {};
  filteredTasks.forEach(task => {
    if (!grouped[task.date]) grouped[task.date] = [];
    grouped[task.date].push(task);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  /* Summary stats (from ALL tasks, not filtered) */
  const totalTasks     = allTasks.length;
  const completedTasks = allTasks.filter(t => t.done).length;
  const totalDays      = [...new Set(allTasks.map(t => t.date))].length;
  const perfectDays    = [...new Set(
    allTasks
      .filter(t => allTasks.filter(x => x.date === t.date).every(x => x.done))
      .map(t => t.date)
  )].length;

  /* Subject keys for filter dropdown */
  const subjectKeys = [...new Set(allTasks.filter(t => t.subjectKey).map(t => t.subjectKey))];

  return (
    <div className="space-y-4 sm:space-y-6 text-foreground">

      {/* ── Header ── */}
      <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-primary shrink-0" />
          Task Timeline
        </h2>
        <p className="text-xs text-muted-foreground">
          Every task you've ever added — topic reviews, custom tasks, and question practice — grouped by date.
        </p>
      </div>

      {/* ── Summary Stats ── */}
      {!loading && totalTasks > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Tasks',   value: totalTasks,     suffix: 'tasks',   color: '' },
            { label: 'Completed',     value: completedTasks, suffix: totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%', color: 'text-primary' },
            { label: 'Days Active',   value: totalDays,      suffix: 'days',    color: '' },
            { label: 'Perfect Days',  value: perfectDays,    suffix: 'all done', color: 'text-emerald-500' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`text-2xl font-bold font-outfit ${s.color}`}>{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.suffix}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters & Search ── */}
      <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search tasks by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {/* Status buttons */}
            {[
              { val: 'all',     label: 'All' },
              { val: 'done',    label: '✓ Completed' },
              { val: 'pending', label: '○ Pending' },
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setFilterStatus(f.val)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all border ${
                  filterStatus === f.val
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'border-border hover:bg-muted text-muted-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}

            {/* Subject dropdown */}
            {subjectKeys.length > 0 && (
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="px-3 py-1 text-xs font-bold bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-all"
              >
                <option value="all">All Subjects</option>
                {subjectKeys.map(key => (
                  <option key={key} value={key}>{subjectColors[key]?.name || key}</option>
                ))}
              </select>
            )}
          </div>

          {/* Expand / Collapse all */}
          {sortedDates.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-border hover:bg-muted text-muted-foreground transition-all"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-border hover:bg-muted text-muted-foreground transition-all"
              >
                Collapse
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin mb-3 text-primary" />
          <p className="text-sm font-medium">Loading your task timeline…</p>
        </div>

      ) : sortedDates.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/80 rounded-2xl bg-muted/5">
          <Info className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-muted-foreground">
            {allTasks.length === 0 ? 'No tasks recorded yet.' : 'No tasks match your filters.'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {allTasks.length === 0
              ? "Add tasks on the Today's Tasks page — they'll appear here."
              : 'Try clearing your search or changing the filter.'}
          </p>
        </div>

      ) : (
        <div className="relative">
          {/* Vertical rail line */}
          <div className="absolute left-[13px] sm:left-[15px] top-0 bottom-0 w-0.5 bg-border/50 rounded-full pointer-events-none" />

          <div className="space-y-0">
            {sortedDates.map(dateStr => (
              <DateGroup
                key={dateStr}
                dateStr={dateStr}
                tasks={grouped[dateStr]}
                topicProgress={topicProgress}
                isExpanded={expandedDates.has(dateStr)}
                onToggle={() => toggleDate(dateStr)}
                user={user}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
