import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  Mic,
  MicOff,
  Check,
  AlertCircle,
  Loader2,
  X,
  FileSpreadsheet,
  Presentation,
  File,
  Sparkles,
  ImageIcon,
  ArrowRight,
  Music,
  Lock,
  Unlock,
  Shield,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import { MemoryItem, MemoryType } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface MemoryCaptureProps {
  onSave: (memory: MemoryItem) => void;
}

// Pro & Minimal Upload File Bar and Capture Interface with Privacy Shield & Password Vault
export const MemoryCapture: React.FC<MemoryCaptureProps> = ({ onSave }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'note'>('file');
  const [isDragOver, setIsDragOver] = useState(false);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    file: File;
    previewUrl?: string;
    fileBase64: string;
    category: MemoryType;
  } | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    description: string;
    extractedText?: string;
    dates?: string[];
    deadlines?: string[];
    names?: string[];
    fileType?: string;
    previewData?: any;
    rawFileUrl?: string;
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Privacy & Password Protection States
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Note / Voice state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [dictationError, setDictationError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Convert File to Notes State
  const [isConvertingFileToNotes, setIsConvertingFileToNotes] = useState(false);
  const [convertingFileName, setConvertingFileName] = useState<string | null>(null);
  const [isNoteDragOver, setIsNoteDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const notesFileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Handle global paste event (screenshots or images)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileUpload(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isPrivate]);

  // Cleanup media recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileCategoryInfo = (filename: string, mime: string) => {
    const lower = filename.toLowerCase();
    if (mime === 'application/pdf' || lower.endsWith('.pdf')) {
      return { category: 'pdf' as MemoryType, label: 'PDF', icon: <FileText className="w-4 h-4 text-red-500" />, badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
    }
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) {
      return { category: 'spreadsheet' as MemoryType, label: 'Excel', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-500" />, badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    }
    if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
      return { category: 'document' as MemoryType, label: 'Word', icon: <File className="w-4 h-4 text-blue-500" />, badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    }
    if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) {
      return { category: 'presentation' as MemoryType, label: 'PowerPoint', icon: <Presentation className="w-4 h-4 text-amber-500" />, badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
    if (mime.startsWith('image/') || lower.match(/\.(png|jpg|jpeg|webp|gif|svg)$/)) {
      return { category: 'screenshot' as MemoryType, label: 'Image', icon: <ImageIcon className="w-4 h-4 text-teal-500" />, badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' };
    }
    return { category: 'document' as MemoryType, label: 'Doc', icon: <File className="w-4 h-4 text-purple-500" />, badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
  };

  const handleFileUpload = async (file: File) => {
    setAnalysisError(null);
    setAnalysisResult(null);

    const { category } = getFileCategoryInfo(file.name, file.type);

    try {
      let fileBase64 = '';
      let previewUrl: string | undefined = undefined;

      if (category === 'screenshot') {
        fileBase64 = await compressImage(file, 1200, 0.8);
        previewUrl = fileBase64;
      } else {
        const reader = new FileReader();
        fileBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setUploadedFile({
        file,
        previewUrl,
        fileBase64,
        category,
      });

      // STRICT PRIVACY CHECK: If marked as Private, NEVER send to Gemini AI!
      if (isPrivate) {
        setIsAnalyzing(false);
        setAnalysisResult({
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          description: 'Private document (Zero AI access · Stored locally)',
          extractedText: file.name,
        });
        return;
      }

      setIsAnalyzing(true);
      const response = await fetch('/api/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: formatFileSize(file.size),
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const data = await response.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (err: any) {
      console.warn('Analysis notice:', err);
      setAnalysisError('File uploaded. Offline index preserved.');
      setAnalysisResult({
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        description: `Preserved ${file.name} in memory cache.`,
      });
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSaveUploadedFile = () => {
    if (!uploadedFile) return;

    const memory: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: uploadedFile.category,
      title: analysisResult?.title || uploadedFile.file.name,
      description: isPrivate
        ? 'Private document (Zero AI access · Stored locally)'
        : (analysisResult?.description || `Preserved ${uploadedFile.file.name}`),
      imageBase64: uploadedFile.previewUrl,
      fileDataUrl: uploadedFile.fileBase64,
      fileName: uploadedFile.file.name,
      fileSize: formatFileSize(uploadedFile.file.size),
      fileType: uploadedFile.category,
      originalText: isPrivate ? uploadedFile.file.name : (analysisResult?.extractedText || uploadedFile.file.name),
      previewData: isPrivate ? undefined : analysisResult?.previewData,
      rawFileUrl: isPrivate ? undefined : analysisResult?.rawFileUrl,
      extractedDetails: isPrivate
        ? { text: uploadedFile.file.name }
        : {
            text: analysisResult?.extractedText || '',
            dates: analysisResult?.dates || [],
            deadlines: analysisResult?.deadlines || [],
            names: analysisResult?.names || [],
          },
      createdAt: Date.now(),
      tags: [uploadedFile.category, uploadedFile.file.name.split('.').pop() || 'file', ...(isPrivate ? ['private'] : [])],
      isPrivate: isPrivate,
      password: password.trim() ? password.trim() : undefined,
    };

    onSave(memory);
    showSuccessToast(
      isPrivate
        ? 'Private file secured in local memory (Zero AI Access)'
        : 'File preserved in memory'
    );
    resetFileForm();
  };

  const resetFileForm = () => {
    setUploadedFile(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
    setIsPrivate(false);
    setPassword('');
    setShowPassword(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const showSuccessToast = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // ==========================================
  // ROBUST VOICE DICTATION & RECORDING ENGINE
  // ==========================================
  const startRecording = async () => {
    setDictationError(null);

    // Try HTML5 MediaRecorder (universal audio stream)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        audioChunksRef.current = [];

        const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
        let chosenMime = '';
        for (const m of mimeTypes) {
          if (MediaRecorder.isTypeSupported(m)) {
            chosenMime = m;
            break;
          }
        }

        const recorder = new MediaRecorder(stream, chosenMime ? { mimeType: chosenMime } : undefined);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: chosenMime || 'audio/webm',
          });
          if (audioBlob.size > 0) {
            await transcribeAudioBlob(audioBlob, chosenMime || 'audio/webm');
          }
          // Stop stream tracks
          stream.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        };

        recorder.start(500); // 500ms chunk intervals
        setIsListening(true);
        setRecordingSeconds(0);

        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        // Also start speech recognition if available for instant interim text
        startSpeechRecognitionInterim();
        return;
      } catch (err: any) {
        console.warn('getUserMedia error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setDictationError('Microphone permission blocked. Please allow microphone access in your browser bar, or upload an audio file.');
          return;
        }
      }
    }

    // Fallback: Web Speech API only
    startSpeechRecognitionStandalone();
  };

  const stopRecording = () => {
    setIsListening(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Optional live speech recognition for immediate visual typing
  const startSpeechRecognitionInterim = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setNoteText((prev) => {
            const trimmed = prev.trim();
            if (trimmed.endsWith(transcript.trim())) return prev;
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('SpeechRecognition interim error:', e);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (e) {
      // ignore
    }
  };

  const startSpeechRecognitionStandalone = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setDictationError('Microphone / Speech recognition is not supported in this browser. Please upload an audio file instead.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setDictationError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setNoteText((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
        setDictationError('Microphone speech service unavailable. Please check permissions or upload an audio recording.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err: any) {
      setDictationError('Could not start microphone. Please check permissions.');
      setIsListening(false);
    }
  };

  // Send audio recording to Gemini API for perfect transcription
  const transcribeAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setDictationError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const audioBase64 = await base64Promise;

      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
        }),
      });

      const data = await response.json();
      if (data.transcript && data.transcript.trim()) {
        const text = data.transcript.trim();
        setNoteText((prev) => (prev ? `${prev.trim()}\n\n${text}` : text));
        showSuccessToast('Voice transcribed with Gemini');
      }
    } catch (err: any) {
      console.warn('Audio transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Upload an existing audio memo file (mp3, wav, m4a, webm)
  const handleAudioFileUpload = async (file: File) => {
    setIsTranscribing(true);
    setDictationError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const audioBase64 = await base64Promise;

      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: file.type || 'audio/webm',
        }),
      });

      const data = await response.json();
      if (data.transcript && data.transcript.trim()) {
        const text = data.transcript.trim();
        setNoteText((prev) => (prev ? `${prev.trim()}\n\n${text}` : text));
        if (!noteTitle) {
          const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setNoteTitle(autoTitle);
        }
        showSuccessToast(`Transcribed ${file.name}`);
      } else {
        setDictationError('No speech detected in audio file.');
      }
    } catch (err: any) {
      setDictationError('Failed to transcribe audio file.');
    } finally {
      setIsTranscribing(false);
      if (audioFileInputRef.current) audioFileInputRef.current.value = '';
    }
  };

  // Convert uploaded file (PDF, DOCX, PPTX, XLSX, Images, Text) into structured written notes
  const handleConvertFileToNotes = async (file: File) => {
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setDictationError('File exceeds 50MB limit. Please upload a smaller file.');
      return;
    }

    setIsConvertingFileToNotes(true);
    setConvertingFileName(file.name);
    setDictationError(null);

    try {
      let fileBase64 = '';
      if (file.type.startsWith('image/')) {
        fileBase64 = await compressImage(file);
      } else {
        const reader = new FileReader();
        fileBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const response = await fetch('/api/convert-to-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          fileName: file.name,
          mimeType: file.type,
        }),
      });

      const data = await response.json();
      if (data.writtenNotes) {
        setNoteText((prev) => {
          if (prev && prev.trim()) {
            return `${prev.trim()}\n\n---\n\n${data.writtenNotes}`;
          }
          return data.writtenNotes;
        });

        if (!noteTitle.trim() && data.title) {
          setNoteTitle(data.title);
        }

        showSuccessToast(`Converted ${file.name} into written notes!`);
      } else {
        throw new Error(data.error || 'Failed to convert file into notes');
      }
    } catch (err: any) {
      console.error('File to notes conversion failed:', err);
      setDictationError(`Failed to convert ${file.name} to notes: ${err.message || 'Please try again.'}`);
    } finally {
      setIsConvertingFileToNotes(false);
      setConvertingFileName(null);
      if (notesFileInputRef.current) notesFileInputRef.current.value = '';
    }
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;

    const memory: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'note',
      title: noteTitle.trim() || noteText.slice(0, 35).trim(),
      description: isPrivate ? 'Private note (Zero AI access · Stored locally)' : noteText.trim().slice(0, 160),
      originalText: noteText.trim(),
      extractedDetails: { text: noteText.trim() },
      createdAt: Date.now(),
      tags: ['note', ...(isPrivate ? ['private'] : [])],
      isPrivate: isPrivate,
      password: password.trim() ? password.trim() : undefined,
    };

    onSave(memory);
    showSuccessToast(
      isPrivate ? 'Private note secured in local memory' : 'Note saved to memory'
    );
    setNoteTitle('');
    setNoteText('');
    setIsPrivate(false);
    setPassword('');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      id="memory-capture-section"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto px-4 my-8"
    >
      <div className="bg-white/90 dark:bg-[#090e17]/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-lg shadow-slate-200/30 dark:shadow-black/30">
        {/* Top Header: Section Label & Tab Switcher */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Preserve
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              · Instant indexing &amp; exact in-browser preview
            </span>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-850 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('file')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-teal-300 font-semibold shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('note')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'note'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-teal-300 font-semibold shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Notes &amp; Convert File
            </button>
          </div>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {saveSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium overflow-hidden"
            >
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{saveSuccessMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: PRO & MINIMAL FILE UPLOAD BAR */}
        {activeTab === 'file' ? (
          <div className="space-y-3">
            {!uploadedFile ? (
              /* Idle / Dropzone Bar */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isDragOver
                    ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/20 ring-2 ring-teal-500/20'
                    : isPrivate
                    ? 'border-amber-400/80 dark:border-amber-600/60 bg-amber-50/15 dark:bg-amber-950/10'
                    : 'border-dashed border-slate-300 dark:border-slate-800 hover:border-teal-500/80 dark:hover:border-teal-500/50 bg-slate-50/50 dark:bg-[#060a12]/50 hover:bg-white dark:hover:bg-[#070b13]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {/* Left: Upload Icon & Descriptive Label */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0 ${
                    isPrivate
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400'
                  }`}>
                    {isPrivate ? <Lock className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                      <span>{isPrivate ? 'Upload Private File (Zero AI Processing)' : 'Drop files here or click to browse'}</span>
                      {isPrivate && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Private
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {isPrivate
                        ? 'Stored strictly in local memory · AI will never read or summarize this file'
                        : 'PDF, PowerPoint, Word, Excel, Images · Up to 50MB'}
                    </p>
                  </div>
                </div>

                {/* Right: Micro Format Tags & Browse Button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isPrivate && (
                    <div className="hidden md:flex items-center gap-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        PPTX
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        DOCX
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        XLSX
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        PDF
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold shadow-2xs border cursor-pointer ${
                      isPrivate
                        ? 'bg-amber-600 hover:bg-amber-500 border-amber-700'
                        : 'bg-slate-900 dark:bg-slate-800 text-white dark:text-teal-300 hover:bg-slate-800 dark:hover:bg-slate-700 border-transparent dark:border-slate-700'
                    }`}
                  >
                    <span>Browse</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </div>
              </div>
            ) : (
              /* Selected State: Sleek Pro File Status Bar */
              <div className={`p-3.5 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isPrivate
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/60'
                  : 'bg-slate-50/80 dark:bg-[#070b13] border-slate-200/90 dark:border-slate-800'
              }`}>
                {/* File Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    {getFileCategoryInfo(uploadedFile.file.name, uploadedFile.file.type).icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {analysisResult?.title || uploadedFile.file.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                          getFileCategoryInfo(uploadedFile.file.name, uploadedFile.file.type).badge
                        }`}
                      >
                        {getFileCategoryInfo(uploadedFile.file.name, uploadedFile.file.type).label}
                      </span>
                      {isPrivate && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Private File</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      <span>{formatFileSize(uploadedFile.file.size)}</span>
                      <span>·</span>
                      {isPrivate ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Zero AI Processing (Protected Locally)
                        </span>
                      ) : isAnalyzing ? (
                        <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
                          <Loader2 className="w-3 h-3 animate-spin" /> Analyzing with Gemini...
                        </span>
                      ) : (
                        <span className="truncate">
                          {analysisResult?.description || 'Ready to save'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    onClick={resetFileForm}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Cancel upload"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSaveUploadedFile}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                      isPrivate
                        ? 'bg-amber-600 hover:bg-amber-500'
                        : 'bg-teal-600 hover:bg-teal-500'
                    }`}
                  >
                    {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{isPrivate ? 'Save as Private' : 'Save to Memory'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* PRIVACY & PASSWORD PROTECTION BAR */}
            <div className="pt-2 px-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Private Toggle Switch */}
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => {
                      setIsPrivate(e.target.checked);
                      if (!e.target.checked) setPassword('');
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600 relative"></div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Lock className={`w-3.5 h-3.5 ${isPrivate ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span>Mark as Private File</span>
                    <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                      (AI will not read or summarize)
                    </span>
                  </div>
                </label>

                {/* Optional Password Input when marked private */}
                {isPrivate && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <div className="relative flex items-center">
                      <Key className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Set password (optional)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-8 pr-7 py-1 text-xs rounded-lg border border-amber-300/80 dark:border-amber-700/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 w-44 sm:w-52 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-1 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Privacy Shield Explainer */}
              {isPrivate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span>
                    <strong>Zero-AI Privacy Shield:</strong> Gemini AI is strictly forbidden from reading, analyzing, or summarizing this file.
                    {password.trim() ? ' A password is required to view or preview.' : ' Stored safely in local browser storage.'}
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          /* TAB 2: QUICK NOTE & ROBUST VOICE DICTATION */
          <div className="space-y-3">
            {/* Error banner if microphone permissions or services blocked */}
            <AnimatePresence>
              {dictationError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between gap-2 text-amber-800 dark:text-amber-300 text-xs overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span>{dictationError}</span>
                  </div>
                  <button
                    onClick={() => setDictationError(null)}
                    className="p-1 text-amber-500 hover:text-amber-700 dark:hover:text-amber-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title Bar & Mic Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Note title (optional)"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
              />

              <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                {/* Convert File to Notes Button */}
                <input
                  ref={notesFileInputRef}
                  type="file"
                  accept="*/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleConvertFileToNotes(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => notesFileInputRef.current?.click()}
                  disabled={isConvertingFileToNotes}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10 hover:from-teal-500/20 hover:to-purple-500/20 text-teal-800 dark:text-teal-200 border border-teal-500/30 dark:border-teal-400/30 shadow-2xs cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-50"
                  title="Upload any file (PDF, Word, Slides, Excel, or Image) to convert it into structured written notes"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Convert File to Notes</span>
                </button>

                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isListening
                      ? 'bg-red-500 text-white border-red-600 shadow-md animate-pulse ring-2 ring-red-500/30'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:text-teal-600'
                  }`}
                  title={isListening ? 'Click to stop recording & transcribe' : 'Start voice dictation'}
                >
                  {isListening ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Stop ({formatTimer(recordingSeconds)})</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Dictate</span>
                    </>
                  )}
                </button>

                {/* Upload Voice Memo / Audio File Button */}
                <input
                  ref={audioFileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleAudioFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => audioFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Upload audio recording to transcribe"
                >
                  <Music className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="hidden sm:inline">Upload Audio</span>
                </button>
              </div>
            </div>

            {/* Converting File to Written Notes Banner */}
            {isConvertingFileToNotes && (
              <div className="p-3 bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10 border border-teal-500/30 dark:border-teal-400/30 rounded-xl flex items-center gap-3 text-xs text-teal-900 dark:text-teal-200">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>Converting "{convertingFileName}" into structured written notes with AI...</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Extracting document pages, lecture slides, formulas, and synthesizing into clean study notes.
                  </p>
                </div>
              </div>
            )}

            {/* Active Recording or Transcribing Banner */}
            {isListening && (
              <div className="p-2.5 bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between text-xs text-red-700 dark:text-red-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="font-semibold">Recording audio ({formatTimer(recordingSeconds)})... Speak clearly into your mic.</span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-2.5 py-0.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] cursor-pointer"
                >
                  Stop &amp; Transcribe
                </button>
              </div>
            )}

            {isTranscribing && (
              <div className="p-2.5 bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 rounded-xl flex items-center gap-2 text-xs text-teal-800 dark:text-teal-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600 dark:text-teal-400" />
                <span>Transcribing voice recording with Gemini AI...</span>
              </div>
            )}

            {/* Drag-and-drop enabled Textarea */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsNoteDragOver(true);
              }}
              onDragLeave={() => setIsNoteDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsNoteDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleConvertFileToNotes(e.dataTransfer.files[0]);
                }
              }}
              className="relative"
            >
              {isNoteDragOver && (
                <div className="absolute inset-0 bg-teal-500/15 dark:bg-teal-400/20 border-2 border-dashed border-teal-500 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-xs pointer-events-none">
                  <Sparkles className="w-6 h-6 text-teal-600 dark:text-teal-300 animate-bounce mb-1" />
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-100">
                    Drop file here to convert into written notes
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-300">
                    PDF, Word, Slides, Excel, or Screenshot
                  </span>
                </div>
              )}

              <textarea
                rows={5}
                placeholder="Type your notes, or click 'Convert File to Notes' / drag & drop any PDF, Word doc, slides, or photo to automatically generate written notes..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden resize-y font-mono leading-relaxed"
              />
            </div>

            {/* Privacy & Password Controls for Notes */}
            <div className="pt-2 px-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => {
                      setIsPrivate(e.target.checked);
                      if (!e.target.checked) setPassword('');
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600 relative"></div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Lock className={`w-3.5 h-3.5 ${isPrivate ? 'text-amber-500' : 'text-slate-400'}`} />
                    <span>Mark Note as Private</span>
                    <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                      (No AI access)
                    </span>
                  </div>
                </label>

                {isPrivate && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <div className="relative flex items-center">
                      <Key className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password (optional)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-8 pr-7 py-1 text-xs rounded-lg border border-amber-300/80 dark:border-amber-700/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 w-44 sm:w-52 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-1 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
              <span>{noteText.length} characters</span>
              <button
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs ${
                  isPrivate ? 'bg-amber-600 hover:bg-amber-500' : 'bg-teal-600 hover:bg-teal-500'
                }`}
              >
                {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isPrivate ? 'Save Private Note' : 'Save Note'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
