
export type ProcessingStatus = 'queued' | 'parsing' | 'analyzing' | 'complete' | 'error';

export interface FileStatus {
  file: File;
  status: ProcessingStatus;
  progress: number;
  message?: string;
}

export interface PublicationDetails {
  journalName: string;
  publicationYear: string;
  volume: string;
  issue: string;
  pageNumbers: string;
}

export interface Summary {
  oneLiner: string;
  significance: string;
  contributions: string;
  limitations: string;
  futureResearch: string;
}

export interface PaperAnalysis {
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  doi: string;
  publicationDetails: PublicationDetails;
  identifiedSections: string[];
  keyFindings: string[];
  methodologies: string[];
  conclusions: string[];
  researchGap: string;
  summary: Summary;
}
