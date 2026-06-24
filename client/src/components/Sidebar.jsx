import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  CalendarDays,
  RefreshCw,
  LineChart,
  Grid,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Flame,
  Target,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, streak, currentDay } = useApp();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects', path: '/subjects', name: 'Subjects', icon: BookOpen },
    { id: 'today', path: '/today', name: 'Today\'s Tasks', icon: CheckSquare },
    { id: 'planner', path: '/planner', name: 'N-Day Planner', icon: CalendarDays },
    { id: 'revision', path: '/revision', name: 'Revision (R1-R3)', icon: RefreshCw },
    { id: 'mocks', path: '/mocks', name: 'Mock Tests', icon: LineChart },
    { id: 'heatmap', path: '/heatmap', name: 'Activity Heatmap', icon: Grid },
    { id: 'stats', path: '/stats', name: 'Statistics', icon: BarChart3 },
    { id: 'notes', path: '/notes', name: 'Study Material', icon: FileText },
    { id: 'settings', path: '/settings', name: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border text-foreground transition-colors duration-300">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          <span className="font-bold tracking-tight text-lg font-outfit">StudyDash</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 rounded-full font-medium">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{streak} d</span>
          </div>
          <div className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
            <Target className="w-3.5 h-3.5" />
            <span>Day {currentDay}</span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-muted rounded-md focus:outline-none"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu Drawer */}
      <div className={`lg:hidden fixed inset-y-0 right-0 w-64 bg-card z-50 transform transition-transform duration-300 ease-in-out border-l border-border ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full justify-between p-4">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <span className="font-semibold text-foreground">Navigation</span>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded-md">
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="border-t border-border pt-4 mt-auto">
            <div className="mb-4">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="font-medium text-foreground truncate">{user?.name}</p>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 text-destructive hover:bg-destructive/15 text-sm font-medium rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-card border-r border-border h-screen sticky top-0 text-foreground transition-colors duration-300 shrink-0">
        <div className="p-4  flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold tracking-tight text-lg leading-none font-outfit">StudyDash</h1>
          </div>
        </div>

        {/* User stats widget in sidebar */}
        <div className="p-3 mx-3 my-2.5 bg-muted/50 border border-border/80 rounded-lg space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary text-xs">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground leading-none">Preparing</p>
              <p className="font-medium text-xs text-foreground truncate mt-0.5">{user?.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/40">
            <div className="bg-card px-1.5 py-1 rounded-md border border-border/50 text-center">
              <span className="text-[9px] text-muted-foreground block">Streak</span>
              <span className="text-[11px] font-bold text-amber-500 flex items-center justify-center gap-0.5">
                <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                {streak} d
              </span>
            </div>
            <div className="bg-card px-1.5 py-1 rounded-md border border-border/50 text-center">
              <span className="text-[9px] text-muted-foreground block">Timeline</span>
              <span className="text-[11px] font-bold text-primary">Day {currentDay}/{user?.targetDays}</span>
            </div>
          </div>
        </div>

        {/* Desktop Menu */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-medium transition-all ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Sidebar Footer */}
        <div className="p-3 border-t border-border mt-auto">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive text-sm font-medium rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
