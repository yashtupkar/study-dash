import React from 'react';
import { useApp } from '../context/AppContext';
import { Grid, Flame, Award, Clock } from 'lucide-react';

export default function HeatmapView() {
  const { user, dayLogs, currentDay, streak } = useApp();

  const targetDays = user?.targetDays || 60;
  const daysArray = Array.from({ length: targetDays }, (_, i) => i + 1);

  const getDayLog = (dayNum) => {
    return dayLogs.find(l => l.day === dayNum) || {
      day: dayNum,
      hours: 0,
      completed: false
    };
  };

  const getIntensityClass = (hours) => {
    if (!hours || hours === 0) return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-700';
    if (hours <= 2) return 'bg-emerald-500/20 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (hours <= 4) return 'bg-emerald-500/40 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300';
    if (hours <= 7) return 'bg-emerald-500/70 dark:bg-emerald-500/50 text-white';
    return 'bg-emerald-500 dark:bg-emerald-400 text-primary-foreground';
  };

  // Derive stats
  const activeDaysCount = dayLogs.filter(l => l.hours > 0).length;
  const totalHours = dayLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
  const avgHours = activeDaysCount > 0 ? (totalHours / activeDaysCount).toFixed(1) : 0;

  return (
    <div className="space-y-6 text-foreground">
      
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 mb-1">
          <Grid className="w-5 h-5 text-primary" />
          Study Activity Heatmap
        </h2>
        <p className="text-xs text-muted-foreground">
          Visual representation of study dedication. Darker green blocks represent higher hours logged on that day.
        </p>
      </div>

      {/* Heatmap Grid Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="font-bold text-sm font-outfit uppercase tracking-widest text-muted-foreground">
            {targetDays}-Day Calendar Grid
          </h3>
          
          {/* Legend */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span>Less</span>
            <span className="w-3.5 h-3.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-border/50"></span>
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 dark:bg-emerald-500/10"></span>
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/40 dark:bg-emerald-500/30"></span>
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/70 dark:bg-emerald-500/50"></span>
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 dark:bg-emerald-400"></span>
            <span>More</span>
          </div>
        </div>

        {/* Heatmap cells */}
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3.5">
          {daysArray.map((dayNum) => {
            const log = getDayLog(dayNum);
            const intensity = getIntensityClass(log.hours);
            const isToday = dayNum === currentDay;

            return (
              <div
                key={dayNum}
                title={`Day ${dayNum}: ${log.hours || 0} hrs studied ${log.completed ? '(Completed)' : ''}`}
                className={`heatmap-cell border p-2 flex flex-col justify-between items-center rounded-lg transition-all select-none hover:scale-105 duration-100 ${intensity} ${
                  isToday 
                    ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background' 
                    : 'border-border/30'
                }`}
              >
                <span className="text-[10px] font-bold opacity-60 leading-none">D{dayNum}</span>
                <span className="text-xs font-extrabold mt-1.5 leading-none">
                  {log.hours || 0}
                </span>
                <span className="text-[8px] opacity-75 font-semibold mt-0.5 leading-none">hrs</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none">Study Consistency</p>
            <p className="font-bold text-sm text-foreground mt-1">
              {activeDaysCount} of {targetDays} Days study logged
            </p>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none">Study Intensity</p>
            <p className="font-bold text-sm text-foreground mt-1">
              Average {avgHours} hours / study day
            </p>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none">Current Study Streak</p>
            <p className="font-bold text-sm text-foreground mt-1">
              {streak} Days Study Streak
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
