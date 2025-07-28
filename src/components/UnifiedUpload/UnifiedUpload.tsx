import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, File as FileIcon, X, CheckCircle, AlertCircle, Clipboard } from 'lucide-react';

interface UnifiedUploadProps {
  onFileUpload: (files: File[]) => void;
  onPasteContent?: (content: string, filename: string) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  showPasteOption?: boolean;
  title?: string;
  description?: string;
  className?: string;
  theme?: 'default' | 'compact' | 'minimal';
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

const UnifiedUpload: React.FC<UnifiedUploadProps> = ({
  onFileUpload,
  onPasteContent,
  acceptedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxFileSize = 10,
  maxFiles = 5,
  showPasteOption = false,
  title = 'Upload Files',
  description = 'Drag and drop files here or click to browse',
  className = '',
  theme = 'default'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteFileName, setPasteFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = useCallback((files: File[]) => {
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        console.warn(`File type ${file.type} not accepted for ${file.name}`);
        continue;
      }

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        console.warn(`File ${file.name} exceeds ${maxFileSize}MB limit`);
        continue;
      }

      // Check max files
      if (uploadedFiles.length + validFiles.length >= maxFiles) {
        console.warn(`Maximum ${maxFiles} files allowed`);
        break;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      // Add files to uploaded files list
      const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
        id: `file_${Date.now()}_${Math.random()}`,
        file,
        status: 'uploading',
        progress: 0
      }));

      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);

      // Simulate upload progress
      newUploadedFiles.forEach(uploadedFile => {
        const interval = setInterval(() => {
          setUploadedFiles(prev => prev.map(f => {
            if (f.id === uploadedFile.id && f.progress !== undefined && f.progress < 100) {
              const newProgress = f.progress + Math.random() * 30;
              if (newProgress >= 100) {
                clearInterval(interval);
                return { ...f, progress: 100, status: 'completed' as const };
              }
              return { ...f, progress: newProgress };
            }
            return f;
          }));
        }, 200);
      });

      // Call the onFileUpload callback
      onFileUpload(validFiles);
    }
  }, [acceptedTypes, maxFileSize, maxFiles, uploadedFiles.length, onFileUpload]);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handlePasteSubmit = () => {
    if (pasteContent.trim() && pasteFileName.trim() && onPasteContent) {
      onPasteContent(pasteContent.trim(), pasteFileName.trim());
      setPasteContent('');
      setPasteFileName('');
      setShowPasteInput(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Upload className="w-4 h-4 animate-pulse text-blue-500" />;
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'compact':
        return {
          container: 'border border-gray-300 rounded-lg p-4',
          dropzone: 'border-dashed border-2 rounded-lg p-6 text-center',
          title: 'text-sm font-medium',
          description: 'text-xs text-gray-500'
        };
      case 'minimal':
        return {
          container: 'border-0',
          dropzone: 'border border-gray-300 rounded p-4 text-center',
          title: 'text-sm font-medium',
          description: 'text-xs text-gray-400'
        };
      default:
        return {
          container: 'bg-white rounded-xl border border-gray-200 shadow-lg p-6',
          dropzone: 'border-2 border-dashed border-gray-300 rounded-xl p-8 text-center',
          title: 'text-lg font-semibold',
          description: 'text-gray-600'
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`${themeClasses.container} ${className}`}>
      {/* Main Upload Area */}
      <motion.div
        className={`${themeClasses.dropzone} transition-all duration-300 ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        
        <h3 className={`${themeClasses.title} text-gray-900 mb-2`}>{title}</h3>
        <p className={`${themeClasses.description} mb-4`}>{description}</p>
        
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Choose Files
          </button>
          
          {showPasteOption && (
            <button
              onClick={() => setShowPasteInput(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
                                  <Clipboard className="w-4 h-4" />
              <span>Paste Content</span>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Max {maxFiles} files, {maxFileSize}MB each
        </p>
      </motion.div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-gray-900">Uploaded Files</h4>
          <AnimatePresence>
            {uploadedFiles.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(uploadedFile.file)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{uploadedFile.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusIcon(uploadedFile.status)}
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Paste Content Modal */}
      <AnimatePresence>
        {showPasteInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowPasteInput(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Paste Content</h3>
              
              <input
                type="text"
                placeholder="Enter filename"
                value={pasteFileName}
                onChange={(e) => setPasteFileName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <textarea
                placeholder="Paste your content here..."
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPasteInput(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteContent.trim() || !pasteFileName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Content
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedUpload; 