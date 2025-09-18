import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import { BadRequestError } from '@/shared/errors';
import { MESSAGES } from '@/shared/constants';

/**
 * File filter function for multer
 */
const fileFilter = (allowedTypes?: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
      return cb(new BadRequestError(
        `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`
      ));
    }
    cb(null, true);
  };
};

/**
 * Generate unique filename
 */
const generateFilename = (originalname: string): string => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalname);
  const basename = path.basename(originalname, extension);
  return `${basename}-${timestamp}-${random}${extension}`;
};

/**
 * Memory storage configuration for Cloudinary uploads
 */
const memoryStorage = multer.memoryStorage();

/**
 * Disk storage configuration for local uploads
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  },
});

/**
 * Upload configuration options
 */
interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  storage?: 'memory' | 'disk';
  fieldName?: string;
  maxFiles?: number;
}

/**
 * Create upload middleware with options
 */
const createUploadMiddleware = (options: UploadOptions = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes,
    storage = 'memory',
    fieldName = 'file',
    maxFiles = 1,
  } = options;

  const multerConfig: multer.Options = {
    storage: storage === 'memory' ? memoryStorage : diskStorage,
    limits: {
      fileSize: maxSize,
      files: maxFiles,
    },
    fileFilter: fileFilter(allowedTypes),
  };

  const upload = multer(multerConfig);

  // Return appropriate middleware based on maxFiles
  if (maxFiles === 1) {
    return upload.single(fieldName);
  } else {
    return upload.array(fieldName, maxFiles);
  }
};

/**
 * Predefined upload middlewares for common use cases
 */

// Single image upload (for avatars, profile pictures)
export const uploadSingleImage = createUploadMiddleware({
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  storage: 'memory',
  fieldName: 'image',
});

// Single avatar upload
export const uploadAvatar = createUploadMiddleware({
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  storage: 'memory',
  fieldName: 'avatar',
});

// Multiple images upload
export const uploadMultipleImages = createUploadMiddleware({
  maxSize: 5 * 1024 * 1024, // 5MB per file
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  storage: 'memory',
  fieldName: 'images',
  maxFiles: 10,
});

// Document upload
export const uploadDocument = createUploadMiddleware({
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  storage: 'memory',
  fieldName: 'document',
});

// Any file upload
export const uploadAnyFile = createUploadMiddleware({
  maxSize: 50 * 1024 * 1024, // 50MB
  storage: 'memory',
  fieldName: 'file',
});

// CSV file upload
export const uploadCSV = createUploadMiddleware({
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['text/csv', 'application/vnd.ms-excel'],
  storage: 'memory',
  fieldName: 'csv',
});

// Excel file upload
export const uploadExcel = createUploadMiddleware({
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  storage: 'memory',
  fieldName: 'excel',
});

// Video upload
export const uploadVideo = createUploadMiddleware({
  maxSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
  storage: 'memory',
  fieldName: 'video',
});

// Audio upload
export const uploadAudio = createUploadMiddleware({
  maxSize: 20 * 1024 * 1024, // 20MB
  allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
  storage: 'memory',
  fieldName: 'audio',
});

/**
 * Multiple field upload middleware
 */
export const uploadMultipleFields = (fields: { name: string; maxCount: number }[]) => {
  const upload = multer({
    storage: memoryStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
    },
  });

  return upload.fields(fields);
};

/**
 * Custom upload middleware factory
 */
export const createCustomUpload = (options: UploadOptions) => {
  return createUploadMiddleware(options);
};

/**
 * File type validation helpers
 */
export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf',
  ],
  SPREADSHEETS: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
  VIDEOS: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/avi'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/aac'],
  ARCHIVES: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
  ],
};

/**
 * File size constants
 */
export const FILE_SIZES = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  AVATAR_MAX: 2 * 1024 * 1024, // 2MB
  IMAGE_MAX: 5 * 1024 * 1024, // 5MB
  DOCUMENT_MAX: 10 * 1024 * 1024, // 10MB
  VIDEO_MAX: 100 * 1024 * 1024, // 100MB
  AUDIO_MAX: 20 * 1024 * 1024, // 20MB
};

/**
 * Utility function to check file type
 */
export const isFileTypeAllowed = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

/**
 * Utility function to format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default {
  uploadSingleImage,
  uploadAvatar,
  uploadMultipleImages,
  uploadDocument,
  uploadAnyFile,
  uploadCSV,
  uploadExcel,
  uploadVideo,
  uploadAudio,
  uploadMultipleFields,
  createCustomUpload,
  FILE_TYPES,
  FILE_SIZES,
  isFileTypeAllowed,
  formatFileSize,
};