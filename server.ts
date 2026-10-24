import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

// Support base64 image uploads up to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize the Gemini client on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Robust model caller that gracefully falls back across valid Gemini models if quota (429) is encountered
async function generateContentWithFallback(params: { contents: any; config?: any }) {
  const modelsToTry = [
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return { response, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      // If 429 or model not available, try next model
      console.warn(`Model ${model} failed (${err?.status || err?.message}). Trying fallback...`);
    }
  }

  throw lastError || new Error('All models exhausted');
}

// In-memory cache for fast search queries
const searchCache = new Map<string, { matches: any[]; isFallback: boolean; timestamp: number }>();

// Simple keyword matching fallback when Gemini is unavailable or errors
function fallbackKeywordSearch(
  query: string,
  memories: Array<{
    id: string;
    title: string;
    description: string;
    text?: string;
    dates?: string[];
    deadlines?: string[];
    names?: string[];
  }>
) {
  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryWords.length === 0) {
    return memories.slice(0, 3).map((m) => ({
      id: m.id,
      score: 0.5,
      reason: 'Recent memory matching your library query.',
    }));
  }

  const scored = memories.map((mem) => {
    let score = 0;
    const titleLower = (mem.title || '').toLowerCase();
    const descLower = (mem.description || '').toLowerCase();
    const textLower = (mem.text || '').toLowerCase();
    const datesText = (mem.dates || []).join(' ').toLowerCase();
    const deadlinesText = (mem.deadlines || []).join(' ').toLowerCase();
    const namesText = (mem.names || []).join(' ').toLowerCase();

    const matchedTerms: string[] = [];

    for (const word of queryWords) {
      if (titleLower.includes(word)) {
        score += 5;
        matchedTerms.push(word);
      }
      if (deadlinesText.includes(word)) {
        score += 4;
        matchedTerms.push(word);
      }
      if (descLower.includes(word)) {
        score += 3;
        matchedTerms.push(word);
      }
      if (namesText.includes(word)) {
        score += 3;
        matchedTerms.push(word);
      }
      if (datesText.includes(word)) {
        score += 2;
        matchedTerms.push(word);
      }
      if (textLower.includes(word)) {
        score += 1;
        matchedTerms.push(word);
      }
    }

    const uniqueMatched = Array.from(new Set(matchedTerms));
    let reason = 'Matched relevant text in this memory.';
    if (uniqueMatched.length > 0) {
      reason = `Keyword match on "${uniqueMatched.slice(0, 3).join(', ')}" in title or notes.`;
    }

    return {
      id: mem.id,
      score,
      reason,
    };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// Store uploaded files in memory to serve exact raw files for in-browser previewing
const uploadedFilesMap = new Map<string, { buffer: Buffer; mimeType: string; fileName: string; createdAt: number }>();

// Route to stream the exact raw file
app.get('/api/files/:id', (req, res) => {
  const item = uploadedFilesMap.get(req.params.id);
  if (!item) {
    return res.status(404).send('File not found');
  }
  res.setHeader('Content-Type', item.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(item.fileName)}"`);
  return res.send(item.buffer);
});

// Helper to extract formatted HTML and raw text from Word documents (.docx)
async function extractWordPreview(buffer: Buffer): Promise<{ html: string; text: string }> {
  try {
    const htmlResult = await mammoth.convertToHtml({ buffer });
    const textResult = await mammoth.extractRawText({ buffer });
    return {
      html: htmlResult.value || '',
      text: textResult.value || '',
    };
  } catch (e) {
    console.warn('Word parsing notice:', e);
    return { html: '', text: '' };
  }
}

// Helper to extract table rows, columns, and sheet data from Excel spreadsheets (.xlsx, .xls)
function extractExcelPreview(buffer: Buffer): {
  tableData: string[][];
  sheetNames: string[];
  fullText: string;
} {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames || [];
    let tableData: string[][] = [];
    let fullText = '';

    if (sheetNames.length > 0) {
      const firstSheet = workbook.Sheets[sheetNames[0]];
      const rawJson = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
      tableData = (rawJson as string[][]).slice(0, 100); // up to 100 rows for preview
    }

    for (const name of sheetNames) {
      const sheet = workbook.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        fullText += `[Sheet: ${name}]\n${csv}\n\n`;
      }
    }

    return { tableData, sheetNames, fullText: fullText.slice(0, 40000) };
  } catch (e) {
    console.warn('Excel parsing notice:', e);
    return { tableData: [], sheetNames: [], fullText: '' };
  }
}

