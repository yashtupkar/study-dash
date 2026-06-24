import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, X } from 'lucide-react';

export default function FeynmanRecallModal() {
  const {
    // Feynman recall modal
    isRecallModalOpen,
    recallModalTask,
    closeRecallModal,
    // QP modal
    isQPModalOpen,
    qpModalTask,
    closeQPModal,
    // Actions
    toggleTodayTask,
    subjects,
  } = useApp();

  // --- Feynman recall local form state ---
  const [recallText, setRecallText] = useState('');
  const [questionsSolved, setQuestionsSolved] = useState(0);

  // --- QP modal local form state ---
  const [qpModalCount, setQpModalCount] = useState(0);
  const [qpModalNote, setQpModalNote] = useState('');

  // Reset form state whenever a new task is opened
  useEffect(() => {
    if (isRecallModalOpen) {
      setRecallText('');
      setQuestionsSolved(0);
    }
  }, [isRecallModalOpen, recallModalTask]);

  useEffect(() => {
    if (isQPModalOpen && qpModalTask) {
      setQpModalCount(qpModalTask.questionCount || 0);
      setQpModalNote('');
    }
  }, [isQPModalOpen, qpModalTask]);

  // --- Handlers ---
  const handleRecallSubmit = async (e) => {
    e.preventDefault();
    if (recallText.trim().length < 15) return;
    closeRecallModal();
    await toggleTodayTask(recallModalTask._id, true, recallText.trim(), questionsSolved);
  };

  const handleQPModalSubmit = async (e) => {
    e.preventDefault();
    closeQPModal();
    await toggleTodayTask(qpModalTask._id, true, qpModalNote.trim() || undefined, qpModalCount);
  };

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isRecallModalOpen) closeRecallModal();
        if (isQPModalOpen) closeQPModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRecallModalOpen, isQPModalOpen]);

  /* ── Feynman Active Recall Modal ──────────────────────────── */
  if (isRecallModalOpen && recallModalTask) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) closeRecallModal(); }}
      >
        <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-[slideUp_0.2s_ease]">
          {/* Accent bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.3))' }} />

          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Active Learning Check
                </span>
                <h3 className="text-lg font-bold font-outfit text-foreground leading-tight">
                  Feynman Recall
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Explain what you learned in{' '}
                  <strong className="text-foreground">
                    &ldquo;{recallModalTask.text.replace('Review Topic: ', '')}&rdquo;
                  </strong>{' '}
                  in your own words. Simple explanation = true mastery.
                </p>
              </div>
              <button
                onClick={closeRecallModal}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecallSubmit} className="space-y-4">
              {/* Explanation textarea */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Your Explanation <span className="text-red-400">*</span> (min 15 chars)
                </label>
                <textarea
                  required
                  autoFocus
                  placeholder="Write a 1-2 sentence summary of core concepts, formulas, or rules you learned..."
                  value={recallText}
                  onChange={(e) => setRecallText(e.target.value)}
                  className="w-full h-24 bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-all"
                />
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1 px-0.5">
                  <span>Be simple, clear, and concise.</span>
                  <span className={recallText.trim().length >= 15 ? 'text-primary font-bold' : 'text-red-500 font-bold'}>
                    {recallText.trim().length} / 15 min
                  </span>
                </div>
              </div>

              {/* Questions solved (for topic tasks) */}
              {recallModalTask.subjectKey && (
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Questions Solved Today
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={questionsSolved}
                    onChange={(e) => setQuestionsSolved(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold"
                  />
                  <span className="block text-[9px] text-muted-foreground mt-1">
                    Number of practice questions completed for this topic block.
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeRecallModal}
                  className="flex-1 py-2.5 border border-border hover:bg-secondary text-muted-foreground text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recallText.trim().length < 15}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Lock In Study Block ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── Question Practice Completion Modal ───────────────────── */
  if (isQPModalOpen && qpModalTask) {
    const subName = subjects.find((s) => s.key === qpModalTask.subjectKey)?.name || qpModalTask.subjectKey;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) closeQPModal(); }}
      >
        <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.2s_ease]">
          {/* Accent bar */}
          <div className="h-1 w-full bg-cyan-500" />

          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1 block">
                  🎯 Question Practice Complete
                </span>
                <h3 className="text-lg font-bold font-outfit text-foreground leading-tight">
                  Log Your Practice Session
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Confirm questions solved. This adds to today's count for{' '}
                  <strong className="text-foreground">{subName} → {qpModalTask.topic}</strong>.
                </p>
              </div>
              <button
                onClick={closeQPModal}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQPModalSubmit} className="space-y-4">
              {/* Questions count */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Questions Solved
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  min="0"
                  value={qpModalCount}
                  onChange={(e) => setQpModalCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold"
                />
                <span className="block text-[9px] text-muted-foreground mt-1">
                  Edit if you solved fewer/more than planned ({qpModalTask.questionCount} planned).
                </span>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Short Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mostly easy, struggled with double analogy..."
                  value={qpModalNote}
                  onChange={(e) => setQpModalNote(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeQPModal}
                  className="flex-1 py-2.5 border border-border hover:bg-secondary text-muted-foreground text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  ✅ Mark Complete &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
