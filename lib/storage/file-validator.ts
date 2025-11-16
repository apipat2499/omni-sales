/**
 * File Validation Utilities
 * Validates file types, sizes, and security
 */

export interface FileValidationConfig {
  maxFileSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  virusScanningEnabled?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

// Default file type configurations
export const FILE_TYPE_CONFIGS = {
  documents: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ],
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  images: {
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
    ],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  videos: {
    mimeTypes: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
    ],
    extensions: ['.mp4', '.webm', '.ogg', '.mov'],
    maxSize: 500 * 1024 * 1024, // 500MB
  },
  archives: {
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
    ],
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  data: {
    mimeTypes: [
      'application/json',
      'text/csv',
      'application/xml',
      'text/xml',
    ],
    extensions: ['.json', '.csv', '.xml'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
};

// Dangerous file extensions that should be blocked
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.rpm', '.dmg', '.pkg', '.msi', '.dll', '.so', '.dylib',
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.psm1',
];

// Suspicious MIME types
const DANGEROUS_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-sharedlib',
  'application/x-shellscript',
];

export class FileValidator {
  private config: FileValidationConfig;

  constructor(config: FileValidationConfig = {}) {
    this.config = {
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // Default 100MB
      allowedMimeTypes: config.allowedMimeTypes || this.getAllAllowedMimeTypes(),
      allowedExtensions: config.allowedExtensions || this.getAllAllowedExtensions(),
      virusScanningEnabled: config.virusScanningEnabled || false,
    };
  }

  /**
   * Get all allowed MIME types from default configs
   */
  private getAllAllowedMimeTypes(): string[] {
    const mimeTypes: string[] = [];
    Object.values(FILE_TYPE_CONFIGS).forEach(config => {
      mimeTypes.push(...config.mimeTypes);
    });
    return [...new Set(mimeTypes)];
  }

  /**
   * Get all allowed extensions from default configs
   */
  private getAllAllowedExtensions(): string[] {
    const extensions: string[] = [];
    Object.values(FILE_TYPE_CONFIGS).forEach(config => {
      extensions.push(...config.extensions);
    });
    return [...new Set(extensions)];
  }

  /**
   * Validate a file
   */
  async validate(file: File): Promise<ValidationResult> {
    const warnings: string[] = [];

    // Check file size
    if (file.size > (this.config.maxFileSize || 0)) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.formatBytes(this.config.maxFileSize || 0)}`,
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty',
      };
    }

    // Get file extension
    const extension = this.getFileExtension(file.name);

    // Check for dangerous extensions
    if (DANGEROUS_EXTENSIONS.includes(extension.toLowerCase())) {
      return {
        valid: false,
        error: `File type ${extension} is not allowed for security reasons`,
      };
    }

    // Check for dangerous MIME types
    if (DANGEROUS_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed for security reasons`,
      };
    }

    // Check allowed extensions
    if (this.config.allowedExtensions && this.config.allowedExtensions.length > 0) {
      if (!this.config.allowedExtensions.includes(extension.toLowerCase())) {
        return {
          valid: false,
          error: `File extension ${extension} is not allowed. Allowed extensions: ${this.config.allowedExtensions.join(', ')}`,
        };
      }
    }

    // Check allowed MIME types
    if (this.config.allowedMimeTypes && this.config.allowedMimeTypes.length > 0) {
      if (!this.config.allowedMimeTypes.includes(file.type)) {
        warnings.push(`File MIME type ${file.type} may not be fully supported`);
      }
    }

    // Validate file name
    const fileNameValidation = this.validateFileName(file.name);
    if (!fileNameValidation.valid) {
      return fileNameValidation;
    }

    // Check for virus scanning if enabled
    if (this.config.virusScanningEnabled) {
      warnings.push('Virus scanning is enabled but not yet implemented');
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate file name
   */
  private validateFileName(fileName: string): ValidationResult {
    // Check for null bytes
    if (fileName.includes('\0')) {
      return {
        valid: false,
        error: 'File name contains invalid characters',
      };
    }

    // Check for path traversal attempts
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return {
        valid: false,
        error: 'File name contains invalid path characters',
      };
    }

    // Check file name length
    if (fileName.length > 255) {
      return {
        valid: false,
        error: 'File name is too long (max 255 characters)',
      };
    }

    // Check for hidden files
    if (fileName.startsWith('.')) {
      return {
        valid: false,
        error: 'Hidden files are not allowed',
      };
    }

    return { valid: true };
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) return '';
    return fileName.slice(lastDot);
  }

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file category based on MIME type
   */
  getFileCategory(mimeType: string): string | null {
    for (const [category, config] of Object.entries(FILE_TYPE_CONFIGS)) {
      if (config.mimeTypes.includes(mimeType)) {
        return category;
      }
    }
    return null;
  }

  /**
   * Check if file is an image
   */
  isImage(mimeType: string): boolean {
    return FILE_TYPE_CONFIGS.images.mimeTypes.includes(mimeType);
  }

  /**
   * Check if file is a video
   */
  isVideo(mimeType: string): boolean {
    return FILE_TYPE_CONFIGS.videos.mimeTypes.includes(mimeType);
  }

  /**
   * Check if file is a document
   */
  isDocument(mimeType: string): boolean {
    return FILE_TYPE_CONFIGS.documents.mimeTypes.includes(mimeType);
  }
}

/**
 * Validate multiple files
 */
export async function validateFiles(
  files: File[],
  config?: FileValidationConfig
): Promise<Map<File, ValidationResult>> {
  const validator = new FileValidator(config);
  const results = new Map<File, ValidationResult>();

  for (const file of files) {
    const result = await validator.validate(file);
    results.set(file, result);
  }

  return results;
}

/**
 * Get recommended max file size for a file type
 */
export function getRecommendedMaxSize(mimeType: string): number {
  for (const config of Object.values(FILE_TYPE_CONFIGS)) {
    if (config.mimeTypes.includes(mimeType)) {
      return config.maxSize;
    }
  }
  return 50 * 1024 * 1024; // Default 50MB
}

export default FileValidator;
