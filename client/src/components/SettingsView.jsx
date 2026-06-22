import React, { useState, useRef } from 'react';
import { useApp, getLocalDateString } from '../context/AppContext';
import { Settings, Calendar, RefreshCw, Sun, Moon, Download, Upload, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsView() {
  const { 
    user, 
    updateSettings, 
    resetProgress, 
    exportProgress, 
    importProgress 
  } = useApp();

  const fileInputRef = useRef(null);

  // Form State
  const [targetDays, setTargetDays] = useState(user?.targetDays || 60);
  const [startDate, setStartDate] = useState(
    user?.startDate ? getLocalDateString(new Date(user.startDate)) : getLocalDateString()
  );
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [loading, setLoading] = useState(false);

  // Helper: Format start date into YYYY-MM-DD
  React.useEffect(() => {
    if (user?.startDate) {
      const d = new Date(user.startDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setStartDate(`${year}-${month}-${day}`);
    }
    if (user?.targetDays) setTargetDays(user.targetDays);
    setTheme(localStorage.getItem('theme') || 'light');
  }, [user]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await updateSettings({
      targetDays: Number(targetDays),
      startDate: new Date(startDate)
    });
    setLoading(false);
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast.success(`Theme switched to ${nextTheme} mode!`);
  };

  const handleImportFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const proceed = window.confirm("WARNING: Importing this backup will overwrite your current progress, mock scores, study notes, and goals. Do you wish to continue?");
        if (proceed) {
          setLoading(true);
          const success = await importProgress(json);
          setLoading(false);
          if (success) {
            toast.success("Backup successfully loaded!");
          }
        }
      } catch (err) {
        toast.error("Invalid JSON file format. Check file content.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  const triggerImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleResetClick = async () => {
    const proceed = window.confirm("CAUTION: This will permanently wipe all mock scores, study notes, and reset all study check logs back to Day 1. This action cannot be undone. Are you absolutely sure?");
    if (proceed) {
      setLoading(true);
      await resetProgress();
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-foreground">
      
      {/* Page Header */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-primary" />
          Dashboard Settings
        </h2>
        <p className="text-xs text-muted-foreground">
          Configure start timeline, toggle light/dark interfaces, manage JSON data backups, or reset progress logs.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <h3 className="font-bold text-sm font-outfit uppercase tracking-widest text-muted-foreground pb-2 border-b border-border/40">
          Target Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Preparation Start Date (Day 1)
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 block">
              Dates prior to today will recalculate Day index.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Target Preparation Timeline (N-Days)
            </label>
            <input
              type="number"
              required
              min="10"
              max="365"
              value={targetDays}
              onChange={(e) => setTargetDays(e.target.value)}
              className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary"
            />
            <span className="text-[10px] text-muted-foreground mt-1 block">
              e.g., 30, 45, 60, 90. Adapts heatmap and daily checks.
            </span>
          </div>
        </div>

        {/* Theme select */}
        <div className="flex items-center justify-between py-2 border-t border-b border-border/40">
          <div>
            <p className="text-sm font-semibold">Interface Mode</p>
            <p className="text-xs text-muted-foreground">Toggle between Light mode and sleek Notion dark theme</p>
          </div>
          <button
            type="button"
            onClick={handleThemeToggle}
            className="p-2.5 border border-border hover:bg-secondary text-foreground rounded-lg transition-all"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg hover:bg-primary/95 text-sm transition-all shadow-sm"
        >
          {loading ? 'Saving Settings...' : 'Save Settings'}
        </button>
      </form>

      {/* Import & Export JSON Cards */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm font-outfit uppercase tracking-widest text-muted-foreground">
          Data Backup & Recovery
        </h3>
        <p className="text-xs text-muted-foreground">
          Export your complete schedule progress tree as a single JSON file. You can restore this schedule backup on any device.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={exportProgress}
            className="flex items-center justify-center gap-2 py-2 px-4 border border-border text-foreground hover:bg-secondary rounded-lg font-medium text-sm transition-all"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Export Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={triggerImportClick}
            className="flex items-center justify-center gap-2 py-2 px-4 border border-border text-foreground hover:bg-secondary rounded-lg font-medium text-sm transition-all"
          >
            <Upload className="w-4 h-4 text-primary" />
            <span>Import Backup JSON</span>
          </button>
          
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Critical Danger Reset Area */}
      <div className="border border-destructive/20 bg-destructive/5 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm font-outfit uppercase tracking-widest text-destructive">
              Danger Zone
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Resetting progress clears all study logs, checklist logs, study notes, and mock exams. Your timeline starts clean back on Day 1.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetClick}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-2 px-4 bg-destructive text-white hover:bg-destructive/90 rounded-lg font-semibold text-sm transition-all shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Reset Study Progress</span>
        </button>
      </div>

    </div>
  );
}