// Helper to unzip and extract slide-by-slide structure, titles, and text from PPTX presentations
async function extractPptxPreview(buffer: Buffer): Promise<{
  slides: Array<{ slideNumber: number; title: string; bullets: string[]; fullText: string }>;
  fullText: string;
}> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles: string[] = [];
    zip.forEach((relativePath) => {
      if (relativePath.match(/^ppt\/slides\/slide\d+\.xml$/)) {
        slideFiles.push(relativePath);
      }
    });

    slideFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '') || '0', 10);
      const numB = parseInt(b.replace(/\D/g, '') || '0', 10);
      return numA - numB;
    });

    const slides: Array<{ slideNumber: number; title: string; bullets: string[]; fullText: string }> = [];
    let fullText = '';

    for (let i = 0; i < slideFiles.length; i++) {
      const path = slideFiles[i];
      const slideNumber = i + 1;
      const xml = (await zip.file(path)?.async('text')) || '';

      // Extract paragraphs (<a:p>)
      const paragraphMatches = xml.match(/<a:p[\s>][\s\S]*?<\/a:p>/g) || [];
      const paragraphs: string[] = [];

      for (const pXml of paragraphMatches) {
        const textMatches = pXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
        const pText = textMatches
          .map((t) => t.replace(/<[^>]+>/g, '').trim())
          .filter(Boolean)
          .join(' ');
        if (pText) {
          paragraphs.push(pText);
        }
      }

      // If paragraph matching didn't yield text, extract all text tags directly
      if (paragraphs.length === 0) {
        const directMatches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
        for (const tm of directMatches) {
          const clean = tm.replace(/<[^>]+>/g, '').trim();
          if (clean) paragraphs.push(clean);
        }
      }

      const slideTitle = paragraphs[0] || `Slide ${slideNumber}`;
      const bullets = paragraphs.slice(1);
      const slideText = paragraphs.join('\n');

      slides.push({
        slideNumber,
        title: slideTitle,
        bullets,
        fullText: slideText,
      });

      fullText += `--- Slide ${slideNumber}: ${slideTitle} ---\n${slideText}\n\n`;
    }

    return { slides, fullText: fullText.trim() };
  } catch (e) {
    console.warn('PPTX parsing notice:', e);
    return { slides: [], fullText: '' };
  }
}

