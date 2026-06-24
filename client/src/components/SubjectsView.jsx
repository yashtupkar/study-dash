import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSearchParams } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Search, 
  AlertCircle, 
  Plus, 
  Minus, 
  MessageSquare, 
  CheckCircle,
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Youtube, 
  ExternalLink, 
  ChevronRight, 
  Upload, 
  FolderPlus, 
  Link2, 
  FolderOpen, 
  Edit2, 
  Move, 
  Trash2, 
  X,
  Loader2,
  ArrowLeft,
  Calendar,
  Award,
  Camera,
  BookOpen,
  Target,
  TrendingUp,
  Flame,
  BarChart2,
  Star,
  Zap,
  CheckSquare,
  Circle
} from 'lucide-react';
import { toast } from 'sonner';
import CameraCaptureModal from './CameraCaptureModal';

// ==========================================
// Reusable Modal Component
// ==========================================
function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-card border border-border rounded-2xl shadow-2xl w-full ${maxWidth} animate-fade-in`}
        style={{ animation: 'fadeIn 0.15s ease-out' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground text-base font-outfit">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Modal Body */}
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Confirm Dialog Component
// ==========================================
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', confirmVariant = 'destructive' }) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{message}</p>
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
            confirmVariant === 'destructive'
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ==========================================
// Input Prompt Dialog Component
// ==========================================
function InputDialog({ isOpen, onClose, onConfirm, title, label, placeholder, defaultValue = '', confirmLabel = 'Save' }) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onConfirm(value.trim());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {label && <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ==========================================
// Sub-Component: Topic Resource Explorer
// ==========================================
function TopicResourceExplorer({ progress, addTopicResource, updateTopicResource, deleteTopicResource }) {
  const { getResourceUrl } = useApp();
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingVal, setRenamingVal] = useState('');
  const [movingId, setMovingId] = useState(null);
  const [activeMediaUrl, setActiveMediaUrl] = useState(null);
  const [activeMediaType, setActiveMediaType] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);

  const handleCameraCapture = async (file) => {
    setIsUploading(true);
    setIsCameraOpen(false);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'file');
    formData.append('name', file.name);
    if (currentFolderId) {
      formData.append('parentId', currentFolderId);
    }
    try {
      await addTopicResource(progress.subjectKey, progress.topic, formData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const resources = progress.resources || [];
  const currentResources = resources.filter(r => r.parentId === currentFolderId);
  const allFolders = resources.filter(r => r.type === 'folder' && r.id !== movingId);

  const getYoutubeVideoId = (url) => {
    if (!url) return '';
    const str = String(url).trim();
    if (str.includes('/shorts/')) {
      const parts = str.split('/shorts/');
      if (parts[1]) return parts[1].split(/[?#&]/)[0];
    }
    if (str.includes('/live/')) {
      const parts = str.split('/live/');
      if (parts[1]) return parts[1].split(/[?#&]/)[0];
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = str.match(regExp);
    if (match && match[2].length === 11) return match[2];
    try {
      const urlObj = new URL(str);
      const v = urlObj.searchParams.get('v');
      if (v && v.length === 11) return v;
    } catch (e) {}
    return '';
  };

  const getYoutubeEmbed = (url) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  const isImageFile = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || url.startsWith('data:image/');
  };

  const getBreadcrumbs = () => {
    const crumbs = [];
    let currentId = currentFolderId;
    while (currentId !== null) {
      const folder = resources.find(r => r.id === currentId);
      if (folder) {
        crumbs.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return crumbs;
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const exists = currentResources.some(r => r.type === 'folder' && r.name.toLowerCase() === newFolderName.trim().toLowerCase());
    if (exists) {
      toast.warning('A folder with this name already exists.');
      return;
    }
    await addTopicResource(progress.subjectKey, progress.topic, {
      name: newFolderName.trim(),
      type: 'folder',
      parentId: currentFolderId || null
    });
    setNewFolderName('');
    setShowAddFolder(false);
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    await addTopicResource(progress.subjectKey, progress.topic, {
      name: newLinkLabel.trim(),
      type: 'link',
      url,
      parentId: currentFolderId || null
    });
    setNewLinkLabel('');
    setNewLinkUrl('');
    setShowAddLink(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'file');
    formData.append('name', file.name);
    if (currentFolderId) {
      formData.append('parentId', currentFolderId);
    }
    try {
      await addTopicResource(progress.subjectKey, progress.topic, formData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRenameSubmit = async (id) => {
    if (!renamingVal.trim()) return;
    await updateTopicResource(progress.subjectKey, progress.topic, id, { name: renamingVal.trim() });
    setRenamingId(null);
    setRenamingVal('');
  };

  const handleMoveSubmit = async (id, targetParentId) => {
    const pId = targetParentId === 'root' ? null : targetParentId;
    if (targetParentId !== 'root') {
      let checkId = pId;
      while (checkId !== null) {
        if (checkId === id) {
          toast.error("Cannot move a folder into itself or its sub-directories.");
          return;
        }
        const parentFolder = resources.find(r => r.id === checkId);
        checkId = parentFolder ? parentFolder.parentId : null;
      }
    }
    await updateTopicResource(progress.subjectKey, progress.topic, id, { parentId: pId });
    setMovingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item? Deleting a folder recursively deletes all its nested items.')) {
      await deleteTopicResource(progress.subjectKey, progress.topic, id);
    }
  };

  const handleResourceClick = (resource) => {
    if (resource.type === 'folder') {
      setCurrentFolderId(resource.id);
    } else if (resource.type === 'link') {
      const ytEmbed = getYoutubeEmbed(resource.url);
      if (ytEmbed) {
        setActiveMediaUrl(ytEmbed);
        setActiveMediaType('youtube');
      } else {
        window.open(resource.url, '_blank');
      }
    } else if (resource.type === 'file') {
      const fullUrl = getResourceUrl(resource.url);
      if (isImageFile(resource.url)) {
        setActiveMediaUrl(fullUrl);
        setActiveMediaType('image');
      } else if (resource.url?.toLowerCase().split('?')[0].endsWith('.pdf')) {
        window.open(`${window.location.origin}/?pdf=${encodeURIComponent(fullUrl)}&name=${encodeURIComponent(resource.name)}`, '_blank');
      } else {
        window.open(fullUrl, '_blank');
      }
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-1 text-xs font-semibold text-muted-foreground">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="hover:text-primary transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-primary/8"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Root</span>
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              <button
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`px-2 py-1 rounded-md transition-colors hover:bg-primary/8 ${
                  idx === breadcrumbs.length - 1 ? 'text-foreground font-bold hover:text-primary' : 'hover:text-primary'
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => { setShowAddFolder(!showAddFolder); setShowAddLink(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showAddFolder
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowAddLink(!showAddLink); setShowAddFolder(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showAddLink
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>

          <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
            isUploading
              ? 'bg-primary/10 border-primary/20 text-primary'
              : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
          }`}>
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
            <input type="file" ref={fileInputRef} disabled={isUploading} onChange={handleFileUpload} className="hidden" accept=".pdf,image/*" />
          </label>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => setIsCameraOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border text-muted-foreground hover:text-foreground rounded-lg text-xs font-semibold transition-all disabled:opacity-50 hover:border-primary/30"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>
        </div>
      </div>

      {/* Inline creation panels */}
      {showAddFolder && (
        <form onSubmit={handleCreateFolder} className="flex gap-2 p-3 bg-background border border-primary/20 rounded-xl animate-fade-in">
          <FolderPlus className="w-4 h-4 text-primary mt-2 shrink-0" />
          <input
            type="text"
            placeholder="Folder name..."
            autoFocus
            required
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60"
          />
          <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold transition-all hover:bg-primary/90">Create</button>
          <button type="button" onClick={() => setShowAddFolder(false)} className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </form>
      )}

      {showAddLink && (
        <form onSubmit={handleCreateLink} className="flex flex-col gap-2 p-3 bg-background border border-primary/20 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Add Link or YouTube URL</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Label (e.g. 'Algebra Tutorial')"
              autoFocus
              required
              value={newLinkLabel}
              onChange={e => setNewLinkLabel(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
            />
            <input
              type="text"
              placeholder="URL..."
              required
              value={newLinkUrl}
              onChange={e => setNewLinkUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-all"
            />
            <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 shrink-0">Add</button>
            <button type="button" onClick={() => setShowAddLink(false)} className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </form>
      )}

      {/* Grid of Files and Folders */}
      {currentResources.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center gap-2">
          <FolderOpen className="w-8 h-8 text-muted-foreground/40" />
          <span className="text-xs font-semibold">This folder is empty</span>
          <span className="text-[11px] text-muted-foreground/60">Upload PDFs, images, or add YouTube links above</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {currentResources.map((res) => {
            const isYT = res.type === 'link' && !!getYoutubeVideoId(res.url);
            const isImg = res.type === 'file' && isImageFile(res.url);
            const isPDF = res.type === 'file' && res.url && res.url.toLowerCase().endsWith('.pdf');
            const ytVideoId = isYT ? getYoutubeVideoId(res.url) : '';
            const ytThumbnail = ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` : '';

            return (
              <div
                key={res.id}
                className="group relative border border-border rounded-xl bg-card flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all overflow-hidden"
              >
                {/* Media Preview */}
                <div
                  onClick={() => handleResourceClick(res)}
                  className="aspect-video w-full bg-muted/50 flex items-center justify-center overflow-hidden cursor-pointer relative"
                >
                  {isImg ? (
                    <img src={getResourceUrl(res.url)} alt={res.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                  ) : isYT && ytThumbnail ? (
                    <div className="relative w-full h-full">
                      <img src={ytThumbnail} alt={res.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-white ml-0.5" style={{borderLeftWidth:'7px', borderLeftColor:'white'}}/>
                        </div>
                      </div>
                    </div>
                  ) : isYT ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Youtube className="w-8 h-8 text-red-500 fill-red-500" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">YouTube</span>
                    </div>
                  ) : res.type === 'folder' ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Folder className="w-8 h-8 text-amber-500 fill-amber-500/20" />
                      <span className="text-[9px] font-bold text-amber-600/80 uppercase tracking-widest">Folder</span>
                    </div>
                  ) : isPDF ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <FileText className="w-8 h-8 text-rose-500" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">PDF</span>
                    </div>
                  ) : res.type === 'file' ? (
                    <FileText className="w-8 h-8 text-blue-500" />
                  ) : (
                    <ExternalLink className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>

                {/* Name and Type */}
                <div className="p-2.5 min-w-0">
                  {renamingId === res.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={renamingVal}
                        onChange={e => setRenamingVal(e.target.value)}
                        className="w-full px-2 py-0.5 border border-primary bg-background rounded text-xs focus:outline-none"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(res.id); if (e.key === 'Escape') setRenamingId(null); }}
                      />
                      <button onClick={() => handleRenameSubmit(res.id)} className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold shrink-0">OK</button>
                      <button onClick={() => setRenamingId(null)} className="text-[9px] text-muted-foreground shrink-0"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleResourceClick(res)}
                      className="text-xs font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                      title={res.name}
                    >
                      {res.name}
                    </div>
                  )}
                  <span className="text-[9px] text-muted-foreground/70 uppercase font-bold tracking-wider">
                    {res.type === 'folder' ? 'Folder' : isYT ? 'YouTube' : isPDF ? 'PDF' : res.type}
                  </span>
                </div>

                {/* Move Dropdown */}
                {movingId === res.id && (
                  <div className="absolute inset-x-0 bottom-0 bg-card border-t border-border p-2 rounded-b-xl z-10 space-y-1">
                    <span className="block text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Move to:</span>
                    <select
                      onChange={(e) => handleMoveSubmit(res.id, e.target.value)}
                      defaultValue=""
                      className="w-full bg-background border border-border rounded text-[10px] p-1 text-foreground focus:outline-none"
                    >
                      <option value="" disabled>Select destination</option>
                      {currentFolderId !== null && <option value="root">Root Workspace</option>}
                      {allFolders
                        .filter(f => f.id !== res.id && f.id !== res.parentId)
                        .map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))
                      }
                    </select>
                    <button onClick={() => setMovingId(null)} className="w-full text-center text-[8px] text-red-500 font-bold hover:underline uppercase pt-0.5">Cancel</button>
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setRenamingId(res.id); setRenamingVal(res.name); }}
                    className="p-1 hover:text-primary text-white bg-black/40 hover:bg-black/60 rounded transition-colors"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {res.type !== 'link' && (
                    <button
                      onClick={() => setMovingId(res.id)}
                      className="p-1 hover:text-primary text-white bg-black/40 hover:bg-black/60 rounded transition-colors"
                      title="Move"
                    >
                      <Move className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="p-1 text-white hover:text-red-300 bg-black/40 hover:bg-red-600/80 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {activeMediaUrl && activeMediaType && (
        activeMediaType === 'youtube' ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-card border border-border w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative">
              <button
                onClick={() => { setActiveMediaUrl(null); setActiveMediaType(null); }}
                className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white z-10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="p-4 border-b border-border">
                <h3 className="font-bold text-sm text-foreground font-outfit">Video Preview</h3>
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
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm select-none">
            <button
              onClick={() => { setActiveMediaUrl(null); setActiveMediaType(null); setScale(1); setPosition({ x: 0, y: 0 }); }}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-50"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-6 flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full z-50 shadow-lg text-white">
              <button type="button" onClick={() => setScale(prev => Math.max(prev - 0.25, 0.5))} className="p-1 font-bold w-6 h-6 flex items-center justify-center hover:bg-white/15 rounded-full transition-colors">-</button>
              <span className="text-xs font-mono font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
              <button type="button" onClick={() => setScale(prev => Math.min(prev + 0.25, 4))} className="p-1 font-bold w-6 h-6 flex items-center justify-center hover:bg-white/15 rounded-full transition-colors">+</button>
              <div className="w-[1px] h-4 bg-white/20 mx-1" />
              <button type="button" onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 hover:bg-white/15 rounded-md transition-colors">Reset</button>
            </div>
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => { if (scale <= 1) return; setIsDragging(true); setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); }}
              onMouseMove={(e) => { if (!isDragging) return; setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onWheel={(e) => {
                const zoomFactor = 0.1;
                if (e.deltaY < 0) setScale(prev => Math.min(prev + zoomFactor, 4));
                else setScale(prev => Math.max(prev - zoomFactor, 0.5));
              }}
            >
              <img
                src={activeMediaUrl}
                alt="Preview"
                style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.15s ease-out', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
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

// ==========================================
// Priority Badge
// ==========================================
function PriorityBadge({ priority }) {
  const styles = {
    High: 'bg-red-500/12 text-red-500 border-red-500/20',
    Medium: 'bg-amber-500/12 text-amber-600 border-amber-500/20',
    Low: 'bg-emerald-500/12 text-emerald-600 border-emerald-500/20',
  };
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
}

// ==========================================
// Difficulty Badge
// ==========================================
function DifficultyBadge({ difficulty }) {
  const styles = {
    Hard: 'bg-purple-500/12 text-purple-500 border-purple-500/20',
    Medium: 'bg-blue-500/12 text-blue-500 border-blue-500/20',
    Easy: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  };
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${styles[difficulty] || styles.Easy}`}>
      {difficulty}
    </span>
  );
}

// ==========================================
// Status Badge
// ==========================================
function StatusBadge({ status }) {
  const styles = {
    Completed: 'bg-emerald-500/12 text-emerald-600 border-emerald-500/20',
    Revision: 'bg-orange-500/12 text-orange-500 border-orange-500/20',
    'In Progress': 'bg-indigo-500/12 text-indigo-500 border-indigo-500/20',
    'Not Started': 'bg-muted text-muted-foreground border-border',
  };
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${styles[status] || styles['Not Started']}`}>
      {status}
    </span>
  );
}

