// Phase 3: Rich Media & Advanced Collaboration - File Sharing Component
// Collaborative file sharing with real-time updates and multimedia support

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Download, Share2, Trash2, Eye, EyeOff, Search, Filter,
  FileText, Image, Video, Music, Paperclip, Users, Clock, X,
  Grid, List, SortAsc, SortDesc, FolderPlus, Tag, Star, StarOff
} from 'lucide-react';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { multimediaUploadService, MultimediaFile, multimediaUploadConfigs } from '../../services/multimediaUploadService';
import { Button } from '../../components';

interface SharedFile extends MultimediaFile {
  id: string;
  uploadedBy: string;
  uploadedAt: Date;
  sharedWith: string[];
  isStarred?: boolean;
  tags?: string[];
  description?: string;
  downloadCount?: number;
  lastAccessed?: Date;
}

interface FileSharingProps {
  sessionId: string;
  onFileSelect?: (file: SharedFile) => void;
  onClose?: () => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type';
type FilterBy = 'all' | 'image' | 'video' | 'audio' | 'document';

export const FileSharing: React.FC<FileSharingProps> = ({
  sessionId,
  onFileSelect,
  onClose
}) => {
  // State management
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<SharedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Collaboration store
  const { currentSession, participants, currentUser } = useCollaborationStore();

  // Load shared files on mount
  useEffect(() => {
    loadSharedFiles();
  }, [sessionId]);

  // Filter and sort files when dependencies change
  useEffect(() => {
    let filtered = [...files];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(file => file.mediaType === filterBy);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.file.name.localeCompare(b.file.name);
          break;
        case 'date':
          comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.mediaType.localeCompare(b.mediaType);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredFiles(filtered);
  }, [files, searchQuery, filterBy, sortBy, sortOrder]);

  // Load shared files from backend
  const loadSharedFiles = useCallback(async () => {
    try {
      // TODO: Implement API call to load shared files for session
      // For now, using mock data
      const mockFiles: SharedFile[] = [
        {
          id: '1',
          file: new File([''], 'presentation.pdf', { type: 'application/pdf' }),
          status: 'success',
          mediaType: 'document',
          size: 2048576,
          mimeType: 'application/pdf',
          url: 'https://example.com/files/presentation.pdf',
          uploadedBy: 'user1',
          uploadedAt: new Date(Date.now() - 3600000),
          sharedWith: ['user2', 'user3'],
          isStarred: true,
          tags: ['presentation', 'important'],
          description: 'Project presentation slides',
          downloadCount: 5
        }
      ];
      setFiles(mockFiles);
    } catch (error) {
      console.error('Failed to load shared files:', error);
    }
  }, [sessionId]);

  // Handle file upload
  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
    if (!currentUser || !sessionId) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const result = await multimediaUploadService.processMultimediaFiles(
        uploadedFiles,
        sessionId,
        (progress) => setUploadProgress(progress * 100)
      );
      
      // Convert to shared files
      const newSharedFiles: SharedFile[] = result.files
        .filter(file => file.status === 'success')
        .map(file => ({
          ...file,
          id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
          uploadedBy: currentUser.id,
          uploadedAt: new Date(),
          sharedWith: participants.map(p => p.user_id),
          downloadCount: 0
        }));
      
      setFiles(prev => [...newSharedFiles, ...prev]);
      setShowUploadArea(false);
      
      // TODO: Broadcast file sharing event to other participants
      
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [currentUser, sessionId, participants]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles);
    }
  }, [handleFileUpload]);

  // Toggle file selection
  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }, []);

  // Toggle file star
  const toggleFileStar = useCallback((fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, isStarred: !file.isStarred }
        : file
    ));
  }, []);

  // Delete selected files
  const deleteSelectedFiles = useCallback(async () => {
    if (selectedFiles.size === 0) return;
    
    try {
      // TODO: Implement API call to delete files
      setFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
      setSelectedFiles(new Set());
    } catch (error) {
      console.error('Failed to delete files:', error);
    }
  }, [selectedFiles]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      default: return <Paperclip className="w-5 h-5" />;
    }
  };

  // Render file card (grid view)
  const renderFileCard = (file: SharedFile) => (
    <motion.div
      key={file.id}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`relative bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer group ${
        selectedFiles.has(file.id) 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => toggleFileSelection(file.id)}
    >
      {/* Thumbnail/Preview */}
      <div className="aspect-square bg-gray-50 rounded-t-lg flex items-center justify-center overflow-hidden">
        {file.thumbnailUrl ? (
          <img 
            src={file.thumbnailUrl} 
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400">
            {getFileIcon(file.mediaType)}
          </div>
        )}
      </div>
      
      {/* File info */}
      <div className="p-3">
        <h4 className="font-medium text-sm text-gray-900 truncate mb-1">
          {file.file.name}
        </h4>
        <p className="text-xs text-gray-500 mb-2">
          {formatFileSize(file.size)} • {file.mediaType}
        </p>
        
        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {file.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {file.tags.length > 2 && (
              <span className="text-xs text-gray-400">+{file.tags.length - 2}</span>
            )}
          </div>
        )}
        
        {/* Upload info */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>by {file.uploadedBy}</span>
          <span>{file.uploadedAt.toLocaleDateString()}</span>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFileStar(file.id);
            }}
            className={`p-1 rounded-full transition-colors ${
              file.isStarred 
                ? 'bg-yellow-100 text-yellow-600' 
                : 'bg-white bg-opacity-80 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {file.isStarred ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
          </button>
          {file.url && (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 bg-white bg-opacity-80 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      
      {/* Selection indicator */}
      {selectedFiles.has(file.id) && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
          <span className="text-xs">✓</span>
        </div>
      )}
    </motion.div>
  );

  // Render file row (list view)
  const renderFileRow = (file: SharedFile) => (
    <motion.tr
      key={file.id}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`cursor-pointer transition-colors ${
        selectedFiles.has(file.id) 
          ? 'bg-blue-50' 
          : 'hover:bg-gray-50'
      }`}
      onClick={() => toggleFileSelection(file.id)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedFiles.has(file.id)}
            onChange={() => toggleFileSelection(file.id)}
            className="rounded border-gray-300"
          />
          <div className="flex items-center gap-2">
            {getFileIcon(file.mediaType)}
            <span className="font-medium text-sm">{file.file.name}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {file.mediaType}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatFileSize(file.size)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {file.uploadedBy}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {file.uploadedAt.toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFileStar(file.id);
            }}
            className={`p-1 rounded transition-colors ${
              file.isStarred 
                ? 'text-yellow-500' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {file.isStarred ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
          </button>
          {file.url && (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </td>
    </motion.tr>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Shared Files</h2>
            <span className="text-sm text-gray-500">({filteredFiles.length} files)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowUploadArea(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          {/* Search and filters */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterBy)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
            </select>
          </div>
          
          {/* View controls */}
          <div className="flex items-center gap-2">
            {selectedFiles.size > 0 && (
              <Button
                onClick={deleteSelectedFiles}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedFiles.size})
              </Button>
            )}
            
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy as SortBy);
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>
          </div>
        </div>
        
        {/* File content */}
        <div className="flex-1 overflow-auto p-4">
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Paperclip className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">No files shared yet</h3>
              <p className="text-center mb-4">
                Upload files to share them with your collaborators
              </p>
              <Button
                onClick={() => setShowUploadArea(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload First File
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <AnimatePresence>
                {filteredFiles.map(renderFileCard)}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredFiles.map(renderFileRow)}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Upload area modal */}
        <AnimatePresence>
          {showUploadArea && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Upload Files</h3>
                  <button
                    onClick={() => setShowUploadArea(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div
                  ref={dropZoneRef}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports images, videos, audio, and documents
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={multimediaUploadConfigs.collaboration.acceptedTypes.join(',')}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        handleFileUpload(files);
                      }
                    }}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isUploading ? 'Uploading...' : 'Choose Files'}
                  </Button>
                  
                  {isUploading && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {Math.round(uploadProgress)}% uploaded
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default FileSharing;