// 1. Analyze any file (PDF, Word, Excel, PPT, Image, Text) with rich preview data and minimal text output
app.post('/api/analyze-file', async (req, res) => {
  try {
    const { fileBase64, fileName = 'uploaded-file', mimeType = 'application/octet-stream', fileSize } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: 'File data is required.' });
    }

    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const lowerName = fileName.toLowerCase();

    // Cache exact raw file for direct in-browser streaming and viewer embedding
    const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    uploadedFilesMap.set(fileId, {
      buffer,
      mimeType: mimeType || 'application/octet-stream',
      fileName,
      createdAt: Date.now(),
    });

    // Determine category and build rich preview data
    let category: 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'screenshot' | 'note' = 'document';
    let isImage = false;
    let isPdf = false;
    let extractedDocumentText = '';
    let previewData: any = {};

    if (mimeType.startsWith('image/') || lowerName.match(/\.(png|jpg|jpeg|webp|gif|svg)$/)) {
      category = 'screenshot';
      isImage = true;
    } else if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
      category = 'pdf';
      isPdf = true;
    } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
      category = 'spreadsheet';
      const excelPreview = extractExcelPreview(buffer);
      extractedDocumentText = excelPreview.fullText;
      previewData = {
        tableData: excelPreview.tableData,
        sheetNames: excelPreview.sheetNames,
        totalCount: excelPreview.tableData.length,
      };
    } else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      category = 'document';
      const wordPreview = await extractWordPreview(buffer);
      extractedDocumentText = wordPreview.text;
      previewData = {
        htmlContent: wordPreview.html,
      };
    } else if (lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt')) {
      category = 'presentation';
      const pptxPreview = await extractPptxPreview(buffer);
      extractedDocumentText = pptxPreview.fullText;
      previewData = {
        slides: pptxPreview.slides,
        totalCount: pptxPreview.slides.length,
      };
    } else if (mimeType.startsWith('text/') || lowerName.match(/\.(txt|md|json|csv|log)$/)) {
      category = 'document';
      extractedDocumentText = buffer.toString('utf-8').slice(0, 40000);
    }

    const minimalPrompt = `You are BrainCache's minimal memory analyzer.
Analyze this file: "${fileName}" (type: ${category}).
Provide a MINIMAL, CRISP, LESS-TEXT analysis:
1. title: Short punchy title (3-5 words max, e.g. "Triple Integration Calculus" or "CS301 Lecture 14").
2. description: Exactly ONE brief sentence summary (maximum 15-20 words). Be direct, zero fluff.
3. dates: Array of up to 2 key dates (or empty []).
4. deadlines: Array of up to 2 critical deadlines (or empty []).
5. names: Array of up to 2 key people/brands (or empty []).
6. extractedText: 1-2 sentence core takeaway.`;

    let contentsPayload: any;

    if (isImage) {
      contentsPayload = {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: mimeType.startsWith('image/') ? mimeType : 'image/png' } },
          { text: minimalPrompt },
        ],
      };
    } else if (isPdf) {
      contentsPayload = {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: 'application/pdf' } },
          { text: minimalPrompt },
        ],
      };
    } else {
      const sampleText = extractedDocumentText || `File: ${fileName}`;
      contentsPayload = {
        parts: [
          { text: `${minimalPrompt}\n\nDocument Content Excerpt:\n${sampleText.slice(0, 25000)}` },
        ],
      };
    }

    const { response } = await generateContentWithFallback({
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Short 3-5 word title',
            },
            description: {
              type: Type.STRING,
              description: 'One single concise sentence summary (max 15-20 words)',
            },
            dates: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 2 key dates',
            },
            deadlines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 2 critical deadlines',
            },
            names: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 2 key names',
            },
            extractedText: {
              type: Type.STRING,
              description: 'Short text summary or key snippet',
            },
          },
          required: ['title', 'description'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No analysis generated by Gemini');
    }

    const parsed = JSON.parse(text);
    return res.json({
      success: true,
      category,
      analysis: {
        ...parsed,
        fileType: category,
        fileName,
        fileSize,
        fileId,
        rawFileUrl: `/api/files/${fileId}`,
        extractedText: extractedDocumentText || parsed.extractedText || parsed.description,
        previewData,
      },
    });
  } catch (error: any) {
    console.error('File analysis error:', error);
    const fileName = req.body?.fileName || 'Uploaded file';
    return res.json({
      success: true,
      category: 'document',
      analysis: {
        title: fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        description: `Preserved ${fileName} in memory cache.`,
        dates: [],
        deadlines: [],
        names: [],
        fileType: 'document',
        fileName,
      },
    });
  }
});

// Backwards-compatible legacy image route
app.post('/api/analyze-image', async (req, res) => {
  req.url = '/api/analyze-file';
  req.body.fileBase64 = req.body.imageBase64;
  req.body.fileName = 'screenshot.png';
  return app._router.handle(req, res);
});