// ==========================================
// Main Component: SubjectsView
// ==========================================
export default function SubjectsView() {
  const { 
    user, 
    currentDay, 
    subjects, 
    topicProgress, 
    toggleTopicDaily, 
    updateTopicProgress,
    addTopicResource,
    updateTopicResource,
    deleteTopicResource,
    addSubject,
    updateSubject,
    deleteSubject,
    addTopic,
    updateTopic,
    deleteTopic
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTopicName = searchParams.get('topic');

  const [activeSubKey, setActiveSubKey] = useState('quant');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState(null);

  // Modal states
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [renameSubjectOpen, setRenameSubjectOpen] = useState(false);
  const [deleteSubjectOpen, setDeleteSubjectOpen] = useState(false);
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [renameTopicOpen, setRenameTopicOpen] = useState(false);
  const [renameTopicTarget, setRenameTopicTarget] = useState('');
  const [deleteTopicOpen, setDeleteTopicOpen] = useState(false);
  const [deleteTopicTarget, setDeleteTopicTarget] = useState('');

  // ---- CRUD handlers using custom modals ----
  const handleCreateSubject = async (name) => {
    try {
      const newSub = await addSubject(name);
      if (newSub) setActiveSubKey(newSub.key);
    } catch (e) { console.error(e); }
  };

  const handleRenameSubject = async (name) => {
    const activeSub = subjects.find(s => s.key === activeSubKey);
    if (!activeSub) return;
    try {
      const updatedSub = await updateSubject(activeSub._id, name);
      if (updatedSub) setActiveSubKey(updatedSub.key);
    } catch (e) { console.error(e); }
  };

  const handleDeleteSubject = async () => {
    const activeSub = subjects.find(s => s.key === activeSubKey);
    if (!activeSub) return;
    try {
      await deleteSubject(activeSub._id);
      const remaining = subjects.filter(s => s.key !== activeSubKey);
      setActiveSubKey(remaining.length > 0 ? remaining[0].key : '');
    } catch (e) { console.error(e); }
  };

  const handleCreateTopic = async (name) => {
    const activeSub = subjects.find(s => s.key === activeSubKey);
    if (!activeSub) return;
    try {
      await addTopic(activeSub._id, name);
    } catch (e) { console.error(e); }
  };

  const handleRenameTopic = async (newName) => {
    const activeSub = subjects.find(s => s.key === activeSubKey);
    if (!activeSub) return;
    try {
      await updateTopic(activeSub._id, renameTopicTarget, newName);
    } catch (e) { console.error(e); }
  };

  const handleDeleteTopic = async () => {
    const activeSub = subjects.find(s => s.key === activeSubKey);
    if (!activeSub) return;
    try {
      await deleteTopic(activeSub._id, deleteTopicTarget);
    } catch (e) { console.error(e); }
  };

  // Input states for selected day log editor
  const [localNote, setLocalNote] = useState('');
  const [localQuestions, setLocalQuestions] = useState(0);
  const [lastLoadedKey, setLastLoadedKey] = useState('');

  // Active Subject details
  const activeSubject = subjects.find(s => s.key === activeSubKey) || subjects[0] || {};
  const activeProgress = topicProgress.filter(p => p.subjectKey === activeSubKey);

  // If a topic is selected, retrieve it from the active progress
  const activeTopicDetail = selectedTopicName ? activeProgress.find(p => p.topic === selectedTopicName) : null;

  // Selected day for detail logging
  const activeDetailDay = selectedHeatmapDay || currentDay;

  // Sync db values to local state when topic or day changes
  const currentKey = activeTopicDetail ? `${activeTopicDetail.topic}-${activeDetailDay}` : '';
  if (activeTopicDetail && currentKey !== lastLoadedKey) {
    const dailyCheck = activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay);
    setLocalNote(dailyCheck ? dailyCheck.note : '');
    setLocalQuestions(dailyCheck ? dailyCheck.questions : 0);
    setLastLoadedKey(currentKey);
  }

  // Filtered topics based on search
  const filteredProgress = activeProgress.filter(p =>
    p.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubjectCompletion = () => {
    const total = activeProgress.length;
    const completed = activeProgress.filter(p => p.completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleTopicCompletedToggle = async (p) => {
    const nextCompleted = !p.completed;
    const nextStatus = nextCompleted ? 'Completed' : 'In Progress';
    await updateTopicProgress(p.subjectKey, p.topic, {
      completed: nextCompleted,
      status: nextStatus
    });
    toast.success(`"${p.topic}" marked as ${nextCompleted ? 'completed ✓' : 'in progress'}.`);
  };

  const handleSaveDailyLog = async () => {
    if (!activeTopicDetail) return;
    if (activeDetailDay > currentDay) {
      toast.error(`Cannot edit logs for future days.`);
      return;
    }
    try {
      const dailyCheck = activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay);
      const isDone = dailyCheck ? dailyCheck.done : false;
      await toggleTopicDaily(activeTopicDetail.subjectKey, activeTopicDetail.topic, activeDetailDay, isDone, localNote, localQuestions);
      toast.success(`Day ${activeDetailDay} log saved!`);
    } catch (e) { console.error(e); }
  };

  const handleToggleDailyDone = async (dayNum, currentDone) => {
    if (!activeTopicDetail) return;
    if (dayNum !== currentDay) {
      toast.warning(`Only today's cell (Day ${currentDay}) can be checked/unchecked.`, {
        icon: <Lock className="w-4 h-4 text-amber-500" />
      });
      return;
    }
    try {
      const dailyCheck = activeTopicDetail.dailyChecks.find(c => c.day === dayNum);
      const currentNote = dailyCheck ? dailyCheck.note : '';
      const currentQ = dailyCheck ? dailyCheck.questions : 0;
      await toggleTopicDaily(activeTopicDetail.subjectKey, activeTopicDetail.topic, dayNum, !currentDone, currentNote, currentQ);
    } catch (e) { console.error(e); }
  };

  const handleCardToggleDone = async (p, e) => {
    e.stopPropagation();
    const todayCell = p.dailyChecks.find(c => c.day === currentDay);
    const isTodayChecked = todayCell ? todayCell.done : false;
    const currentNote = todayCell ? todayCell.note : '';
    let targetQuestions = todayCell ? todayCell.questions : 0;

    if (!isTodayChecked) {
      const userInput = window.prompt(`How many questions did you solve today for "${p.topic}"?`, "10");
      if (userInput === null) return;
      targetQuestions = parseInt(userInput) || 0;
    }

    try {
      await toggleTopicDaily(p.subjectKey, p.topic, currentDay, !isTodayChecked, currentNote, targetQuestions);
      toast.success(
        !isTodayChecked
          ? `Logged ${targetQuestions} questions for Day ${currentDay}!`
          : `Removed today's check.`
      );
    } catch (err) { console.error(err); }
  };

  const completion = getSubjectCompletion();

  // Main Render
  return (
    <div className="space-y-5 text-foreground font-outfit">

      {/* === Custom Modal Dialogs === */}
      <InputDialog
        isOpen={addSubjectOpen}
        onClose={() => setAddSubjectOpen(false)}
        onConfirm={handleCreateSubject}
        title="Add New Subject"
        label="Subject Name"
        placeholder="e.g. Quantitative Aptitude"
        confirmLabel="Create Subject"
      />
      <InputDialog
        isOpen={renameSubjectOpen}
        onClose={() => setRenameSubjectOpen(false)}
        onConfirm={handleRenameSubject}
        title="Rename Subject"
        label="New Name"
        placeholder="New subject name..."
        defaultValue={subjects.find(s => s.key === activeSubKey)?.name || ''}
        confirmLabel="Rename"
      />
      <ConfirmDialog
        isOpen={deleteSubjectOpen}
        onClose={() => setDeleteSubjectOpen(false)}
        onConfirm={handleDeleteSubject}
        title="Delete Subject"
        message={`Are you sure you want to delete "${subjects.find(s => s.key === activeSubKey)?.name}"? This will permanently delete all topics, progress, and task logs.`}
        confirmLabel="Delete Subject"
      />
      <InputDialog
        isOpen={addTopicOpen}
        onClose={() => setAddTopicOpen(false)}
        onConfirm={handleCreateTopic}
        title="Add New Topic"
        label="Topic Name"
        placeholder="e.g. Algebra, Percentages..."
        confirmLabel="Create Topic"
      />
      <InputDialog
        isOpen={renameTopicOpen}
        onClose={() => setRenameTopicOpen(false)}
        onConfirm={handleRenameTopic}
        title="Rename Topic"
        label="New Name"
        placeholder="New topic name..."
        defaultValue={renameTopicTarget}
        confirmLabel="Rename"
      />
      <ConfirmDialog
        isOpen={deleteTopicOpen}
        onClose={() => setDeleteTopicOpen(false)}
        onConfirm={handleDeleteTopic}
        title="Delete Topic"
        message={`Are you sure you want to delete "${deleteTopicTarget}"? This will permanently clear all its progress, resources, and daily logs.`}
        confirmLabel="Delete Topic"
      />

      {/* === Subject Tabs (Hidden in Detail View) === */}
      {!activeTopicDetail && (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
          {/* Top row: label + action buttons */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subjects</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAddSubjectOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 rounded-lg transition-all"
                title="Add New Subject"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Subject</span>
              </button>
              {subjects.length > 0 && (
                <div className="flex items-center gap-1 bg-secondary/60 border border-border rounded-lg p-0.5">
                  <button
                    onClick={() => setRenameSubjectOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-all"
                    title="Rename Active Subject"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Rename</span>
                  </button>
                  <div className="w-px h-4 bg-border" />
                  <button
                    onClick={() => setDeleteSubjectOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                    title="Delete Active Subject"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subject pill tabs */}
          <div className="flex flex-wrap gap-2">
            {subjects.map(sub => {
              const isActive = activeSubKey === sub.key;
              const stats = topicProgress.filter(t => t.subjectKey === sub.key);
              const comp = stats.length > 0 ? Math.round((stats.filter(t => t.completed).length / stats.length) * 100) : 0;
              const doneCount = stats.filter(t => t.completed).length;
              return (
                <button
                  key={sub.key}
                  onClick={() => {
                    setActiveSubKey(sub.key);
                    setSearchQuery('');
                    setSearchParams({});
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]'
                      : 'bg-secondary/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground hover:border-border'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-background/80 text-muted-foreground'
                  }`}>
                    {doneCount}/{stats.length}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/15 text-primary-foreground/80'
                      : 'bg-muted text-muted-foreground/70'
                  }`}>
                    {comp}%
                  </span>
                </button>
              );
            })}
            {subjects.length === 0 && (
              <span className="text-sm text-muted-foreground italic">No subjects yet — click "New Subject" to get started.</span>
            )}
          </div>
        </div>
      )}

      {/* === Main Content === */}
      {activeTopicDetail ? (
        // =====================================================================
        // TOPIC DETAIL VIEW
        // =====================================================================
        <div className="space-y-5">
          {/* Back Navigation */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => { setSearchParams({}); setSelectedHeatmapDay(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg border border-border/80 transition-all font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {activeSubject?.name || 'Syllabus'}</span>
            </button>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-muted-foreground font-semibold">{activeSubject?.name}</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-foreground font-bold">{activeTopicDetail.topic}</span>
          </div>

          {/* Topic Hero Header */}
          <div className="relative bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden">
            {/* Background gradient accent */}
            <div
              className="absolute inset-0 opacity-[0.035] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top left, hsl(var(--primary)) 0%, transparent 60%)' }}
            />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    {activeSubject?.name || 'Subject'}
                  </span>
                  <PriorityBadge priority={activeTopicDetail.priority} />
                  <DifficultyBadge difficulty={activeTopicDetail.difficulty} />
                  <StatusBadge status={activeTopicDetail.status} />
                </div>
                <h1 className="text-2xl font-bold font-outfit text-foreground tracking-tight">{activeTopicDetail.topic}</h1>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                  Track daily progress, manage study resources, and log question counts.
                </p>
              </div>

              <button
                onClick={() => handleTopicCompletedToggle(activeTopicDetail)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all shadow-sm shrink-0 ${
                  activeTopicDetail.completed
                    ? 'bg-primary border-primary text-primary-foreground shadow-primary/20 shadow-md'
                    : 'bg-background hover:bg-muted border-border text-foreground hover:border-primary/40'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${activeTopicDetail.completed ? 'fill-current' : ''}`} />
                <span>{activeTopicDetail.completed ? 'Completed ✓' : 'Mark Complete'}</span>
              </button>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-border/60">
              {[
                {
                  icon: <Flame className="w-4 h-4 text-orange-500" />,
                  label: 'Days Logged',
                  value: `${activeTopicDetail.dailyChecks.filter(c => c.done).length} / ${user?.targetDays || 60}`,
                  sub: `${Math.round((activeTopicDetail.dailyChecks.filter(c => c.done).length / (user?.targetDays || 60)) * 100)}% done`
                },
                {
                  icon: <Target className="w-4 h-4 text-blue-500" />,
                  label: 'Daily Qs',
                  value: activeTopicDetail.dailyChecks.reduce((s, c) => s + (c.questions || 0), 0),
                  sub: 'questions tracked'
                },
                {
                  icon: <Award className="w-4 h-4 text-primary" />,
                  label: 'General Qs',
                  value: activeTopicDetail.questions || 0,
                  sub: 'total solved'
                },
              ].map((stat, i) => (
                <div key={i} className="flex items-start gap-3 bg-background/70 border border-border/60 rounded-xl p-3">
                  <div className="p-1.5 bg-secondary rounded-lg shrink-0">{stat.icon}</div>
                  <div className="min-w-0">
                    <span className="block text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</span>
                    <span className="block text-lg font-bold text-foreground font-outfit leading-tight">{stat.value}</span>
                    <span className="block text-[10px] text-muted-foreground/80">{stat.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* Left 2 Cols */}
            <div className="xl:col-span-2 space-y-5">

              {/* Parameters Panel */}
              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart2 className="w-3.5 h-3.5" />
                  Topic Settings
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Priority</label>
                    <select
                      value={activeTopicDetail.priority}
                      onChange={e => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { priority: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer"
                    >
                      <option value="High">🔴 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Difficulty</label>
                    <select
                      value={activeTopicDetail.difficulty}
                      onChange={e => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { difficulty: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer"
                    >
                      <option value="Easy">😊 Easy</option>
                      <option value="Medium">😐 Medium</option>
                      <option value="Hard">😤 Hard</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                    <select
                      value={activeTopicDetail.status}
                      onChange={e => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, {
                        status: e.target.value,
                        completed: e.target.value === 'Completed'
                      })}
                      className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer"
                    >
                      <option value="Not Started">⬜ Not Started</option>
                      <option value="In Progress">🔵 In Progress</option>
                      <option value="Revision">🔄 Revision</option>
                      <option value="Completed">✅ Completed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">General Qs Solved</label>
                    <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                      <button
                        onClick={() => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { questions: Math.max(0, (activeTopicDetail.questions || 0) - 5) })}
                        className="px-2.5 py-2 hover:bg-muted text-muted-foreground border-r border-border transition-colors shrink-0"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={activeTopicDetail.questions || 0}
                        onChange={e => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { questions: parseInt(e.target.value) || 0 })}
                        className="w-full text-center bg-transparent text-sm text-foreground focus:outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { questions: (activeTopicDetail.questions || 0) + 5 })}
                        className="px-2.5 py-2 hover:bg-muted text-muted-foreground border-l border-border transition-colors shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Log Panel */}
              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Daily Log</h3>
                      <span className="text-[10px] text-muted-foreground">Day {activeDetailDay} {activeDetailDay === currentDay ? '— Today' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">Status:</span>
                    {activeDetailDay === currentDay ? (
                      <button
                        onClick={() => {
                          const dailyCheck = activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay);
                          const isDone = dailyCheck ? dailyCheck.done : false;
                          handleToggleDailyDone(activeDetailDay, isDone);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 transition-all ${
                          (activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay)?.done)
                            ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                            : 'bg-secondary border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${(activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay)?.done) ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                        <span>{(activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay)?.done) ? 'Done ✓' : 'Mark Done'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                        <Lock className="w-3 h-3" />
                        <span>{(activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay)?.done) ? 'Completed' : 'Pending'} (Locked)</span>
                      </div>
                    )}
                  </div>
                </div>

                {activeDetailDay > currentDay && (
                  <div className="bg-amber-500/8 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Future day logs are locked. You can only edit today or past days.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  {/* Questions */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Questions Solved</label>
                    <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                      <button
                        type="button"
                        onClick={() => setLocalQuestions(q => Math.max(0, q - 5))}
                        disabled={activeDetailDay > currentDay}
                        className="px-3 py-2 hover:bg-muted text-muted-foreground border-r border-border transition-colors disabled:opacity-40"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={localQuestions}
                        onChange={e => setLocalQuestions(parseInt(e.target.value) || 0)}
                        disabled={activeDetailDay > currentDay}
                        className="w-full text-center bg-transparent text-sm text-foreground focus:outline-none font-bold disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setLocalQuestions(q => q + 5)}
                        disabled={activeDetailDay > currentDay}
                        className="px-3 py-2 hover:bg-muted text-muted-foreground border-l border-border transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Daily Note */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-primary" />
                      Study Notes / Key Takeaways
                    </label>
                    <textarea
                      placeholder="Write formulas, key lessons or summary for this day..."
                      value={localNote}
                      onChange={e => setLocalNote(e.target.value)}
                      disabled={activeDetailDay > currentDay}
                      className="w-full bg-background border border-border rounded-xl text-sm px-3 py-2.5 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 h-[42px] min-h-[42px] max-h-[120px] resize-y transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1 border-t border-border/60">
                  <button
                    onClick={handleSaveDailyLog}
                    disabled={activeDetailDay > currentDay}
                    className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Save Day {activeDetailDay} Log</span>
                  </button>
                </div>
              </div>

              {/* General Notes */}
              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Master Topic Notes</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Core concepts, formulas, video links, textbook references.</p>
                </div>
                <textarea
                  placeholder="Core concepts, video links, textbook references, formulas..."
                  value={activeTopicDetail.notes || ''}
                  onChange={e => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { notes: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl text-sm px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 h-36 resize-y transition-all"
                />
              </div>

              {/* Resources Panel */}
              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Study Resources</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Upload PDFs, images, or save YouTube links for this topic.</p>
                </div>
                <TopicResourceExplorer
                  progress={activeTopicDetail}
                  addTopicResource={addTopicResource}
                  updateTopicResource={updateTopicResource}
                  deleteTopicResource={deleteTopicResource}
                />
              </div>
            </div>

            {/* Right Column: Heatmap + Stats */}
            <div className="xl:col-span-1 space-y-5">
              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4 sticky top-4">
                <div>
                  <h3 className="font-bold text-sm text-foreground">60-Day Progress Map</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Click a day cell to view or edit its log.</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span>COMPLETION</span>
                    <span>{Math.round((activeTopicDetail.dailyChecks.filter(c => c.done).length / (user?.targetDays || 60)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((activeTopicDetail.dailyChecks.filter(c => c.done).length / (user?.targetDays || 60)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Heatmap Grid */}
                <div className="grid grid-cols-10 gap-1.5 p-3 bg-background/60 border border-border/60 rounded-xl justify-items-center">
                  {Array.from({ length: user?.targetDays || 60 }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const cell = activeTopicDetail.dailyChecks.find(c => c.day === dayNum);
                    const isDone = cell ? cell.done : false;
                    const hasNote = cell ? !!cell.note : false;
                    const dailyQ = cell ? cell.questions : 0;
                    const isToday = dayNum === currentDay;
                    const isSelected = dayNum === activeDetailDay;

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => setSelectedHeatmapDay(dayNum)}
                        title={`Day ${dayNum}${isToday ? ' (Today)' : ''}\nStatus: ${isDone ? '✓ Done' : '○ Pending'}${hasNote ? '\n📝 Note' : ''}${dailyQ ? `\n❓ ${dailyQ} Qs` : ''}`}
                        className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[9px] font-bold transition-all relative ${
                          isDone
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : isToday
                              ? 'border-2 border-primary bg-primary/10 text-primary'
                              : 'bg-secondary/60 border border-border/40 text-muted-foreground/60 hover:bg-secondary'
                        } ${isSelected ? 'ring-2 ring-foreground/50 ring-offset-1 scale-110 z-10' : 'hover:scale-105'}`}
                      >
                        {dayNum}
                        {hasNote && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 border border-card" />}
                        {dailyQ > 0 && <span className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 border border-card" />}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-2 text-[10px] border-t border-border/60 pt-3">
                  <div className="grid grid-cols-2 gap-1.5 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-primary" />
                      <span>Done</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-secondary border border-border" />
                      <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-md border-2 border-primary bg-primary/10" />
                      <span>Today (D{currentDay})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-secondary border-2 border-foreground/40 scale-110" />
                      <span>Selected</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-1 text-[9px] font-mono text-muted-foreground border-t border-border/40">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Has Note</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>Has Qs</span>
                    </div>
                  </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {[
                    { label: 'Days Logged', value: `${activeTopicDetail.dailyChecks.filter(c => c.done).length}/${user?.targetDays || 60}`, color: 'text-primary' },
                    { label: 'Daily Qs', value: `${activeTopicDetail.dailyChecks.reduce((sum, c) => sum + (c.questions || 0), 0)}`, color: 'text-foreground' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-background border border-border/60 p-3 rounded-xl text-center">
                      <span className="block text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</span>
                      <span className={`block text-xl font-bold font-outfit ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // =====================================================================
        // TOPIC CARDS GRID
        // =====================================================================
        <div className="space-y-5">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground mb-1.5">
                <span>SUBJECT PROGRESS — {activeSubject?.name?.toUpperCase() || ''}</span>
                <span className="text-primary">{completion}% DONE</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-semibold">
                <span>{activeProgress.filter(p => p.completed).length} completed</span>
                <span>·</span>
                <span>{activeProgress.filter(p => p.status === 'In Progress').length} in progress</span>
                <span>·</span>
                <span>{activeProgress.filter(p => p.status === 'Not Started').length} not started</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setAddTopicOpen(true)}
                className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-all text-xs flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Topic</span>
              </button>
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredProgress.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-semibold text-sm">No topics found</p>
              <p className="text-xs mt-1 text-muted-foreground/70">
                {searchQuery ? `No topics match "${searchQuery}"` : 'Click "Add Topic" to create your first topic.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProgress.map((p) => {
                const doneDaysCount = p.dailyChecks.filter(c => c.done).length;
                const dailyQuestionsSum = p.dailyChecks.reduce((sum, c) => sum + (c.questions || 0), 0);
                const materialsCount = p.resources?.length || 0;
                const progressPercent = Math.round((doneDaysCount / (user?.targetDays || 60)) * 100);
                const todayCell = p.dailyChecks.find(c => c.day === currentDay);
                const isTodayChecked = todayCell ? todayCell.done : false;

                // Rich priority theming
                const priorityTheme = p.priority === 'High'
                  ? {
                      border: 'border-red-500/40',
                      stripe: 'bg-red-500',
                      headerBg: 'bg-red-500/8 dark:bg-red-500/10',
                      hover: 'hover:border-red-500/60 hover:shadow-red-500/10',
                      progressBar: 'bg-red-500',
                    }
                  : p.priority === 'Medium'
                  ? {
                      border: 'border-amber-500/40',
                      stripe: 'bg-amber-500',
                      headerBg: 'bg-amber-500/8 dark:bg-amber-500/10',
                      hover: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
                      progressBar: 'bg-amber-500',
                    }
                  : {
                      border: 'border-emerald-500/35',
                      stripe: 'bg-emerald-500',
                      headerBg: 'bg-emerald-500/8 dark:bg-emerald-500/10',
                      hover: 'hover:border-emerald-500/55 hover:shadow-emerald-500/10',
                      progressBar: 'bg-emerald-500',
                    };

                const progressColor =
                  progressPercent >= 80 ? 'bg-emerald-500'
                    : progressPercent >= 50 ? 'bg-primary'
                      : progressPercent >= 25 ? 'bg-amber-500'
                        : 'bg-muted-foreground/30';

                return (
                  <div
                    key={p.topic}
                    onClick={() => setSearchParams({ topic: p.topic })}
                    className={`group bg-card border ${priorityTheme.border} ${priorityTheme.hover} rounded-2xl flex flex-col hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden`}
                  >
                    {/* Colored left accent stripe */}
                    <div className={`absolute left-0 inset-y-0 w-1 ${priorityTheme.stripe} rounded-l-2xl`} />

                    {/* Tinted header band */}
                    <div className={`${priorityTheme.headerBg} px-5 pt-4 pb-3 border-b border-border/50`}>
                      {/* Badges row + hover actions */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <PriorityBadge priority={p.priority} />
                          <DifficultyBadge difficulty={p.difficulty} />
                          <StatusBadge status={p.status} />
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setRenameTopicTarget(p.topic);
                              setRenameTopicOpen(true);
                            }}
                            className="p-1.5 hover:bg-background/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="Rename Topic"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setDeleteTopicTarget(p.topic);
                              setDeleteTopicOpen(true);
                            }}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Topic name + completion toggle */}
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); handleTopicCompletedToggle(p); }}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            p.completed
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/30 hover:border-primary/60 bg-background/80'
                          }`}
                          title={p.completed ? 'Mark In Progress' : 'Mark Completed'}
                        >
                          {p.completed && <span className="text-[9px] font-bold">✓</span>}
                        </button>
                        <h3 className={`font-bold text-base font-outfit leading-snug transition-colors group-hover:text-primary min-w-0 break-words ${
                          p.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                        }`}>
                          {p.topic}
                        </h3>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="px-5 py-4 flex flex-col gap-3 pl-6">
                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                          <span>DAILY PROGRESS</span>
                          <span>{doneDaysCount}/{user?.targetDays || 60} · {progressPercent}%</span>
                        </div>
                        <div className="w-full bg-secondary/80 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`${progressColor} h-full rounded-full transition-all duration-300`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Footer */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/50 pt-2.5 gap-2 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 font-semibold" title="Daily questions solved">
                            <Zap className="w-3 h-3 text-primary" />
                            <span>{dailyQuestionsSum} Daily Qs</span>
                          </div>
                          <div className="flex items-center gap-1 font-semibold" title="General questions solved">
                            <Star className="w-3 h-3 text-amber-500" />
                            <span>{p.questions || 0} Gen Qs</span>
                          </div>
                          {materialsCount > 0 && (
                            <div className="flex items-center gap-1 font-semibold">
                              <FileText className="w-3 h-3 text-muted-foreground" />
                              <span>{materialsCount} files</span>
                            </div>
                          )}
                        </div>

                        {/* Today toggle */}
                        <button
                          type="button"
                          onClick={e => handleCardToggleDone(p, e)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 transition-all shrink-0 ${
                            isTodayChecked
                              ? 'bg-primary/10 border-primary/25 text-primary'
                              : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isTodayChecked ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                          <span>{isTodayChecked ? `D${currentDay} Done ✓` : `Log D${currentDay}`}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
