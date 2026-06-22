import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Toaster } from 'sonner';
import LoginRegister from './components/LoginRegister';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import SubjectsView from './components/SubjectsView';
import TodayView from './components/TodayView';
import PlannerView from './components/PlannerView';
import RevisionView from './components/RevisionView';
import MocksView from './components/MocksView';
import HeatmapView from './components/HeatmapView';
import StatsView from './components/StatsView';
import NotesView from './components/NotesView';
import SettingsView from './components/SettingsView';
import { Loader2 } from 'lucide-react';

function DashboardShell() {
  const { user, loading, dataLoading, topicProgress } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-300">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground mt-3 font-medium font-outfit">Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginRegister />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} />;
      case 'subjects':
        return <SubjectsView />;
      case 'today':
        return <TodayView />;
      case 'planner':
        return <PlannerView />;
      case 'revision':
        return <RevisionView />;
      case 'mocks':
        return <MocksView />;
      case 'heatmap':
        return <HeatmapView />;
      case 'stats':
        return <StatsView />;
      case 'notes':
        return <NotesView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView setActiveTab={setActiveTab} />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Home Dashboard';
      case 'subjects': return 'Subject Syllabus';
      case 'today': return 'Today\'s Targets';
      case 'planner': return 'N-Day Planner Logs';
      case 'revision': return 'Revision Tracker';
      case 'mocks': return 'Mock Tests Performance';
      case 'heatmap': return 'Study Heatmap';
      case 'stats': return 'Study Statistics';
      case 'notes': return 'Study Notes';
      case 'settings': return 'Settings';
      default: return 'Study Dashboard';
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header bar (Desktop only) */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-border bg-card">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground font-outfit">{getTabTitle()}</h1>
            <p className="text-xs text-muted-foreground">Keep studying, consistency leads to success.</p>
          </div>
          {dataLoading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Syncing...</span>
            </div>
          )}
        </header>

        {/* Dynamic Views area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          {dataLoading && !topicProgress?.length ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground mt-3 font-outfit">Syncing syllabus databases...</p>
            </div>
          ) : (
            renderActiveView()
          )}
        </div>

      </main>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DashboardShell />
      <Toaster position="top-right" richColors />
    </AppProvider>
  );
}
