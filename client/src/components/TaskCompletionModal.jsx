import React from 'react';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';

const quotes = [
  "The secret of getting ahead is getting started — and you finished. Well done.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Every expert was once a beginner who refused to quit.",
  "Discipline is choosing between what you want now and what you want most.",
  "You don't have to be great to start, but you have to start to be great.",
];

export default function TaskCompletionModal() {
  const { showCompletionModal, completionStats, closeCompletionModal } = useApp();

  if (!showCompletionModal) return null;

  const { completedCount, day } = completionStats;
  const quote = quotes[day % quotes.length];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10  p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeCompletionModal(); }}
    >
      <div className="relative w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-border bg-card animate-[slideUp_0.25s_ease]">

        {/* Slim primary accent bar */}
        <div className="h-1 w-full bg-primary" />

        <div className="p-8 text-center space-y-6">

          {/* Big emoji headline */}
          <div className="space-y-2">
            <div className="text-5xl leading-none select-none">🎉</div>
            <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.2em]">
              Day {day} Complete
            </p>
            <h2 className="text-2xl font-bold font-outfit tracking-tight text-foreground">
              All Tasks Done!
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              You've locked in every study target for today. Consistency like this is what
              separates good students from great ones.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/60 border border-border rounded-2xl p-4">
              <p className="text-2xl font-bold text-primary">{completedCount}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                Tasks Done
              </p>
            </div>
            <div className="bg-muted/60 border border-border rounded-2xl p-4">
              <p className="text-2xl font-bold text-primary">{day}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                Day No.
              </p>
            </div>
            <div className="bg-muted/60 border border-border rounded-2xl p-4">
              <p className="text-2xl font-bold text-primary">100%</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                Complete
              </p>
            </div>
          </div>

          {/* Rotating motivational quote */}
          <div className="bg-muted/40 border border-border/60 rounded-2xl px-4 py-3">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
          </div>

          {/* CTA button */}
          <button
            onClick={closeCompletionModal}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl text-sm transition-all shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            Keep Going 🚀
          </button>
        </div>

        {/* X close button */}
        <button
          onClick={closeCompletionModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
