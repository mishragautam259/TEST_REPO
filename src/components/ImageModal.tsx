import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Presentation,
  File,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Code,
  AlignLeft,
  Columns,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { PptxViewer } from '@aiden0z/pptx-renderer';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';
import { MemoryItem } from '../types';
import { generateNewTabPreviewUrl } from '../utils/previewTabGenerator';

interface ImageModalProps {
  memory: MemoryItem | null;
  onClose: () => void;
  onOpenAiAssistant?: (memory: MemoryItem, tab: 'summary' | 'doubts') => void;
}

// Universal Exact File Previewer — 100% Unmodified, High-Fidelity Rendering for All File Types
export const ImageModal: React.FC<ImageModalProps> = ({ memory, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // PowerPoint states
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [totalSlideCount, setTotalSlideCount] = useState(0);
  const [isLoadingPptx, setIsLoadingPptx] = useState(false);
  const [pptxError, setPptxError] = useState<string | null>(null);

  // Word states
  const [docxZoom, setDocxZoom] = useState<number>(100);
  const [isLoadingDocx, setIsLoadingDocx] = useState(false);

  // Excel states
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [excelSheets, setExcelSheets] = useState<{ name: string; data: string[][] }[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ coord: string; val: string } | null>(null);
  const [excelSearch, setExcelSearch] = useState('');

  // Image states
  const [imageZoom, setImageZoom] = useState<number>(100);
  const [imageRotation, setImageRotation] = useState<number>(0);

  // PDF states
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Text/Code states
  const [isWordWrap, setIsWordWrap] = useState(true);
  const [textSearch, setTextSearch] = useState('');

  // Refs
  const pptxContainerRef = useRef<HTMLDivElement>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const pptxViewerInstanceRef = useRef<PptxViewer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert memory binary into an ArrayBuffer
  const getArrayBuffer = async (): Promise<ArrayBuffer | null> => {
    if (!memory) return null;

    if (memory.fileDataUrl) {
      try {
        const clean = memory.fileDataUrl.replace(/^data:[^;]+;base64,/, '');
        const binary = atob(clean);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
      } catch (err) {
        console.warn('Error converting fileDataUrl to ArrayBuffer:', err);
      }
    }

    if (memory.rawFileUrl) {
      try {
        const res = await fetch(memory.rawFileUrl);
        if (res.ok) {
          return await res.arrayBuffer();
        }
      } catch (err) {
        console.warn('Error fetching rawFileUrl:', err);
      }
    }

    return null;
  };

  const lowerName = (memory?.fileName || memory?.title || '').toLowerCase();

  const isPdf =
    memory?.type === 'pdf' || lowerName.endsWith('.pdf');

  const isImage =
    memory?.type === 'screenshot' ||
    memory?.type === 'photo' ||
    Boolean(lowerName.match(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/)) ||
    Boolean(memory?.imageBase64);

  const isWord =
    memory?.type === 'document' &&
    (lowerName.endsWith('.docx') || lowerName.endsWith('.doc'));

  const isExcel =
    memory?.type === 'spreadsheet' ||
    Boolean(lowerName.match(/\.(xlsx|xls|csv)$/));

  const isPpt =
    memory?.type === 'presentation' ||
    Boolean(lowerName.match(/\.(pptx|ppt)$/));

  const isCodeOrText =
    !isPdf &&
    !isImage &&
    !isWord &&
    !isExcel &&
    !isPpt;

  // 1. POWERPOINT: Render Exact Presentation Slides
  useEffect(() => {
    if (!memory || !isPpt) return;

    let isCancelled = false;
    setActiveSlideIndex(0);
    setTotalSlideCount(0);
    setPptxError(null);

    const loadPptx = async () => {
      setIsLoadingPptx(true);
      try {
        const buffer = await getArrayBuffer();
        if (!buffer || isCancelled || !pptxContainerRef.current) {
          setIsLoadingPptx(false);
          return;
        }

        pptxContainerRef.current.innerHTML = '';
        const viewer = await PptxViewer.open(buffer, pptxContainerRef.current, {
          fitMode: 'contain',
          renderMode: 'slide',
          onSlideChange: (index) => {
            if (!isCancelled) setActiveSlideIndex(index);
          },
        });

        if (isCancelled) return;

        pptxViewerInstanceRef.current = viewer;
        setTotalSlideCount(viewer.slideCount || 1);
        await viewer.renderSlide(0);
      } catch (err: any) {
        console.warn('Error rendering PPTX slides:', err);
        if (!isCancelled) {
          setPptxError(err?.message || 'Error rendering PowerPoint slides directly.');
        }
      } finally {
        if (!isCancelled) setIsLoadingPptx(false);
      }
    };

    const timer = setTimeout(loadPptx, 50);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
      pptxViewerInstanceRef.current = null;
    };
  }, [memory?.id, memory?.fileDataUrl, isPpt]);

  // Navigate PowerPoint slide
  const handleGoToSlide = async (targetIndex: number) => {
    if (!pptxViewerInstanceRef.current) return;
    const clamped = Math.max(0, Math.min(totalSlideCount - 1, targetIndex));
    setActiveSlideIndex(clamped);
    try {
      await pptxViewerInstanceRef.current.renderSlide(clamped);
    } catch (err) {
      console.warn('Slide navigation error:', err);
    }
  };

  // 2. WORD: Render Exact Word Document Pages (.docx)
  useEffect(() => {
    if (!memory || !isWord || !docxContainerRef.current) return;

    let isCancelled = false;
    setIsLoadingDocx(true);

    const loadDocx = async () => {
      try {
        const buffer = await getArrayBuffer();
        if (!buffer || isCancelled || !docxContainerRef.current) {
          setIsLoadingDocx(false);
          return;
        }

        docxContainerRef.current.innerHTML = '';
        await renderAsync(buffer, docxContainerRef.current, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          experimental: true,
          useBase64URL: true,
        });
      } catch (err) {
        console.warn('DOCX preview notice:', err);
      } finally {
        if (!isCancelled) setIsLoadingDocx(false);
      }
    };

    const timer = setTimeout(loadDocx, 50);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [memory?.id, memory?.fileDataUrl, isWord]);

  // 3. EXCEL: Parse & Render Exact Spreadsheet Sheets (.xlsx, .xls, .csv)
  useEffect(() => {
    if (!memory || !isExcel) return;

    let isCancelled = false;
    setActiveSheetIndex(0);
    setSelectedCell(null);
    setExcelSearch('');

    const loadExcel = async () => {
      try {
        const buffer = await getArrayBuffer();
        if (!buffer || isCancelled) {
          // Fallback to previewData if buffer not yet loaded
          if (memory.previewData?.tableData) {
            setExcelSheets([
              {
                name: memory.previewData.sheetNames?.[0] || 'Sheet 1',
                data: memory.previewData.tableData,
              },
            ]);
          }
          return;
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheets: { name: string; data: string[][] }[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
            header: 1,
            raw: false,
            defval: '',
          });
          sheets.push({
            name: sheetName,
            data: rawRows as string[][],
          });
        });

        if (!isCancelled && sheets.length > 0) {
          setExcelSheets(sheets);
        }
      } catch (err) {
        console.warn('Excel parse notice:', err);
      }
    };

    loadExcel();
    return () => {
      isCancelled = true;
    };
  }, [memory?.id, memory?.fileDataUrl, isExcel]);

  // 4. PDF: Create Object URL for Native In-Browser Reader
  useEffect(() => {
    if (!memory || !isPdf) return;

    let objectUrl: string | null = null;

    const loadPdf = async () => {
      const buffer = await getArrayBuffer();
      if (buffer) {
        const blob = new Blob([buffer], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      } else if (memory.fileDataUrl) {
        setPdfBlobUrl(memory.fileDataUrl);
      } else if (memory.rawFileUrl) {
        setPdfBlobUrl(memory.rawFileUrl);
      }
    };

    loadPdf();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setPdfBlobUrl(null);
    };
  }, [memory?.id, memory?.fileDataUrl, isPdf]);

  // Reset image zoom & rotation on memory change
  useEffect(() => {
    setImageZoom(100);
    setImageRotation(0);
    setDocxZoom(100);
  }, [memory?.id]);

  // Re-load file if binary wasn't previously cached
  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !memory) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      memory.fileDataUrl = dataUrl;

      // Handle PPTX reload
      if (isPpt && pptxContainerRef.current) {
        setIsLoadingPptx(true);
        setPptxError(null);
        try {
          const buffer = await file.arrayBuffer();
          pptxContainerRef.current.innerHTML = '';
          const viewer = await PptxViewer.open(buffer, pptxContainerRef.current, {
            fitMode: 'contain',
            renderMode: 'slide',
            onSlideChange: (index) => setActiveSlideIndex(index),
          });
          pptxViewerInstanceRef.current = viewer;
          setTotalSlideCount(viewer.slideCount || 1);
          await viewer.renderSlide(0);
        } catch (err: any) {
          setPptxError(err?.message || 'Error parsing PowerPoint file.');
        } finally {
          setIsLoadingPptx(false);
        }
      }

      // Handle Word reload
      if (isWord && docxContainerRef.current) {
        setIsLoadingDocx(true);
        try {
          const buffer = await file.arrayBuffer();
          docxContainerRef.current.innerHTML = '';
          await renderAsync(buffer, docxContainerRef.current, undefined, {
            inWrapper: true,
            breakPages: true,
          });
        } catch (err) {
          console.warn('Word reload error:', err);
        } finally {
          setIsLoadingDocx(false);
        }
      }

      // Handle PDF reload
      if (isPdf) {
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: 'application/pdf' });
        setPdfBlobUrl(URL.createObjectURL(blob));
      }
    };
    reader.readAsDataURL(file);
  };

  if (!memory) return null;

  const downloadUrl = memory.fileDataUrl || memory.imageBase64 || memory.rawFileUrl;
  const newTabUrl = generateNewTabPreviewUrl(memory);
  const fileName =
    memory.fileName || `${memory.title.toLowerCase().replace(/\s+/g, '-')}.${isImage ? 'png' : 'file'}`;

  const handleCopyContent = () => {
    const textToCopy =
      memory.originalText ||
      memory.extractedDetails?.text ||
      memory.description ||
      memory.title;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Active Excel Sheet Data
  const currentSheet = excelSheets[activeSheetIndex] || excelSheets[0];
  const sheetRows = currentSheet?.data || [];
  const filteredRows = excelSearch.trim()
    ? sheetRows.filter((row, idx) =>
        idx === 0 ||
        row.some((cell) =>
          String(cell).toLowerCase().includes(excelSearch.toLowerCase())
        )
      )
    : sheetRows;

  // Code / Text file lines
  const textContent = memory.originalText || memory.description || memory.title;
  const textLines = textContent.split('\n');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className={`relative bg-white dark:bg-[#0c1322] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-all ${
            isFullscreen ? 'w-[98vw] h-[96vh]' : 'max-w-6xl w-full h-[88vh]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* TOP TOOLBAR: File Brand, Contextual Controls & Actions */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-[#070b13] flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-200/60 dark:bg-slate-800">
                {isPpt && <Presentation className="w-4 h-4 text-amber-500" />}
                {isWord && <File className="w-4 h-4 text-blue-500" />}
                {isExcel && <FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
                {isPdf && <FileText className="w-4 h-4 text-red-500" />}
                {isImage && <FileText className="w-4 h-4 text-teal-500" />}
                {isCodeOrText && <Code className="w-4 h-4 text-violet-500" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {memory.fileName || memory.title}
                  </h3>
                  <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Exact Preview
                  </span>
                  {memory.isPrivate && (
                    <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Private (Zero AI)</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  {memory.fileSize || 'Standard file'} · Original file (unmodified)
                </p>
              </div>
            </div>

            {/* Contextual Toolbar Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* PowerPoint Slide Navigation */}
              {isPpt && totalSlideCount > 0 && (
                <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 px-2 py-1 rounded-xl text-xs font-semibold mr-1">
                  <button
                    onClick={() => handleGoToSlide(activeSlideIndex - 1)}
                    disabled={activeSlideIndex <= 0}
                    className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Previous Slide"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                  </button>
                  <span className="px-2 font-mono text-slate-700 dark:text-slate-200">
                    Slide {activeSlideIndex + 1} / {totalSlideCount}
                  </span>
                  <button
                    onClick={() => handleGoToSlide(activeSlideIndex + 1)}
                    disabled={activeSlideIndex >= totalSlideCount - 1}
                    className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Next Slide"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                  </button>
                </div>
              )}

              {/* Word Zoom Controls */}
              {isWord && (
                <div className="hidden sm:flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 px-2 py-1 rounded-xl text-xs font-medium mr-1">
                  <button
                    onClick={() => setDocxZoom((z) => Math.max(50, z - 10))}
                    className="p-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1">{docxZoom}%</span>
                  <button
                    onClick={() => setDocxZoom((z) => Math.min(200, z + 10))}
                    className="p-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Excel Search Box */}
              {isExcel && (
                <div className="hidden sm:flex items-center relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={excelSearch}
                    onChange={(e) => setExcelSearch(e.target.value)}
                    placeholder="Find in sheet..."
                    className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-36"
                  />
                </div>
              )}

              {/* Image Lightbox Controls */}
              {isImage && (
                <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 px-2 py-1 rounded-xl text-xs font-medium mr-1">
                  <button
                    onClick={() => setImageZoom((z) => Math.max(30, z - 20))}
                    className="p-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1">{imageZoom}%</span>
                  <button
                    onClick={() => setImageZoom((z) => Math.min(300, z + 20))}
                    className="p-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setImageRotation((r) => (r + 90) % 360)}
                    className="p-1 hover:text-slate-900 dark:hover:text-white ml-1 cursor-pointer"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Text/Code Wrap Toggle */}
              {isCodeOrText && (
                <button
                  onClick={() => setIsWordWrap(!isWordWrap)}
                  className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                    isWordWrap
                      ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                  title="Toggle Word Wrap"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>{isWordWrap ? 'Wrapped' : 'No Wrap'}</span>
                </button>
              )}

              {/* Copy Text */}
              <button
                onClick={handleCopyContent}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
                title="Copy contents"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              {/* OPEN IN NEW TAB */}
              {newTabUrl && (
                <a
                  href={newTabUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-300 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-400 dark:hover:border-teal-500/50 shadow-2xs transition-all cursor-pointer"
                  title="Open exact preview in another browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="hidden sm:inline">Open in Tab</span>
                </a>
              )}

              {/* DOWNLOAD ORIGINAL FILE */}
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={fileName}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xs cursor-pointer"
                  title="Download exact original file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              )}

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MAIN EXACT DISPLAY STAGE */}
          <div className="flex-1 overflow-hidden bg-slate-100/70 dark:bg-[#070b13] flex flex-col min-h-0 relative">
            {/* 1. POWERPOINT PRESENTATION (.pptx, .ppt) */}
            {isPpt && (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 w-full h-full">
                {totalSlideCount > 0 && (
                  <div className="w-full md:w-48 bg-slate-50 dark:bg-[#090e1a] border-r border-slate-200 dark:border-slate-800 p-2 overflow-y-auto space-y-1.5 flex-shrink-0">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Slides ({totalSlideCount})
                    </div>
                    {Array.from({ length: totalSlideCount }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleGoToSlide(idx)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          activeSlideIndex === idx
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span>Slide {idx + 1}</span>
                        {activeSlideIndex === idx && <span className="text-[10px] uppercase font-bold">Active</span>}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 overflow-auto min-h-0 relative">
                  {isLoadingPptx && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 dark:bg-[#0c1322]/70 backdrop-blur-xs gap-2">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Rendering exact PowerPoint slides...
                      </p>
                    </div>
                  )}

                  <div
                    ref={pptxContainerRef}
                    className="w-full h-full max-w-4xl max-h-full flex items-center justify-center rounded-xl overflow-hidden shadow-2xl bg-white"
                  />

                  {!memory.fileDataUrl && !memory.rawFileUrl && (
                    <div className="max-w-md text-center p-6 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
                        <Presentation className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {memory.fileName || 'PowerPoint Presentation'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Select <span className="font-semibold">{memory.fileName || 'this presentation'}</span> to view exact slides.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pptx,.ppt"
                          className="hidden"
                          onChange={handleLocalFileSelect}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Upload className="w-4 h-4" /> Load Exact Slides
                        </button>
                      </div>
                    </div>
                  )}

                  {pptxError && (
                    <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200 dark:border-red-900 mt-2">
                      {pptxError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. WORD DOCUMENT (.docx, .doc) — EXACT DOCUMENT PAGES */}
            {isWord && (
              <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center min-h-0 bg-slate-200/80 dark:bg-[#05080e] relative">
                {isLoadingDocx && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 dark:bg-[#0c1322]/70 backdrop-blur-xs gap-2">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Rendering exact Word document pages...
                    </p>
                  </div>
                )}

                <div
                  ref={docxContainerRef}
                  style={{ transform: `scale(${docxZoom / 100})`, transformOrigin: 'top center' }}
                  className="transition-transform duration-150 ease-out"
                />

                {/* Fallback to Mammoth HTML if docx-preview is empty or if .doc */}
                {(!docxContainerRef.current || docxContainerRef.current.innerHTML === '') &&
                  memory.previewData?.htmlContent && (
                    <div className="w-full max-w-4xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-14 min-h-full">
                      <div
                        className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: memory.previewData.htmlContent }}
                      />
                    </div>
                  )}

                {!memory.fileDataUrl && !memory.rawFileUrl && (
                  <div className="max-w-md text-center p-6 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center mx-auto">
                      <File className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {memory.fileName || 'Word Document'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select <span className="font-semibold">{memory.fileName}</span> to load exact pages.
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".docx,.doc"
                      className="hidden"
                      onChange={handleLocalFileSelect}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Load Exact Document
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. EXCEL SPREADSHEET (.xlsx, .xls, .csv) — EXACT WORKBOOK & SHEETS */}
            {isExcel && (
              <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-hidden min-h-0 bg-white dark:bg-[#0b101b]">
                {/* Excel Active Cell Indicator */}
                {selectedCell && (
                  <div className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800/60 text-xs flex-shrink-0">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                      {selectedCell.coord}
                    </span>
                    <span className="text-slate-700 dark:text-slate-200 font-mono truncate">
                      {selectedCell.val}
                    </span>
                  </div>
                )}

                {/* Table Data Grid */}
                <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-auto shadow-inner bg-slate-50/50 dark:bg-[#070b13] min-h-0">
                  {filteredRows.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0f172a] shadow-xs">
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="p-2 w-12 text-[10px] text-slate-400 font-mono text-center border-r border-slate-200 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-800">
                            #
                          </th>
                          {filteredRows[0]?.map((col, cIdx) => (
                            <th
                              key={cIdx}
                              className="p-2.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 truncate max-w-[240px] select-none"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span>{String(col ?? '')}</span>
                                <span className="text-[10px] font-mono text-slate-400 font-normal">
                                  {String.fromCharCode(65 + (cIdx % 26))}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.slice(1, 200).map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className="border-b border-slate-100 dark:border-slate-800/70 hover:bg-emerald-500/5 transition-colors"
                          >
                            <td className="p-2 text-[10px] text-slate-400 font-mono text-center bg-slate-100/70 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 select-none">
                              {rIdx + 1}
                            </td>
                            {row.map((cell, cIdx) => {
                              const cellStr = String(cell ?? '');
                              const coord = `${String.fromCharCode(65 + (cIdx % 26))}${rIdx + 2}`;
                              const isSelected = selectedCell?.coord === coord;
                              const isMatch =
                                excelSearch.trim() &&
                                cellStr.toLowerCase().includes(excelSearch.toLowerCase());

                              return (
                                <td
                                  key={cIdx}
                                  onClick={() => setSelectedCell({ coord, val: cellStr })}
                                  className={`p-2 border-r border-slate-100 dark:border-slate-800/50 truncate max-w-[240px] cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-emerald-500/20 ring-2 ring-emerald-500 text-emerald-950 dark:text-emerald-100 font-medium'
                                      : isMatch
                                      ? 'bg-amber-300/30 text-amber-900 dark:text-amber-200'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                                  }`}
                                >
                                  {cellStr}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No matching cells found.
                    </div>
                  )}
                </div>

                {/* Bottom Sheet Switcher Tabs */}
                {excelSheets.length > 0 && (
                  <div className="flex items-center gap-1 pt-2 border-t border-slate-200 dark:border-slate-800 overflow-x-auto flex-shrink-0">
                    {excelSheets.map((sheet, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveSheetIndex(idx);
                          setSelectedCell(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeSheetIndex === idx
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>{sheet.name}</span>
                        <span className="text-[10px] opacity-70">({sheet.data.length} rows)</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. PDF DOCUMENT — NATIVE IN-BROWSER EXACT VIEWER */}
            {isPdf && (
              <div className="flex-1 w-full h-full min-h-0 bg-white">
                {pdfBlobUrl ? (
                  <iframe
                    src={pdfBlobUrl}
                    className="w-full h-full border-0"
                    title={memory.title}
                  />
                ) : (
                  <div className="p-8 text-center space-y-4 my-auto">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      PDF preview ready.
                    </p>
                    {downloadUrl && (
                      <a
                        href={downloadUrl}
                        download={fileName}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                      >
                        <Download className="w-4 h-4" /> Download Original PDF
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 5. IMAGE SCREENSHOT / PHOTO — EXACT LIGHTBOX CANVAS */}
            {isImage && (
              <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0 overflow-auto bg-slate-950/10 dark:bg-black/40">
                <img
                  src={memory.imageBase64 || memory.fileDataUrl}
                  alt={memory.title}
                  style={{
                    transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl dark:brightness-95"
                />
              </div>
            )}

            {/* 6. CODE & TEXT DOCUMENTS (.txt, .md, .json, .py, .js, .sql, .log) */}
            {isCodeOrText && (
              <div className="flex-1 overflow-auto p-4 sm:p-6 min-h-0 bg-[#0d1117] text-slate-200 font-mono text-xs">
                <div className="w-full max-w-5xl mx-auto rounded-xl border border-slate-800 bg-[#161b22] p-4 sm:p-6 shadow-xl">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
                    <span>{memory.fileName || 'Source Text'}</span>
                    <span>{textLines.length} lines · {textContent.length} characters</span>
                  </div>

                  <div className="flex">
                    {/* Line Numbers Gutter */}
                    <div className="pr-4 border-r border-slate-800 text-slate-600 select-none text-right font-mono">
                      {textLines.map((_, i) => (
                        <div key={i} className="leading-relaxed">
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Content */}
                    <div className="pl-4 flex-1 overflow-x-auto">
                      {textLines.map((line, i) => (
                        <div
                          key={i}
                          className={`leading-relaxed ${
                            isWordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
                          }`}
                        >
                          {line || '\u00A0'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
