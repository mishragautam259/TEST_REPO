// Data models for BrainCache memories, search results, AI Summarizer, and AI Doubt Solver

export type MemoryType =
  | 'screenshot'
  | 'photo'
  | 'note'
  | 'transcript'
  | 'document'
  | 'pdf'
  | 'spreadsheet'
  | 'presentation';

export interface ExtractedDetails {
  text?: string;
  dates?: string[];
  deadlines?: string[];
  names?: string[];
}

export interface SlideItem {
  slideNumber: number;
  title: string;
  bullets: string[];
  fullText: string;
}

export interface DocumentPreviewData {
  htmlContent?: string;        // Formatted Word or Excel HTML representation
  slides?: SlideItem[];        // PPTX slide-by-slide structure
  tableData?: Array<string[]>; // Spreadsheet rows & columns
  sheetNames?: string[];       // Excel sheets
  totalCount?: number;         // Total slides, pages, or rows
}

export interface MemoryItem {
  id: string;
  type: MemoryType;
  title: string;
  description: string;
  originalText?: string;
  extractedDetails?: ExtractedDetails;
  imageBase64?: string; // base64 encoded image or document thumbnail
  fileDataUrl?: string; // base64 data url for viewing/downloading the original file
  rawFileUrl?: string; // server endpoint to stream the exact file
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  previewData?: DocumentPreviewData; // Rich visual preview data (slides, tables, formatted HTML)
  createdAt: number;
  tags?: string[];
  isPrivate?: boolean; // When true, AI is strictly forbidden from reading, analyzing, or summarizing this file
  password?: string;  // Optional password protection required to unlock and preview this file
}

export interface SearchMatchResult {
  id: string;
  score: number;
  reason: string;
}

export interface SearchResponse {
  matches: SearchMatchResult[];
  isFallback: boolean;
  fallbackMessage?: string;
}

// AI Summarizer Output
export interface MemorySummaryResult {
  executiveSummary: string;
  keyTakeaways: string[];
  coreTopics: string[];
  actionItems: string[];
  examOrCriticalTips?: string[];
}

// AI Doubt Solver Message
export interface DoubtChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  suggestedFollowUps?: string[];
  isSolvedQuestion?: boolean;
}

// Detected Question from uploaded file
export interface DetectedQuestion {
  id: string;
  questionNumber: string;
  questionText: string;
  topic?: string;
}
