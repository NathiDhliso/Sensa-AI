import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSmartNavigation } from '../../hooks/useAuth';
import { ArrowLeft, Upload, FileText, Image, File as FileIcon, X, CheckCircle, AlertCircle, Brain, Sparkles, BookOpen, Target, Zap, Eye, Copy, Check, Cast as Paste } from 'lucide-react';
import { usePageTheme } from '../../contexts/themeUtils';
import { useUIStore } from '../../stores';
import styles from './StudyMaterialUpload.module.css';
import { orchestrateAgents } from '../../services/edgeFunctions';
import { FileExtractor } from '../../utils/fileExtraction';

interface UploadedFile {
  id: string;
  file: File;
  type: 'study_guide' | 'past_paper' | 'syllabus' | 'notes';
  status: 'uploading' | 'processing' | 'completed' | 'error';
  extractedContent?: string;
  generatedStudyGuide?: string;
  error?: string;
}

const StudyMaterialUpload: React.FC = () => {
  const navigate = useNavigate();
  const { goBack } = useSmartNavigation();
  const { addNotification } = useUIStore();
  const pageTheme = usePageTheme('course');

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedType, setSelectedType] = useState<'study_guide' | 'past_paper' | 'syllabus' | 'notes'>('study_guide');
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteFileName, setPasteFileName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const processFile = useCallback(async (uploadedFile: UploadedFile) => {
    try {
      // Update status to processing
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id ? { ...f, status: 'processing' } : f
      ));

      // Extract content from file using centralized utility
      const result = await FileExtractor.extractContent(uploadedFile.file);
      const extractedContent = result.content;
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to extract content');
      }
      
      // If it's a past paper, generate study guide
      let generatedStudyGuide: string | undefined;
      if (uploadedFile.type === 'past_paper') {
        generatedStudyGuide = await generateStudyGuideFromPastPaper(extractedContent, uploadedFile.file.name) as string;
      }

      // Update file with extracted content
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'completed', 
              extractedContent,
              generatedStudyGuide 
            } 
          : f
      ));

      addNotification({
        type: 'success',
        title: 'File Processed Successfully',
        message: `${uploadedFile.file.name} has been processed and is ready for study map generation.`,
        duration: 4000
      });

    } catch (error) {
      console.error('File processing error:', error);
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Processing failed' 
            } 
          : f
      ));

      addNotification({
        type: 'error',
        title: 'Processing Failed',
        message: `Failed to process ${uploadedFile.file.name}. Please try again.`,
        duration: 5000
      });
    }
  }, [addNotification, setUploadedFiles]);

  const handleFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      // Validate file type
      const validTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

      if (!validTypes.includes(file.type)) {
        addNotification({
          type: 'error',
          title: 'Invalid File Type',
          message: `${file.name} is not a supported file type. Please upload PDF, DOC, TXT, or image files.`,
          duration: 5000
        });
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        addNotification({
          type: 'error',
          title: 'File Too Large',
          message: `${file.name} is too large. Please upload files smaller than 10MB.`,
          duration: 5000
        });
        continue;
      }

      const uploadedFile: UploadedFile = {
        id: `file_${Date.now()}_${Math.random()}`,
        file,
        type: selectedType,
        status: 'uploading'
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);

      // Process the file
      await processFile(uploadedFile);
    }
  }, [addNotification, setUploadedFiles, selectedType, processFile]);

  // File extraction now handled by centralized utility

  const generateStudyGuideFromPastPaper = async (pastPaperContent: string, fileName: string): Promise<string> => {
    const subject = fileName.split('.')[0].replace(/[_-]/g, ' ');

    try {
      const adkResponse = await orchestrateAgents({
        agent_type: 'orchestrator',
        task: 'document_content_analysis',
        payload: {
          document: {
            name: fileName,
            content: pastPaperContent,
            content_type: 'exam_past_paper',
            actual_subject: subject
          }
        },
        analysis_requirements: ['study_guide']
      } as Record<string, unknown>);

      if (adkResponse?.analysis?.study_guide) {
        return adkResponse.analysis.study_guide as string;
      }

      // Build guide from study_recommendations if provided
      if (Array.isArray(adkResponse?.analysis?.study_recommendations)) {
        const recs = adkResponse.analysis.study_recommendations as Array<Record<string, unknown>>;

        const sectionsMarkdown = recs.map((rec: Record<string, unknown>) => {
          const title = rec.title || rec.section || 'Section';
          const priority = rec.priority || 'medium';
          const time = rec.estimatedTime || rec.time || '1 week';
          const topicsArr: string[] = rec.topics || rec.key_topics || [];
          const topicsStr = topicsArr.length ? topicsArr.join(', ') : 'Topic outline TBD';
          return `
${title} (${priority} priority)
+- Time: ${time}
+- Topics: ${topicsStr}`;
        }).join('\n\n');

        return `STUDY GUIDE: Study Guide for ${fileName}\nSubject: ${subject}\nTotal Time: 4-6 weeks\n\nSECTIONS:\n${sectionsMarkdown}`;
      }
    } catch (error) {
      console.error('ADK study guide generation failed, falling back:', error);
    }

    // Fallback template if AI unavailable
    return `# Study Guide for ${subject}

AI services are currently unavailable. A detailed guide will be generated once connectivity is restored.`;
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const generateStudyMap = async () => {
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
    
    if (completedFiles.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Files Ready',
        message: 'Please upload and process at least one file before generating a study map.',
        duration: 4000
      });
      return;
    }

    // Combine all extracted content
    const combinedContent = completedFiles.map(f => f.extractedContent || '').join('\n\n');
    
    // Navigate to enhanced study map with uploaded content
    navigate('/enhanced-study-map', { 
      state: { 
        uploadedContent: combinedContent,
        files: completedFiles 
      } 
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (file.type.includes('image')) return <Image className="w-6 h-6 text-blue-500" />;
    return <FileIcon className="w-6 h-6 text-gray-500" />;
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Brain className="w-5 h-5 text-indigo-500" /></motion.div>;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const copyToClipboard = (text: string, fileId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFileId(fileId);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedFileId(null);
      }, 2000);
      
      addNotification({
        type: 'success',
        title: 'Copied to Clipboard',
        message: 'Study guide content has been copied to your clipboard.',
        duration: 2000
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      addNotification({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy content to clipboard.',
        duration: 3000
      });
    });
  };

  const handlePasteSubmit = async () => {
    if (!pasteContent.trim() || !pasteFileName.trim()) {
      addNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please provide both content and a file name.',
        duration: 3000
      });
      return;
    }

    // Create a file from the pasted content
    const blob = new Blob([pasteContent], { type: 'text/plain' });
    const file = new File([blob], `${pasteFileName}.txt`, { type: 'text/plain' });
    
    const uploadedFile: UploadedFile = {
      id: `file_${Date.now()}_${Math.random()}`,
      file,
      type: selectedType,
      status: 'uploading'
    };

    setUploadedFiles(prev => [...prev, uploadedFile]);
    
    // Process the file
    await processFile(uploadedFile);
    
    // Reset paste form
    setPasteContent('');
    setPasteFileName('');
    setShowPasteInput(false);
  };

  const togglePasteInput = () => {
    setShowPasteInput(!showPasteInput);
    // Focus the textarea when showing the paste input
    if (!showPasteInput && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <motion.button
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
                              onClick={() => goBack('/dashboard')}
              className={styles.backButton}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className={styles.titleContainer}>
              <div 
                className={styles.titleIcon}
                style={{ background: pageTheme.gradients.transformation }}
              >
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div className={styles.titleText}>
                <h1>Study Material Upload</h1>
                <p>Upload your study materials for personalized mapping</p>
              </div>
            </div>
          </div>
          
          {uploadedFiles.some(f => f.status === 'completed') && (
            <motion.button
              onClick={generateStudyMap}
              className={styles.generateButton}
              style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-5 h-5" />
              <span>Generate Study Map</span>
            </motion.button>
          )}
        </div>
      </motion.header>

      <div className={styles.mainContent}>
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.introSection}
        >
          <motion.div
            className={styles.introIcon}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div 
              className={styles.introIconContainer}
              style={{ background: pageTheme.gradients.transformation }}
            >
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <h2 className={styles.introTitle}>
            Upload your study materials for
            <br />
            <span 
              className={`${styles.introTitleHighlight} gradient-text`}
              style={{ backgroundImage: pageTheme.gradients.memoryToLearning }}
            >
              personalized sequential mapping
            </span>
          </h2>
          <p className={styles.introDescription}>
            Upload study guides, past papers, syllabi, or notes. Sensa will extract content, 
            sequence topics logically, and create personalized study maps based on your memories.
          </p>
        </motion.div>

        <div className={styles.contentGrid}>
          {/* Upload Area */}
          <div className={styles.uploadSection}>
            {/* File Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.typeSelection}
            >
              <h3 className={styles.typeSelectionTitle}>What type of material are you uploading?</h3>
              <div className={styles.typeGrid}>
                {[
                  { type: 'study_guide', label: 'Study Guide', icon: <BookOpen className="w-5 h-5" />, color: 'indigo' },
                  { type: 'past_paper', label: 'Past Paper', icon: <FileText className="w-5 h-5" />, color: 'purple' },
                  { type: 'syllabus', label: 'Syllabus', icon: <Target className="w-5 h-5" />, color: 'blue' },
                  { type: 'notes', label: 'Notes', icon: <Eye className="w-5 h-5" />, color: 'green' }
                ].map((option) => (
                  <motion.button
                    key={option.type}
                    onClick={() => setSelectedType(option.type as 'document' | 'image' | 'video' | 'audio')}
                    className={styles.typeButton}
                    style={{ 
                      borderColor: selectedType === option.type 
                        ? `var(--color-${option.color === 'indigo' ? 'amethyst' : option.color === 'purple' ? 'plum' : option.color === 'blue' ? 'amethyst' : 'sage'})` 
                        : '#e5e7eb',
                      backgroundColor: selectedType === option.type 
                        ? `rgba(var(--color-${option.color === 'indigo' ? 'amethyst' : option.color === 'purple' ? 'plum' : option.color === 'blue' ? 'amethyst' : 'sage'}, 0.05)` 
                        : 'transparent'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div 
                      className={styles.typeIcon}
                      style={{ 
                        color: selectedType === option.type 
                          ? `var(--color-${option.color === 'indigo' ? 'amethyst' : option.color === 'purple' ? 'plum' : option.color === 'blue' ? 'amethyst' : 'sage'})` 
                          : '#6b7280' 
                      }}
                    >
                      {option.icon}
                    </div>
                    <div 
                      className={styles.typeLabel}
                      style={{ 
                        color: selectedType === option.type 
                          ? `var(--color-${option.color === 'indigo' ? 'amethyst' : option.color === 'purple' ? 'plum' : option.color === 'blue' ? 'amethyst' : 'sage'})` 
                          : '#4b5563' 
                      }}
                    >
                      {option.label}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Upload Methods */}
            <div className={styles.uploadMethodsContainer}>
              <h3 className={styles.uploadMethodsTitle}>Upload Method</h3>
              <motion.button
                onClick={togglePasteInput}
                className={styles.pasteButton}
                style={{
                  backgroundColor: showPasteInput ? '#e0e7ff' : '#f3f4f6',
                  color: showPasteInput ? '#4f46e5' : '#4b5563'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Paste className="w-4 h-4" />
                <span>{showPasteInput ? 'Cancel Paste' : 'Paste Content'}</span>
              </motion.button>
            </div>

            {/* Paste Content Input */}
            <AnimatePresence>
              {showPasteInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={styles.pasteContainer}
                >
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      File Name
                    </label>
                    <input
                      type="text"
                      value={pasteFileName}
                      onChange={(e) => setPasteFileName(e.target.value)}
                      placeholder="Enter a name for this content"
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Content
                    </label>
                    <textarea
                      ref={textareaRef}
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      placeholder="Paste your content here..."
                      className={styles.formTextarea}
                    />
                  </div>
                  
                  <div className={styles.submitButtonContainer}>
                    <motion.button
                      onClick={handlePasteSubmit}
                      disabled={!pasteContent.trim() || !pasteFileName.trim()}
                      className={styles.submitButton}
                      whileHover={{ scale: pasteContent.trim() && pasteFileName.trim() ? 1.05 : 1 }}
                      whileTap={{ scale: pasteContent.trim() && pasteFileName.trim() ? 0.95 : 1 }}
                    >
                      <Paste className="w-4 h-4" />
                      <span>Process Content</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileInput}
                className={styles.fileInput}
              />
              
              <motion.div
                animate={{ y: dragActive ? -5 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Upload className={styles.dropZoneIcon} />
                <h3 className={styles.dropZoneTitle}>
                  Drop your {selectedType.replace('_', ' ')} files here
                </h3>
                <p className={styles.dropZoneDescription}>
                  or click to browse your computer
                </p>
                <p className={styles.dropZoneNote}>
                  Supports PDF, DOC, TXT, and image files up to 10MB
                </p>
              </motion.div>
            </motion.div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={styles.fileList}
              >
                <h3 className={styles.fileListTitle}>Uploaded Files</h3>
                <div className={styles.fileItems}>
                  {uploadedFiles.map((uploadedFile) => (
                    <motion.div
                      key={uploadedFile.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={styles.fileItem}
                    >
                      <div className={styles.fileHeader}>
                        <div className={styles.fileInfo}>
                          <div className={styles.fileIcon}>
                            {getFileIcon(uploadedFile.file)}
                          </div>
                          <div className={styles.fileDetails}>
                            <h4>{uploadedFile.file.name}</h4>
                            <p>
                              {uploadedFile.type.replace('_', ' ')} • {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        
                        <div className={styles.fileActions}>
                          {getStatusIcon(uploadedFile.status)}
                          <motion.button
                            onClick={() => removeFile(uploadedFile.id)}
                            className={styles.removeButton}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                      
                      {uploadedFile.status === 'processing' && (
                        <div className={styles.processingInfo}>
                          <div className={styles.processingText}>
                            <Brain className="w-4 h-4" />
                            <span>
                              {uploadedFile.type === 'past_paper' 
                                ? 'Extracting content and generating study guide...'
                                : 'Extracting and analyzing content...'
                              }
                            </span>
                          </div>
                          <div className={styles.progressBar}>
                            <motion.div
                              className={styles.progressFill}
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 3, ease: "easeInOut" }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {uploadedFile.status === 'error' && uploadedFile.error && (
                        <div className={styles.errorMessage}>
                          <p className={styles.errorText}>{uploadedFile.error}</p>
                        </div>
                      )}
                      
                      {uploadedFile.status === 'completed' && uploadedFile.generatedStudyGuide && (
                        <div className={styles.studyGuidePreview}>
                          <div className={styles.studyGuideHeader}>
                            <p className={styles.studyGuideTitle}>✨ Study guide generated from past paper!</p>
                            <motion.button
                              onClick={() => copyToClipboard(uploadedFile.generatedStudyGuide!, uploadedFile.id)}
                              className={styles.copyButton}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {copiedFileId === uploadedFile.id ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </motion.button>
                          </div>
                          <details>
                            <summary className={styles.studyGuideSummary}>View generated study guide</summary>
                            <div className={styles.studyGuideContent}>
                              {uploadedFile.generatedStudyGuide}
                            </div>
                          </details>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Information Panel */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={styles.infoPanel}
            >
              <h3 className={styles.infoPanelTitle}>
                <Zap className="w-5 h-5 text-amber-500" />
                How It Works
              </h3>
              
              <div className={styles.stepsList}>
                <div className={styles.stepItem}>
                  <div className={styles.stepIcon} style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}>
                    <Upload className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className={styles.stepContent}>
                    <h4>1. Upload Materials</h4>
                    <p>Upload study guides, past papers, or notes</p>
                  </div>
                </div>
                
                <div className={styles.stepItem}>
                  <div className={styles.stepIcon} style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)' }}>
                    <Brain className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className={styles.stepContent}>
                    <h4>2. AI Processing</h4>
                    <p>Sensa extracts and analyzes content</p>
                  </div>
                </div>
                
                <div className={styles.stepItem}>
                  <div className={styles.stepIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  <div className={styles.stepContent}>
                    <h4>3. Sequential Mapping</h4>
                    <p>Topics are sequenced and grouped logically</p>
                  </div>
                </div>
                
                <div className={styles.stepItem}>
                  <div className={styles.stepIcon} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className={styles.stepContent}>
                    <h4>4. Memory Integration</h4>
                    <p>Connected to your personal memories</p>
                  </div>
                </div>
              </div>
              
              <div className={styles.tipBox}>
                <h4 className={styles.tipTitle}>💡 Pro Tip</h4>
                <p className={styles.tipText}>
                  Upload past papers to automatically generate study guides with topic priorities based on exam patterns!
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyMaterialUpload;