import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, ClipboardList, Sparkles } from 'lucide-react';

export default function TodayView() {
  const { todayTasks, addTodayTask, toggleTodayTask, deleteTodayTask, currentDay } = useApp();
  const [taskText, setTaskText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    addTodayTask(taskText.trim());
    setTaskText('');
  };

  const completedCount = todayTasks.filter(t => t.done).length;
  const totalCount = todayTasks.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="max-w-xl mx-auto space-y-6 text-foreground">
      
      {/* Celebration Banner */}
      {isAllDone && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden animate-bounce">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 animate-pulse" />
          <h2 className="text-xl font-bold tracking-tight text-primary font-outfit">Today's Goal Completed! 🎉</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Excellent persistence on Day {currentDay}! All focus tasks are completed.
          </p>
        </div>
      )}

      {/* Tasks container */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-primary" />
          Today's Focused Study Tasks
        </h2>
        <p className="text-xs text-muted-foreground mb-6">
          Set 3-5 high-priority focus tasks for Day {currentDay}. Break down your targets.
        </p>

        {/* Task Progress */}
        {totalCount > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-1">
              <span>TODAY'S TASK COMPLETED</span>
              <span>{completedCount} / {totalCount} ({Math.round((completedCount/totalCount)*100)}%)</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${(completedCount/totalCount)*100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Form to Add Task */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            required
            placeholder="Add a priority study task (e.g., Solve 50 Quant SI/CI questions)..."
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/95 transition-all text-sm flex items-center justify-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Tasks List */}
        <div className="space-y-2">
          {todayTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tasks added for today. Add a task to start tracking your daily progress!
            </div>
          ) : (
            todayTasks.map(task => (
              <div 
                key={task._id} 
                className={`flex items-center justify-between p-3 border rounded-xl bg-muted/10 transition-all ${
                  task.done ? 'border-primary/20 bg-primary/5' : 'border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleTodayTask(task._id, !task.done)}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                      task.done 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-border hover:border-primary/50 text-transparent'
                    }`}
                  >
                    ✓
                  </button>
                  <span className={`text-sm font-medium truncate ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {task.text}
                  </span>
                </div>
                <button
                  onClick={() => deleteTodayTask(task._id)}
                  className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