// 2. Semantic plain-language search with Gemini
app.post('/api/search', async (req, res) => {
  const { query, memories } = req.body;

  if (!query || typeof query !== 'string' || !Array.isArray(memories) || memories.length === 0) {
    return res.json({ matches: [], isFallback: false });
  }

  // Filter out any private files: AI will NEVER receive or read private documents
  const nonPrivateMemories = memories.filter((m) => !m.isPrivate);
  if (nonPrivateMemories.length === 0) {
    return res.json({ matches: [], isFallback: false });
  }

  // Check cache for instant 5ms response
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `${normalizedQuery}__${nonPrivateMemories.length}__${nonPrivateMemories.map((m) => m.id).sort().join(',')}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 300_000) {
    return res.json({
      matches: cached.matches,
      isFallback: cached.isFallback,
      cached: true,
    });
  }

  // Pre-calculate instant smart heuristic matches
  const fallbackMatches = fallbackKeywordSearch(query, nonPrivateMemories);

  try {
    // Select top candidates (up to 8) to reduce payload and maximize Gemini response speed
    const candidateIds = new Set(fallbackMatches.map((m) => m.id));
    const pool = nonPrivateMemories.filter((m) => candidateIds.has(m.id) || nonPrivateMemories.indexOf(m) < 6);

    const memoryContext = pool.map((m) => ({
      id: m.id,
      title: m.title || 'Untitled',
      type: m.type,
      description: (m.description || '').slice(0, 150),
      dates: m.dates || [],
      deadlines: m.deadlines || [],
      names: m.names || [],
      textSnippet: (m.text || '').slice(0, 150),
    }));

    const searchPrompt = `User search query: "${query}"

Stored files:
${JSON.stringify(memoryContext)}

Task:
Find top 1-3 best matching files.
Provide a concise 1-line reason (10-20 words).
Return JSON array: [{"id": "...", "reason": "...", "score": 0.95}]`;

    // Strict 2500ms timeout race so response NEVER takes 7-10s
    const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) =>
      setTimeout(() => resolve({ isTimeout: true }), 2500)
    );

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: searchPrompt,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 220,
        temperature: 0.1,
      },
    }).then((response) => ({ isTimeout: false, response }));

    const raceResult: any = await Promise.race([geminiPromise, timeoutPromise]);

    if (raceResult.isTimeout) {
      searchCache.set(cacheKey, { matches: fallbackMatches, isFallback: true, timestamp: Date.now() });
      return res.json({
        matches: fallbackMatches,
        isFallback: true,
        fastFallback: true,
      });
    }

    const output = raceResult.response?.text;
    if (output) {
      const parsedMatches = JSON.parse(output);
      const topMatches = parsedMatches.slice(0, 3);
      searchCache.set(cacheKey, { matches: topMatches, isFallback: false, timestamp: Date.now() });
      return res.json({
        matches: topMatches,
        isFallback: false,
      });
    }

    throw new Error('Empty output');
  } catch (err: any) {
    searchCache.set(cacheKey, { matches: fallbackMatches, isFallback: true, timestamp: Date.now() });
    return res.json({
      matches: fallbackMatches,
      isFallback: true,
      fallbackMessage: 'Matched using keyword search fallback.',
    });
  }
});

// 3. AI Summarizer: Summarize any note, college lecture, screenshot, or transcript
app.post('/api/summarize-memory', async (req, res) => {
  try {
    const { memory } = req.body;
    if (!memory) {
      return res.status(400).json({ error: 'Memory object is required' });
    }

    if (memory.isPrivate) {
      return res.status(403).json({
        error: 'Private document: AI analysis and summarization is blocked for private files.',
      });
    }

    const memoryDetails = `
Title: ${memory.title}
Type: ${memory.type}
Description: ${memory.description}
Full Content / Notes: ${memory.originalText || memory.extractedDetails?.text || 'No explicit raw text'}
Dates mentioned: ${(memory.extractedDetails?.dates || []).join(', ') || 'None'}
Deadlines mentioned: ${(memory.extractedDetails?.deadlines || []).join(', ') || 'None'}
Entities & Names: ${(memory.extractedDetails?.names || []).join(', ') || 'None'}
`;

    const prompt = `You are BrainCache's expert AI Document & Note Summarizer.
Analyze this stored memory file (notes of college, lecture slides, email screenshot, or study transcript) and generate a comprehensive, structured summary.

Memory File Details:
${memoryDetails}

Produce:
1. "executiveSummary": A clear, concise 2-3 sentence overview of the core subject and significance.
2. "keyTakeaways": 3-5 crucial bullet points summarizing the most important concepts, formulas, or takeaways.
3. "coreTopics": An array of 3-5 high-level subject tags or concepts covered.
4. "actionItems": Any specific tasks, assignments, deadlines, or action items extracted from the file.
5. "examOrCriticalTips": Important advice, warnings (e.g. exam topics, edge cases, formulas to remember, or critical notices).`;

    const isRasterImage =
      memory.imageBase64 &&
      typeof memory.imageBase64 === 'string' &&
      (memory.imageBase64.startsWith('data:image/png') ||
        memory.imageBase64.startsWith('data:image/jpeg') ||
        memory.imageBase64.startsWith('data:image/webp'));

    let contentsPayload: any = prompt;

    if (isRasterImage) {
      const cleanBase64 = memory.imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const mimeType = memory.imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
      contentsPayload = {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: prompt },
        ],
      };
    }

    const { response } = await generateContentWithFallback({
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            coreTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            examOrCriticalTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'executiveSummary',
            'keyTakeaways',
            'coreTopics',
            'actionItems',
            'examOrCriticalTips',
          ],
        },
      },
    });

    const output = response.text;
    if (!output) {
      throw new Error('No summary generated');
    }

    const summaryResult = JSON.parse(output);
    return res.json({ success: true, summary: summaryResult });
  } catch (error: any) {
    console.error('Summarize error:', error?.message || error);
    const mem = req.body.memory || {};
    return res.json({
      success: true,
      isFallback: true,
      summary: {
        executiveSummary: mem.description || 'Summary of saved memory.',
        keyTakeaways: [
          mem.title ? `Subject focus: ${mem.title}` : 'Contains stored memory details',
          mem.extractedDetails?.text
            ? `Key text: ${mem.extractedDetails.text.slice(0, 100)}...`
            : 'Extracted from memory',
          (mem.extractedDetails?.deadlines || []).length > 0
            ? `Deadlines: ${mem.extractedDetails.deadlines.join(', ')}`
            : 'No urgent deadlines detected',
        ],
        coreTopics: mem.tags || ['Memory', 'Study'],
        actionItems: mem.extractedDetails?.deadlines || ['Review file notes before test/deadline'],
        examOrCriticalTips: ['Double check requirements and dates listed in this file.'],
      },
    });
  }
});

// Convert uploaded file into clean, comprehensive written study notes
app.post('/api/convert-to-notes', async (req, res) => {
  try {
    const { fileBase64, fileName, mimeType = '' } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'fileBase64 is required' });
    }

    const cleanBase64 = fileBase64.replace(/^data:[a-zA-Z0-9+.-]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const lowerName = (fileName || 'document').toLowerCase();

    let isImage = false;
    let isPdf = false;
    let extractedDocumentText = '';

    if (mimeType.startsWith('image/') || lowerName.match(/\.(png|jpg|jpeg|webp|gif|svg)$/)) {
      isImage = true;
    } else if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
      isPdf = true;
    } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
      const excelPreview = extractExcelPreview(buffer);
      extractedDocumentText = excelPreview.fullText;
    } else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      const wordPreview = await extractWordPreview(buffer);
      extractedDocumentText = wordPreview.text;
    } else if (lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt')) {
      const pptxPreview = await extractPptxPreview(buffer);
      extractedDocumentText = pptxPreview.fullText;
    } else if (mimeType.startsWith('text/') || lowerName.match(/\.(txt|md|json|csv|log)$/)) {
      extractedDocumentText = buffer.toString('utf-8').slice(0, 45000);
    }

    const prompt = `You are BrainCache's expert AI Note-Taking and Study Assistant.
The user uploaded a file: "${fileName || 'uploaded file'}" to convert it into written notes.
Analyze all its content, diagrams, slides, pages, or text, and convert it into comprehensive, beautifully organized WRITTEN STUDY NOTES.

Output Requirements:
1. "title": A clean, descriptive title for these notes (3-6 words, e.g., "Linear Algebra: Eigenvalues & Vectors" or "Quarterly Budget & Roadmap").
2. "summary": A concise 1-2 sentence overview of the subject.
3. "writtenNotes": High-quality, detailed written notes in clean markdown-style plain text:
   - Begin with a brief overview of the main topic.
   - Use clear section headers (e.g. "## 1. Core Concepts & Definitions", "## 2. Key Breakdown & Principles", "## 3. Important Formulas / Data / Facts", "## 4. Summary & Action Items").
   - Use bullet points, bold key terms, and bulleted takeaways.
   - Ensure it reads like top-tier, structured study notes that can be easily studied, revised, or shared.`;

    let contentsPayload: any;
    if (isImage) {
      contentsPayload = {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: mimeType.startsWith('image/') ? mimeType : 'image/png' } },
          { text: prompt },
        ],
      };
    } else if (isPdf) {
      contentsPayload = {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: 'application/pdf' } },
          { text: prompt },
        ],
      };
    } else {
      const sampleText = extractedDocumentText || `File name: ${fileName}`;
      contentsPayload = {
        parts: [
          { text: `${prompt}\n\nDocument Text Content:\n${sampleText.slice(0, 35000)}` },
        ],
      };
    }

    const { response } = await generateContentWithFallback({
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Short descriptive 3-6 word title' },
            summary: { type: Type.STRING, description: '1-2 sentence core overview' },
            writtenNotes: { type: Type.STRING, description: 'Comprehensive, structured written study notes' },
          },
          required: ['title', 'writtenNotes'],
        },
      },
    });

    const output = response.text;
    if (output) {
      const parsed = JSON.parse(output);
      return res.json({
        success: true,
        title: parsed.title || fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        writtenNotes: parsed.writtenNotes,
        summary: parsed.summary || '',
      });
    }

    throw new Error('Empty response from model');
  } catch (err: any) {
    console.error('Convert to notes error:', err);
    const fallbackTitle = (req.body.fileName || 'Study Notes').replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    return res.json({
      success: true,
      isFallback: true,
      title: fallbackTitle,
      writtenNotes: `## Overview\nNotes generated from ${req.body.fileName || 'uploaded document'}.\n\n## Key Content\n- Content extracted and preserved in your notes library.\n- Review and annotate your notes anytime.\n\n## Action Items\n- [ ] Review key concepts\n- [ ] Add your personal reflections`,
      summary: `Written notes generated from ${req.body.fileName || 'file'}.`,
    });
  }
});

