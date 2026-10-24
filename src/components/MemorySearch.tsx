import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sparkles,
  Loader2,
  X,
  CornerDownLeft,
  Filter,
  FileText,
  Presentation,
  FileSpreadsheet,
  File,
  ImageIcon,
  Clock,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';
import { MemoryItem, SearchMatchResult } from '../types';
import { MemoryCard } from './MemoryCard';

interface MemorySearchProps {
  memories: MemoryItem[];
  onPreviewImage: (memory: MemoryItem) => void;
  onDeleteMemory: (id: string) => void;
  onOpenAiAssistant?: (memory: MemoryItem, tab: 'summary' | 'doubts') => void;
}

type FilterCategory = 'all' | 'presentation' | 'document' | 'spreadsheet' | 'pdf' | 'screenshot';

// Ultra-fast client search scorer (executes in 2ms)
function computeInstantLocalMatches(q: string, pool: MemoryItem[]): { memory: MemoryItem; reason: string; score: number }[] {
  const queryLower = q.toLowerCase().trim();
  const words = queryLower
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  if (words.length === 0) {
    return pool.slice(0, 3).map((m) => ({
      memory: m,
      score: 1,
      reason: `Matched file in your library (${m.fileName || m.title})`,
    }));
  }

  const scored = pool.map((m) => {
    let score = 0;
    const title = (m.title || '').toLowerCase();
    const fileName = (m.fileName || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    const text = (m.originalText || m.extractedDetails?.text || '').toLowerCase();
    const fileType = (m.fileType || m.type || '').toLowerCase();
    const dates = (m.extractedDetails?.dates || []).join(' ').toLowerCase();
    const deadlines = (m.extractedDetails?.deadlines || []).join(' ').toLowerCase();
    const names = (m.extractedDetails?.names || []).join(' ').toLowerCase();

    // Exact title or filename match gets top boost
    if (title.includes(queryLower) || fileName.includes(queryLower)) {
      score += 15;
    }

    for (const w of words) {
      if (title.includes(w)) score += 8;
      if (fileName.includes(w)) score += 8;
      if (deadlines.includes(w)) score += 6;
      if (names.includes(w)) score += 5;
      if (desc.includes(w)) score += 4;
      if (fileType.includes(w)) score += 4;
      if (dates.includes(w)) score += 3;
      if (text.includes(w)) score += 2;
    }

    return {
      memory: m,
      score,
      reason: score > 0 ? `Matched "${q}" in ${m.fileName || m.title}` : '',
    };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// Pro & Minimal Spotlight Search Bar
export const MemorySearch: React.FC<MemorySearchProps> = ({
  memories,
  onPreviewImage,
  onDeleteMemory,
  onOpenAiAssistant,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchResults, setSearchResults] = useState<{
    matches: { memory: MemoryItem; reason: string; score: number }[];
    isFallback: boolean;
  }>({ matches: [], isFallback: false });

  // Voice Search states
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceTranscribing, setIsVoiceTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const speechRecognitionRef = React.useRef<any>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const silenceTimerRef = React.useRef<any>(null);
  const currentTranscriptRef = React.useRef<string>('');

  const stopVoiceSearch = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setIsVoiceListening(false);
  };

  const startVoiceSearch = async () => {
    setVoiceError(null);
    currentTranscriptRef.current = '';

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // 1. Browser Native Web Speech API for instantaneous transcription
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsVoiceListening(true);
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }

          if (transcript.trim()) {
            currentTranscriptRef.current = transcript.trim();
            setQuery(transcript.trim());

            // Auto-submit 1.3s after user stops speaking
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (currentTranscriptRef.current.trim()) {
                stopVoiceSearch();
                handleSearch(currentTranscriptRef.current.trim());
              }
            }, 1300);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition error:', e);
          setIsVoiceListening(false);
          if (e.error !== 'no-speech') {
            setVoiceError('Microphone access was denied or unavailable. Please check permissions.');
          }
        };

        recognition.onend = () => {
          setIsVoiceListening(false);
          const finalQuery = currentTranscriptRef.current.trim();
          if (finalQuery) {
            handleSearch(finalQuery);
          }
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
        return;
      } catch (e) {
        console.warn('Native speech recognition failed, falling back to recorder:', e);
      }
    }

    // 2. High-Fidelity Audio Recording + Gemini API fallback
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setVoiceError('Voice search is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (audioBlob.size > 0) {
          setIsVoiceTranscribing(true);
          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Data = reader.result as string;
              const res = await fetch('/api/transcribe-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioBase64: base64Data,
                  mimeType: recorder.mimeType || 'audio/webm',
                }),
              });
              const data = await res.json();
              if (data.transcription && data.transcription.trim()) {
                const transcribedText = data.transcription.trim();
                setQuery(transcribedText);
                handleSearch(transcribedText);
              } else {
                setVoiceError('Could not recognize any speech. Please try speaking again.');
              }
              setIsVoiceTranscribing(false);
            };
            reader.readAsDataURL(audioBlob);
          } catch (err) {
            console.error('Transcription error:', err);
            setIsVoiceTranscribing(false);
            setVoiceError('Failed to process voice query. Please try again.');
          }
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsVoiceListening(true);
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      setIsVoiceListening(false);
      setVoiceError('Microphone permission was not granted.');
    }
  };

  const toggleVoiceSearch = () => {
    if (isVoiceListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  // Cleanup microphone on unmount
  useEffect(() => {
    return () => {
      stopVoiceSearch();
    };
  }, []);

  // Keyboard shortcut listener (Cmd+K or / to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('pro-search-input')?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('pro-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const quickFilters: { id: FilterCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: null },
    { id: 'presentation', label: 'Slides', icon: <Presentation className="w-3 h-3 text-amber-500" /> },
    { id: 'document', label: 'Docs', icon: <File className="w-3 h-3 text-blue-500" /> },
    { id: 'spreadsheet', label: 'Sheets', icon: <FileSpreadsheet className="w-3 h-3 text-emerald-500" /> },
    { id: 'pdf', label: 'PDFs', icon: <FileText className="w-3 h-3 text-red-500" /> },
    { id: 'screenshot', label: 'Images', icon: <ImageIcon className="w-3 h-3 text-teal-500" /> },
  ];

  const examplePrompts = [
    'triple integration notes',
    'internship deadline',
    'flight ticket confirmation',
    'medical receipt with Dr. Bennett',
  ];

  // In-memory client cache for instant 0ms responses
  const searchCacheRef = React.useRef<Map<string, { matches: { memory: MemoryItem; reason: string; score: number }[]; isFallback: boolean }>>(new Map());

  const handleSearch = async (searchQuery?: string, filterCat: FilterCategory = activeFilter) => {
    const q = (searchQuery !== undefined ? searchQuery : query).trim();
    if (!q && filterCat === 'all') return;

    if (searchQuery !== undefined) {
      setQuery(searchQuery);
    }

    setHasSearched(true);

    // Filter memories pool
    const pool = filterCat === 'all'
      ? memories
      : memories.filter((m) => {
          if (filterCat === 'screenshot') return m.type === 'screenshot' || m.type === 'photo';
          return m.type === filterCat;
        });

    const cacheKey = `${q.toLowerCase()}__${filterCat}__${pool.length}`;

    // 1. Instant Cache Check (< 1ms)
    if (searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey)!;
      setSearchResults(cached);
      setIsSearching(false);
      return;
    }

    // 2. Dual-Phase Progressive Search: Show Instant local matches (< 5ms)
    const instantLocalMatches = computeInstantLocalMatches(q, pool);
    if (instantLocalMatches.length > 0) {
      setSearchResults({
        matches: instantLocalMatches,
        isFallback: false,
      });
    }

    setIsSearching(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q || `All files in ${filterCat}`,
          memories: pool.map((m) => ({
            id: m.id,
            title: m.title,
            type: m.type,
            description: m.description,
            text: m.extractedDetails?.text || m.originalText || '',
            dates: m.extractedDetails?.dates || [],
            deadlines: m.extractedDetails?.deadlines || [],
            names: m.extractedDetails?.names || [],
            createdAt: m.createdAt,
          })),
        }),
      });

      const data = await response.json();
      const rawMatches: SearchMatchResult[] = data.matches || [];

      const resolved = rawMatches
        .map((match) => {
          const found = memories.find((m) => m.id === match.id);
          if (!found) return null;
          return {
            memory: found,
            reason: match.reason,
            score: match.score || 1,
          };
        })
        .filter((item): item is { memory: MemoryItem; reason: string; score: number } => item !== null)
        .slice(0, 3);

      const finalResults = {
        matches: resolved.length > 0 ? resolved : instantLocalMatches,
        isFallback: Boolean(data.isFallback),
      };

      searchCacheRef.current.set(cacheKey, finalResults);
      setSearchResults(finalResults);
    } catch (err) {
      console.warn('Network search notice, using instant local matches:', err);
      if (instantLocalMatches.length > 0) {
        setSearchResults({ matches: instantLocalMatches, isFallback: true });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setHasSearched(false);
    setSearchResults({ matches: [], isFallback: false });
  };

  return (
    <motion.div
      id="memory-search-section"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto px-4 my-8"
    >
      {/* Pro & Minimal Spotlight Search Container */}
      <div className="relative group">
        {/* Subtle hairline glow on hover/focus */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 rounded-2xl blur-xs opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative bg-white/90 dark:bg-[#090e17]/90 backdrop-blur-xl rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-lg shadow-slate-200/40 dark:shadow-black/40 overflow-hidden transition-all duration-300">
          {/* Main Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center px-4 sm:px-5 py-3.5 gap-3"
          >
            {/* Search Icon */}
            <div className="flex-shrink-0 text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            </div>

            {/* Input Field */}
            <input
              id="pro-search-input"
              type="text"
              placeholder={
                isVoiceListening
                  ? 'Listening... Speak your search query now...'
                  : isVoiceTranscribing
                  ? 'Transcribing your voice query...'
                  : 'Search anything in your memory... (e.g. triple integration, college notes)'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm sm:text-base font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden min-w-0"
            />

            {/* Keyboard Shortcut Indicator & Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Voice Search Button */}
              <button
                type="button"
                onClick={toggleVoiceSearch}
                className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isVoiceListening
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400/60'
                    : isVoiceTranscribing
                    ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                    : 'text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isVoiceListening ? 'Stop listening' : 'Voice Search your files'}
                aria-label="Voice Search"
              >
                {isVoiceListening && (
                  <span className="absolute inset-0 rounded-xl bg-rose-400/40 animate-ping pointer-events-none" />
                )}
                {isVoiceTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
                ) : isVoiceListening ? (
                  <Mic className="w-4 h-4 text-white animate-pulse" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {!query && (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 rounded border border-slate-200/60 dark:border-slate-700/60 select-none">
                  ⌘K
                </kbd>
              )}

              {/* Minimal Pro Search Button */}
              <button
                type="submit"
                disabled={!query.trim() && activeFilter === 'all'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-teal-300 text-xs font-semibold shadow-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer border border-transparent dark:border-slate-700/80"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Search</span>
                    <CornerDownLeft className="w-3 h-3 opacity-60 hidden sm:inline" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Active Voice Search Listening Banner */}
          <AnimatePresence>
            {isVoiceListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-2 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-teal-500/10 border-t border-rose-200/40 dark:border-rose-900/30 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 font-medium"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
                  <span>Listening... Speak your search query now (e.g. &quot;internship deadline&quot; or &quot;triple integration&quot;)</span>
                </div>
                <button
                  type="button"
                  onClick={stopVoiceSearch}
                  className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                >
                  Done / Search
                </button>
              </motion.div>
            )}

            {voiceError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300"
              >
                <span>⚠️ {voiceError}</span>
                <button
                  type="button"
                  onClick={() => setVoiceError(null)}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-800 text-xs ml-2 cursor-pointer font-bold"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Bar: Micro Category Switchers & Example Chips */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-slate-50/60 dark:bg-[#060a12]/60 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Filter:
              </span>
              {quickFilters.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveFilter(tab.id);
                    if (query.trim() || tab.id !== 'all') {
                      handleSearch(undefined, tab.id);
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-teal-300 font-semibold shadow-2xs border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Micro Prompt Suggestions */}
            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px]">Try:</span>
              {examplePrompts.slice(0, 2).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSearch(prompt)}
                  className="text-[11px] text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 underline decoration-slate-300 dark:decoration-slate-700 transition-colors cursor-pointer truncate max-w-[150px]"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Display */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Top Recall Matches
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  {searchResults.matches.length} found
                </span>
              </div>
              <button
                onClick={clearSearch}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Clear Results
              </button>
            </div>

            {searchResults.matches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {searchResults.matches.map((item, index) => (
                  <MemoryCard
                    key={item.memory.id}
                    memory={item.memory}
                    matchReason={item.reason}
                    rank={index + 1}
                    highlight={index === 0}
                    onPreviewImage={onPreviewImage}
                    onDelete={onDeleteMemory}
                    onOpenAiAssistant={onOpenAiAssistant}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-400">
                No memories matched "{query}". Try a different topic or keyword.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
