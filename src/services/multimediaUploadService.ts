// Phase 3: Rich Media & Advanced Collaboration - Multimedia Upload Service
// Extends the existing upload service to handle images, videos, and audio files

import { uploadService, UploadConfig, ProcessedFile } from './uploadService';
import { supabase } from '../lib/supabase';

export interface MultimediaFile extends ProcessedFile {
  url?: string;
  thumbnailUrl?: string;
  duration?: number; // for audio/video
  dimensions?: { width: number; height: number }; // for images/video
  mediaType: 'image' | 'video' | 'audio' | 'document';
  size: number;
  mimeType: string;
}

export interface MultimediaUploadResult {
  files: MultimediaFile[];
  errors: string[];
  uploadedUrls: string[];
}

export class MultimediaUploadService {
  private static instance: MultimediaUploadService;
  
  static getInstance(): MultimediaUploadService {
    if (!MultimediaUploadService.instance) {
      MultimediaUploadService.instance = new MultimediaUploadService();
    }
    return MultimediaUploadService.instance;
  }

  // Enhanced file type validation for multimedia
  validateMultimediaFile(file: File): { isValid: boolean; error?: string; mediaType?: string } {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
    const audioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'];
    const documentTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    let mediaType: string;
    let maxSize: number; // in MB

    if (imageTypes.includes(file.type)) {
      mediaType = 'image';
      maxSize = 10; // 10MB for images
    } else if (videoTypes.includes(file.type)) {
      mediaType = 'video';
      maxSize = 100; // 100MB for videos
    } else if (audioTypes.includes(file.type)) {
      mediaType = 'audio';
      maxSize = 50; // 50MB for audio
    } else if (documentTypes.includes(file.type)) {
      mediaType = 'document';
      maxSize = 20; // 20MB for documents
    } else {
      return {
        isValid: false,
        error: `Unsupported file type: ${file.type}. Supported types: images, videos, audio, and documents.`
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return {
        isValid: false,
        error: `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed size (${maxSize}MB) for ${mediaType} files.`
      };
    }

    return { isValid: true, mediaType };
  }

  // Extract metadata from multimedia files
  async extractMediaMetadata(file: File, mediaType: string): Promise<Partial<MultimediaFile>> {
    const metadata: Partial<MultimediaFile> = {
      size: file.size,
      mimeType: file.type,
      mediaType: mediaType as 'image' | 'video' | 'audio' | 'document'
    };

    try {
      if (mediaType === 'image') {
        const dimensions = await this.getImageDimensions(file);
        metadata.dimensions = dimensions;
      } else if (mediaType === 'video') {
        const videoMetadata = await this.getVideoMetadata(file);
        metadata.dimensions = videoMetadata.dimensions;
        metadata.duration = videoMetadata.duration;
      } else if (mediaType === 'audio') {
        const duration = await this.getAudioDuration(file);
        metadata.duration = duration;
      }
    } catch (error) {
      console.warn('Failed to extract metadata:', error);
    }

    return metadata;
  }

  // Get image dimensions
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Get video metadata
  private getVideoMetadata(file: File): Promise<{ dimensions: { width: number; height: number }; duration: number }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve({
          dimensions: { width: video.videoWidth, height: video.videoHeight },
          duration: video.duration
        });
        URL.revokeObjectURL(video.src);
      };
      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  }

  // Get audio duration
  private getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src);
      };
      audio.onerror = reject;
      audio.src = URL.createObjectURL(file);
    });
  }

  // Upload file to Supabase Storage
  async uploadToStorage(file: File, sessionId: string): Promise<{ url: string; path: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `collaboration/${sessionId}/media/${fileName}`;

    const { data, error } = await supabase.storage
      .from('mindmap-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('mindmap-media')
      .getPublicUrl(filePath);

    return { url: publicUrl, path: filePath };
  }

  // Generate thumbnail for images and videos
  async generateThumbnail(file: File, mediaType: string): Promise<string | null> {
    if (mediaType === 'image') {
      return this.generateImageThumbnail(file);
    } else if (mediaType === 'video') {
      return this.generateVideoThumbnail(file);
    }
    return null;
  }

  // Generate image thumbnail
  private generateImageThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxSize = 200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Generate video thumbnail
  private generateVideoThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration / 4); // Capture at 25% or 1 second
      };
      
      video.onseeked = () => {
        const maxSize = 200;
        const ratio = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight);
        canvas.width = video.videoWidth * ratio;
        canvas.height = video.videoHeight * ratio;
        
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  }

  // Process multimedia files for mindmap nodes
  async processMultimediaFiles(
    files: File[], 
    sessionId: string,
    onProgress?: (progress: number) => void
  ): Promise<MultimediaUploadResult> {
    const processedFiles: MultimediaFile[] = [];
    const errors: string[] = [];
    const uploadedUrls: string[] = [];
    let completedCount = 0;

    for (const file of files) {
      try {
        // Validate file
        const validation = this.validateMultimediaFile(file);
        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        // Extract metadata
        const metadata = await this.extractMediaMetadata(file, validation.mediaType!);
        
        // Upload to storage
        const { url, path } = await this.uploadToStorage(file, sessionId);
        
        // Generate thumbnail if applicable
        const thumbnailUrl = await this.generateThumbnail(file, validation.mediaType!);
        
        // For documents, extract text using existing service
        let extractedText: string | undefined;
        if (validation.mediaType === 'document') {
          const config: UploadConfig = {
            acceptedTypes: [file.type],
            maxFileSize: 20,
            extractText: true,
            maxTextLength: 25000
          };
          const result = await uploadService.processFile(file, config);
          extractedText = result.extractedText;
        }

        const processedFile: MultimediaFile = {
          file,
          status: 'success',
          url,
          thumbnailUrl: thumbnailUrl || undefined,
          extractedText,
          mediaType: validation.mediaType as 'image' | 'video' | 'audio' | 'document',
          ...metadata
        };

        processedFiles.push(processedFile);
        uploadedUrls.push(url);
        
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        processedFiles.push({
          file,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          mediaType: 'document',
          size: file.size,
          mimeType: file.type
        });
      }
      
      completedCount++;
      onProgress?.(completedCount / files.length);
    }

    return {
      files: processedFiles,
      errors,
      uploadedUrls
    };
  }

  // Delete uploaded file from storage
  async deleteFromStorage(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('mindmap-media')
      .remove([filePath]);
    
    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
}

export const multimediaUploadService = MultimediaUploadService.getInstance();

// Enhanced upload configurations for different media types
export const multimediaUploadConfigs = {
  collaboration: {
    acceptedTypes: [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos
      'video/mp4', 'video/webm', 'video/ogg',
      // Audio
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac',
      // Documents
      'application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxFiles: 10,
    extractText: true
  },
  imageOnly: {
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles: 5,
    extractText: false
  },
  videoOnly: {
    acceptedTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    maxFiles: 3,
    extractText: false
  },
  audioOnly: {
    acceptedTypes: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'],
    maxFiles: 5,
    extractText: false
  }
};