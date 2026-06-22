import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, FileText, Search, Save, Edit, X } from 'lucide-react';

export default function NotesView() {
  const { notes, addNote, updateNote, deleteNote } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Note Form Modal / Panel toggles
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await addNote(title.trim(), content.trim());
    setTitle('');
    setContent('');
    setShowAddForm(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await updateNote(editingNoteId, title.trim(), content.trim());
    setEditingNoteId(null);
    setTitle('');
    setContent('');
  };

  const startEditing = (note) => {
    setEditingNoteId(note._id);
    setTitle(note.title);
    setContent(note.content);
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-foreground">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-primary" />
            Study Notes & Outlines
          </h2>
          <p className="text-xs text-muted-foreground">
            Write formulas, reference URLs, study checklists, or lecture outlines. Searchable across titles and contents.
          </p>
        </div>
        <button
          onClick={() => {
            if (editingNoteId) cancelEdit();
            setShowAddForm(!showAddForm);
          }}
          className="bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/95 transition-all text-sm px-4 py-2 self-start flex items-center justify-center gap-1 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Write Note'}</span>
        </button>
      </div>

      {/* Editor Block (Add or Edit) */}
      {(showAddForm || editingNoteId) && (
        <form 
          onSubmit={editingNoteId ? handleEditSubmit : handleAddSubmit}
          className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4 max-w-3xl"
        >
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <h3 className="font-bold text-sm font-outfit">
              {editingNoteId ? 'Edit Study Note' : 'Create New Study Note'}
            </h3>
            {editingNoteId && (
              <button 
                type="button" 
                onClick={cancelEdit}
                className="p-1 hover:bg-muted rounded text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Note Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Quantitative - Trigonometry Formulas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Content / Details
              </label>
              <textarea
                required
                placeholder="Write your study concepts, outline, or markdown-formatted links..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary h-40 resize-y"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingNoteId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="py-1.5 px-3 border border-border text-xs font-medium rounded hover:bg-muted text-muted-foreground transition-all"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="py-1.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingNoteId ? 'Save Changes' : 'Publish Note'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter notes by title or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all"
        />
      </div>

      {/* Grid of Note Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 bg-card border border-border rounded-xl text-muted-foreground text-sm">
            No study notes found. Click "Write Note" to make one.
          </div>
        ) : (
          filteredNotes.map((note) => {
            const date = new Date(note.updatedAt || note.createdAt);
            return (
              <div 
                key={note._id}
                className="bg-card border border-border hover:border-primary/45 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2 pb-1.5 border-b border-border/40">
                    <span className="font-bold font-outfit text-sm text-foreground truncate" title={note.title}>
                      {note.title}
                    </span>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => startEditing(note)}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteNote(note._id)}
                        className="p-1 hover:bg-destructive/15 rounded text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-6">
                    {note.content}
                  </p>
                </div>

                <div className="text-[10px] text-muted-foreground/80 mt-4 text-right">
                  Updated: {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
