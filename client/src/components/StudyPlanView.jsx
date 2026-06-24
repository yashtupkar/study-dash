import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  X,
  BookOpenCheck,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Persistent storage helpers (localStorage)
   ───────────────────────────────────────────── */
const STORAGE_KEY = 'studyPlanPDFs';

function loadStoredPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredPlans(plans) {
  // Store only metadata (name, uploadedAt, id) + the dataURL
  // dataURL is base64 so it can be large – we only store up to 5 plans
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans.slice(0, 5)));
  } catch (e) {
    // quota exceeded – skip silently
  }
}

/* ─────────────────────────────────────────────
   Full-screen PDF viewer overlay
   ───────────────────────────────────────────── */
function PdfViewerOverlay({ plan, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card shrink-0 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate max-w-xs" title={plan.name}>
              {plan.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Uploaded {new Date(plan.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={plan.dataUrl}
            download={plan.name}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-muted hover:bg-muted/70 text-foreground transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Close
          </button>
        </div>
      </div>

      {/* PDF iframe */}
      <div className="flex-1 w-full overflow-hidden bg-slate-200 dark:bg-slate-950">
        <iframe
          src={plan.dataUrl}
          title={plan.name}
          className="w-full h-full border-0"
          allow="autoplay"
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Upload Drop Zone
   ───────────────────────────────────────────── */
function UploadZone({ onFileSelect }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') onFileSelect(file);
  }, [onFileSelect]);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 py-14 px-6 text-center select-none
        ${dragging
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border bg-muted/30 hover:border-primary/60 hover:bg-primary/5'
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleChange}
      />

      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200 ${dragging ? 'bg-primary/20' : 'bg-primary/10'}`}>
        <UploadCloud className={`w-8 h-8 transition-colors duration-200 ${dragging ? 'text-primary' : 'text-primary/70'}`} />
      </div>

      <div>
        <p className="text-base font-semibold text-foreground">
          {dragging ? 'Drop your PDF here' : 'Upload Study Plan PDF'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Drag & drop or <span className="text-primary font-medium underline underline-offset-2">browse</span> — PDF files only
        </p>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
        <Info className="w-3 h-3 shrink-0" />
        Up to 5 plans stored locally in your browser
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Plan Card
   ───────────────────────────────────────────── */
function PlanCard({ plan, isActive, onClick, onDelete }) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-150
        ${isActive
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40'
        }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-primary/15' : 'bg-muted'}`}>
        <FileText className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
          {plan.name}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {new Date(plan.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      {isActive && (
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
          VIEWING
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0 ml-1"
        title="Remove plan"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main StudyPlanView
   ───────────────────────────────────────────── */
export default function StudyPlanView() {
  const [plans, setPlans] = useState(loadStoredPlans);
  const [activeId, setActiveId] = useState(() => loadStoredPlans()[0]?.id ?? null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const activePlan = plans.find((p) => p.id === activeId) ?? null;

  /* Convert file to base64 dataURL and persist */
  const handleFileSelect = (file) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const newPlan = {
        id: `plan_${Date.now()}`,
        name: file.name.replace(/\.pdf$/i, ''),
        dataUrl: e.target.result,
        uploadedAt: new Date().toISOString(),
      };
      const updated = [newPlan, ...plans].slice(0, 5);
      setPlans(updated);
      setActiveId(newPlan.id);
      saveStoredPlans(updated);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id) => {
    const updated = plans.filter((p) => p.id !== id);
    setPlans(updated);
    saveStoredPlans(updated);
    if (activeId === id) setActiveId(updated[0]?.id ?? null);
  };

  return (
    <>
      {/* Full-screen overlay viewer */}
      {overlayOpen && activePlan && (
        <PdfViewerOverlay plan={activePlan} onClose={() => setOverlayOpen(false)} />
      )}

      <div className="space-y-6">
        {/* Page heading */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpenCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Study Plan</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload your course study plan PDF and view it anytime
              </p>
            </div>
          </div>

          {activePlan && (
            <button
              onClick={() => setOverlayOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold rounded-xl shadow-md shadow-primary/20 transition-all"
            >
              <ZoomIn className="w-4 h-4" />
              Open Full Screen
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* ── Left Panel: Upload + plan list ── */}
          <div className="space-y-4">
            <UploadZone onFileSelect={handleFileSelect} />

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeLinecap="round" />
                </svg>
                Processing PDF…
              </div>
            )}

            {plans.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
                  Saved Plans ({plans.length}/5)
                </p>
                {plans.map((p) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    isActive={p.id === activeId}
                    onClick={() => setActiveId(p.id)}
                    onDelete={() => handleDelete(p.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right Panel: Embedded PDF viewer ── */}
          <div>
            {activePlan ? (
              <div className="rounded-2xl border border-border overflow-hidden shadow-sm bg-card">
                {/* Viewer toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate max-w-[220px]">
                      {activePlan.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={activePlan.dataUrl}
                      download={activePlan.name + '.pdf'}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Save
                    </a>
                    <button
                      onClick={() => setOverlayOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    >
                      <ZoomIn className="w-3 h-3" />
                      Expand
                    </button>
                  </div>
                </div>

                {/* Embedded PDF */}
                <div className="w-full" style={{ height: '72vh' }}>
                  <iframe
                    key={activePlan.id}
                    src={activePlan.dataUrl}
                    title={activePlan.name}
                    className="w-full h-full border-0"
                    allow="autoplay"
                  />
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-border bg-muted/20 text-center py-24 px-8">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BookOpenCheck className="w-10 h-10 text-primary/50" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">No study plan yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                    Upload your Adda247 SSC study plan PDF using the panel on the left to view it here instantly.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
