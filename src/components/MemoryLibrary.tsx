import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  RefreshCw,
  FolderOpen,
  LayoutList,
  LayoutGrid,
  FileText,
  Presentation,
  FileSpreadsheet,
  File,
  ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MemoryItem, MemoryType } from '../types';
import { MemoryCard } from './MemoryCard';

interface MemoryLibraryProps {
  memories: MemoryItem[];
  onPreviewImage: (memory: MemoryItem) => void;
  onDeleteMemory: (id: string) => void;
  onClearAll: () => void;
  onRestoreSamples: () => void;
  onOpenAiAssistant?: (memory: MemoryItem, tab: 'summary' | 'doubts') => void;
}

type LibraryFilter = 'all' | 'vault' | 'presentation' | 'document' | 'spreadsheet' | 'pdf' | 'screenshot' | 'note';

const INITIAL_DISPLAY_COUNT = 5;

// Pro & Minimal Storage Section with 5-6 Items Limit + Load More + Show Less + Private Vault
export const MemoryLibrary: React.FC<MemoryLibraryProps> = ({
  memories,
  onPreviewImage,
  onDeleteMemory,
  onClearAll,
  onRestoreSamples,
  onOpenAiAssistant,
}) => {
  const [filterType, setFilterType] = useState<LibraryFilter>('all');
  const [viewMode, setViewMode] = useState<'row' | 'grid'>('row'); // Default to Row (File Bar) view
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_DISPLAY_COUNT);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const privateCount = memories.filter((m) => m.isPrivate).length;

  const filterTabs: { id: LibraryFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: memories.length },
    ...(privateCount > 0
      ? [{ id: 'vault' as LibraryFilter, label: '🔒 Vault', count: privateCount }]
      : []),
    {
      id: 'presentation',
      label: 'Slides',
      count: memories.filter((m) => m.type === 'presentation').length,
    },
    {
      id: 'document',
      label: 'Docs',
      count: memories.filter((m) => m.type === 'document').length,
    },
    {
      id: 'spreadsheet',
      label: 'Sheets',
      count: memories.filter((m) => m.type === 'spreadsheet').length,
    },
    {
      id: 'pdf',
      label: 'PDFs',
      count: memories.filter((m) => m.type === 'pdf').length,
    },
    {
      id: 'screenshot',
      label: 'Images',
      count: memories.filter((m) => m.type === 'screenshot' || m.type === 'photo').length,
    },
  ];

  const filteredMemories = memories.filter((m) => {
    if (filterType === 'all') return true;
    if (filterType === 'vault') return Boolean(m.isPrivate);
    if (filterType === 'screenshot') return m.type === 'screenshot' || m.type === 'photo';
    return m.type === filterType;
  });

  const displayedMemories = filteredMemories.slice(0, visibleCount);
  const hasMore = filteredMemories.length > visibleCount;
  const remainingCount = filteredMemories.length - visibleCount;

  const handleFilterChange = (type: LibraryFilter) => {
    setFilterType(type);
    setVisibleCount(INITIAL_DISPLAY_COUNT); // Reset to 5 items on filter change
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  const handleShowLess = () => {
    setVisibleCount(INITIAL_DISPLAY_COUNT);
    // Smooth scroll back up to the storage header
    document.getElementById('storage-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.section
      id="storage-header"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-6xl mx-auto px-4 my-10"
    >
      {/* Pro Storage Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Left: Storage Label & Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Storage
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
              {memories.length} files
            </span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">
            · In-browser persistent cache
          </span>
        </div>

        {/* Right Controls: View Switcher, Load Demo & Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Toggle: List (File Bar) vs Grid */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-850 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('row')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'row'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-teal-300 shadow-2xs font-semibold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="File Bar view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-teal-300 shadow-2xs font-semibold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Grid card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Load Sample Data */}
          <button
            onClick={onRestoreSamples}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Restore sample documents"
          >
            <RefreshCw className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Demo Data</span>
          </button>

          {/* Clear Storage */}
          {memories.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-all cursor-pointer"
              title="Clear all stored files"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleFilterChange(tab.id)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterType === tab.id
                ? 'bg-slate-900 dark:bg-slate-800 text-white dark:text-teal-300 shadow-2xs border border-transparent dark:border-slate-700'
                : 'bg-white/80 dark:bg-[#090e17]/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] opacity-70 font-mono">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Storage Files List / Grid (Limited to 5 items initially) */}
      {displayedMemories.length > 0 ? (
        <>
          {viewMode === 'row' ? (
            /* PRO & MINIMAL UPLOADED FILE BAR VIEW */
            <div className="space-y-2">
              {displayedMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  layout="row"
                  onPreviewImage={onPreviewImage}
                  onDelete={onDeleteMemory}
                  onOpenAiAssistant={onOpenAiAssistant}
                />
              ))}
            </div>
          ) : (
            /* PRO & MINIMAL GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  layout="grid"
                  onPreviewImage={onPreviewImage}
                  onDelete={onDeleteMemory}
                  onOpenAiAssistant={onOpenAiAssistant}
                />
              ))}
            </div>
          )}

          {/* Minimal Pagination Actions: Load More / Show Less */}
          {(hasMore || visibleCount > INITIAL_DISPLAY_COUNT) && (
            <div className="flex items-center justify-center gap-2.5 pt-5 pb-2">
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#090e17] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                >
                  <span>Load More Files</span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
                    +{Math.min(5, remainingCount)} of {remainingCount}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                </button>
              )}

              {visibleCount > INITIAL_DISPLAY_COUNT && (
                <button
                  onClick={handleShowLess}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-850 hover:bg-slate-200/90 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-750 text-xs font-medium transition-all cursor-pointer group"
                  title="Collapse to initial 5 files"
                >
                  <span>Show Less</span>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No files found in this category
          </p>
          <p className="text-xs text-slate-400">
            Upload files above or click "Demo Data" to populate with sample documents.
          </p>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              className="max-w-sm w-full bg-white dark:bg-[#0c1322] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Clear all files?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This will remove all {memories.length} saved files from your browser's local memory.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearAll();
                    setShowClearConfirm(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
