/**
 * Centralized file extraction utilities
 * Consolidates duplicate file reading logic across the application
 */

export interface FileExtractionConfig {
  maxTextLength?: number;
  maxPages?: number;
  extractText?: boolean;
}

export interface ExtractedFileData {
  content: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  success: boolean;
  error?: string;
}

/**
 * Unified file extraction utility class
 */
export class FileExtractor {
  private static readonly DEFAULT_CONFIG: FileExtractionConfig = {
    maxTextLength: 20000,
    maxPages: 10,
    extractText: true
  };

  /**
   * Extract content from any supported file type
   */
  static async extractContent(
    file: File, 
    config: FileExtractionConfig = {}
  ): Promise<ExtractedFileData> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    try {
      let content: string;
      
      if (file.type === 'text/plain') {
        content = await this.extractFromTextFile(file, finalConfig);
      } else if (file.type === 'application/pdf') {
        content = await this.extractFromPDFFile(file, finalConfig);
      } else if (file.type.includes('word')) {
        content = await this.extractFromWordFile(file, finalConfig);
      } else {
        content = this.createPlaceholderContent(file);
      }

      return {
        content,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        success: true
      };
    } catch (error) {
      return {
        content: this.createErrorContent(file, error),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract text from a text file
   */
  private static async extractFromTextFile(
    file: File, 
    config: FileExtractionConfig
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string || '';
        const truncated = config.maxTextLength && result.length > config.maxTextLength 
          ? result.substring(0, config.maxTextLength) 
          : result;
        resolve(truncated);
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  /**
   * Extract text from a PDF file (placeholder - would need PDF.js integration)
   */
  private static async extractFromPDFFile(
    file: File, 
    config: FileExtractionConfig
  ): Promise<string> {
    // For now, return a placeholder. In a real implementation, 
    // this would use PDF.js or similar library
    return `[PDF Content from ${file.name}]\n\nPDF text extraction requires PDF.js integration.\n\nFile: ${file.name}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }

  /**
   * Extract text from a Word document (placeholder)
   */
  private static async extractFromWordFile(
    file: File, 
    config: FileExtractionConfig
  ): Promise<string> {
    // For now, try to read as text. In a real implementation,
    // this would use mammoth.js or similar library
    try {
      return await this.extractFromTextFile(file, config);
    } catch {
      return this.createPlaceholderContent(file);
    }
  }

  /**
   * Create placeholder content for unsupported file types
   */
  private static createPlaceholderContent(file: File): string {
    return `[File Content from ${file.name}]\n\nFile type: ${file.type}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\n\nContent extraction for this file type is not yet supported.`;
  }

  /**
   * Create error content when extraction fails
   */
  private static createErrorContent(file: File, error: unknown): string {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `[Error extracting content from ${file.name}]\n\nError: ${errorMessage}\nFile type: ${file.type}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\n\nPlease try a different file or contact support.`;
  }

  /**
   * Create a File object from text content
   */
  static createFileFromContent(content: string, filename: string): File {
    const blob = new Blob([content], { type: 'text/plain' });
    const finalFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;
    return new File([blob], finalFilename, { type: 'text/plain' });
  }

  /**
   * Validate file before processing
   */
  static validateFile(file: File, maxSize: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)} MB)`
      };
    }

    const supportedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!supportedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not supported. Please use text, PDF, or Word documents.`
      };
    }

    return { valid: true };
  }

  /**
   * Process multiple files and combine their content
   */
  static async extractFromMultipleFiles(
    files: File[], 
    config: FileExtractionConfig = {}
  ): Promise<{
    combinedContent: string;
    results: ExtractedFileData[];
    errors: string[];
  }> {
    const results: ExtractedFileData[] = [];
    const errors: string[] = [];
    let combinedContent = '';

    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      const result = await this.extractContent(file, config);
      results.push(result);

      if (result.success) {
        combinedContent += result.content + '\n\n';
      } else {
        errors.push(`${file.name}: ${result.error}`);
      }
    }

    return {
      combinedContent: combinedContent.trim(),
      results,
      errors
    };
  }
}

// Legacy compatibility exports
export const extractContentFromFile = FileExtractor.extractContent;
export const createFileFromContent = FileExtractor.createFileFromContent;
export const readFileAsText = (file: File): Promise<string> => {
  return FileExtractor.extractContent(file).then(result => result.content);
};