import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, LineChart as ChartIcon, FileText, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function MocksView() {
  const { mockTests, addMockTest, deleteMockTest } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [score, setScore] = useState('');
  const [accuracy, setAccuracy] = useState('');
  const [timeTaken, setTimeTaken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !score || !accuracy || !timeTaken) return;
    
    await addMockTest({
      name,
      date: date ? new Date(date) : new Date(),
      score: Number(score),
      accuracy: Number(accuracy),
      timeTaken: Number(timeTaken)
    });

    setName('');
    setDate('');
    setScore('');
    setAccuracy('');
    setTimeTaken('');
    setShowAddForm(false);
  };

  // Format data for chart
  const chartData = mockTests.map(mock => {
    const d = new Date(mock.date);
    return {
      name: mock.name,
      dateStr: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
      Score: mock.score,
      Accuracy: mock.accuracy
    };
  });

  return (
    <div className="space-y-6 text-foreground">
      
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 mb-1">
            <ChartIcon className="w-5 h-5 text-primary" />
            Mock Tests Performance
          </h2>
          <p className="text-xs text-muted-foreground">
            Track exam scores, duration, and accuracy levels. Trend charts automatically plot score improvements.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/95 transition-all text-sm px-4 py-2 self-start flex items-center justify-center gap-1 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Add Test Score'}</span>
        </button>
      </div>

      {/* Add Form Dropdown */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4 max-w-2xl">
          <h3 className="font-bold text-sm font-outfit">Log Mock Exam Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Mock Exam Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., SSC CGL Full Mock 10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-1.5 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Attempt Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-1.5 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Score Obtained
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g., 148"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-1.5 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Accuracy (%)
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                placeholder="e.g., 85"
                value={accuracy}
                onChange={(e) => setAccuracy(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-1.5 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Time Taken (minutes)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g., 60"
                value={timeTaken}
                onChange={(e) => setTimeTaken(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-1.5 text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 text-sm transition-all"
              >
                Log Performance
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Trend Charts Section */}
      {mockTests.length > 0 ? (
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-sm font-outfit uppercase tracking-widest text-muted-foreground mb-4">
            Performance Trend (Score & Accuracy)
          </h3>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                <XAxis dataKey="dateStr" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#10B981" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#4F46E5" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="Score" stroke="#10B981" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="Accuracy" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-xl text-muted-foreground text-sm">
          No mock test data logged yet. Add your first mock score to generate progress trends.
        </div>
      )}

      {/* History List */}
      {mockTests.length > 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-sm font-outfit uppercase tracking-widest text-muted-foreground">
              Mock Tests History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground border-b border-border text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Exam Name</th>
                  <th className="p-4">Attempt Date</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 text-center">Accuracy</th>
                  <th className="p-4 text-center">Duration</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {mockTests.map((mock) => {
                  const d = new Date(mock.date);
                  return (
                    <tr key={mock._id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold text-foreground">{mock.name}</td>
                      <td className="p-4 text-muted-foreground">
                        {d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                        {mock.score}
                      </td>
                      <td className="p-4 text-center font-semibold text-indigo-600 dark:text-indigo-400">
                        {mock.accuracy}%
                      </td>
                      <td className="p-4 text-center text-muted-foreground">
                        {mock.timeTaken} mins
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => deleteMockTest(mock._id)}
                          className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
