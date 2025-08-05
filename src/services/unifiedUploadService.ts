// Unified Upload Service
// Consolidates all upload functionality from uploadService, multimediaUploadService, and various upload components

import { uploadService, UploadConfig, ProcessedFile } from './uploadService';
import { multimediaUploadService, MultimediaFile } from './multimediaUploadService';
import { supabase } from '../lib/supabase';

export type UploadType = 'document' | 'multimedia' | 'study-material' | 'collaboration' | 'general';
export type MediaType = 'image' | 'video' | 'audio' | 'document';
export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'error';

export interface UnifiedUploadConfig {
  type: UploadType;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  extractText?: boolean;
  maxTextLength?: number;
  maxPages?: number;
  enableThumbnails?: boolean;
  enableMetadata?: boolean;
  storageBucket?: string;
  uploadPath?: string;
}

export interface UnifiedFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress?: number;
  error?: string;
  extractedText?: string;
  url?: string;
  thumbnailUrl?: string;
  duration?: number;
  dimensions?: { width: number; height: number };
  mediaType: MediaType;
  size: number;
  mimeType: string;
  uploadedAt?: Date;
  uploadedBy?: string;
  metadata?: Record<string, any>;
}

export interface UnifiedUploadResult {
  files: UnifiedFile[];
  errors: string[];
  uploadedUrls: string[];
  totalExtractedText?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

type ProgressCallback = (progress: UploadProgress[]) => void;

export class UnifiedUploadService {
  private static instance: UnifiedUploadService;
  private activeUploads = new Map<string, AbortController>();

  static getInstance(): UnifiedUploadService {
    if (!UnifiedUploadService.instance) {
      UnifiedUploadService.instance = new UnifiedUploadService();
    }
    return UnifiedUploadService.instance;
  }

  private constructor() {}

