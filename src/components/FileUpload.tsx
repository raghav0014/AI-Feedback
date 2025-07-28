import React, { useRef, useState } from 'react';
import { Upload, X, File, Image, CheckCircle, AlertCircle } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';

interface FileUploadProps {
  onUpload?: (result: any) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  type?: 'avatar' | 'review-image' | 'document';
  className?: string;
}

export default function FileUpload({
  onUpload,
  accept = 'image/*,.pdf,.txt,.json',
  multiple = false,
  maxFiles = 5,
  type = 'document',
  className = ''
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { uploading, progress, error, uploadFile, uploadMultipleFiles, reset } = useFileUpload({
    onSuccess: (result) => {
      onUpload?.(result);
      setSelectedFiles([]);
    },
    onError: (error) => {
      console.error('Upload error:', error);
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    const limitedFiles = multiple ? fileArray.slice(0, maxFiles) : [fileArray[0]];
    setSelectedFiles(limitedFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    if (multiple && selectedFiles.length > 1) {
      await uploadMultipleFiles(selectedFiles, type);
    } else {
      await uploadFile(selectedFiles[0], type);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-2">
            {dragActive ? 'Drop files here' : 'Upload files'}
          </div>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or{' '}
            <button
              type="button"
              onClick={openFileDialog}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              browse
            </button>
          </p>
          <p className="text-sm text-gray-500">
            {multiple ? `Up to ${maxFiles} files` : 'Single file'} • Max 10MB each
          </p>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Files</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded"
                  disabled={uploading}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload {selectedFiles.length > 1 ? 'Files' : 'File'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      {uploading && progress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={reset}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}