
import React from 'react';
import type { FileStatus } from '../types';
import { CheckCircleIcon, XCircleIcon, LoaderIcon, FileTextIcon, HourglassIcon } from './icons';

interface FileListProps {
  statuses: FileStatus[];
  selectedFileName: string | null;
  onFileSelect: (name: string) => void;
  processingQueueSize: number;
  totalFiles: number;
}

const StatusIcon: React.FC<{ status: FileStatus['status'] }> = ({ status }) => {
  switch (status) {
    case 'queued':
      return <HourglassIcon className="w-5 h-5 text-yellow-500" />;
    case 'parsing':
    case 'analyzing':
      return <LoaderIcon className="w-5 h-5 text-blue-500 animate-spin" />;
    case 'complete':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case 'error':
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    default:
      return <FileTextIcon className="w-5 h-5 text-gray-500" />;
  }
};

export const FileList: React.FC<FileListProps> = ({ statuses, selectedFileName, onFileSelect, processingQueueSize, totalFiles }) => {
  if (statuses.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">No files uploaded yet.</p>
      </div>
    );
  }
  
  const processedCount = totalFiles - processingQueueSize;

  return (
    <div>
        <div className="px-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
            {totalFiles > 0 && `Processing: ${processedCount}/${totalFiles} files`}
        </div>
        <ul className="space-y-2">
        {statuses.map(({ file, status, progress, message }) => (
            <li key={file.name}>
            <button
                onClick={() => onFileSelect(file.name)}
                className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3
                ${selectedFileName === file.name ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                `}
            >
                <div className="flex-shrink-0">
                    <StatusIcon status={status} />
                </div>
                <div className="flex-grow overflow-hidden">
                <p className="font-medium text-sm truncate text-gray-800 dark:text-gray-200" title={file.name}>
                    {file.name}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-300
                        ${status === 'complete' ? 'bg-green-500' : ''}
                        ${status === 'error' ? 'bg-red-500 w-full' : ''}
                        ${status === 'parsing' || status === 'analyzing' ? 'bg-blue-500' : ''}
                        `}
                        style={{ width: `${status === 'error' ? 100 : progress}%` }}
                    ></div>
                </div>
                {message && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{message}</p>}
                </div>
            </button>
            </li>
        ))}
        </ul>
    </div>
  );
};
