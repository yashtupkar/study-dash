import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, BookOpen, RefreshCw, FileQuestion, HelpCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function PlannerView() {
  const { user, dayLogs, updateDayLog, currentDay } = useApp();
  const [editingDay, setEditingDay] = useState(null);

  // Form State for editing log details
  const [hours, setHours] = useState(0);
  const [notes, setNotes] = useState('');
  const [revision, setRevision] = useState(false);
  const [mockTest, setMockTest] = useState(false);
  const [completed, setCompleted] = useState(false);

  const targetDays = user?.targetDays || 60;
  const daysArray = Array.from({ length: targetDays }, (_, i) => i + 1);

  const getDayLog = (dayNum) => {
    return dayLogs.find(l => l.day === dayNum) || {
      day: dayNum,
      completed: false,
      topics: 0,
      hours: 0,
      revision: false,
      mockTest: false,
      notes: ''
    };
  };

  const startEditing = (log) => {
    setEditingDay(log.day);
    setHours(log.hours || 0);
    setNotes(log.notes || '');
    setRevision(log.revision || false);
    setMockTest(log.mockTest || false);
    setCompleted(log.completed || false);
  };

  const handleSave = async (dayNum) => {
    await updateDayLog(dayNum, {
      hours: Number(hours),
      notes,
      revision,
      mockTest,
      completed
    });
    setEditingDay(null);
  };

  return (
    <div className="space-y-6 text-foreground">
      
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-primary" />
          {targetDays}-Day Planner Grid
        </h2>
        <p className="text-xs text-muted-foreground">
          Log details for each study day. Cards are color-coded: green for completed, amber outline for active today, and gray for upcoming. Click on any card to update its logs.
        </p>
      </div>

      {/* Grid of Day Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {daysArray.map((dayNum) => {
          const log = getDayLog(dayNum);
          const isToday = dayNum === currentDay;
          const isCompleted = log.completed;
          const isEditing = editingDay === dayNum;

          if (isEditing) {
            return (
              <div 
                key={dayNum}
                className="bg-card border-2 border-primary rounded-xl p-4 shadow-md space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-border mb-2.5">
                    <span className="font-bold text-sm text-primary">Day {dayNum} (Editing)</span>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                      <input 
                        type="checkbox"
                        checked={completed}
                        onChange={(e) => setCompleted(e.target.checked)}
                        className="rounded text-primary focus:ring-primary border-border w-3.5 h-3.5"
                      />
                      Done
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Study Hours
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg text-xs px-2 py-1 text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center gap-4 py-1">
                      <label className="flex items-center gap-1.5 text-xs text-foreground">
                        <input
                          type="checkbox"
                          checked={revision}
                          onChange={(e) => setRevision(e.target.checked)}
                          className="rounded text-primary focus:ring-primary border-border w-3.5 h-3.5"
                        />
                        Revision
                      </label>

                      <label className="flex items-center gap-1.5 text-xs text-foreground">
                        <input
                          type="checkbox"
                          checked={mockTest}
                          onChange={(e) => setMockTest(e.target.checked)}
                          className="rounded text-primary focus:ring-primary border-border w-3.5 h-3.5"
                        />
                        Mock Test
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                        Daily Notes
                      </label>
                      <textarea
                        placeholder="Topics read, challenges..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg text-xs px-2.5 py-1 text-foreground focus:outline-none focus:border-primary h-14 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditingDay(null)}
                    className="flex-1 py-1 px-2 border border-border text-[11px] font-medium rounded hover:bg-muted text-muted-foreground transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(dayNum)}
                    className="flex-1 py-1 px-2 bg-primary text-primary-foreground text-[11px] font-semibold rounded hover:bg-primary/95 transition-all flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={dayNum}
              onClick={() => startEditing(log)}
              className={`bg-card border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between group ${
                isCompleted 
                  ? 'border-primary/30 bg-primary/5' 
                  : isToday
                    ? 'border-2 border-amber-500 shadow-md shadow-amber-500/5'
                    : 'border-border'
              }`}
            >
              <div>
                <div className="flex justify-between items-center pb-1.5 border-b border-border/40 mb-2">
                  <span className={`font-bold text-sm ${isToday ? 'text-amber-500' : 'text-foreground'}`}>
                    Day {dayNum} {isToday && '(Today)'}
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                      Completed
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                    <span>Hours: <strong className="text-foreground">{log.hours || 0} hrs</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500/70 shrink-0" />
                    <span>Topics Studied: <strong className="text-foreground">{log.topics || 0}</strong></span>
                  </div>
                  
                  <div className="flex gap-2 pt-1.5">
                    {log.revision && (
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-1 rounded flex items-center gap-0.5 font-semibold">
                        <RefreshCw className="w-2.5 h-2.5" /> Revision
                      </span>
                    )}
                    {log.mockTest && (
                      <span className="text-[9px] bg-purple-500/10 text-purple-500 border border-purple-500/20 px-1 rounded flex items-center gap-0.5 font-semibold">
                        <FileQuestion className="w-2.5 h-2.5" /> Mock Exam
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {log.notes && (
                <p className="text-[11px] text-muted-foreground italic mt-3 border-t border-border/30 pt-2 truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                  "{log.notes}"
                </p>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
