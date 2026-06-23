import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
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
import QuizzesView from './components/QuizzesView';
import { Loader2, FileText, Download, X } from 'lucide-react';

function Header() {
  const location = useLocation();
  const { dataLoading } = useApp();

  const getTabTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard': return 'Home Dashboard';
      case '/subjects': return 'Subject Syllabus';
      case '/today': return 'Today\'s Targets';
      case '/planner': return 'N-Day Planner Logs';
      case '/revision': return 'Revision Tracker';
      case '/mocks': return 'Mock Tests Performance';
      case '/quizzes': return 'Topic Tests Performance';
      case '/heatmap': return 'Study Heatmap';
      case '/stats': return 'Study Statistics';
      case '/notes': return 'Study Material Hub';
      case '/settings': return 'Settings';
      default: return 'Study Dashboard';
    }
  };

  return (
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
  );
}

function DashboardShell() {
  const { user, loading, dataLoading, topicProgress } = useApp();

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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header bar (Desktop only) */}
        <Header />

        {/* Dynamic Views area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          {dataLoading && !topicProgress?.length ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground mt-3 font-outfit">Syncing syllabus databases...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/subjects" element={<SubjectsView />} />
              <Route path="/today" element={<TodayView />} />
              <Route path="/planner" element={<PlannerView />} />
              <Route path="/revision" element={<RevisionView />} />
              <Route path="/mocks" element={<MocksView />} />
              <Route path="/quizzes" element={<QuizzesView />} />
              <Route path="/heatmap" element={<HeatmapView />} />
              <Route path="/stats" element={<StatsView />} />
              <Route path="/notes" element={<NotesView />} />
              <Route path="/settings" element={<SettingsView />} />
              {/* Catch all redirect to / */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>

      </main>

    </div>
  );
}


function PdfViewerPage({ url, name }) {
  const isDark = (localStorage.getItem('theme') || 'light') === 'dark';

  return (
    <div className={`h-screen flex flex-col font-outfit ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Premium Header */}
      <header className={`h-16 border-b flex items-center justify-between px-6 shrink-0 shadow-sm ${
        isDark 
          ? 'border-slate-800 bg-slate-950 text-slate-100' 
          : 'border-slate-200 bg-white text-slate-900'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-500/10 text-rose-600'}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold truncate max-w-md" title={name}>{name || 'PDF Document'}</h1>
            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Study Platform - Built-in PDF Viewer</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={url}
            download
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors text-xs font-semibold rounded-lg border ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700' 
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
          <button
            onClick={() => window.close()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 transition-colors text-xs font-semibold text-white rounded-lg shadow-sm"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close View</span>
          </button>
        </div>
      </header>

      {/* PDF View Container */}
      <div className={`flex-1 w-full overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-200'}`}>
        <iframe
          src={url}
          title={name}
          className="w-full h-full border-0"
          allow="autoplay"
        />
      </div>
    </div>
  );
}

function PdfViewerWrapper() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('pdf');
  const name = searchParams.get('name');
  return <PdfViewerPage url={url} name={name} />;
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const legacyPdfUrl = params.get('pdf');
  const legacyPdfName = params.get('name');

  // Preserve legacy search-param PDF route fallback for tabs already opened this way
  if (legacyPdfUrl) {
    return <PdfViewerPage url={legacyPdfUrl} name={legacyPdfName} />;
  }

  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/pdf" element={<PdfViewerWrapper />} />
          <Route path="/*" element={<DashboardShell />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </AppProvider>
    </BrowserRouter>
  );
}
