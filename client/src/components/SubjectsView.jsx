import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
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
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// Sub-Component: Topic Resource Explorer
// ==========================================
function TopicResourceExplorer({ progress, addTopicResource, updateTopicResource, deleteTopicResource }) {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingVal, setRenamingVal] = useState('');
  const [movingId, setMovingId] = useState(null);
  const [activeMediaUrl, setActiveMediaUrl] = useState(null);
  const [activeMediaType, setActiveMediaType] = useState(null); // 'image' | 'youtube'
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);

  const resources = progress.resources || [];
  
  // Filter resources for current directory
  const currentResources = resources.filter(r => r.parentId === currentFolderId);
  
  // Find all folders for the "Move to..." dropdown (excluding the folder being moved)
  const allFolders = resources.filter(r => r.type === 'folder' && r.id !== movingId);

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
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || url.startsWith('data:image/');
  };

  // Helper to build breadcrumb path
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
    
    // Check if name duplicate in same folder
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
    
    // Cycle check: make sure we are not moving a folder into its own descendants
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
      if (isImageFile(resource.url)) {
        setActiveMediaUrl(resource.url);
        setActiveMediaType('image');
      } else if (resource.url?.toLowerCase().split('?')[0].endsWith('.pdf')) {
        window.open(`${window.location.origin}/?pdf=${encodeURIComponent(resource.url)}&name=${encodeURIComponent(resource.name)}`, '_blank');
      } else {
        // PDF or others open in new tab
        window.open(resource.url, '_blank');
      }
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="border border-border/80 bg-background/50 rounded-xl p-4 space-y-4">
      
      {/* File Explorer Header with Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center flex-wrap gap-1 text-xs font-semibold text-muted-foreground">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Root Workspace</span>
          </button>
          
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
              <button 
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`hover:text-primary transition-colors ${
                  idx === breadcrumbs.length - 1 ? 'text-foreground font-bold' : ''
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Upload and creation actions */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* File Upload Input */}
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm">
            {isUploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            <span>{isUploading ? 'Uploading...' : 'Upload File (PDF/Img)'}</span>
            <input 
              type="file" 
              ref={fileInputRef}
              disabled={isUploading}
              onChange={handleFileUpload}
              className="hidden" 
              accept=".pdf,image/*"
            />
          </label>
        </div>
      </div>

      {/* Creation Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Create Folder Form */}
        <form onSubmit={handleCreateFolder} className="flex gap-2">
          <input 
            type="text" 
            placeholder="New folder name..."
            required
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button 
            type="submit"
            className="px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-all border border-border/80"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Folder</span>
          </button>
        </form>

        {/* Add Link Form */}
        <form onSubmit={handleCreateLink} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Link Title (e.g. YouTube tutorial)..."
            required
            value={newLinkLabel}
            onChange={e => setNewLinkLabel(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <input 
            type="text" 
            placeholder="URL..."
            required
            value={newLinkUrl}
            onChange={e => setNewLinkUrl(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button 
            type="submit"
            className="px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-all border border-border/80"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Link</span>
          </button>
        </form>

      </div>

      {/* Grid of Files and Folders */}
      {currentResources.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-xs border border-dashed border-border/80 rounded-lg">
          Folder is empty. Upload PDFs/images or create sub-folders and YouTube links.
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
                className="group relative border border-border rounded-xl bg-card p-3 flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all"
              >
                {/* Media Preview Box or Icon */}
                <div 
                  onClick={() => handleResourceClick(res)}
                  className="aspect-video w-full rounded-lg bg-muted/50 border border-border/60 flex items-center justify-center overflow-hidden cursor-pointer relative group-hover:bg-muted/70 transition-all mb-2"
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
                    <Folder className="w-8 h-8 text-amber-500 fill-amber-500" />
                  ) : isPDF ? (
                    <div className="flex flex-col items-center gap-1">
                      <FileText className="w-8 h-8 text-rose-500 fill-rose-500/10" />
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">PDF Document</span>
                    </div>
                  ) : res.type === 'file' ? (
                    <FileText className="w-8 h-8 text-blue-500" />
                  ) : (
                    <ExternalLink className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>

                {/* Details Section */}
                <div className="min-w-0">
                  {renamingId === res.id ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input 
                        type="text"
                        value={renamingVal}
                        onChange={e => setRenamingVal(e.target.value)}
                        className="w-full px-2 py-0.5 border border-primary bg-background rounded text-xs focus:outline-none"
                      />
                      <button 
                        onClick={() => handleRenameSubmit(res.id)}
                        className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold"
                      >
                        OK
                      </button>
                      <button 
                        onClick={() => setRenamingId(null)}
                        className="text-[9px] bg-secondary border border-border px-1.5 py-0.5 rounded text-muted-foreground font-semibold"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => handleResourceClick(res)}
                      className="text-xs font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors pr-6 mt-1"
                      title={res.name}
                    >
                      {res.name}
                    </div>
                  )}

                  {/* Resource type detail label */}
                  <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider leading-none">
                    {res.type === 'folder' ? 'Folder' : isYT ? 'YouTube' : isPDF ? 'PDF Document' : res.type}
                  </span>
                </div>

                {/* Move Dropdown Panel */}
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
                    <button 
                      onClick={() => setMovingId(null)}
                      className="w-full text-center text-[8px] text-red-500 font-bold hover:underline uppercase pt-0.5"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Float Actions overlay */}
                <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 py-0.5 px-1 rounded border border-border shadow-sm">
                  <button 
                    onClick={() => {
                      setRenamingId(res.id);
                      setRenamingVal(res.name);
                    }}
                    className="p-1 hover:text-primary text-muted-foreground rounded transition-colors"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  
                  {res.type !== 'link' && (
                    <button 
                      onClick={() => setMovingId(res.id)}
                      className="p-1 hover:text-primary text-muted-foreground rounded transition-colors"
                      title="Move Folder"
                    >
                      <Move className="w-3 h-3" />
                    </button>
                  )}

                  <button 
                    onClick={() => handleDelete(res.id)}
                    className="p-1 hover:text-destructive text-muted-foreground rounded transition-colors"
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

    </div>
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
    deleteTopicResource
  } = useApp();

  const [activeSubKey, setActiveSubKey] = useState('quant');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopic, setExpandedTopic] = useState(null);

  // Active Subject details
  const activeSubject = subjects.find(s => s.key === activeSubKey);
  const activeProgress = topicProgress.filter(p => p.subjectKey === activeSubKey);

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
    toast.success(`"${p.topic}" marked as ${nextCompleted ? 'completed' : 'in progress'}.`);
  };

  const handleCellClick = async (p, dayNum, currentChecked) => {
    if (dayNum !== currentDay) {
      toast.warning(`Locked — only today's cell (Day ${currentDay}) is editable.`, {
        icon: <Lock className="w-4 h-4 text-amber-500" />
      });
      return;
    }
    try {
      await toggleTopicDaily(p.subjectKey, p.topic, dayNum, !currentChecked);
    } catch (e) {
      // Toast shown by context
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      
      {/* Subject Tabs */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-none gap-2">
        {subjects.map(sub => {
          const isActive = activeSubKey === sub.key;
          const stats = topicProgress.filter(t => t.subjectKey === sub.key);
          const comp = stats.length > 0 ? Math.round((stats.filter(t => t.completed).length / stats.length) * 100) : 0;
          return (
            <button
              key={sub.key}
              onClick={() => {
                setActiveSubKey(sub.key);
                setSearchQuery('');
                setExpandedTopic(null);
              }}
              className={`px-4 py-2.5 font-semibold text-sm border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{sub.name}</span>
              <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">
                {comp}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Subject Stats & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex-1">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-1">
            <span>SUBJECT PROGRESS</span>
            <span>{getSubjectCompletion()}% Completed</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${getSubjectCompletion()}%` }}
            ></div>
          </div>
        </div>

        <div className="relative w-full md:w-64">
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

      {/* Topics Accordion List */}
      <div className="space-y-2.5">
        {filteredProgress.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl text-muted-foreground text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
            No topics found matching your filter.
          </div>
        ) : (
          filteredProgress.map((p) => {
            const isExpanded = expandedTopic === p.topic;
            
            // Find today's daily cell status
            const todayCell = p.dailyChecks.find(c => c.day === currentDay);
            const isTodayChecked = todayCell ? todayCell.done : false;
            const todayNote = todayCell ? todayCell.note : '';

            return (
              <div 
                key={p.topic}
                className={`bg-card border rounded-xl transition-all ${
                  isExpanded ? 'border-primary/50 shadow-sm' : 'border-border hover:border-border/80'
                }`}
              >
                {/* Topic Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                  
                  {/* Topic Checkbox & Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleTopicCompletedToggle(p)}
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                        p.completed 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-border hover:border-primary/50 text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                    <span className={`font-semibold text-sm truncate ${p.completed ? 'text-muted-foreground line-through font-normal' : 'text-foreground'}`}>
                      {p.topic}
                    </span>
                  </div>

                  {/* Badges / Dropdowns (Read Only when collapsed) */}
                  <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      p.priority === 'High' 
                        ? 'bg-red-500/10 text-red-500' 
                        : p.priority === 'Medium'
                          ? 'bg-yellow-500/10 text-yellow-500' 
                          : 'bg-green-500/10 text-green-500'
                    }`}>
                      {p.priority} Priority
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      p.difficulty === 'Hard' 
                        ? 'bg-purple-500/10 text-purple-500' 
                        : p.difficulty === 'Medium'
                          ? 'bg-blue-500/10 text-blue-500' 
                          : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {p.difficulty}
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      p.status === 'Completed' 
                        ? 'bg-green-500/10 text-green-500' 
                        : p.status === 'Revision'
                          ? 'bg-orange-500/10 text-orange-500'
                          : p.status === 'In Progress'
                            ? 'bg-indigo-500/10 text-indigo-500'
                            : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {p.status}
                    </span>

                    <span className="text-xs bg-secondary border border-border/80 px-2 py-0.5 rounded text-muted-foreground">
                      Q: {p.questions || 0}
                    </span>

                    {/* Today Cell Checkbox shortcut directly on collapsed row */}
                    <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
                      <span className="text-[10px] text-muted-foreground">Today (D{currentDay}):</span>
                      <button
                        onClick={() => handleCellClick(p, currentDay, isTodayChecked)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                          isTodayChecked 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'border-primary/40 hover:border-primary text-transparent'
                        }`}
                      >
                        <span className="text-[8px] leading-none">✓</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setExpandedTopic(isExpanded ? null : p.topic)}
                      className="p-1 hover:bg-secondary rounded text-muted-foreground ml-1"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 p-4 space-y-4">
                    
                    {/* Settings Dropdowns row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Priority
                        </label>
                        <select
                          value={p.priority}
                          onChange={(e) => updateTopicProgress(p.subjectKey, p.topic, { priority: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg text-sm px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Difficulty
                        </label>
                        <select
                          value={p.difficulty}
                          onChange={(e) => updateTopicProgress(p.subjectKey, p.topic, { difficulty: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg text-sm px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Study Status
                        </label>
                        <select
                          value={p.status}
                          onChange={(e) => updateTopicProgress(p.subjectKey, p.topic, { 
                            status: e.target.value,
                            completed: e.target.value === 'Completed'
                          })}
                          className="w-full bg-background border border-border rounded-lg text-sm px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Revision">Revision</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Questions Solved
                        </label>
                        <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
                          <button
                            onClick={() => updateTopicProgress(p.subjectKey, p.topic, { questions: Math.max(0, (p.questions || 0) - 5) })}
                            className="px-2 py-1.5 hover:bg-muted text-muted-foreground border-r border-border"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={p.questions || 0}
                            onChange={(e) => updateTopicProgress(p.subjectKey, p.topic, { questions: parseInt(e.target.value) || 0 })}
                            className="w-full text-center bg-transparent text-sm text-foreground focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => updateTopicProgress(p.subjectKey, p.topic, { questions: (p.questions || 0) + 5 })}
                            className="px-2 py-1.5 hover:bg-muted text-muted-foreground border-l border-border"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Daily Check Cell Strip */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Daily Study Logs Check (Day 1 to {user?.targetDays})
                        </span>
                        <span className="text-[10px] text-primary flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Active Day: Day {currentDay}
                        </span>
                      </div>
                      
                      {/* Horizontal Strip */}
                      <div className="flex items-center gap-1 overflow-x-auto py-2 px-1 border border-border/80 bg-background rounded-lg scrollbar-thin">
                        {Array.from({ length: user?.targetDays || 60 }).map((_, idx) => {
                          const dayNum = idx + 1;
                          const cell = p.dailyChecks.find(c => c.day === dayNum);
                          const isDone = cell ? cell.done : false;
                          const isToday = dayNum === currentDay;

                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => handleCellClick(p, dayNum, isDone)}
                              title={isToday ? `Day ${dayNum} (Today) - Click to toggle` : `Day ${dayNum} - Locked`}
                              className={`w-6 h-6 rounded shrink-0 flex items-center justify-center text-[9px] font-bold transition-all relative ${
                                isDone 
                                  ? 'bg-primary border border-primary text-primary-foreground' 
                                  : isToday
                                    ? 'border-2 border-primary bg-primary/10 text-primary animate-pulse'
                                    : 'bg-muted border border-border/60 text-muted-foreground/80 hover:bg-secondary'
                              }`}
                            >
                              {dayNum}
                              {!isToday && !isDone && (
                                <span className="absolute -top-0.5 -right-0.5 text-muted-foreground/30">
                                  <Lock className="w-[6px] h-[6px]" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes textareas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Today's Note */}
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-primary" />
                          Note for Today (Day {currentDay})
                        </label>
                        <textarea
                          placeholder="Log formulas, quick notes, or reminders for today's study..."
                          value={todayNote}
                          onChange={async (e) => {
                            const noteText = e.target.value;
                            await toggleTopicDaily(p.subjectKey, p.topic, currentDay, isTodayChecked, noteText);
                          }}
                          className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary h-20 resize-none"
                        />
                      </div>

                      {/* General Topic Notes */}
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          General Topic Notes (Master Outline)
                        </label>
                        <textarea
                          placeholder="Core concepts, video links, textbook references, formulas..."
                          value={p.notes || ''}
                          onChange={(e) => updateTopicProgress(p.subjectKey, p.topic, { notes: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:border-primary h-20 resize-none"
                        />
                      </div>

                    </div>

                    {/* File Explorer Resource Manager section */}
                    <div className="space-y-1.5 border-t border-border pt-4">
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Topic Resources & Study Files
                      </label>
                      <TopicResourceExplorer
                        progress={p}
                        addTopicResource={addTopicResource}
                        updateTopicResource={updateTopicResource}
                        deleteTopicResource={deleteTopicResource}
                      />
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
