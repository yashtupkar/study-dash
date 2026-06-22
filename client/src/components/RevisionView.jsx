import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RefreshCw, Search, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';

export default function RevisionView() {
  const { subjects, topicProgress, updateTopicProgress } = useApp();
  const [activeSubKey, setActiveSubKey] = useState('quant');
  const [searchQuery, setSearchQuery] = useState('');

  const activeSubject = subjects.find(s => s.key === activeSubKey);
  const activeProgress = topicProgress.filter(p => p.subjectKey === activeSubKey);

  const filteredProgress = activeProgress.filter(p => 
    p.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleRevision = async (p, revNum, currentVal) => {
    const fieldName = `rev${revNum}`;
    const updates = { [fieldName]: !currentVal };
    
    // If marking R3 completed, optionally set status to completed or update status
    await updateTopicProgress(p.subjectKey, p.topic, updates);
    toast.success(`Revision ${revNum} updated for "${p.topic}".`);
  };

  // Get revision statistics for active subject
  const getSubjectRevStats = () => {
    const total = activeProgress.length;
    if (total === 0) return { r1: 0, r2: 0, r3: 0 };
    const r1 = Math.round((activeProgress.filter(p => p.rev1).length / total) * 100);
    const r2 = Math.round((activeProgress.filter(p => p.rev2).length / total) * 100);
    const r3 = Math.round((activeProgress.filter(p => p.rev3).length / total) * 100);
    return { r1, r2, r3 };
  };

  const revStats = getSubjectRevStats();

  return (
    <div className="space-y-6 text-foreground">
      
      {/* Subjects Switcher */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-none gap-2">
        {subjects.map(sub => {
          const isActive = activeSubKey === sub.key;
          return (
            <button
              key={sub.key}
              onClick={() => {
                setActiveSubKey(sub.key);
                setSearchQuery('');
              }}
              className={`px-4 py-2.5 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
                isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {sub.name}
            </button>
          );
        })}
      </div>

      {/* Revision Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card border border-border p-4 rounded-xl shadow-sm items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none font-outfit">Revision (R1-R3)</h3>
            <p className="text-xs text-muted-foreground mt-1">Active Subject Stats</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
            <span>R1 (1st Rev)</span>
            <span>{revStats.r1}%</span>
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full" style={{ width: `${revStats.r1}%` }}></div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
            <span>R2 (2nd Rev)</span>
            <span>{revStats.r2}%</span>
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full" style={{ width: `${revStats.r2}%` }}></div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
            <span>R3 (3rd Rev)</span>
            <span>{revStats.r3}%</span>
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full" style={{ width: `${revStats.r3}%` }}></div>
          </div>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <span className="font-bold text-sm font-outfit text-foreground hidden sm:inline">
            Topic Revision Matrix
          </span>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40 text-muted-foreground border-b border-border text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Topic Description</th>
                <th className="p-4 text-center w-28">R1 (1st Rev)</th>
                <th className="p-4 text-center w-28">R2 (2nd Rev)</th>
                <th className="p-4 text-center w-28">R3 (3rd Rev)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProgress.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-muted-foreground">
                    No topics found in this subject.
                  </td>
                </tr>
              ) : (
                filteredProgress.map((p) => (
                  <tr key={p.topic} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.completed ? 'bg-primary' : 'bg-muted-foreground/30'}`}></span>
                        <span>{p.topic}</span>
                      </div>
                    </td>
                    
                    {/* R1 */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleRevision(p, 1, p.rev1)}
                        className={`inline-flex items-center justify-center p-1 rounded-md border transition-all ${
                          p.rev1 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                            : 'border-border text-transparent hover:border-emerald-500/40 hover:text-emerald-500/20'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </td>

                    {/* R2 */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleRevision(p, 2, p.rev2)}
                        disabled={!p.rev1} // Enforce revision order
                        className={`inline-flex items-center justify-center p-1 rounded-md border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          p.rev2 
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400' 
                            : 'border-border text-transparent hover:border-indigo-500/40 hover:text-indigo-500/20'
                        }`}
                        title={!p.rev1 ? "Complete 1st revision first" : ""}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </td>

                    {/* R3 */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleRevision(p, 3, p.rev3)}
                        disabled={!p.rev2} // Enforce revision order
                        className={`inline-flex items-center justify-center p-1 rounded-md border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          p.rev3 
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400' 
                            : 'border-border text-transparent hover:border-purple-500/40 hover:text-purple-500/20'
                        }`}
                        title={!p.rev2 ? "Complete 2nd revision first" : ""}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
