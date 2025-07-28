import { useState, useCallback } from 'react';
import { fileUploadService, UploadResult, UploadProgress } from '../services/fileUploadService';

interface UseFileUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const uploadFile = useCallback(async (
    file: File,
    type: 'avatar' | 'review-image' | 'document' = 'document'
  ) => {
    setUploading(true);
    setError(null);
    setProgress(null);
    setResult(null);

    try {
      const uploadResult = await fileUploadService.uploadFile(
        file,
        type,
        (progressData) => {
          setProgress(progressData);
          options.onProgress?.(progressData);
        }
      );

      setResult(uploadResult);

      if (uploadResult.success) {
        options.onSuccess?.(uploadResult);
      } else {
        const errorMessage = uploadResult.error || 'Upload failed';
        setError(errorMessage);
        options.onError?.(errorMessage);
      }

      return uploadResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  }, [options]);

  const uploadMultipleFiles = useCallback(async (
    files: FileList | File[],
    type: 'avatar' | 'review-image' | 'document' = 'document'
  ) => {
    setUploading(true);
    setError(null);
    setProgress(null);
    setResult(null);

    try {
      const results = await fileUploadService.uploadMultipleFiles(
        files,
        type,
        (fileIndex, progressData) => {
          setProgress(progressData);
          options.onProgress?.(progressData);
        }
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      if (failureCount > 0) {
        setError(`${failureCount} files failed to upload`);
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return [];
    } finally {
      setUploading(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(null);
    setError(null);
    setResult(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    result,
    uploadFile,
    uploadMultipleFiles,
    reset
  };
}