  /**
   * Get predefined configurations for different upload types
   */
  getConfig(type: UploadType): UnifiedUploadConfig {
    const configs: Record<UploadType, UnifiedUploadConfig> = {
      'document': {
        type: 'document',
        acceptedTypes: [
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        maxFileSize: 10,
        maxFiles: 5,
        extractText: true,
        maxTextLength: 20000,
        maxPages: 10,
        enableThumbnails: false,
        enableMetadata: true,
        storageBucket: 'documents',
        uploadPath: 'uploads/documents'
      },
      'multimedia': {
        type: 'multimedia',
        acceptedTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
          'video/mp4', 'video/webm', 'video/ogg',
          'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac',
          'application/pdf', 'text/plain'
        ],
        maxFileSize: 50,
        maxFiles: 10,
        extractText: false,
        enableThumbnails: true,
        enableMetadata: true,
        storageBucket: 'mindmap-media',
        uploadPath: 'uploads/multimedia'
      },
      'study-material': {
        type: 'study-material',
        acceptedTypes: [
          'application/pdf',
          'text/plain',
          'image/jpeg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        maxFileSize: 10,
        maxFiles: 3,
        extractText: true,
        maxTextLength: 15000,
        maxPages: 8,
        enableThumbnails: true,
        enableMetadata: true,
        storageBucket: 'study-materials',
        uploadPath: 'uploads/study-materials'
      },
      'collaboration': {
        type: 'collaboration',
        acceptedTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm',
          'audio/mp3', 'audio/wav',
          'application/pdf', 'text/plain'
        ],
        maxFileSize: 25,
        maxFiles: 10,
        extractText: true,
        enableThumbnails: true,
        enableMetadata: true,
        storageBucket: 'collaboration',
        uploadPath: 'uploads/collaboration'
      },
      'general': {
        type: 'general',
        acceptedTypes: [
          'application/pdf',
          'text/plain',
          'image/jpeg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        maxFileSize: 10,
        maxFiles: 5,
        extractText: true,
        maxTextLength: 20000,
        maxPages: 10,
        enableThumbnails: false,
        enableMetadata: true,
        storageBucket: 'general',
        uploadPath: 'uploads/general'
      }
    };

    return configs[type];
  }

  /**
   * Validate files against configuration
   */
  validateFiles(files: File[], config: UnifiedUploadConfig): { validFiles: File[]; errors: string[] } {
    const validFiles: File[] = [];
    const errors: string[] = [];

    if (files.length > config.maxFiles!) {
      errors.push(`Maximum ${config.maxFiles} files allowed. Only the first ${config.maxFiles} files will be processed.`);
    }

    for (let i = 0; i < Math.min(files.length, config.maxFiles!); i++) {
      const file = files[i];

      // Check file type
      if (!config.acceptedTypes!.includes(file.type)) {
        errors.push(`File type ${file.type} not supported for ${file.name}`);
        continue;
      }

      // Check file size
      if (file.size > config.maxFileSize! * 1024 * 1024) {
        errors.push(`File ${file.name} exceeds ${config.maxFileSize}MB limit`);
        continue;
      }

      validFiles.push(file);
    }

    return { validFiles, errors };
  }

  /**
   * Determine media type from file
   */
  private getMediaType(file: File): MediaType {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Upload files with unified processing
   */
  async uploadFiles(
    files: File[],
    config: UnifiedUploadConfig,
    onProgress?: ProgressCallback,
    sessionId?: string,
    userId?: string
  ): Promise<UnifiedUploadResult> {
    const { validFiles, errors } = this.validateFiles(files, config);
    const processedFiles: UnifiedFile[] = [];
    const uploadedUrls: string[] = [];
    let totalExtractedText = '';

    // Initialize progress tracking
    const progressMap = new Map<string, UploadProgress>();
    
    const updateProgress = () => {
      if (onProgress) {
        onProgress(Array.from(progressMap.values()));
      }
    };

    for (const file of validFiles) {
      const fileId = this.generateFileId();
      const abortController = new AbortController();
      this.activeUploads.set(fileId, abortController);

      // Initialize progress
      progressMap.set(fileId, {
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'pending'
      });
      updateProgress();

      try {
        // Update status to uploading
        progressMap.set(fileId, {
          ...progressMap.get(fileId)!,
          status: 'uploading',
          progress: 10
        });
        updateProgress();

        let processedFile: UnifiedFile;

        if (config.type === 'multimedia' || this.getMediaType(file) !== 'document') {
          // Use multimedia service for media files
          const multimediaResult = await multimediaUploadService.processMultimediaFiles(
            [file],
            sessionId || 'default',
            (progress) => {
              progressMap.set(fileId, {
                ...progressMap.get(fileId)!,
                progress: 10 + (progress * 80) // 10-90% for upload
              });
              updateProgress();
            }
          );

          if (multimediaResult.files.length > 0) {
            const multimediaFile = multimediaResult.files[0];
            processedFile = {
              id: fileId,
              file,
              status: multimediaFile.status === 'success' ? 'completed' : 'error',
              progress: 100,
              extractedText: multimediaFile.extractedText,
              url: multimediaFile.url,
              thumbnailUrl: multimediaFile.thumbnailUrl,
              duration: multimediaFile.duration,
              dimensions: multimediaFile.dimensions,
              mediaType: multimediaFile.mediaType,
              size: file.size,
              mimeType: file.type,
              uploadedAt: new Date(),
              uploadedBy: userId,
              error: multimediaFile.error
            };

            if (multimediaFile.url) {
              uploadedUrls.push(multimediaFile.url);
            }
          } else {
            throw new Error('Multimedia processing failed');
          }
        } else {
          // Use document service for text-based files
          progressMap.set(fileId, {
            ...progressMap.get(fileId)!,
            status: 'processing',
            progress: 50
          });
          updateProgress();

          const documentResult = await uploadService.processFile(file, {
            acceptedTypes: config.acceptedTypes,
            maxFileSize: config.maxFileSize,
            maxFiles: 1,
            extractText: config.extractText,
            maxTextLength: config.maxTextLength,
            maxPages: config.maxPages
          });

          processedFile = {
            id: fileId,
            file,
            status: documentResult.status === 'success' ? 'completed' : 'error',
            progress: 100,
            extractedText: documentResult.extractedText,
            mediaType: this.getMediaType(file),
            size: file.size,
            mimeType: file.type,
            uploadedAt: new Date(),
            uploadedBy: userId,
            error: documentResult.error
          };
        }

        // Update final progress
        progressMap.set(fileId, {
          fileId,
          fileName: file.name,
          progress: 100,
          status: processedFile.status
        });
        updateProgress();

        processedFiles.push(processedFile);

        if (processedFile.extractedText) {
          totalExtractedText += processedFile.extractedText + '\n\n';
        }

        if (processedFile.error) {
          errors.push(`${file.name}: ${processedFile.error}`);
        }

      } catch (error) {
        console.error('Error processing file:', file.name, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${file.name}: ${errorMessage}`);

        progressMap.set(fileId, {
          fileId,
          fileName: file.name,
          progress: 100,
          status: 'error',
          error: errorMessage
        });
        updateProgress();

        processedFiles.push({
          id: fileId,
          file,
          status: 'error',
          progress: 100,
          error: errorMessage,
          mediaType: this.getMediaType(file),
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date(),
          uploadedBy: userId
        });
      } finally {
        this.activeUploads.delete(fileId);
      }
    }

    return {
      files: processedFiles,
      errors,
      uploadedUrls,
      totalExtractedText: totalExtractedText.trim()
    };
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(fileId: string): void {
    const controller = this.activeUploads.get(fileId);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(fileId);
    }
  }

  /**
   * Cancel all active uploads
   */
  cancelAllUploads(): void {
    for (const [fileId, controller] of this.activeUploads) {
      controller.abort();
    }
    this.activeUploads.clear();
  }

  /**
   * Delete uploaded file from storage
   */
  async deleteFromStorage(filePath: string, bucket?: string): Promise<void> {
    const storageBucket = bucket || 'general';
    const { error } = await supabase.storage
      .from(storageBucket)
      .remove([filePath]);
    
    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Get upload statistics
   */
  getUploadStats(): {
    activeUploads: number;
    totalUploaded: number;
  } {
    return {
      activeUploads: this.activeUploads.size,
      totalUploaded: 0 // This could be tracked in a more persistent way
    };
  }
}

// Export singleton instance
export const unifiedUploadService = UnifiedUploadService.getInstance();

// Export convenience functions for different upload types
export const uploadDocuments = (files: File[], onProgress?: ProgressCallback, userId?: string) => {
  const config = unifiedUploadService.getConfig('document');
  return unifiedUploadService.uploadFiles(files, config, onProgress, undefined, userId);
};

export const uploadMultimedia = (files: File[], sessionId: string, onProgress?: ProgressCallback, userId?: string) => {
  const config = unifiedUploadService.getConfig('multimedia');
  return unifiedUploadService.uploadFiles(files, config, onProgress, sessionId, userId);
};

export const uploadStudyMaterials = (files: File[], onProgress?: ProgressCallback, userId?: string) => {
  const config = unifiedUploadService.getConfig('study-material');
  return unifiedUploadService.uploadFiles(files, config, onProgress, undefined, userId);
};

export const uploadForCollaboration = (files: File[], sessionId: string, onProgress?: ProgressCallback, userId?: string) => {
  const config = unifiedUploadService.getConfig('collaboration');
  return unifiedUploadService.uploadFiles(files, config, onProgress, sessionId, userId);
};

export default unifiedUploadService;