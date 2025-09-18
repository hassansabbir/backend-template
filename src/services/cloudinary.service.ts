import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import { Readable } from "stream";
import { BadRequestError, InternalServerError } from "@/shared/errors";
import { MESSAGES } from "@/shared/constants";
import { logger } from "@/utils";

/**
 * Cloudinary configuration
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload options interface
 */
interface UploadOptions {
  folder?: string;
  public_id?: string;
  transformation?: any[];
  resource_type?: "image" | "video" | "raw" | "auto";
  format?: string;
  quality?: string | number;
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  tags?: string[];
  context?: Record<string, string>;
  overwrite?: boolean;
  unique_filename?: boolean;
  use_filename?: boolean;
}

/**
 * Upload result interface
 */
interface UploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
  api_key: string;
}

/**
 * Cloudinary Service Class
 */
export class CloudinaryService {
  /**
   * Upload file buffer to Cloudinary
   */
  static async uploadBuffer(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const defaultOptions: UploadOptions = {
        resource_type: "auto",
        folder: "uploads",
        unique_filename: true,
        overwrite: false,
        ...options,
      };

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          defaultOptions,
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined
          ) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error("Upload failed: No result returned"));
            }
          }
        );

        // Create readable stream from buffer
        const bufferStream = new Readable();
        bufferStream.push(buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });

      logger.info("File uploaded to Cloudinary successfully", {
        public_id: result.public_id,
        url: result.secure_url,
        size: result.bytes,
      });

      return result as unknown as UploadResult;
    } catch (error: any) {
      logger.error("Cloudinary upload failed", {
        error: error.message,
        options,
      });

      if (error.http_code === 400) {
        throw new BadRequestError(`Upload failed: ${error.message}`);
      }

      throw new InternalServerError("File upload failed");
    }
  }

  /**
   * Upload image with automatic optimization
   */
  static async uploadImage(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const imageOptions: UploadOptions = {
      resource_type: "image",
      folder: "images",
      format: "webp",
      quality: "auto:good",
      transformation: [{ fetch_format: "auto" }, { quality: "auto:good" }],
      ...options,
    };

    return this.uploadBuffer(buffer, imageOptions);
  }

  /**
   * Upload avatar with specific transformations
   */
  static async uploadAvatar(
    buffer: Buffer,
    userId: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const avatarOptions: UploadOptions = {
      resource_type: "image",
      folder: "avatars",
      public_id: `avatar_${userId}`,
      format: "webp",
      quality: "auto:good",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
      overwrite: true,
      ...options,
    };

    return this.uploadBuffer(buffer, avatarOptions);
  }

  /**
   * Upload video
   */
  static async uploadVideo(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const videoOptions: UploadOptions = {
      resource_type: "video",
      folder: "videos",
      quality: "auto:good",
      ...options,
    };

    return this.uploadBuffer(buffer, videoOptions);
  }

  /**
   * Upload raw file (documents, etc.)
   */
  static async uploadRaw(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const rawOptions: UploadOptions = {
      resource_type: "raw",
      folder: "documents",
      ...options,
    };

    return this.uploadBuffer(buffer, rawOptions);
  }

  /**
   * Delete file from Cloudinary
   */
  static async deleteFile(
    publicId: string,
    resourceType: "image" | "video" | "raw" = "image"
  ): Promise<{ result: string }> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      logger.info("File deleted from Cloudinary", {
        public_id: publicId,
        result: result.result,
      });

      return result;
    } catch (error: any) {
      logger.error("Cloudinary delete failed", {
        error: error.message,
        public_id: publicId,
      });

      throw new InternalServerError("File deletion failed");
    }
  }

  /**
   * Delete multiple files from Cloudinary
   */
  static async deleteFiles(
    publicIds: string[],
    resourceType: "image" | "video" | "raw" = "image"
  ): Promise<{ deleted: Record<string, string> }> {
    try {
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType,
      });

      logger.info("Multiple files deleted from Cloudinary", {
        public_ids: publicIds,
        deleted_count: Object.keys(result.deleted).length,
      });

      return result;
    } catch (error: any) {
      logger.error("Cloudinary bulk delete failed", {
        error: error.message,
        public_ids: publicIds,
      });

      throw new InternalServerError("Bulk file deletion failed");
    }
  }

  /**
   * Get file details from Cloudinary
   */
  static async getFileDetails(
    publicId: string,
    resourceType: "image" | "video" | "raw" = "image"
  ): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      return result;
    } catch (error: any) {
      logger.error("Failed to get file details from Cloudinary", {
        error: error.message,
        public_id: publicId,
      });

      throw new InternalServerError("Failed to get file details");
    }
  }

  /**
   * Generate transformation URL
   */
  static generateUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
      gravity?: string;
      transformation?: any[];
    } = {}
  ): string {
    return cloudinary.url(publicId, {
      secure: true,
      ...options,
    });
  }

  /**
   * Generate multiple sizes for responsive images
   */
  static generateResponsiveUrls(
    publicId: string,
    sizes: number[] = [300, 600, 900, 1200]
  ): Record<string, string> {
    const urls: Record<string, string> = {};

    sizes.forEach((size) => {
      urls[`w_${size}`] = this.generateUrl(publicId, {
        width: size,
        crop: "scale",
        quality: "auto:good",
        format: "auto",
      });
    });

    return urls;
  }

  /**
   * Create folder in Cloudinary
   */
  static async createFolder(folderName: string): Promise<any> {
    try {
      const result = await cloudinary.api.create_folder(folderName);
      logger.info("Folder created in Cloudinary", { folder: folderName });
      return result;
    } catch (error: any) {
      logger.error("Failed to create folder in Cloudinary", {
        error: error.message,
        folder: folderName,
      });

      throw new InternalServerError("Failed to create folder");
    }
  }

  /**
   * List files in folder
   */
  static async listFiles(
    folderName: string,
    options: {
      resourceType?: "image" | "video" | "raw";
      maxResults?: number;
      nextCursor?: string;
    } = {}
  ): Promise<any> {
    try {
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: folderName,
        resource_type: options.resourceType || "image",
        max_results: options.maxResults || 100,
        next_cursor: options.nextCursor,
      });

      return result;
    } catch (error: any) {
      logger.error("Failed to list files from Cloudinary", {
        error: error.message,
        folder: folderName,
      });

      throw new InternalServerError("Failed to list files");
    }
  }

  /**
   * Get upload statistics
   */
  static async getUploadStats(): Promise<any> {
    try {
      const result = await cloudinary.api.usage();
      return result;
    } catch (error: any) {
      logger.error("Failed to get Cloudinary usage stats", {
        error: error.message,
      });

      throw new InternalServerError("Failed to get upload statistics");
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  static extractPublicId(url: string): string | null {
    try {
      const regex = /\/(?:v\d+\/)?([^\/]+)\.[^.]+$/;
      const match = url.match(regex);
      return match ? match[1] || null : null;
    } catch (error) {
      logger.error("Failed to extract public ID from URL", { url });
      return null;
    }
  }

  /**
   * Validate Cloudinary configuration
   */
  static validateConfig(): boolean {
    const requiredEnvVars = [
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      logger.error("Missing Cloudinary environment variables", {
        missing: missingVars,
      });
      return false;
    }

    return true;
  }
}

export default CloudinaryService;
