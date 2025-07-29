
import React from 'react';
import type { PaperAnalysis } from '../types';
import { Accordion, AccordionItem } from './Accordion';
import { ExportButtons } from './ExportButtons';
import { FileTextIcon, LoaderIcon } from './icons';

interface ResultsDisplayProps {
  result: PaperAnalysis | undefined;
  fileName: string | null;
  isLoading: boolean;
}

const SectionContent: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  if (!children || (Array.isArray(children) && children.length === 0 && typeof children !== 'string')) {
    return (
      <p className="text-sm text-gray-500 italic px-4 pb-4">
        No {title.toLowerCase()} information extracted.
      </p>
    );
  }
  return <div className="px-4 pb-4 text-sm leading-relaxed">{children}</div>;
};

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-disc list-inside space-y-1">
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, fileName, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-8 text-gray-500 dark:text-gray-400">
        <LoaderIcon className="w-16 h-16 animate-spin text-blue-500" />
        <p className="mt-4 text-lg">Analyzing "{fileName}"...</p>
        <p>This may take a moment.</p>
      </div>
    );
  }

  if (!result || !fileName) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-8 text-gray-500 dark:text-gray-400">
        <FileTextIcon className="w-24 h-24 text-gray-300 dark:text-gray-600" />
        <h2 className="mt-4 text-xl font-semibold">No file selected</h2>
        <p>Select a completed file from the left to view its analysis.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-800/50 h-full">
      <header className="mb-6">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Analysis Result</p>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1" title={result.title}>
                    {result.title || "Untitled Paper"}
                </h2>
            </div>
            <ExportButtons result={result} fileName={fileName} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {result.authors.join(', ')}
        </p>
        {result.summary?.oneLiner && (
          <blockquote className="mt-4 pl-4 border-l-4 border-blue-500 italic text-gray-700 dark:text-gray-300">
            <p>"{result.summary.oneLiner}"</p>
          </blockquote>
        )}
      </header>

      <Accordion type="multiple" defaultValue={['abstract', 'summary', 'research-gap']}>
        <AccordionItem value="abstract" title="Abstract">
            <SectionContent title="Abstract"><p>{result.abstract}</p></SectionContent>
        </AccordionItem>
        <AccordionItem value="research-gap" title="Identified Research Gap">
            <SectionContent title="Research Gap"><p>{result.researchGap}</p></SectionContent>
        </AccordionItem>
        <AccordionItem value="key-findings" title="Key Findings">
            <SectionContent title="Key Findings"><BulletList items={result.keyFindings} /></SectionContent>
        </AccordionItem>
        <AccordionItem value="summary" title="AI Generated Summary">
            <SectionContent title="Summary">
                <div className="space-y-4">
                    <div><strong className="font-semibold">Significance:</strong> {result.summary.significance}</div>
                    <div><strong className="font-semibold">Contributions:</strong> {result.summary.contributions}</div>
                    <div><strong className="font-semibold">Limitations:</strong> {result.summary.limitations}</div>
                    <div><strong className="font-semibold">Future Research:</strong> {result.summary.futureResearch}</div>
                </div>
            </SectionContent>
        </AccordionItem>
        <AccordionItem value="methodology" title="Methodology">
            <SectionContent title="Methodology"><BulletList items={result.methodologies} /></SectionContent>
        </AccordionItem>
        <AccordionItem value="conclusion" title="Conclusion">
            <SectionContent title="Conclusion"><BulletList items={result.conclusions} /></SectionContent>
        </AccordionItem>
         <AccordionItem value="metadata" title="Publication Metadata">
            <SectionContent title="Metadata">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Journal:</strong> {result.publicationDetails.journalName || 'N/A'}</div>
                    <div><strong>Publication Year:</strong> {result.publicationDetails.publicationYear || 'N/A'}</div>
                    <div><strong>DOI:</strong> {result.doi ? <a href={`https://doi.org/${result.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{result.doi}</a> : 'N/A'}</div>
                    <div><strong>Volume:</strong> {result.publicationDetails.volume || 'N/A'}</div>
                    <div><strong>Issue:</strong> {result.publicationDetails.issue || 'N/A'}</div>
                    <div><strong>Pages:</strong> {result.publicationDetails.pageNumbers || 'N/A'}</div>
                    <div><strong>Keywords:</strong> {result.keywords.join(', ') || 'N/A'}</div>
                    <div><strong>Identified Sections:</strong> {result.identifiedSections.join(', ') || 'N/A'}</div>
                </div>
            </SectionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
