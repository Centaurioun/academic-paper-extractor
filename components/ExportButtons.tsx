
import React from 'react';
import type { PaperAnalysis } from '../types';
import { DownloadIcon } from './icons';

// Type declarations for jspdf and jspdf-autotable from CDN
declare const jspdf: any;

interface ExportButtonsProps {
  result: PaperAnalysis;
  fileName: string;
}

const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const escapeCsvField = (field: string | undefined | null): string => {
    if (field === null || field === undefined) {
        return '""';
    }
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        const escapedStr = str.replace(/"/g, '""');
        return `"${escapedStr}"`;
    }
    return `"${str}"`;
};


export const ExportButtons: React.FC<ExportButtonsProps> = ({ result, fileName }) => {
  const baseFileName = fileName.replace(/\.pdf$/i, '');

  const exportJSON = () => {
    const jsonContent = JSON.stringify(result, null, 2);
    downloadFile(jsonContent, `${baseFileName}_analysis.json`, 'application/json');
  };

  const exportCSV = () => {
    const headers = ['Category', 'Field', 'Value'];
    const rows: (string | null)[][] = [
        ['Main', 'Title', result.title],
        ['Main', 'Authors', result.authors.join('; ')],
        ['Main', 'DOI', result.doi],
        ['Main', 'Research Gap', result.researchGap],
        ['Publication', 'Journal Name', result.publicationDetails.journalName],
        ['Publication', 'Publication Year', result.publicationDetails.publicationYear],
        ['Publication', 'Volume', result.publicationDetails.volume],
        ['Publication', 'Issue', result.publicationDetails.issue],
        ['Publication', 'Page Numbers', result.publicationDetails.pageNumbers],
        ['Content', 'Abstract', result.abstract],
        ['Content', 'Keywords', result.keywords.join('; ')],
        ['Content', 'Identified Sections', result.identifiedSections.join('; ')],
        ...result.keyFindings.map((finding, i) => ['Key Finding', `Finding ${i + 1}`, finding]),
        ...result.methodologies.map((method, i) => ['Methodology', `Method ${i + 1}`, method]),
        ...result.conclusions.map((conclusion, i) => ['Conclusion', `Conclusion ${i + 1}`, conclusion]),
        ['AI Summary', 'Significance', result.summary.significance],
        ['AI Summary', 'Contributions', result.summary.contributions],
        ['AI Summary', 'Limitations', result.summary.limitations],
        ['AI Summary', 'Future Research', result.summary.futureResearch],
    ];

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(escapeCsvField).join(','))
    ].join('\n');

    downloadFile(csvContent, `${baseFileName}_analysis.csv`, 'text/csv;charset=utf-8;');
  };

  const exportMarkdown = () => {
    const md = `
# Analysis for: ${result.title}

**Authors:** ${result.authors.join(', ')}

**DOI:** ${result.doi || 'N/A'}

---

## Publication Details
- **Journal:** ${result.publicationDetails.journalName || 'N/A'}
- **Publication Year:** ${result.publicationDetails.publicationYear || 'N/A'}
- **Volume:** ${result.publicationDetails.volume || 'N/A'}
- **Issue:** ${result.publicationDetails.issue || 'N/A'}
- **Pages:** ${result.publicationDetails.pageNumbers || 'N/A'}

---

## Abstract
${result.abstract || 'Not extracted.'}

## Research Gap
${result.researchGap || 'Not specified.'}

## Key Findings
${result.keyFindings.length > 0 ? result.keyFindings.map(f => `- ${f}`).join('\n') : 'None extracted.'}

## Methodologies
${result.methodologies.length > 0 ? result.methodologies.map(m => `- ${m}`).join('\n') : 'None extracted.'}

## Conclusions
${result.conclusions.length > 0 ? result.conclusions.map(c => `- ${c}`).join('\n') : 'None extracted.'}

## AI Generated Summary
- **Significance:** ${result.summary.significance || 'N/A'}
- **Contributions:** ${result.summary.contributions || 'N/A'}
- **Limitations:** ${result.summary.limitations || 'N/A'}
- **Future Research:** ${result.summary.futureResearch || 'N/A'}

---

## Additional Metadata
- **Keywords:** ${result.keywords.join(', ') || 'None'}
- **Identified Sections:** ${result.identifiedSections.join(', ') || 'None'}
`;
    downloadFile(md.trim(), `${baseFileName}_analysis.md`, 'text/markdown');
  };
  
  const exportPDF = () => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    let yPos = 20;
    const margin = 15;
    const textWidth = 180;

    const checkAndAddPage = (spaceNeeded = 20) => {
        if (yPos > 297 - margin - spaceNeeded) { // A4 height is 297mm
            doc.addPage();
            yPos = margin;
        }
    };
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    const titleLines = doc.splitTextToSize(result.title, textWidth);
    checkAndAddPage(titleLines.length * 7);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 7;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    const authorLines = doc.splitTextToSize(`Authors: ${result.authors.join(', ')}`, textWidth);
    checkAndAddPage(authorLines.length * 4 + 10);
    doc.text(authorLines, margin, yPos);
    yPos += authorLines.length * 4 + 10;

    const addSection = (title: string, content: string | string[], isList: boolean = false) => {
      if (!content || (Array.isArray(content) && content.length === 0)) return;
      
      checkAndAddPage();
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0);
      doc.text(title, margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(80);
      const text = isList && Array.isArray(content) ? content.map(item => `• ${item}`).join('\n') : Array.isArray(content) ? content.join(', ') : content;
      const splitText = doc.splitTextToSize(text, textWidth);
      checkAndAddPage(splitText.length * 4 + 6);
      doc.text(splitText, margin, yPos);
      yPos += splitText.length * 4 + 6;
    };
    
    addSection('Abstract', result.abstract);
    addSection('Research Gap', result.researchGap);
    addSection('Key Findings', result.keyFindings, true);
    addSection('Methodologies', result.methodologies, true);
    addSection('Conclusions', result.conclusions, true);
    
    checkAndAddPage();
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text('AI Generated Summary', margin, yPos);
    yPos += 8;
    
    const summaryContent = [
        `Significance: ${result.summary.significance}`,
        `Contributions: ${result.summary.contributions}`,
        `Limitations: ${result.summary.limitations}`,
        `Future Research: ${result.summary.futureResearch}`
    ].join('\n\n');
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80);
    const summaryLines = doc.splitTextToSize(summaryContent, textWidth);
    checkAndAddPage(summaryLines.length * 4 + 6);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 4 + 6;

    checkAndAddPage();
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text('Publication Metadata', margin, yPos);
    yPos += 8;
    const metadataContent = [
        `DOI: ${result.doi || 'N/A'}`,
        `Journal: ${result.publicationDetails.journalName || 'N/A'}`,
        `Publication Year: ${result.publicationDetails.publicationYear || 'N/A'}`,
        `Volume: ${result.publicationDetails.volume || 'N/A'}`,
        `Issue: ${result.publicationDetails.issue || 'N/A'}`,
        `Pages: ${result.publicationDetails.pageNumbers || 'N/A'}`,
        `Keywords: ${result.keywords.join(', ') || 'N/A'}`,
        `Identified Sections: ${result.identifiedSections.join(', ') || 'N/A'}`
    ].join('\n');
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80);
    const metadataLines = doc.splitTextToSize(metadataContent, textWidth);
    checkAndAddPage(metadataLines.length * 4);
    doc.text(metadataLines, margin, yPos);

    doc.save(`${baseFileName}_report.pdf`);
  };

  return (
    <div className="relative inline-block text-left">
      <div className="group">
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
        >
          <DownloadIcon className="w-5 h-5 mr-2" />
          Export
        </button>
        <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity invisible group-hover:visible group-focus-within:visible z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <a href="#" onClick={e => {e.preventDefault(); exportJSON()}} className="text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">JSON</a>
            <a href="#" onClick={e => {e.preventDefault(); exportMarkdown()}} className="text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">Markdown</a>
            <a href="#" onClick={e => {e.preventDefault(); exportPDF()}} className="text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">PDF Report</a>
            <a href="#" onClick={e => {e.preventDefault(); exportCSV()}} className="text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">CSV</a>
          </div>
        </div>
      </div>
    </div>
  );
};