// 4. AI Doubt Solver: Interactive tutor and Q&A grounded specifically in the memory file
app.post('/api/solve-doubt', async (req, res) => {
  try {
    const { memory, question, chatHistory = [] } = req.body;

    if (!memory || !question) {
      return res.status(400).json({ error: 'Memory and question are required' });
    }

    if (memory.isPrivate) {
      return res.status(403).json({
        error: 'Private document: AI analysis is blocked for private files.',
      });
    }

    const memoryContext = `
File Title: ${memory.title}
Type: ${memory.type}
Description: ${memory.description}
Full Content / Notes: ${memory.originalText || memory.extractedDetails?.text || 'No raw text'}
Dates: ${(memory.extractedDetails?.dates || []).join(', ') || 'None'}
Deadlines: ${(memory.extractedDetails?.deadlines || []).join(', ') || 'None'}
Names: ${(memory.extractedDetails?.names || []).join(', ') || 'None'}
`;

    const conversationContext = chatHistory
      .slice(-4)
      .map((m: any) => `${m.sender === 'user' ? 'Student' : 'Tutor'}: ${m.text}`)
      .join('\n');

    const prompt = `Doubt Solver for Brain Cache, an educational learning assistant.

Your job is to help students understand and solve their doubts in detail. Be accurate, patient, and encouraging. Focus on helping the student learn the reasoning, not just giving a final answer.

FILE CONTEXT (File saved in Brain Cache):
${memoryContext}

PREVIOUS CONVERSATION:
${conversationContext || 'First question about this file'}

STUDENT QUESTION / COMMAND:
"${question}"

For each question:

1. Identify what the student is asking. If the question is unclear or missing important information, ask a short clarifying question before solving it.
2. Explain the relevant idea or concept in simple language.
3. Work through the solution step by step, showing the reasoning behind each step.
4. Define unfamiliar terms and explain any formulas or assumptions you use.
5. Give the final answer clearly.
6. Where useful, include a quick example, analogy, or way to check the answer.
7. End with a brief “Key takeaway” that summarizes what the student should remember.

Adapt your response to the student’s level and the subject. For maths and science, show calculations and units. For programming, explain the approach and provide readable code only when helpful. For writing or humanities, explain the interpretation and support it with relevant evidence.

If the student shares their own attempt, first point out what they did correctly, then explain where their reasoning needs adjustment. Don’t make them feel bad for mistakes.

Do not invent facts, sources, or details. If you are unsure, say so and explain what information would help. If the request is outside your ability, be honest and suggest a useful next step.

Keep the answer detailed enough to teach the idea, but organized and easy to follow. Use headings, numbered steps, equations, or code blocks when they improve clarity.

Also provide 2-3 short, relevant "suggestedFollowUps" (follow-up doubts or questions) that the student might want to ask next to deepen their understanding.`;

    const isRasterImage =
      memory.imageBase64 &&
      typeof memory.imageBase64 === 'string' &&
      (memory.imageBase64.startsWith('data:image/png') ||
        memory.imageBase64.startsWith('data:image/jpeg') ||
        memory.imageBase64.startsWith('data:image/webp'));

    let contentsPayload: any = prompt;

    if (isRasterImage) {
      const cleanBase64 = memory.imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const mimeType = memory.imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
      contentsPayload = {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: prompt },
        ],
      };
    }

    const { response } = await generateContentWithFallback({
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: 'Clear, comprehensive explanation and answer to the user doubt',
            },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 3 suggested questions or doubts to ask next',
            },
          },
          required: ['answer', 'suggestedFollowUps'],
        },
      },
    });

    const output = response.text;
    if (!output) {
      throw new Error('No answer generated');
    }

    const parsed = JSON.parse(output);
    return res.json({
      success: true,
      answer: parsed.answer,
      suggestedFollowUps: parsed.suggestedFollowUps || [],
    });
  } catch (error: any) {
    console.error('Doubt solver error:', error?.message || error);
    const mem = req.body.memory || {};
    return res.json({
      success: true,
      isFallback: true,
      answer: `Regarding your question about "${mem.title}": Based on the notes, ${mem.description}. For more in-depth problem solving, make sure to review the key points: ${(mem.extractedDetails?.dates || []).join(', ') || 'check referenced materials'}.`,
      suggestedFollowUps: [
        'Can you summarize the main formula or rule?',
        'What are the most important deadlines?',
        'Can you test me on this topic with a practice question?',
      ],
    });
  }
});

