import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UploadCloud,
  Search,
  Sparkles,
  Bot,
  Mic,
  Copy,
  ArrowRight,
  HelpCircle,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { BrainCacheLogo } from './BrainCacheLogo';

interface HowToModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToSearch: () => void;
  onGoToCapture: () => void;
}

export const HowToModal: React.FC<HowToModalProps> = ({
  isOpen,
  onClose,
  onGoToSearch,
  onGoToCapture,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="relative max-w-2xl w-full max-h-[90vh] bg-white dark:bg-[#0c1322] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <BrainCacheLogo size={28} />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    How To Use Brain Cache
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload screenshots, dictation, and search in plain conversational language
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {/* Part 1: How to Upload & Save */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider text-xs">
                  <UploadCloud className="w-4 h-4" />
                  <span>1. How to Upload &amp; Save Memories</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Documents & Screenshots */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      <span className="w-5 h-5 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold text-[10px]">
                        A
                      </span>
                      <span>All Files &amp; Documents</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                        <span><strong>Upload any file:</strong> PDF, Excel, Word, PPT, Screenshots, or text.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                        <span>Or press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono">Ctrl+V</kbd> to paste clipboard screenshots.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                        <span>Gemini extracts a clean, minimal 1-line summary and critical dates.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Notes & Dictation */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      <span className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 flex items-center justify-center font-bold text-[10px]">
                        B
                      </span>
                      <span>Notes &amp; Voice Dictation</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>Switch to the <strong>Note / Voice</strong> tab.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>Click <strong className="text-purple-600 dark:text-purple-400 flex-inline items-center gap-1"><Mic className="w-3 h-3 inline" /> Dictate</strong> to speak your notes aloud.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>Hit <strong>Save Note</strong> to store it in your second memory.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Part 2: How to Search in Plain Words */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs">
                  <Search className="w-4 h-4" />
                  <span>2. How to Search in Plain Language</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    You don't need exact filenames or tags. Just ask natural questions like you're talking to an assistant:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-850 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                        "notes of college"
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Finds CS301 algorithms notes, Dijkstra SSSP, and midterm dates.
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-850 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                        "internship deadline"
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pulls up the research application screenshot and deadline.
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    ✨ <strong>Gemini Reason:</strong> Every match includes a dedicated 1-line reason explaining why it answers your question.
                  </p>
                </div>
              </div>

              {/* Part 3: AI Summarizer & Doubt Solver */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>3. AI Summarizer &amp; AI Doubt Solver</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40">
                    <span className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      AI Summary Button
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                      Click on any card to get an instant <strong>Executive Summary</strong>, core formulas, key takeaways, and critical exam warnings.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                    <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                      <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Doubt Solver Button
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                      Chat with your AI academic tutor grounded in that specific file. Ask conceptual doubts, formulas, or practice quiz questions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Ready to try it out?
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onGoToSearch();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Try Searching</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onGoToCapture();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-teal-300 text-xs font-semibold border border-transparent dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Try Uploading</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
