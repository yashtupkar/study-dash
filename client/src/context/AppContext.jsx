import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const AppContext = createContext();

// Helper to calculate current day
export const getCurrentDay = (startDate, targetDays) => {
  if (!startDate) return 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const current = diffDays + 1;
  
  if (current < 1) return 1;
  if (current > targetDays) return targetDays;
  return current;
};

// Helper to calculate streak
export const calculateStreak = (dayLogs, currentDay) => {
  if (!dayLogs || dayLogs.length === 0) return 0;
  
  const logsMap = {};
  dayLogs.forEach(log => {
    logsMap[log.day] = log.completed;
  });

  const isTodayCompleted = logsMap[currentDay] === true;
  const isYesterdayCompleted = logsMap[currentDay - 1] === true;

  let checkDay = currentDay;
  if (!isTodayCompleted) {
    if (!isYesterdayCompleted) {
      return 0;
    }
    checkDay = currentDay - 1;
  }

  let streak = 0;
  while (checkDay >= 1) {
    if (logsMap[checkDay] === true) {
      streak++;
      checkDay--;
    } else {
      break;
    }
  }

  return streak;
};

// Helper for local YYYY-MM-DD
export const getLocalDateString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Core Study States
  const [subjects, setSubjects] = useState([]);
  const [topicProgress, setTopicProgress] = useState([]);
  const [dayLogs, setDayLogs] = useState([]);
  const [mockTests, setMockTests] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [notes, setNotes] = useState([]);

  // Quotes List
  const quotes = [
    "Success is the sum of small efforts, repeated day in and day out.",
    "Do not wait. The time will never be 'just right.'",
    "Focus on being productive instead of busy.",
    "Your preparation today determines your performance tomorrow.",
    "Consistency is the key that unlocks all doors of achievement.",
    "The secret of getting ahead is getting started.",
    "You don't have to be great to start, but you have to start to be great.",
    "Small progress is still progress.",
    "Believe you can and you're halfway there.",
    "Difficult roads lead to beautiful destinations."
  ];

  // Rotate daily quote based on calendar date day
  const [dailyQuote, setDailyQuote] = useState(quotes[0]);

  useEffect(() => {
    const dayOfMonth = new Date().getDate();
    setDailyQuote(quotes[dayOfMonth % quotes.length]);
  }, []);

  // Configure axios auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data);
        // Apply theme
        if (res.data.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (err) {
        console.error('Fetch user error:', err);
        setToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // Load all user progress data when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Clear data
      setSubjects([]);
      setTopicProgress([]);
      setDayLogs([]);
      setMockTests([]);
      setTodayTasks([]);
      setNotes([]);
    }
  }, [user?.id]);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      const [subs, prog, days, mocks, tasks, notesRes] = await Promise.all([
        axios.get('/api/subjects'),
        axios.get('/api/progress/topics'),
        axios.get('/api/progress/days'),
        axios.get('/api/mocks'),
        axios.get(`/api/today-tasks?date=${getLocalDateString()}`),
        axios.get('/api/notes')
      ]);

      setSubjects(subs.data);
      setTopicProgress(prog.data);
      setDayLogs(days.data);
      setMockTests(mocks.data);
      setTodayTasks(tasks.data);
      setNotes(notesRes.data);
    } catch (error) {
      console.error('Error loading study dashboard data:', error);
      toast.error('Failed to load study data');
    } finally {
      setDataLoading(false);
    }
  };

  // Auth Functions
  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      if (res.data.user.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      toast.success(`Welcome back, ${res.data.user.name}!`);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      if (res.data.user.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      toast.success('Registration successful! Syllabus initialized.');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    toast.success('Logged out successfully');
  };

  // Study Progress Actions
  const toggleTopicDaily = async (subjectKey, topic, day, done) => {
    try {
      const res = await axios.patch(`/api/progress/topics/${subjectKey}/${encodeURIComponent(topic)}/daily`, {
        day,
        done
      });
      
      // Update local TopicProgress state
      setTopicProgress(prev => prev.map(p => {
        if (p.subjectKey === subjectKey && p.topic === topic) {
          return res.data;
        }
        return p;
      }));

      // Reload day logs since completing a daily checkbox updates day logs count
      const daysRes = await axios.get('/api/progress/days');
      setDayLogs(daysRes.data);
      
      toast.success(`Day ${day} check updated!`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update daily progress';
      toast.error(errorMsg);
      throw err;
    }
  };

  const updateTopicProgress = async (subjectKey, topic, updates) => {
    try {
      const res = await axios.patch(`/api/progress/topics/${subjectKey}/${encodeURIComponent(topic)}`, updates);
      setTopicProgress(prev => prev.map(p => {
        if (p.subjectKey === subjectKey && p.topic === topic) {
          return res.data;
        }
        return p;
      }));
      return res.data;
    } catch (err) {
      toast.error('Failed to update topic details');
      console.error(err);
    }
  };

  const updateDayLog = async (day, updates) => {
    try {
      const res = await axios.patch(`/api/progress/days/${day}`, updates);
      setDayLogs(prev => {
        const exists = prev.some(l => l.day === Number(day));
        if (exists) {
          return prev.map(l => l.day === Number(day) ? res.data : l);
        } else {
          return [...prev, res.data].sort((a,b) => a.day - b.day);
        }
      });
      
      // Check if this was marked as completed and celebrating it
      if (updates.completed === true) {
        toast.success(`🎉 Day ${day} Goal Completed! Stay consistent!`);
      } else {
        toast.success(`Day ${day} log updated.`);
      }
      return res.data;
    } catch (err) {
      toast.error('Failed to update day log');
      console.error(err);
    }
  };

  // Mock Tests
  const addMockTest = async (mock) => {
    try {
      const res = await axios.post('/api/mocks', mock);
      setMockTests(prev => [...prev, res.data].sort((a,b) => new Date(a.date) - new Date(b.date)));
      toast.success('Mock test added!');
    } catch (err) {
      toast.error('Failed to add mock test');
      console.error(err);
    }
  };

  const deleteMockTest = async (id) => {
    try {
      await axios.delete(`/api/mocks/${id}`);
      setMockTests(prev => prev.filter(m => m._id !== id));
      toast.success('Mock test deleted.');
    } catch (err) {
      toast.error('Failed to delete mock test');
      console.error(err);
    }
  };

  // Notes
  const addNote = async (title, content) => {
    try {
      const res = await axios.post('/api/notes', { title, content });
      setNotes(prev => [res.data, ...prev]);
      toast.success('Note created!');
    } catch (err) {
      toast.error('Failed to create note');
      console.error(err);
    }
  };

  const updateNote = async (id, title, content) => {
    try {
      const res = await axios.patch(`/api/notes/${id}`, { title, content });
      setNotes(prev => prev.map(n => n._id === id ? res.data : n));
      toast.success('Note updated.');
    } catch (err) {
      toast.error('Failed to update note');
      console.error(err);
    }
  };

  const deleteNote = async (id) => {
    try {
      await axios.delete(`/api/notes/${id}`);
      setNotes(prev => prev.filter(n => n._id !== id));
      toast.success('Note deleted.');
    } catch (err) {
      toast.error('Failed to delete note');
      console.error(err);
    }
  };

  // Today Tasks
  const fetchTasksForDate = async (date) => {
    try {
      const res = await axios.get(`/api/today-tasks?date=${date}`);
      setTodayTasks(res.data);
    } catch (error) {
      console.error('Fetch tasks for date error:', error);
    }
  };

  const addTodayTask = async (text, date) => {
    try {
      const res = await axios.post('/api/today-tasks', { text, date });
      setTodayTasks(prev => [...prev, res.data]);
      toast.success('Task added!');
    } catch (err) {
      toast.error('Failed to add task');
      console.error(err);
    }
  };

  const toggleTodayTask = async (id, done) => {
    try {
      const res = await axios.patch(`/api/today-tasks/${id}`, { done });
      setTodayTasks(prev => prev.map(t => t._id === id ? res.data : t));
      
      // Celebrate if all tasks are done!
      const updatedTasks = todayTasks.map(t => t._id === id ? res.data : t);
      const allDone = updatedTasks.length > 0 && updatedTasks.every(t => t.done);
      if (allDone) {
        toast.success("🎉 All today's tasks completed! Outstanding job!");
      }
    } catch (err) {
      toast.error('Failed to update task');
      console.error(err);
    }
  };

  const deleteTodayTask = async (id) => {
    try {
      await axios.delete(`/api/today-tasks/${id}`);
      setTodayTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Task deleted.');
    } catch (err) {
      toast.error('Failed to delete task');
      console.error(err);
    }
  };

  // Settings Actions
  const updateSettings = async (settings) => {
    try {
      const res = await axios.patch('/api/settings', settings);
      setUser(res.data);
      if (settings.theme) {
        if (settings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      // Reload Day Logs as targetDays changes might scale logs list
      if (settings.targetDays) {
        const daysRes = await axios.get('/api/progress/days');
        setDayLogs(daysRes.data);
      }
      
      toast.success('Settings updated successfully!');
      return true;
    } catch (err) {
      toast.error('Failed to update settings');
      console.error(err);
      return false;
    }
  };

  const resetProgress = async () => {
    try {
      const res = await axios.delete('/api/reset');
      setUser(res.data.user);
      await loadAllData();
      toast.success('All progress successfully reset.');
    } catch (err) {
      toast.error('Failed to reset progress');
      console.error(err);
    }
  };

  const exportProgress = async () => {
    try {
      const res = await axios.get('/api/export');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `study_progress_${getLocalDateString()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Backup file exported!');
    } catch (err) {
      toast.error('Failed to export data');
      console.error(err);
    }
  };

  const importProgress = async (jsonData) => {
    try {
      const res = await axios.post('/api/import', jsonData);
      setUser(res.data.user);
      await loadAllData();
      toast.success('Backup imported successfully! All records loaded.');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import backup file');
      console.error(err);
      return false;
    }
  };

  // Global Derived Stats
  const currentDay = user ? getCurrentDay(user.startDate, user.targetDays) : 1;
  const streak = dayLogs.length > 0 ? calculateStreak(dayLogs, currentDay) : 0;

  return (
    <AppContext.Provider value={{
      user,
      token,
      loading,
      dataLoading,
      subjects,
      topicProgress,
      dayLogs,
      mockTests,
      todayTasks,
      notes,
      dailyQuote,
      currentDay,
      streak,
      login,
      register,
      logout,
      toggleTopicDaily,
      updateTopicProgress,
      updateDayLog,
      addMockTest,
      deleteMockTest,
      addNote,
      updateNote,
      deleteNote,
      fetchTasksForDate,
      addTodayTask,
      toggleTodayTask,
      deleteTodayTask,
      updateSettings,
      resetProgress,
      exportProgress,
      importProgress,
      loadAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
