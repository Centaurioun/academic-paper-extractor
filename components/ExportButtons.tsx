import React from 'react';
import type { PaperAnalysis } from '../types';
import { DownloadIcon } from './icons';

// Type declarations for jspdf and jspdf-autotable from CDN
declare const jspdf: any;

interface ExportButtonsProps {
  result: PaperAnalysis;
  fileName: string;
}

const downloadFile = (content: string, fileName:string, mimeType: string) => {
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
    // Escape quotes and wrap in quotes if it contains a comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        const escapedStr = str.replace(/"/g, '""');
        return `"${escapedStr}"`;
    }
    return `"${str}"`; // Always quote fields for safety
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
        ['Main', 'One-Liner Summary', result.summary?.oneLiner],
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
        ['AI Summary', 'Significance', result.summary?.significance],
        ['AI Summary', 'Contributions', result.summary?.contributions],
        ['AI Summary', 'Limitations', result.summary?.limitations],
        ['AI Summary', 'Future Research', result.summary?.futureResearch],
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

> ${result.summary?.oneLiner || 'No one-line summary provided.'}

**Authors:** ${result.authors.join(', ')}

**DOI:** ${result.doi || 'N/A'}

---

## Abstract
${result.abstract || 'Not extracted.'}

## Research Gap
${result.researchGap || 'Not specified.'}

## AI Generated Summary
- **Significance:** ${result.summary?.significance || 'N/A'}
- **Contributions:** ${result.summary?.contributions || 'N/A'}
- **Limitations:** ${result.summary?.limitations || 'N/A'}
- **Future Research:** ${result.summary?.futureResearch || 'N/A'}

## Key Findings
${result.keyFindings.length > 0 ? result.keyFindings.map(f => `- ${f}`).join('\n') : 'None extracted.'}

## Methodologies
${result.methodologies.length > 0 ? result.methodologies.map(m => `- ${m}`).join('\n') : 'None extracted.'}

## Conclusions
${result.conclusions.length > 0 ? result.conclusions.map(c => `- ${c}`).join('\n') : 'None extracted.'}

---

## Publication Details
- **Journal:** ${result.publicationDetails.journalName || 'N/A'}
- **Publication Year:** ${result.publicationDetails.publicationYear || 'N/A'}
- **Volume:** ${result.publicationDetails.volume || 'N/A'}
- **Issue:** ${result.publicationDetails.issue || 'N/A'}
- **Pages:** ${result.publicationDetails.pageNumbers || 'N/A'}

