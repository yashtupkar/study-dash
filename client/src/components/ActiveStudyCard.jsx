import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Pause, Play, CheckCheck, Minimize2, Maximize2, Zap } from 'lucide-react';

function formatTimer(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n) => n.toString().padStart(2, '0');
  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

export default function ActiveStudyCard() {
  const {
    activeStudyTaskId,
    activeStudySeconds,
    isStudyTimerRunning,
    todayTasks,
    pauseStudyTask,
    resumeStudyTask,
    openRecallModal,
    openQPModal,
  } = useApp();

  const [collapsed, setCollapsed] = useState(false);

  if (!activeStudyTaskId) return null;

  const activeTask = todayTasks.find((t) => t._id === activeStudyTaskId);
  const taskLabel = activeTask?.text || 'Study Session';

  // Opens the global Feynman / QP modal — same flow as the TodayView checkbox
  const handleComplete = () => {
    if (!activeTask) return;
    if (activeTask.taskType === 'question_practice') {
      openQPModal(activeTask);
    } else {
      openRecallModal(activeTask);
    }
  };

  /* ── Collapsed pill ─────────────────────────────────────────── */
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-6 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-xl shadow-primary/20 border border-primary/40 animate-[slideUp_0.25s_ease] transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--card)) 100%)',
          backdropFilter: 'blur(14px)',
        }}
      >
        {/* pulsing dot */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${isStudyTimerRunning ? 'bg-primary animate-pulse' : 'bg-amber-400'}`} />
        <span className="text-sm font-bold tabular-nums text-primary">{formatTimer(activeStudySeconds)}</span>
        <Maximize2 className="w-3 h-3 text-muted-foreground ml-0.5" />
      </button>
    );
  }

  /* ── Expanded card ──────────────────────────────────────────── */
  return (
    <div
      className="fixed bottom-6 right-5 z-50 w-72 rounded-xl overflow-hidden shadow-2xl shadow-primary/15 border border-primary/20 animate-[slideUp_0.25s_ease]"
      style={{ backdropFilter: 'blur(20px)' }}
    >
      {/* Gradient accent top bar */}
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.4) 100%)' }}
      />

      {/* Card body */}
      <div
        className="p-4 space-y-4"
        style={{ background: 'linear-gradient(160deg, hsl(var(--card)) 60%, hsl(var(--primary) / 0.06) 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isStudyTimerRunning ? 'bg-primary animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              {isStudyTimerRunning ? 'In Progress' : 'Paused'}
            </span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title="Collapse"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Task label */}
        <div className="flex items-start gap-2.5">
          <div className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 pt-0.5">
            {taskLabel}
          </p>
        </div>

        {/* Live clock */}
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-center gap-3 border border-primary/10"
          style={{ background: 'hsl(var(--primary) / 0.06)' }}
        >
          <span
            className="text-3xl font-bold tabular-nums tracking-tight text-primary"
            style={{ fontVariantNumeric: 'tabular-nums', fontFamily: "'Space Grotesk', monospace" }}
          >
            {formatTimer(activeStudySeconds)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Pause / Resume */}
          {isStudyTimerRunning ? (
            <button
              onClick={pauseStudyTask}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-secondary hover:bg-muted text-foreground text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          ) : (
            <button
              onClick={resumeStudyTask}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/25 text-primary text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: 'hsl(var(--primary) / 0.08)' }}
            >
              <Play className="w-3.5 h-3.5 fill-primary" />
              Resume
            </button>
          )}

          {/* Complete */}
          <button
            onClick={handleComplete}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-primary/25"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Done ✓
          </button>
        </div>
      </div>
    </div>
  );
}
