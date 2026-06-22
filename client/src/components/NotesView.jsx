import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Search, 
  Save, 
  Edit, 
  X, 
  Folder, 
  FolderOpen,
  Image as ImageIcon, 
  Youtube, 
  ExternalLink, 
  Link2, 
  Upload, 
  Loader2,
  FileSignature,
  ChevronRight,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import CameraCaptureModal from './CameraCaptureModal';

const subjectColors = {
  quant: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  reasoning: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
  english: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  ga: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
  cs: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
};

export default function NotesView() {
  const { 
    notes, 
    addNote, 
    updateNote, 
    deleteNote,
    subjects,
    topicProgress,
    addTopicResource,
    deleteTopicResource
  } = useApp();

  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'notes'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState(null);
  
  // Note Form Modal / Panel toggles
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Add Material Panel States
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [selectedSubKey, setSelectedSubjectKey] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [materialType, setMaterialType] = useState('file'); // 'file' | 'link' | 'folder'
  const [materialName, setMaterialName] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleCameraCapture = async (file) => {
    if (!selectedSubKey || !selectedTopic) {
      toast.error('Please select a subject and a topic.');
      return;
    }

    let targetParentId = null;
    if (currentFolderId) {
      const activeFolder = allResources.find(r => r.id === currentFolderId);
      if (activeFolder && activeFolder.subjectKey === selectedSubKey && activeFolder.topic === selectedTopic) {
        targetParentId = currentFolderId;
      }
    }

    setIsUploading(true);
    setIsCameraOpen(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'file');
    formData.append('name', materialName.trim() || file.name);
    if (targetParentId) {
      formData.append('parentId', targetParentId);
    }

    try {
      await addTopicResource(selectedSubKey, selectedTopic, formData);
      setMaterialName('');
      setShowAddMaterial(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Lightbox States
  const [activeMediaUrl, setActiveMediaUrl] = useState(null);
  const [activeMediaType, setActiveMediaType] = useState(null); // 'image' | 'youtube'
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize dropdown selections
  React.useEffect(() => {
    if (subjects.length > 0 && !selectedSubKey) {
      setSelectedSubjectKey(subjects[0].key);
      if (subjects[0].topics && subjects[0].topics.length > 0) {
        setSelectedTopic(subjects[0].topics[0]);
      }
    }
  }, [subjects, selectedSubKey]);

  // Synchronize dropdown selections with the active folder & handle folder deletion cleanup
  React.useEffect(() => {
    if (currentFolderId) {
      const folder = allResources.find(r => r.id === currentFolderId);
      if (folder) {
        setSelectedSubjectKey(folder.subjectKey);
        setSelectedTopic(folder.topic);
      } else {
        setCurrentFolderId(null);
      }
    }
  }, [currentFolderId, topicProgress]);

  const handleSubjectChange = (subjectKey) => {
    setSelectedSubjectKey(subjectKey);
    const sub = subjects.find(s => s.key === subjectKey);
    if (sub && sub.topics && sub.topics.length > 0) {
      setSelectedTopic(sub.topics[0]);
    } else {
      setSelectedTopic('');
    }
  };

  // Helper to extract YouTube video ID and build embed link
  const getYoutubeVideoId = (url) => {
    if (!url) return '';
    const str = String(url).trim();
    
    // Check for shorts
    if (str.includes('/shorts/')) {
      const parts = str.split('/shorts/');
      if (parts[1]) {
        return parts[1].split(/[?#&]/)[0];
      }
    }
    
    // Check for live stream
    if (str.includes('/live/')) {
      const parts = str.split('/live/');
      if (parts[1]) {
        return parts[1].split(/[?#&]/)[0];
      }
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = str.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    
    try {
      const urlObj = new URL(str);
      const v = urlObj.searchParams.get('v');
      if (v && v.length === 11) return v;
    } catch (e) {
      // ignore
    }
    
    return '';
  };

  const getYoutubeEmbed = (url) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  const isImageFile = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
  };

  // Gather all resources across all topicProgress items
  const allResources = topicProgress.flatMap(prog => 
    (prog.resources || []).map(res => ({
      ...res,
      subjectKey: prog.subjectKey,
      topic: prog.topic
    }))
  );

  // Filter resources based on folder and search query
  const filteredResources = allResources.filter(res => {
    // If there is a search query, show match globally
    if (searchQuery.trim() !== '') {
      const sub = subjects.find(s => s.key === res.subjectKey);
      const subName = sub ? sub.name : '';
      return (
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Otherwise, show only items in current folder
    return (res.parentId || null) === currentFolderId;
  });

  // Helper to build breadcrumb path
  const getBreadcrumbs = () => {
    const crumbs = [];
    let currentId = currentFolderId;
    while (currentId !== null) {
      const folder = allResources.find(r => r.id === currentId);
      if (folder) {
        crumbs.unshift(folder);
        currentId = folder.parentId || null;
      } else {
        break;
      }
    }
    return crumbs;
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add Material Submit Handler
  const handleAddMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubKey || !selectedTopic) {
      toast.error('Please select a subject and a topic.');
      return;
    }

    // Determine parentId based on current folder selection
    let targetParentId = null;
    if (currentFolderId) {
      const activeFolder = allResources.find(r => r.id === currentFolderId);
      if (activeFolder && activeFolder.subjectKey === selectedSubKey && activeFolder.topic === selectedTopic) {
        targetParentId = currentFolderId;
      }
    }

    if (materialType === 'file') {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        toast.error('Please select a file to upload.');
        return;
      }
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'file');
      formData.append('name', materialName.trim() || file.name);
      if (targetParentId) {
        formData.append('parentId', targetParentId);
      }

      try {
        await addTopicResource(selectedSubKey, selectedTopic, formData);
        setMaterialName('');
        setShowAddMaterial(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    } else {
      if (materialType === 'folder' && !materialName.trim()) {
        toast.error('Please specify folder name.');
        return;
      }
      if (materialType === 'link' && (!materialName.trim() || !materialUrl.trim())) {
        toast.error('Please specify link title and URL.');
        return;
      }

      let url = materialUrl.trim();
      if (materialType === 'link' && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }

      try {
        await addTopicResource(selectedSubKey, selectedTopic, {
          name: materialName.trim(),
          type: materialType,
          url: materialType === 'link' ? url : undefined,
          parentId: targetParentId
        });
        setMaterialName('');
        setMaterialUrl('');
        setShowAddMaterial(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Add Note Submit Handlers
  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await addNote(title.trim(), content.trim());
    setTitle('');
    setContent('');
    setShowAddForm(false);
  };

  const handleEditNoteSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await updateNote(editingNoteId, title.trim(), content.trim());
    setEditingNoteId(null);
    setTitle('');
    setContent('');
  };

  const startEditingNote = (note) => {
    setEditingNoteId(note._id);
    setTitle(note.title);
    setContent(note.content);
    setShowAddForm(false);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
  };

  const handleResourceClick = (res) => {
    if (res.type === 'link') {
      const ytEmbed = getYoutubeEmbed(res.url);
      if (ytEmbed) {
        setActiveMediaUrl(ytEmbed);
        setActiveMediaType('youtube');
      } else {
        window.open(res.url, '_blank');
      }
    } else if (res.type === 'file') {
      if (isImageFile(res.url)) {
        setActiveMediaUrl(res.url);
        setActiveMediaType('image');
      } else if (res.url?.toLowerCase().split('?')[0].endsWith('.pdf')) {
        window.open(`${window.location.origin}/?pdf=${encodeURIComponent(res.url)}&name=${encodeURIComponent(res.name)}`, '_blank');
      } else {
        window.open(res.url, '_blank');
      }
    } else if (res.type === 'folder') {
      setCurrentFolderId(res.id);
    }
  };

  const handleDeleteResource = async (res) => {
    if (window.confirm(`Delete "${res.name}"? Deleting a folder recursively deletes nested items.`)) {
      await deleteTopicResource(res.subjectKey, res.topic, res.id);
      if (currentFolderId === res.id) {
        setCurrentFolderId(null);
      }
    }
  };

  return (
    <div className=" text-foreground">
      
      {/* Header Banner */}
      <div className="bg-card mb-4 border border-border p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 mb-1">
            <FolderOpen className="w-5 h-5 text-primary" />
            Study Material Hub
          </h2>
          <p className="text-xs text-muted-foreground">
            A centralized dashboard to upload cheat sheets, save YouTube tutorial links, and write lecture notes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start">
          {activeTab === 'materials' ? (
            <button
              onClick={() => setShowAddMaterial(!showAddMaterial)}
              className="bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/95 transition-all text-sm px-4 py-2 flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddMaterial ? 'Close Form' : 'Add Material'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (editingNoteId) cancelEditNote();
                setShowAddForm(!showAddForm);
              }}
              className="bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/95 transition-all text-sm px-4 py-2 flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Close Form' : 'Write Note'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b mb-4 border-border gap-4">
        <button
          onClick={() => {
            setActiveTab('materials');
            setShowAddForm(false);
          }}
          className={`pb-2.5 text-sm font-bold  tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'materials' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Study Resources ({allResources.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('notes');
            setShowAddMaterial(false);
          }}
          className={`pb-2.5 text-sm font-bold  tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'notes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          <span>Study Notes ({notes.length})</span>
        </button>
      </div>

      {/* Quick Add Material Panel */}
      {activeTab === 'materials' && showAddMaterial && (
        <form onSubmit={handleAddMaterialSubmit} className="bg-card border mb-4 border-border p-5 rounded-xl shadow-sm space-y-4 max-w-3xl">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <h3 className="font-bold text-sm font-outfit">Add Resource Material</h3>
            <button type="button" onClick={() => setShowAddMaterial(false)} className="p-1 hover:bg-muted rounded text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Select Subject</label>
              <select
                value={selectedSubKey}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              >
                {subjects.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Select Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              >
                {selectedTopic ? (
                  subjects.find(s => s.key === selectedSubKey)?.topics.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                  ))
                ) : (
                  <option value="">No topic selected</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-2">Material Type</label>
            <div className="flex gap-4">
              {['file', 'link', 'folder'].map(t => (
                <label key={t} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="materialType"
                    checked={materialType === t}
                    onChange={() => setMaterialType(t)}
                    className="accent-primary"
                  />
                  <span className="capitalize">{t === 'file' ? 'Upload PDF/Img' : t === 'link' ? 'Web/YouTube Link' : 'Folder'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                {materialType === 'folder' ? 'Folder Name' : 'Material Title'}
              </label>
              <input
                type="text"
                required
                placeholder={materialType === 'folder' ? 'e.g. Formula Sheets' : 'e.g. Percentage Shortcuts, Polity Video Lesson...'}
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {materialType === 'file' ? (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Select File (PDF / Images)</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="file"
                    required
                    ref={fileInputRef}
                    accept=".pdf,image/*"
                    className="flex-1 text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-xs file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase select-none hidden sm:inline">OR</span>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => setIsCameraOpen(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 text-primary" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : materialType === 'link' ? (
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">URL (YouTube / Web Page)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  value={materialUrl}
                  onChange={(e) => setMaterialUrl(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddMaterial(false)}
              className="py-1.5 px-3 border border-border text-xs font-semibold rounded hover:bg-muted text-muted-foreground transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="py-1.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Material</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Editor Block (Study Notes Add or Edit) */}
      {activeTab === 'notes' && (showAddForm || editingNoteId) && (
        <form 
          onSubmit={editingNoteId ? handleEditNoteSubmit : handleAddNoteSubmit}
          className="bg-card border border-border p-5 rounded-xl mb-4 shadow-sm space-y-4 max-w-3xl"
        >
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <h3 className="font-bold text-sm font-outfit">
              {editingNoteId ? 'Edit Study Note' : 'Create New Study Note'}
            </h3>
            <button type="button" onClick={cancelEditNote} className="p-1 hover:bg-muted rounded text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Note Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Quant - Percentage Formulas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Content / Details</label>
              <textarea
                required
                placeholder="Write study summaries, outlines, or references..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary h-40 resize-y"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={cancelEditNote}
              className="py-1.5 px-3 border border-border text-xs font-semibold rounded hover:bg-muted text-muted-foreground transition-all"
            >
              Cancel
            </button>
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

      {/* Global Filter Search */}
      <div className="relative max-w-md mb-4">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
        <input
          type="text"
          placeholder={activeTab === 'materials' ? "Search materials by title, subject, topic..." : "Filter notes by title or content..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all"
        />
      </div>

      {/* Dynamic Tabs Content */}
      {activeTab === 'materials' ? (
        // Tab 1: Materials Explorer
        <div className="space-y-4">
          {/* Breadcrumbs Navigation */}
          {searchQuery.trim() === '' && (
            <div className="flex items-center flex-wrap gap-1.5 text-xs font-semibold text-muted-foreground bg-card border border-border/80 rounded-xl px-4 py-2.5 shadow-sm">
              <button 
                onClick={() => setCurrentFolderId(null)}
                className="hover:text-primary transition-colors flex items-center gap-1 text-muted-foreground/80 hover:text-foreground"
              >
                <FolderOpen className="w-3.5 h-3.5 text-primary" />
                <span>Root Workspace</span>
              </button>
              
              {getBreadcrumbs().map((crumb, idx) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                  <button 
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className={`hover:text-primary transition-colors ${
                      idx === getBreadcrumbs().length - 1 ? 'text-foreground font-bold font-outfit' : 'text-muted-foreground/80'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredResources.length === 0 ? (
              <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 text-center py-16 bg-card border border-border border-dashed rounded-2xl text-muted-foreground text-sm">
                <Folder className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                <p className="font-semibold text-foreground">
                  {currentFolderId ? 'This folder is empty.' : 'No resources uploaded yet.'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentFolderId 
                    ? 'Click "Add Material" to upload files, links or folders inside this directory.'
                    : 'Click "Add Material" or upload tricks directly within expanded topics in the Syllabus.'
                  }
                </p>
              </div>
            ) : (
              filteredResources.map((res) => {
                const isYT = res.type === 'link' && !!getYoutubeVideoId(res.url);
                const isImg = res.type === 'file' && isImageFile(res.url);
                const isPDF = res.type === 'file' && res.url?.toLowerCase().endsWith('.pdf');
                
                const ytVideoId = isYT ? getYoutubeVideoId(res.url) : '';
                const ytThumbnail = ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` : '';

                const sub = subjects.find(s => s.key === res.subjectKey);
                const subjectBadge = sub ? sub.name : res.subjectKey;

                return (
                  <div 
                    key={res.id}
                    className="group relative border border-border rounded-xl bg-card p-4 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    <div>
                      {/* Media thumbnail preview */}
                      <div 
                        onClick={() => handleResourceClick(res)}
                        className="aspect-video w-full rounded-lg bg-muted border border-border/60 flex items-center justify-center overflow-hidden cursor-pointer relative group-hover:bg-muted/70 transition-all mb-3"
                      >
                        {isImg ? (
                          <img 
                            src={res.url} 
                            alt={res.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                        ) : isYT && ytThumbnail ? (
                          <img 
                            src={ytThumbnail} 
                            alt={res.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                        ) : isYT ? (
                          <div className="flex flex-col items-center gap-1">
                            <Youtube className="w-8 h-8 text-red-500 fill-red-500 animate-pulse" />
                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">YouTube Video</span>
                          </div>
                        ) : res.type === 'folder' ? (
                          <Folder className="w-10 h-10 text-amber-500 fill-amber-500 transition-transform group-hover:scale-110 duration-200" />
                        ) : isPDF ? (
                          <div className="flex flex-col items-center gap-1">
                            <FileText className="w-8 h-8 text-rose-500 fill-rose-500/10" />
                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">PDF Document</span>
                          </div>
                        ) : (
                          <ExternalLink className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div 
                          onClick={() => handleResourceClick(res)}
                          className="text-sm font-bold text-foreground truncate cursor-pointer hover:text-primary transition-colors leading-tight"
                          title={res.name}
                        >
                          {res.name}
                        </div>

                        {/* Subject / Topic Badge */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                            subjectColors[res.subjectKey] || 'bg-muted border-border text-muted-foreground'
                          }`}>
                            {subjectBadge}
                          </span>
                          <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[120px]" title={res.topic}>
                            {res.topic}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-border/40 text-[10px]">
                      <span className="text-muted-foreground/80 uppercase font-bold tracking-wider font-outfit">
                        {res.type === 'folder' ? 'Folder' : isYT ? 'YouTube' : isPDF ? 'PDF Document' : res.type}
                      </span>
                      <button
                        onClick={() => handleDeleteResource(res)}
                        className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-all flex items-center justify-center gap-0.5"
                        title="Delete resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        // Tab 2: Personal Notes List
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-card border border-border border-dashed rounded-2xl text-muted-foreground text-sm">
              <FileSignature className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
              <p className="font-semibold text-foreground">No study notes created yet.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Click "Write Note" to compose your revision sheets.</p>
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
                          onClick={() => startEditingNote(note)}
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
      )}

      {/* Lightbox / Video Player Modal */}
      {activeMediaUrl && activeMediaType && (
        activeMediaType === 'youtube' ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-card border border-border w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative">
              <button 
                onClick={() => {
                  setActiveMediaUrl(null);
                  setActiveMediaType(null);
                }}
                className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white z-10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="p-4 border-b border-border bg-muted/10">
                <h3 className="font-bold font-outfit text-sm text-foreground truncate pr-10">
                  Media Preview & Active Learning
                </h3>
              </div>

              <div className="bg-black flex items-center justify-center aspect-video w-full">
                <iframe 
                  src={activeMediaUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm select-none">
            {/* Close button */}
            <button 
              onClick={() => {
                setActiveMediaUrl(null);
                setActiveMediaType(null);
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-50 shadow-md"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Floating Zoom Controls */}
            <div className="absolute bottom-6 flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full z-50 shadow-lg text-white">
              <button 
                type="button"
                onClick={() => setScale(prev => Math.max(prev - 0.25, 0.5))} 
                className="p-1 text-base font-bold w-6 h-6 flex items-center justify-center hover:bg-white/15 rounded-full transition-colors"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center select-none">
                {Math.round(scale * 100)}%
              </span>
              <button 
                type="button"
                onClick={() => setScale(prev => Math.min(prev + 0.25, 4))} 
                className="p-1 text-base font-bold w-6 h-6 flex items-center justify-center hover:bg-white/15 rounded-full transition-colors"
                title="Zoom In"
              >
                +
              </button>
              <div className="w-[1px] h-4 bg-white/20 mx-1" />
              <button 
                type="button"
                onClick={() => {
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 hover:bg-white/15 rounded-md transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Image display container */}
            <div 
              className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                if (scale <= 1) return;
                setIsDragging(true);
                setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
              }}
              onMouseMove={(e) => {
                if (!isDragging) return;
                setPosition({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y
                });
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onWheel={(e) => {
                const zoomFactor = 0.1;
                if (e.deltaY < 0) {
                  setScale(prev => Math.min(prev + zoomFactor, 4));
                } else {
                  setScale(prev => Math.max(prev - zoomFactor, 0.5));
                }
              }}
            >
              <img 
                src={activeMediaUrl} 
                alt="Preview" 
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                draggable="false"
                className="shadow-2xl rounded-lg"
              />
            </div>
          </div>
        )
      )}

      <CameraCaptureModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        isUploading={isUploading}
      />
    </div>
  );
}
