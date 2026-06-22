import React, { useState, useEffect, useRef } from 'react';
import { useApp, getLocalDateString } from '../context/AppContext';
import { 
  Plus, 
  Trash2, 
  ClipboardList, 
  Sparkles, 
  Timer, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  BookOpen, 
  LineChart, 
  Flame,
  CheckSquare,
  RefreshCw,
  FileText,
  CalendarDays,
  Grid,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

const subjectColors = {
  quant: { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400', name: 'Quant' },
  reasoning: { bg: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400', name: 'Reasoning' },
  english: { bg: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400', name: 'English' },
  ga: { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400', name: 'General Awareness' },
  cs: { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400', name: 'Comp Sci' }
};

const soundUrls = {
  lofi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  rain: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  instrumental: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
};

const defaultHabits = [
  { id: 'phone', text: 'Put phone on Do Not Disturb & place outside study room', done: false },
  { id: 'desk', text: 'Clean and organize study desk workspace', done: false },
  { id: 'water', text: 'Fill a large water bottle (stay hydrated!)', done: false },
  { id: 'sounds', text: 'Put on noise-cancelling headphones or study audio', done: false },
  { id: 'notes', text: 'Review previous day\'s formulas / notes for 5 minutes', done: false }
];

export default function TodayView() {
  const { 
    todayTasks, 
    addTodayTask, 
    toggleTodayTask, 
    deleteTodayTask, 
    currentDay,
    subjects,
    topicProgress,
    activeStudyTaskId,
    activeStudySeconds,
    isStudyTimerRunning,
    startStudyTask,
    pauseStudyTask,
    resumeStudyTask
  } = useApp();

  // Task Form States
  const [taskType, setTaskType] = useState('custom'); // 'custom' | 'topic'
  const [customText, setCustomText] = useState('');
  const [selectedSubjectKey, setSelectedSubjectKey] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  // Feynman Active Recall States
  const [activeRecallTask, setActiveRecallTask] = useState(null);
  const [recallText, setRecallText] = useState('');
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);

  // Pomodoro Timer States
  const [timeLeft, setTimeLeft] = useState(1500); // 25m default (seconds)
  const [timerType, setTimerType] = useState('focus'); // 'focus' | 'short' | 'long'
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  // Ambient Sound States
  const [activeSound, setActiveSound] = useState('none'); // 'none' | 'lofi' | 'rain' | 'instrumental'
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  // Habit Tracker States (persisted in localStorage)
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('study_habits_checklist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultHabits;
      }
    }
    return defaultHabits;
  });

  // Save habits to localStorage
  useEffect(() => {
    localStorage.setItem('study_habits_checklist', JSON.stringify(habits));
  }, [habits]);

  // Set default subject and topic when subjects load
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectKey) {
      setSelectedSubjectKey(subjects[0].key);
      if (subjects[0].topics && subjects[0].topics.length > 0) {
        setSelectedTopic(subjects[0].topics[0]);
      }
    }
  }, [subjects, selectedSubjectKey]);

  // Handle subject change to update topics dropdown
  const handleSubjectChange = (subjectKey) => {
    setSelectedSubjectKey(subjectKey);
    const sub = subjects.find(s => s.key === subjectKey);
    if (sub && sub.topics && sub.topics.length > 0) {
      setSelectedTopic(sub.topics[0]);
    } else {
      setSelectedTopic('');
    }
  };

  // Task Submit
  const handleAddTask = (e) => {
    e.preventDefault();
    const todayStr = getLocalDateString();
    
    if (taskType === 'custom') {
      if (!customText.trim()) return;
      addTodayTask(customText.trim(), todayStr);
      setCustomText('');
    } else {
      if (!selectedSubjectKey || !selectedTopic) {
        toast.error('Please select a subject and a topic');
        return;
      }
      
      const sub = subjects.find(s => s.key === selectedSubjectKey);
      const subName = sub ? sub.name : selectedSubjectKey;
      
      const taskText = `Review Topic: ${selectedTopic}`;
      
      // Check if topic task already exists for today
      const alreadyExists = todayTasks.some(t => t.subjectKey === selectedSubjectKey && t.topic === selectedTopic);
      if (alreadyExists) {
        toast.warning('This topic is already added to today\'s tasks!');
        return;
      }

      addTodayTask(taskText, todayStr, selectedSubjectKey, selectedTopic);
    }
  };

  // Checkbox Toggle with Feynman Active Recall Popup
  const handleTaskCheckClick = (task) => {
    if (!task.done) {
      setActiveRecallTask(task);
      setRecallText('');
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
    
    // Toggle task in DB and save feynman reflection
    await toggleTodayTask(activeRecallTask._id, true, reflectionText);
    
    setActiveRecallTask(null);
    setRecallText('');
  };

  // Pomodoro Timer Effects & Controls
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            playCompletionBeep();
            toast.success(`🎉 Pomodoro ${timerType === 'focus' ? 'Focus Session' : 'Break'} Completed!`);
            
            if (timerType === 'focus') {
              handleTimerPreset('short');
            } else {
              handleTimerPreset('focus');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, timerType]);

  const playCompletionBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn("Web Audio beep blocked or failed", e);
    }
  };

  const handleTimerPreset = (type) => {
    setTimerRunning(false);
    setTimerType(type);
    if (type === 'focus') {
      setTimeLeft(1500); // 25m
    } else if (type === 'short') {
      setTimeLeft(300); // 5m
    } else if (type === 'long') {
      setTimeLeft(900); // 15m
    }
  };

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    handleTimerPreset(timerType);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

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

  // Ambient Audio Effects & Controls
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (activeSound !== 'none') {
        audioRef.current.src = soundUrls[activeSound];
        audioRef.current.load();
        audioRef.current.volume = volume;
        if (soundPlaying) {
          audioRef.current.play().catch(e => {
            console.log("Audio playback blocked", e);
            setSoundPlaying(false);
          });
        }
      }
    }
  }, [activeSound]);

  const toggleSoundPlay = () => {
    if (activeSound === 'none') {
      toast.warning('Please select an ambient track first.');
      return;
    }
    
    if (audioRef.current) {
      if (soundPlaying) {
        audioRef.current.pause();
        setSoundPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setSoundPlaying(true))
          .catch(e => {
            console.log("Playback failed", e);
            toast.error("Click anywhere on the page first, then play study audio.");
          });
      }
    }
  };

  const handleVolumeChange = (e) => {
    const nextVol = parseFloat(e.target.value);
    setVolume(nextVol);
    if (audioRef.current) {
      audioRef.current.volume = nextVol;
    }
  };

  // Habit toggler
  const toggleHabit = (id) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  const resetHabits = () => {
    setHabits(defaultHabits);
  };

  // Stats Derived
  const completedTasksCount = todayTasks.filter(t => t.done).length;
  const totalTasksCount = todayTasks.length;
  const isAllTasksDone = totalTasksCount > 0 && completedTasksCount === totalTasksCount;

  const completedHabitsCount = habits.filter(h => h.done).length;
  const totalHabitsCount = habits.length;

  const activeSubject = subjects.find(s => s.key === selectedSubjectKey);
  const activeTopics = activeSubject ? activeSubject.topics : [];

  const getTopicStatusLabel = (topicName) => {
    const prog = topicProgress.find(p => p.subjectKey === selectedSubjectKey && p.topic === topicName);
    if (!prog) return null;
    return prog.completed ? '✓ Mastered' : prog.status !== 'Not Started' ? '• In Progress' : null;
  };

  // Circular timer constants
  const totalPresetSeconds = timerType === 'focus' ? 1500 : timerType === 'short' ? 300 : 900;

  return (
    <div className="space-y-6 text-foreground">
      
      {/* Hidden audio element */}
      <audio ref={audioRef} loop />

      {/* Celebration Banner */}
      {isAllTasksDone && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden animate-bounce max-w-5xl mx-auto">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 animate-pulse" />
          <h2 className="text-xl font-bold tracking-tight text-primary font-outfit">Today's Focus Goal Completed! 🎉</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Phenomenal persistence on Day {currentDay}! All selected focus tasks are ticked off.
          </p>
        </div>
      )}

      {/* Two Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* Left Side: Tasks & Study Habits (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Focus Tasks Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-primary" />
              Today's Targets Checklist
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Establish 3-5 priority study tasks for Day {currentDay}. Link syllabus topics to auto-sync syllabus progress.
            </p>

            {/* Task Progress Bar */}
            {totalTasksCount > 0 && (
              <div className="mb-6 bg-muted/30 border border-border/60 p-4 rounded-xl">
                <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-1.5">
                  <span className="uppercase tracking-wider">Today's Tasks Completion</span>
                  <span className="text-primary font-bold">{completedTasksCount} / {totalTasksCount} ({Math.round((completedTasksCount/totalTasksCount)*100)}%)</span>
                </div>
                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${(completedTasksCount/totalTasksCount)*100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Task Creation Tabs Form */}
            <div className="mb-6 border border-border rounded-xl p-4 bg-muted/10">
              <div className="flex border-b border-border mb-4 gap-4">
                <button
                  type="button"
                  onClick={() => setTaskType('custom')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    taskType === 'custom' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Custom Text Task
                </button>
                <button
                  type="button"
                  onClick={() => setTaskType('topic')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    taskType === 'topic' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Syllabus Topic Task
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-3">
                {taskType === 'custom' ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Add custom task (e.g. Solve 50 Quant questions, revise GA notes)..."
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/95 transition-all text-sm flex items-center justify-center gap-1 shadow-sm shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Select Subject
                        </label>
                        <select
                          value={selectedSubjectKey}
                          onChange={(e) => handleSubjectChange(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                          {subjects.map(s => (
                            <option key={s.key} value={s.key}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Select Topic
                        </label>
                        <select
                          value={selectedTopic}
                          onChange={(e) => setSelectedTopic(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                          {activeTopics.length === 0 ? (
                            <option value="">No topics available</option>
                          ) : (
                            activeTopics.map((topic, idx) => {
                              const status = getTopicStatusLabel(topic);
                              return (
                                <option key={idx} value={topic}>
                                  {topic} {status ? `(${status})` : ''}
                                </option>
                              );
                            })
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={activeTopics.length === 0}
                        className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground transition-all text-sm flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Syllabus Topic</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Today Tasks Checklist List */}
            <div className="space-y-2.5">
              {todayTasks.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border/80 rounded-xl">
                  <Info className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-sm font-medium">No targets scheduled for today.</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Use the form above to plan your study sessions.</p>
                </div>
              ) : (
                todayTasks.map(task => {
                  const isTopicTask = !!task.subjectKey;
                  const subColor = isTopicTask ? subjectColors[task.subjectKey] || { bg: 'bg-muted border-border text-muted-foreground', name: 'Task' } : null;
                  const topicDetail = isTopicTask ? topicProgress.find(p => p.subjectKey === task.subjectKey && p.topic === task.topic) : null;
                  const isActiveTask = activeStudyTaskId === task._id;

                  return (
                    <div 
                      key={task._id} 
                      className={`flex flex-col p-3 border rounded-xl bg-card transition-all ${
                        task.done 
                          ? 'border-primary/20 bg-primary/5/10 hover:bg-primary/5/20 shadow-sm shadow-primary/5' 
                          : isActiveTask
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 animate-[pulse_3s_infinite]'
                            : 'border-border hover:border-border/80 hover:bg-muted/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleTaskCheckClick(task)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                              task.done 
                                ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20' 
                                : 'border-border hover:border-primary/50 text-transparent bg-background'
                            }`}
                          >
                            <span className="text-[10px] leading-none font-bold">✓</span>
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {isTopicTask && subColor && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${subColor.bg}`}>
                                  {subColor.name}
                                </span>
                              )}
                              <span className={`text-sm font-semibold truncate ${task.done ? 'text-muted-foreground line-through font-medium' : 'text-foreground'}`}>
                                {task.text}
                              </span>

                              {/* Study time badge */}
                              {task.studyTime > 0 && !isActiveTask && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0 flex items-center gap-1">
                                  <Timer className="w-3 h-3 text-muted-foreground/80" />
                                  <span>{task.done ? 'Studied: ' : ''}{formatStudyDuration(task.studyTime)}</span>
                                </span>
                              )}

                              {isActiveTask && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${isStudyTimerRunning ? 'bg-primary/10 text-primary animate-pulse border border-primary/20' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isStudyTimerRunning ? 'bg-primary animate-ping' : 'bg-yellow-500'} inline-block`}></span>
                                  <span>{isStudyTimerRunning ? 'Studying: ' : 'Paused: '}{formatTimer(activeStudySeconds)}</span>
                                </span>
                              )}
                            </div>

                            {/* Extra topic badges */}
                            {isTopicTask && topicDetail && (
                              <div className="flex items-center gap-2 mt-1">
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
                                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                  • Synced
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteTodayTask(task._id)}
                          className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors ml-2 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Study control buttons */}
                      {!task.done && (
                        <div className="mt-2.5 pt-2.5 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                          {isActiveTask ? (
                            <div className="flex items-center gap-2 w-full justify-between">
                              <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5 text-primary" />
                                Active Session
                              </span>
                              <div className="flex gap-2">
                                {isStudyTimerRunning ? (
                                  <button
                                    type="button"
                                    onClick={pauseStudyTask}
                                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 transition-all flex items-center gap-1"
                                  >
                                    <Pause className="w-3 h-3" />
                                    Pause
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={resumeStudyTask}
                                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1"
                                  >
                                    <Play className="w-3 h-3" />
                                    Resume
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleTaskCheckClick(task)}
                                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-primary text-primary-foreground hover:bg-primary/95 transition-all flex items-center gap-1 shadow-sm"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Complete Task
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 w-full justify-end">
                              <button
                                type="button"
                                onClick={() => startStudyTask(task._id)}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all flex items-center gap-1"
                              >
                                <Play className="w-3 h-3" />
                                Start Studying
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Display Feynman explanation if completed */}
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
                })
              )}
            </div>
          </div>

          {/* Focus Readiness Checklist (Habit Tracker) */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-bold font-outfit tracking-tight flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                Focus Readiness Check
              </h2>
              <button 
                type="button" 
                onClick={resetHabits}
                className="text-[10px] text-muted-foreground hover:text-primary hover:underline uppercase tracking-wider font-semibold"
              >
                Reset Checklist
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Tick off these brain-prep tasks before clicking the Pomodoro timer to maximize study flow.
            </p>

            <div className="mb-4">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-1">
                <span>HABITS COMPLETED</span>
                <span>{completedHabitsCount} / {totalHabitsCount}</span>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(completedHabitsCount/totalHabitsCount)*100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              {habits.map((habit) => (
                <div 
                  key={habit.id} 
                  onClick={() => toggleHabit(habit.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                    habit.done 
                      ? 'border-amber-500/20 bg-amber-500/5 text-muted-foreground' 
                      : 'border-border bg-muted/10 hover:border-border/80'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                    habit.done 
                      ? 'bg-amber-500 border-amber-500 text-white' 
                      : 'border-border bg-background'
                  }`}>
                    {habit.done && <span className="text-[8px] font-bold">✓</span>}
                  </div>
                  <span className={`text-xs font-medium ${habit.done ? 'line-through' : ''}`}>
                    {habit.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Pomodoro Timer, Ambient Music Player & Features Guide */}
        <div className="space-y-6">
          
          {/* Pomodoro Focus Timer Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center relative overflow-hidden flex flex-col items-center">
            <h2 className="text-lg font-bold font-outfit tracking-tight flex items-center gap-1.5 mb-1 self-start">
              <Timer className="w-5 h-5 text-primary" />
              Pomodoro Focus Timer
            </h2>
            <p className="text-xs text-muted-foreground mb-6 self-start">
              Implement focus blocks followed by recovery rests.
            </p>

            {/* Circular Timer Display */}
            <div className="relative flex items-center justify-center mb-6">
              <svg className="w-44 h-44 transform -rotate-90">
                <circle 
                  cx="88" 
                  cy="88" 
                  r="78" 
                  className="stroke-secondary fill-transparent" 
                  strokeWidth="6" 
                />
                <circle 
                  cx="88" 
                  cy="88" 
                  r="78" 
                  className="stroke-primary fill-transparent transition-all duration-300" 
                  strokeWidth="6" 
                  strokeDasharray="490" 
                  strokeDashoffset={490 - (490 * (timeLeft / totalPresetSeconds))} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold tracking-tight font-outfit text-foreground leading-none">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1.5">
                  {timerType === 'focus' ? 'Focus Session' : 'Rest Cycle'}
                </span>
              </div>
            </div>

            {/* Presets Row */}
            <div className="flex gap-1.5 mb-5 w-full">
              <button
                type="button"
                onClick={() => handleTimerPreset('focus')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition-all ${
                  timerType === 'focus' 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'border-border bg-muted/20 hover:bg-secondary text-muted-foreground'
                }`}
              >
                Focus (25m)
              </button>
              <button
                type="button"
                onClick={() => handleTimerPreset('short')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition-all ${
                  timerType === 'short' 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'border-border bg-muted/20 hover:bg-secondary text-muted-foreground'
                }`}
              >
                Short (5m)
              </button>
              <button
                type="button"
                onClick={() => handleTimerPreset('long')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition-all ${
                  timerType === 'long' 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'border-border bg-muted/20 hover:bg-secondary text-muted-foreground'
                }`}
              >
                Long (15m)
              </button>
            </div>

            {/* Controls Row */}
            <div className="flex gap-3 justify-center w-full">
              <button
                type="button"
                onClick={toggleTimer}
                className="flex-1 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1 transition-all"
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Start</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="px-4 py-2 border border-border hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
                title="Reset Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Divider */}
            <div className="w-full border-t border-border/60 my-5" />

            {/* Ambient Sound Controller */}
            <div className="w-full text-left space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-primary" />
                  Study Ambient Sound
                </span>
                {activeSound !== 'none' && (
                  <button
                    type="button"
                    onClick={toggleSoundPlay}
                    className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline"
                  >
                    {soundPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{soundPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                )}
              </div>

              {/* Soundtrack buttons */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'None 🔇' },
                  { id: 'lofi', label: 'Lofi Focus 🎧' },
                  { id: 'rain', label: 'Soft Rain 🌧️' },
                  { id: 'instrumental', label: 'Acoustic 🎹' }
                ].map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      setActiveSound(track.id);
                      setSoundPlaying(track.id !== 'none');
                    }}
                    className={`py-2 text-[10px] font-bold border rounded-lg uppercase tracking-wider text-center transition-all ${
                      activeSound === track.id
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'border-border bg-muted/10 hover:bg-secondary text-muted-foreground'
                    }`}
                  >
                    {track.label}
                  </button>
                ))}
              </div>

              {/* Volume Slider */}
              {activeSound !== 'none' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[9px] font-bold text-muted-foreground">VOL:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-[9px] font-bold text-muted-foreground w-6 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* List of Essential Study Features */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold font-outfit tracking-tight flex items-center gap-2 border-b border-border/60 pb-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              Essential Study Features
            </h2>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex gap-2">
                <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground">Syllabus Planner Hub</h3>
                  <p className="text-[11px] text-muted-foreground">Set subject-wise priority tags, difficulty meters, and notes to log topic mastery.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Timer className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground">Time Management Cycle</h3>
                  <p className="text-[11px] text-muted-foreground">Leverage Pomodoro cycles (25/5 min block intervals) to boost attention spans.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <RefreshCw className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground">Active Recall Queue (R1-R3)</h3>
                  <p className="text-[11px] text-muted-foreground">Maintain 3 revision cycles per topic to improve long-term recall memory.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <LineChart className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground">Mock Score Analytics</h3>
                  <p className="text-[11px] text-muted-foreground">Log practice test scores and review accuracy metrics through line graphs.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground">Integrated Study Notes</h3>
                  <p className="text-[11px] text-muted-foreground">Document central concepts, formulas, and links directly on the dashboard.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Grid className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground">Activity Heatmap Log</h3>
                  <p className="text-[11px] text-muted-foreground">Visualize daily study hours, streaks, and overall database commits.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Feynman Active Recall Modal */}
      {isRecallModalOpen && activeRecallTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
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
