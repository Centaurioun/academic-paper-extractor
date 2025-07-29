import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { ResultsDisplay } from './components/ResultsDisplay';
import { extractTextFromPdf } from './services/pdfService';
import { analyzePaper } from './services/geminiService';
import type { FileStatus, PaperAnalysis, ProcessingStatus } from './types';
import { AppIcon } from './components/icons';

// Set the worker source for pdf.js
// This is necessary for the library to work correctly when loaded from a CDN.
const pdfjsWorkerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs';
if (typeof window !== 'undefined' && 'pdfjsLib' in window) {
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
}


export default function App() {
  const [fileStatuses, setFileStatuses] = useState<Map<string, FileStatus>>(new Map());
  const [analysisResults, setAnalysisResults] = useState<Map<string, PaperAnalysis>>(new Map());
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [processingQueue, setProcessingQueue] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const updateFileStatus = useCallback((name: string, status: ProcessingStatus, progress: number = 0, message?: string) => {
    setFileStatuses(prev => {
      const newStatuses = new Map(prev);
      const existingStatus = newStatuses.get(name);

      if (existingStatus) {
        newStatuses.set(name, {
          ...existingStatus,
          status,
          progress,
          message
        });
      }
      // Note: If existingStatus is not found, we don't update.
      // This is safer than the original implementation's fallback, which created a dummy File object.
      // The app's logic should ensure a status exists before updating it.
      return newStatuses;
    });
  }, []);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    updateFileStatus(file.name, 'parsing', 0, 'Preparing to parse...');
    
    try {
      const text = await extractTextFromPdf(file, (progress, page, total) => {
        updateFileStatus(file.name, 'parsing', progress, `Parsing page ${page} of ${total}`);
      });

      updateFileStatus(file.name, 'analyzing', 100, 'Analyzing with AI...');
      const analysis = await analyzePaper(text);
      
      setAnalysisResults(prev => new Map(prev).set(file.name, analysis));
      updateFileStatus(file.name, 'complete', 100, 'Analysis complete');
      if (!selectedFileName) {
        setSelectedFileName(file.name);
      }
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      updateFileStatus(file.name, 'error', 0, errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingQueue(prev => prev.slice(1));
    }
  }, [updateFileStatus, selectedFileName]);

  useEffect(() => {
    if (!isProcessing && processingQueue.length > 0) {
      const nextFile = processingQueue[0];
      processFile(nextFile);
    }
  }, [processingQueue, isProcessing, processFile]);

  const handleFilesAdded = useCallback((files: File[]) => {
    const newFileStatuses = new Map(fileStatuses);
    const newFilesToQueue: File[] = [];

    files.forEach(file => {
      if (!newFileStatuses.has(file.name)) {
        newFileStatuses.set(file.name, { file, status: 'queued', progress: 0 });
        newFilesToQueue.push(file);
      }
    });
    
    setFileStatuses(newFileStatuses);
    setProcessingQueue(prev => [...prev, ...newFilesToQueue]);
  }, [fileStatuses]);

  const handleClearAll = () => {
    setFileStatuses(new Map());
    setAnalysisResults(new Map());
    setSelectedFileName(null);
    setProcessingQueue([]);
    setIsProcessing(false);
  };
  
  const selectedResult = selectedFileName ? analysisResults.get(selectedFileName) : undefined;
  const filesArray = Array.from(fileStatuses.values());

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans">
      <main className="flex flex-col md:flex-row h-screen">
        <aside className="w-full md:w-1/3 xl:w-1/4 h-1/2 md:h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col p-4">
          <header className="flex items-center gap-3 mb-4 p-2">
              <AppIcon className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              <div>
                <h1 className="text-xl font-bold">Academic Paper Extractor</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Upload PDFs to analyze</p>
              </div>
          </header>
          
          <FileUpload onFilesAdded={handleFilesAdded} />

          <div className="flex-grow overflow-y-auto mt-4 pr-2">
            <FileList 
              statuses={filesArray} 
              selectedFileName={selectedFileName} 
              onFileSelect={setSelectedFileName}
              processingQueueSize={processingQueue.length}
              totalFiles={filesArray.length}
            />
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClearAll}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
              disabled={filesArray.length === 0}
            >
              Clear All
            </button>
          </div>
        </aside>

        <section className="w-full md:w-2/3 xl:w-3/4 h-1/2 md:h-full overflow-y-auto">
          <ResultsDisplay 
            result={selectedResult} 
            fileName={selectedFileName}
            isLoading={isProcessing && selectedFileName === processingQueue[0]?.name}
          />
        </section>
      </main>
    </div>
  );
}