// 4b. Detect questions, problems, and exercises inside any stored memory file
app.post('/api/detect-questions', async (req, res) => {
  try {
    const { memory } = req.body;
    if (!memory) {
      return res.status(400).json({ error: 'Memory object is required' });
    }

    if (memory.isPrivate) {
      return res.json({ success: true, hasQuestions: false, questions: [] });
    }

    const memoryContext = `
Title: ${memory.title}
Type: ${memory.type}
Description: ${memory.description}
Full Content / Notes: ${memory.originalText || memory.extractedDetails?.text || 'No raw text'}
`;

    const prompt = `Scan this file/document and determine if it contains any specific questions, homework problems, exercises, practice quiz items, or problem set questions.
FILE CONTEXT:
${memoryContext}

If questions exist (even 1 question), extract each question:
- "id": unique string like "q-1", "q-2"
- "questionNumber": e.g. "Question 1", "Problem 2", "Exercise 3a", "Q4"
- "questionText": The full question statement/prompt as stated in the file
- "topic": Short topic tag (e.g. "Calculus", "Data Structures", "Grammar", "Organic Chemistry")

If the file does NOT contain any questions (e.g. it is just reference notes, an invoice, or an article without exercises), set "hasQuestions" to false and "questions" to [].`;

    const isRasterImage =
      memory.imageBase64 &&
      typeof memory.imageBase64 === 'string' &&
      (memory.imageBase64.startsWith('data:image/png') ||
        memory.imageBase64.startsWith('data:image/jpeg') ||
        memory.imageBase64.startsWith('data:image/webp'));

    let contentsPayload: any = prompt;

    if (isRasterImage) {
      const cleanBase64 = memory.imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const mimeType = memory.imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
      contentsPayload = {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: prompt },
        ],
      };
    }

    const { response } = await generateContentWithFallback({
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasQuestions: { type: Type.BOOLEAN },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  questionNumber: { type: Type.STRING },
                  questionText: { type: Type.STRING },
                  topic: { type: Type.STRING },
                },
                required: ['id', 'questionNumber', 'questionText'],
              },
            },
          },
          required: ['hasQuestions', 'questions'],
        },
      },
    });

    const output = response.text;
    if (output) {
      const parsed = JSON.parse(output);
      return res.json({
        success: true,
        hasQuestions: Boolean(parsed.hasQuestions && parsed.questions && parsed.questions.length > 0),
        questions: parsed.questions || [],
      });
    }

    return res.json({ success: true, hasQuestions: false, questions: [] });
  } catch (err: any) {
    console.warn('Detect questions notice:', err?.message || err);
    return res.json({ success: true, hasQuestions: false, questions: [] });
  }
});

// 5. Transcribe audio/voice recording file using Gemini
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio base64 is required' });
    }

    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

    const { response } = await generateContentWithFallback({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: 'Accurately transcribe this spoken audio recording or voice memo word-for-word into clean text. Return only the transcription.',
            },
          ],
        },
      ],
    });

    const transcript = response?.text ? response.text.trim() : '';
    return res.json({ success: true, transcript });
  } catch (err: any) {
    console.error('Audio transcription error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to transcribe audio' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Configure Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`BrainCache server listening on http://0.0.0.0:${port}`);
  });
}

setupServer();
