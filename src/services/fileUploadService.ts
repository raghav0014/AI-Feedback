interface UploadConfig {
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  uploadUrl: string;
  apiKey?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  type?: string;
  error?: string;
}

type ProgressCallback = (progress: UploadProgress) => void;

class FileUploadService {
  private config: UploadConfig;

  constructor() {
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/json'
      ],
      uploadUrl: import.meta.env.VITE_UPLOAD_URL || '/api/upload',
      apiKey: import.meta.env.VITE_UPLOAD_API_KEY
    };
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${this.formatFileSize(this.config.maxFileSize)} limit`
      };
    }

    // Check file type
    if (!this.config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    return { valid: true };
  }

  async uploadFile(
    file: File,
    type: 'avatar' | 'review-image' | 'document' = 'document',
    onProgress?: ProgressCallback
  ): Promise<UploadResult> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    try {
      // Try cloud upload first
      const cloudResult = await this.uploadToCloud(file, type, onProgress);
      if (cloudResult.success) {
        return cloudResult;
      }

      // Fallback to local upload
      return await this.uploadLocally(file, type, onProgress);
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: 'Upload failed. Please try again.'
      };
    }
  }

  private async uploadToCloud(
    file: File,
    type: string,
    onProgress?: ProgressCallback
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            };
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              url: response.url,
              filename: response.filename,
              size: response.size,
              type: response.type
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'Invalid server response'
            });
          }
        } else {
          resolve({
            success: false,
            error: `Upload failed with status ${xhr.status}`
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload'
        });
      });

      xhr.open('POST', this.config.uploadUrl);
      
      // Add authorization header if API key is available
      if (this.config.apiKey) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.config.apiKey}`);
      }

      xhr.send(formData);
    });
  }

  private async uploadLocally(
    file: File,
    type: string,
    onProgress?: ProgressCallback
  ): Promise<UploadResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (onProgress && event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          onProgress(progress);
        }
      };

      reader.onload = () => {
        try {
          const result = reader.result as string;
          const filename = `${Date.now()}-${file.name}`;
          
          // Store in localStorage for demo purposes
          const uploads = JSON.parse(localStorage.getItem('uploaded_files') || '{}');
          uploads[filename] = {
            data: result,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
          };
          localStorage.setItem('uploaded_files', JSON.stringify(uploads));

          resolve({
            success: true,
            url: result, // Data URL for local storage
            filename,
            size: file.size,
            type: file.type
          });
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to process file locally'
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read file'
        });
      };

      reader.readAsDataURL(file);
    });
  }

  async uploadMultipleFiles(
    files: FileList | File[],
    type: 'avatar' | 'review-image' | 'document' = 'document',
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const fileArray = Array.from(files);
    const results: UploadResult[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const result = await this.uploadFile(
        file,
        type,
        onProgress ? (progress) => onProgress(i, progress) : undefined
      );
      results.push(result);
    }

    return results;
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      // Try to delete from server
      const response = await fetch(`${this.config.uploadUrl}/${filename}`, {
        method: 'DELETE',
        headers: this.config.apiKey ? {
          'Authorization': `Bearer ${this.config.apiKey}`
        } : {}
      });

      if (response.ok) {
        return true;
      }

      // Fallback to local deletion
      const uploads = JSON.parse(localStorage.getItem('uploaded_files') || '{}');
      if (uploads[filename]) {
        delete uploads[filename];
        localStorage.setItem('uploaded_files', JSON.stringify(uploads));
        return true;
      }

      return false;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  getUploadedFiles(): Array<{
    filename: string;
    type: string;
    size: number;
    uploadedAt: string;
    url: string;
  }> {
    try {
      const uploads = JSON.parse(localStorage.getItem('uploaded_files') || '{}');
      return Object.entries(uploads).map(([filename, data]: [string, any]) => ({
        filename,
        type: data.type,
        size: data.size,
        uploadedAt: data.uploadedAt,
        url: data.data
      }));
    } catch (error) {
      console.error('Error getting uploaded files:', error);
      return [];
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Image-specific methods
  async resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

export const fileUploadService = new FileUploadService();
export type { UploadResult, UploadProgress, ProgressCallback };