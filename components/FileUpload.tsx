
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFilesAdded: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      if(pdfFiles.length > 0) {
        onFilesAdded(pdfFiles);
      } else {
        alert("Please upload PDF files only.");
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [onFilesAdded]);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
        ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        multiple
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="flex flex-col items-center">
          <UploadIcon className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
          <p className="font-semibold text-blue-600 dark:text-blue-400">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">PDF files only</p>
        </div>
      </label>
    </div>
  );
};
