import React, { useState, useRef } from 'react';
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
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import CameraCaptureModal from './CameraCaptureModal';

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
  const [activeMediaType, setActiveMediaType] = useState(null); // 'image' | 'youtube'
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

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
      const fullUrl = getResourceUrl(resource.url);
      if (isImageFile(resource.url)) {
        setActiveMediaUrl(fullUrl);
        setActiveMediaType('image');
      } else if (resource.url?.toLowerCase().split('?')[0].endsWith('.pdf')) {
        window.open(`${window.location.origin}/?pdf=${encodeURIComponent(fullUrl)}&name=${encodeURIComponent(resource.name)}`, '_blank');
      } else {
        // PDF or others open in new tab
        window.open(fullUrl, '_blank');
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

          {/* Camera Capture Button */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => setIsCameraOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 animate-fade-in"
          >
            <Camera className="w-3.5 h-3.5 text-primary" />
            <span>Take Photo</span>
          </button>
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
                      src={getResourceUrl(res.url)} 
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

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTopicName = searchParams.get('topic');

  const [activeSubKey, setActiveSubKey] = useState('quant');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState(null);

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
    toast.success(`"${p.topic}" marked as ${nextCompleted ? 'completed' : 'in progress'}.`);
  };

  const handleSaveDailyLog = async () => {
    if (!activeTopicDetail) return;
    try {
      const dailyCheck = activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay);
      const isDone = dailyCheck ? dailyCheck.done : false;
      await toggleTopicDaily(
        activeTopicDetail.subjectKey,
        activeTopicDetail.topic,
        activeDetailDay,
        isDone,
        localNote,
        localQuestions
      );
      toast.success(`Day ${activeDetailDay} log saved successfully!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleDailyDone = async (dayNum, currentDone) => {
    if (!activeTopicDetail) return;
    if (dayNum !== currentDay) {
      toast.warning(`Locked — only today's cell (Day ${currentDay}) can be checked/unchecked.`, {
        icon: <Lock className="w-4 h-4 text-amber-500" />
      });
      return;
    }
    try {
      const dailyCheck = activeTopicDetail.dailyChecks.find(c => c.day === dayNum);
      const currentNote = dailyCheck ? dailyCheck.note : '';
      const currentQ = dailyCheck ? dailyCheck.questions : 0;
      await toggleTopicDaily(
        activeTopicDetail.subjectKey,
        activeTopicDetail.topic,
        dayNum,
        !currentDone,
        currentNote,
        currentQ
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleCardToggleDone = async (p, e) => {
    e.stopPropagation();
    const todayCell = p.dailyChecks.find(c => c.day === currentDay);
    const isTodayChecked = todayCell ? todayCell.done : false;
    const currentNote = todayCell ? todayCell.note : '';
    let targetQuestions = todayCell ? todayCell.questions : 0;

    if (!isTodayChecked) {
      const userInput = window.prompt(`How many questions did you solve today for "${p.topic}"?`, "10");
      if (userInput === null) return; // User cancelled the action
      targetQuestions = parseInt(userInput) || 0;
    }

    try {
      await toggleTopicDaily(
        p.subjectKey,
        p.topic,
        currentDay,
        !isTodayChecked,
        currentNote,
        targetQuestions
      );
      toast.success(
        !isTodayChecked 
          ? `Logged Today's Target with ${targetQuestions} questions!`
          : `Removed Today's target check.`
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Main Render
  return (
    <div className="space-y-6 text-foreground font-outfit">
      
      {/* Subject Tabs (Hidden in Details View) */}
      {!activeTopicDetail && (
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
                  setSearchParams({});
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
      )}

      {/* Main Details View vs Cards List */}
      {activeTopicDetail ? (
        // ==============================================================
        // TOPIC DETAILS PAGE VIEW
        // ==============================================================
        <div className="space-y-6">
          {/* Breadcrumb / Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground font-semibold">
              <button 
                onClick={() => {
                  setSearchParams({});
                  setSelectedHeatmapDay(null);
                }} 
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg border border-border/80 transition-all shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Syllabus</span>
              </button>
              <span className="text-border">/</span>
              <span>{activeSubject?.name || ''}</span>
              <span className="text-border">/</span>
              <span className="text-foreground font-bold font-outfit">{activeTopicDetail.topic}</span>
            </div>
          </div>

          {/* Topic Title & Complete Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
            <div>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Active Topic Workspace</span>
              <h2 className="text-xl font-bold font-outfit text-foreground tracking-tight flex items-center gap-3 mt-0.5">
                {activeTopicDetail.topic}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Maintain your daily streak. Track your progress, update study files, and log questions.
              </p>
            </div>
            
            <button
              onClick={() => handleTopicCompletedToggle(activeTopicDetail)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all shadow-sm shrink-0 ${
                activeTopicDetail.completed 
                  ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10' 
                  : 'bg-background hover:bg-muted border-border text-foreground'
              }`}
            >
              <CheckCircle className={`w-4 h-4 ${activeTopicDetail.completed ? 'fill-current' : ''}`} />
              <span>{activeTopicDetail.completed ? 'Topic Completed ✓' : 'Mark Topic Completed'}</span>
            </button>
          </div>

          {/* Details Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Settings, Notes, Day Log, Resources */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* parameters row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={activeTopicDetail.priority}
                    onChange={(e) => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { priority: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg text-sm px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={activeTopicDetail.difficulty}
                    onChange={(e) => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { difficulty: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg text-sm px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Study Status
                  </label>
                  <select
                    value={activeTopicDetail.status}
                    onChange={(e) => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { 
                      status: e.target.value,
                      completed: e.target.value === 'Completed'
                    })}
                    className="w-full bg-background border border-border rounded-lg text-sm px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Revision">Revision</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    General Qs Solved
                  </label>
                  <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden focus-within:border-primary transition-all">
                    <button
                      onClick={() => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { questions: Math.max(0, (activeTopicDetail.questions || 0) - 5) })}
                      className="px-2 py-1.5 hover:bg-muted text-muted-foreground border-r border-border transition-colors shrink-0"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={activeTopicDetail.questions || 0}
                      onChange={(e) => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { questions: parseInt(e.target.value) || 0 })}
                      className="w-full text-center bg-transparent text-xs text-foreground focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                    />
                    <button
                      onClick={() => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { questions: (activeTopicDetail.questions || 0) + 5 })}
                      className="px-2 py-1.5 hover:bg-muted text-muted-foreground border-l border-border transition-colors shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Day Study Log Detail Input */}
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">
                      Daily Target Log — Day {activeDetailDay} {activeDetailDay === currentDay ? '(Today)' : ''}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-semibold">Done:</span>
                    {activeDetailDay === currentDay ? (
                      <button
                        onClick={() => {
                          const dailyCheck = activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay);
                          const isDone = dailyCheck ? dailyCheck.done : false;
                          handleToggleDailyDone(activeDetailDay, isDone);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
                          (activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay)?.done)
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-secondary border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{(activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay)?.done) ? 'Done' : 'Pending'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        <Lock className="w-3 h-3 text-muted-foreground/60" />
                        <span>{(activeTopicDetail.dailyChecks.find(c => c.day === activeDetailDay)?.done) ? 'Completed (Locked)' : 'Pending (Locked)'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  
                  {/* Daily Questions */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Questions Solved
                    </label>
                    <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden focus-within:border-primary transition-all">
                      <button
                        type="button"
                        onClick={() => setLocalQuestions(q => Math.max(0, q - 5))}
                        className="px-2.5 py-1.5 hover:bg-muted text-muted-foreground border-r border-border transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={localQuestions}
                        onChange={(e) => setLocalQuestions(parseInt(e.target.value) || 0)}
                        className="w-full text-center bg-transparent text-sm text-foreground focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setLocalQuestions(q => q + 5)}
                        className="px-2.5 py-1.5 hover:bg-muted text-muted-foreground border-l border-border transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Daily Note */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-primary" />
                      Study Notes / Formulas / Outline
                    </label>
                    <textarea
                      placeholder="Write formulas, key lessons or summary notes for this day..."
                      value={localNote}
                      onChange={(e) => setLocalNote(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg text-sm px-3 py-1.5 text-foreground focus:outline-none focus:border-primary h-[38px] min-h-[38px] max-h-[120px] resize-y transition-all"
                    />
                  </div>

                </div>

                <div className="flex justify-end pt-1 border-t border-border/60">
                  <button
                    onClick={handleSaveDailyLog}
                    className="px-4 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>Save Day {activeDetailDay} Log</span>
                  </button>
                </div>
              </div>

              {/* General Outline Note */}
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-3">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  General Topic Notes (Master Outline)
                </label>
                <textarea
                  placeholder="Core concepts, video links, textbook references, formulas..."
                  value={activeTopicDetail.notes || ''}
                  onChange={(e) => updateTopicProgress(activeTopicDetail.subjectKey, activeTopicDetail.topic, { notes: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl text-sm px-4 py-3 text-foreground focus:outline-none focus:border-primary h-36 resize-y transition-all"
                />
              </div>

              {/* Study materials */}
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Topic Resources & Study Files</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Upload PDFs, images, or save YouTube tutorial link mappings.</p>
                </div>
                <TopicResourceExplorer
                  progress={activeTopicDetail}
                  addTopicResource={addTopicResource}
                  updateTopicResource={updateTopicResource}
                  deleteTopicResource={deleteTopicResource}
                />
              </div>

            </div>

            {/* Right Column: 60-Day Map */}
            <div className="xl:col-span-1 space-y-6">
              
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Syllabus Progress Map</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Select a day cell to view or update logs.</p>
                </div>

                {/* Heatmap Grid */}
                <div className="grid grid-cols-10 gap-2 border border-border/80 bg-background/50 p-3.5 rounded-lg justify-items-center">
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
                        title={`Day ${dayNum}${isToday ? ' (Today)' : ''} - Click to edit log\nStatus: ${isDone ? 'Completed' : 'Pending'}${hasNote ? '\nNote: ' + cell.note : ''}${dailyQ ? '\nQs: ' + dailyQ : ''}`}
                        className={`w-7 h-7 rounded shrink-0 flex items-center justify-center text-[10px] font-bold transition-all relative ${
                          isDone 
                            ? 'bg-primary border border-primary text-primary-foreground shadow-sm shadow-primary/15 hover:bg-primary/90' 
                            : isToday
                              ? 'border-2 border-primary bg-primary/10 text-primary animate-pulse'
                              : 'bg-muted border border-border/60 text-muted-foreground hover:bg-secondary/80'
                        } ${isSelected ? 'ring-2 ring-foreground/45 ring-offset-2 scale-110 z-10' : ''}`}
                      >
                        {dayNum}
                        {!isToday && !isDone && (
                          <span className="absolute -top-0.5 -right-0.5 text-muted-foreground/30">
                            <Lock className="w-[6px] h-[6px]" />
                          </span>
                        )}
                        {hasNote && (
                          <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-400" />
                        )}
                        {dailyQ > 0 && (
                          <span className="absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full bg-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="pt-2 border-t border-border/60 space-y-2 text-[10px]">
                  <div className="flex items-center justify-between text-muted-foreground font-semibold">
                    <span>GRID LEGEND</span>
                    <span>DAY {currentDay} ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded bg-primary border border-primary" />
                      <span>Logged (Done)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded bg-muted border border-border" />
                      <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded border-2 border-primary bg-primary/10" />
                      <span>Today (Day {currentDay})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded bg-muted border border-border flex items-center justify-center text-[7px] text-muted-foreground/50">🔒</div>
                      <span>Locked Checkbox</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-1.5 text-[9px] text-muted-foreground border-t border-border/40 font-mono">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Has Note</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>Has Qs</span>
                    </div>
                  </div>
                </div>

                {/* Stats Summary Widget */}
                <div className="bg-secondary/35 border border-border/80 p-3 rounded-lg space-y-2 text-xs">
                  <span className="block font-bold text-[9px] uppercase tracking-wider text-muted-foreground">Syllabus Stats</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-card border border-border p-2 rounded-md">
                      <span className="block text-[9px] text-muted-foreground">Days Checked</span>
                      <span className="font-bold text-sm text-primary">
                        {activeTopicDetail.dailyChecks.filter(c => c.done).length} / {user?.targetDays || 60}
                      </span>
                    </div>
                    <div className="bg-card border border-border p-2 rounded-md">
                      <span className="block text-[9px] text-muted-foreground">Total Daily Qs</span>
                      <span className="font-bold text-sm text-foreground">
                        {activeTopicDetail.dailyChecks.reduce((sum, c) => sum + (c.questions || 0), 0)} Qs
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((activeTopicDetail.dailyChecks.filter(c => c.done).length / (user?.targetDays || 60)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        // ==============================================================
        // TOPIC CARDS GRID
        // ==============================================================
        <div className="space-y-6">
          {/* Subject Stats & Filters Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-1">
                <span>SUBJECT PROGRESS ({activeSubject?.name || ''})</span>
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

          {/* Cards Grid */}
          {filteredProgress.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl text-muted-foreground text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
              No topics found matching your filter.
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
                // Distinct card style based on priority (soft borders/backgrounds instead of a thick left border)
                const priorityCardClass = 
                  p.priority === 'High' 
                    ? 'border-red-500/20 hover:border-red-500/50 bg-red-500/[0.02] dark:bg-red-500/[0.01]' 
                    : p.priority === 'Medium' 
                      ? 'border-yellow-500/20 hover:border-yellow-500/50 bg-yellow-500/[0.02] dark:bg-yellow-500/[0.01]' 
                      : 'border-green-500/20 hover:border-green-500/50 bg-green-500/[0.02] dark:bg-green-500/[0.01]';

                return (
                  <div
                    key={p.topic}
                    onClick={() => setSearchParams({ topic: p.topic })}
                    className={`group ${priorityCardClass} border rounded-xl p-4 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-pointer relative min-w-0`}
                  >
                    <div>
                      {/* Top Badges row */}
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          p.priority === 'High' 
                            ? 'bg-red-500/10 text-red-500' 
                            : p.priority === 'Medium'
                              ? 'bg-yellow-500/10 text-yellow-500' 
                              : 'bg-green-500/10 text-green-500'
                        }`}>
                          {p.priority}
                        </span>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          p.difficulty === 'Hard' 
                            ? 'bg-purple-500/10 text-purple-500' 
                            : p.difficulty === 'Medium'
                              ? 'bg-blue-500/10 text-blue-500' 
                              : 'bg-slate-500/10 text-slate-500'
                        }`}>
                          {p.difficulty}
                        </span>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ml-auto ${
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
                      </div>

                      {/* Header Topic Title & Completion Toggle */}
                      <div className="flex items-start gap-2.5 min-w-0 mb-3.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTopicCompletedToggle(p);
                          }}
                          className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                            p.completed 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'border-border hover:border-primary/50 text-transparent'
                          }`}
                        >
                          <span className="text-[10px]">✓</span>
                        </button>
                        
                        <h3 className={`font-bold text-base font-outfit leading-snug transition-colors group-hover:text-primary min-w-0 break-words ${
                          p.completed ? 'text-muted-foreground line-through font-semibold' : 'text-foreground'
                        }`} title={p.topic}>
                          {p.topic}
                        </h3>
                      </div>

                      {/* Micro Progress Bar & Days Logged details */}
                      <div className="space-y-1 mb-4">
                        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                          <span>PROGRESS</span>
                          <span>{doneDaysCount} / {user?.targetDays || 60} Days ({progressPercent}%)</span>
                        </div>
                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Metrics row */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/50 pt-3 gap-2 flex-wrap">
                      <div className="flex items-center gap-1 font-semibold" title="Daily questions solved sum">
                        <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{dailyQuestionsSum} Daily Qs</span>
                      </div>

                      <div className="flex items-center gap-1 font-semibold" title="General questions solved">
                        <Award className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{p.questions || 0} General Qs</span>
                      </div>

                      <div className="flex items-center gap-1 font-semibold">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{materialsCount} materials</span>
                      </div>
                    </div>

                    {/* Today Targets log Shortcut */}
                    <div className="mt-3.5 pt-2.5 border-t border-border/50 flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                        Target D{currentDay}:
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCardToggleDone(p, e)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all ${
                          isTodayChecked 
                            ? 'bg-primary/10 border-primary/20 text-primary shadow-sm' 
                            : 'bg-muted border border-border/80 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{isTodayChecked ? 'Done' : 'Mark Done'}</span>
                      </button>
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