## Additional Metadata
- **Keywords:** ${result.keywords.join(', ') || 'None'}
- **Identified Sections:** ${result.identifiedSections.join(', ') || 'None'}
`;
    downloadFile(md.trim(), `${baseFileName}_analysis.md`, 'text/markdown');
  };
  
  const exportPDF = () => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    let yPos = 25;
    const margin = 20;
    const textWidth = doc.internal.pageSize.getWidth() - (margin * 2);
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- PDF Generation Helpers ---

    const checkAndAddPage = (spaceNeeded = 20) => {
        if (yPos > pageHeight - margin - spaceNeeded) {
            doc.addPage();
            yPos = margin + 5;
        }
    };

    const addSectionTitle = (title: string, fontSize = 14, topMargin = 8, bottomMargin = 6) => {
        checkAndAddPage(fontSize + topMargin + bottomMargin);
        yPos += topMargin;
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Pure black for section titles
        doc.text(title, margin, yPos);
        yPos += bottomMargin;
    };

    const addSubsectionTitle = (title: string) => {
        checkAndAddPage(12);
        yPos += 4;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Pure black for subsection titles
        doc.text(title, margin, yPos);
        yPos += 5;
    };

    const addDetailLine = (label: string, value: string | undefined | null, isSubDetail = false) => {
        if (!value && typeof value !== 'string') return;
        
        const val = String(value || 'N/A').trim();
        if (!val || val === 'N/A') return;
        
        const lineHeight = 5.5;
        const labelIndent = isSubDetail ? margin + 8 : margin + 4;
        const fontSize = 10;

        doc.setFontSize(fontSize);
        
        // Calculate label width
        doc.setFont('helvetica', 'bold');
        const labelText = `${label}:`;
        const labelWidth = doc.getTextWidth(labelText) + 3;
        
        const valueIndent = labelIndent + labelWidth;
        const valueWidth = textWidth - (labelIndent - margin) - labelWidth;
        
        // Split value text to fit width with proper justification
        doc.setFont('helvetica', 'normal');
        const valueLines = doc.splitTextToSize(val, valueWidth);
        
        checkAndAddPage(valueLines.length * lineHeight + 3);

        // Draw label (bold black) and first value line on the same line
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Pure black for labels
        doc.text(labelText, labelIndent, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40); // Dark gray for content
        
        if (valueLines.length > 0) {
            doc.text(valueLines[0], valueIndent, yPos, { align: 'left' });
        }
        
        yPos += lineHeight;

        // Draw subsequent value lines, properly indented and justified
        for (let i = 1; i < valueLines.length; i++) {
            checkAndAddPage(lineHeight);
            doc.text(valueLines[i], valueIndent, yPos, { align: 'left' });
            yPos += lineHeight;
        }

        yPos += 2; // Spacing after each detail line
    };

    const addJustifiedText = (text: string, fontSize = 10, textColor = [60, 60, 60]) => {
        if (!text || !text.trim()) return;
        
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        const lineHeight = fontSize * 0.55;
        const lines = doc.splitTextToSize(text.trim(), textWidth);
        
        checkAndAddPage(lines.length * lineHeight + 8);
        
        // Add justified text with proper spacing
        for (let i = 0; i < lines.length; i++) {
            doc.text(lines[i], margin, yPos, { 
                align: 'left',
                maxWidth: textWidth 
            });
            yPos += lineHeight;
        }
        
        yPos += 6; // Extra spacing after paragraphs
    };

    const addListSection = (title: string, content: string[], bulletStyle = '•') => {
        if (!content || content.length === 0) return;
        
        addSubsectionTitle(title);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        
        const bulletIndent = margin + 4;
        const textIndent = margin + 12;
        const listTextWidth = textWidth - 12;
        const lineHeight = 5.5;
        
        content.forEach((item, index) => {
            if (!item || !item.trim()) return;
            
            const itemLines = doc.splitTextToSize(item.trim(), listTextWidth);
            checkAndAddPage(itemLines.length * lineHeight + 3);
            
            // Add bullet point
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(bulletStyle, bulletIndent, yPos);
            
            // Add first line of content
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            if (itemLines.length > 0) {
                doc.text(itemLines[0], textIndent, yPos);
            }
            yPos += lineHeight;
            
            // Add continuation lines with proper indentation
            for (let i = 1; i < itemLines.length; i++) {
                checkAndAddPage(lineHeight);
                doc.text(itemLines[i], textIndent, yPos);
                yPos += lineHeight;
            }
            
            yPos += 2; // Space between list items
        });
        
        yPos += 4; // Extra space after the list
    };

    // --- PDF Content Generation ---

    // Document Header with improved typography
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Pure black for title
    const titleLines = doc.splitTextToSize(result.title, textWidth);
    checkAndAddPage(titleLines.length * 8 + 15);
    doc.text(titleLines, margin, yPos, { align: 'left' });
    yPos += titleLines.length * 8 + 8;
    
    // Authors
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    const authorText = result.authors.join(', ');
    const authorLines = doc.splitTextToSize(authorText, textWidth);
    checkAndAddPage(authorLines.length * 6 + 4);
    doc.text(authorLines, margin, yPos, { align: 'left' });
    yPos += authorLines.length * 6 + 4;
    
    // One-liner summary with elegant styling
    if (result.summary?.oneLiner) {
        yPos += 4;
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(11);
        const oneLinerLines = doc.splitTextToSize(`"${result.summary.oneLiner}"`, textWidth - 10);
        checkAndAddPage(oneLinerLines.length * 5.5 + 12);
        doc.text(oneLinerLines, margin + 5, yPos, { align: 'left' });
        yPos += oneLinerLines.length * 5.5 + 12;
    }

    // Add a subtle separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, margin + textWidth, yPos);
    yPos += 10;

    // Main Content Sections
    if (result.abstract) {
        addSectionTitle('Abstract');
        addJustifiedText(result.abstract);
    }
    
    if (result.researchGap) {
        addSectionTitle('Research Gap');
        addJustifiedText(result.researchGap);
    }
    
    // AI Generated Summary Section with improved formatting
    if (result.summary) {
        addSectionTitle('AI Generated Summary');
        
        if (result.summary.significance) {
            addDetailLine('Significance', result.summary.significance);
        }
        if (result.summary.contributions) {
            addDetailLine('Contributions', result.summary.contributions);
        }
        if (result.summary.limitations) {
            addDetailLine('Limitations', result.summary.limitations);
        }
        if (result.summary.futureResearch) {
            addDetailLine('Future Research', result.summary.futureResearch);
        }
        yPos += 4;
    }
    
    // List Sections with better formatting
    if (result.keyFindings && result.keyFindings.length > 0) {
        addSectionTitle('Key Findings');
        addListSection('', result.keyFindings);
    }
    
    if (result.methodologies && result.methodologies.length > 0) {
        addSectionTitle('Methodologies');
        addListSection('', result.methodologies);
    }
    
    if (result.conclusions && result.conclusions.length > 0) {
        addSectionTitle('Conclusions');
        addListSection('', result.conclusions);
    }

    // Publication Metadata Section
    addSectionTitle('Publication Metadata');
    
    if (result.doi) {
        addDetailLine('DOI', result.doi);
    }
    if (result.publicationDetails.journalName) {
        addDetailLine('Journal', result.publicationDetails.journalName);
    }
    if (result.publicationDetails.publicationYear) {
        addDetailLine('Publication Year', result.publicationDetails.publicationYear);
    }
    if (result.publicationDetails.volume) {
        addDetailLine('Volume', result.publicationDetails.volume);
    }
    if (result.publicationDetails.issue) {
        addDetailLine('Issue', result.publicationDetails.issue);
    }
    if (result.publicationDetails.pageNumbers) {
        addDetailLine('Pages', result.publicationDetails.pageNumbers);
    }
    if (result.keywords && result.keywords.length > 0) {
        addDetailLine('Keywords', result.keywords.join(', '));
    }
    if (result.identifiedSections && result.identifiedSections.length > 0) {
        addDetailLine('Identified Sections', result.identifiedSections.join(', '));
    }

    // Add footer with generation timestamp
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        const timestamp = new Date().toLocaleString();
        doc.text(`Generated on ${timestamp}`, margin, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, margin + textWidth - 30, pageHeight - 10);
    }

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
            <a href="#" onClick={e => {e.preventDefault(); exportCSV()}} className="text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">CSV</a>
            <a href="#" onClick={e => {e.preventDefault(); exportMarkdown()}} className="text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">Markdown</a>
            <a href="#" onClick={e => {e.preventDefault(); exportPDF()}} className="text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">PDF Report</a>
          </div>
        </div>
      </div>
    </div>
  );
};