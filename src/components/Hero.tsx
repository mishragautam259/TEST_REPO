import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { BrainCacheLogo } from './BrainCacheLogo';

interface HeroProps {
  memoryCount: number;
  onFocusSearch: () => void;
  onFocusCapture: () => void;
}

const subtitleSlides = [
  {
    id: 'welcome',
    content: (
      <span>
        Your intelligent second memory for notes, documents, and doubts.{' '}
        <span className="font-medium text-slate-900 dark:text-slate-100">
          Ask questions, and Gemini recalls the exact match in seconds.
        </span>
      </span>
    ),
  },
  {
    id: 'features',
    content: (
      <span>
        Drop in screenshots, lecture slides, or PDFs to get written notes.{' '}
        <span className="font-medium text-slate-900 dark:text-slate-100">
          Give the command, and AI solves your questions step by step.
        </span>
      </span>
    ),
  },
];

// Minimal, modern hero section with refined, understated dark mode
export const Hero: React.FC<HeroProps> = ({ memoryCount, onFocusSearch, onFocusCapture }) => {
  const [subtitleIndex, setSubtitleIndex] = useState(0);

  // Smooth, calm looping subtitle cycle with zero layout flicker
  useEffect(() => {
    const timer = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitleSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  return (
    <header className="relative pt-12 pb-8 sm:pt-20 sm:pb-12 text-center max-w-4xl mx-auto px-4 overflow-hidden">
      {/* Morphing ambient glow behind hero - deeply subtle in dark mode */}
      <motion.div
        animate={{
          scale: [1, 1.2, 0.95, 1],
          rotate: [0, 45, 90, 0],
          borderRadius: [
            '40% 60% 70% 30% / 40% 50% 60% 50%',
            '60% 40% 30% 70% / 50% 30% 70% 40%',
            '50% 60% 40% 60% / 40% 60% 50% 60%',
            '40% 60% 70% 30% / 40% 50% 60% 50%',
          ],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96 bg-gradient-to-tr from-teal-200/20 via-indigo-200/15 to-pink-200/20 dark:from-teal-950/20 dark:via-indigo-950/15 dark:to-purple-950/20 blur-3xl pointer-events-none -z-10"
      />

      {/* 1. Animated Badge with custom mini Logo */}
      <motion.div
        initial={{ opacity: 0, y: -24, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-2.5 px-3.5 py-1.5 mb-6 rounded-full bg-white/85 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs text-slate-700 dark:text-slate-300 text-xs font-medium tracking-tight"
      >
        <BrainCacheLogo size={18} />
        <span className="font-semibold text-slate-900 dark:text-slate-200">Brain Cache</span>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <span className="text-slate-500 dark:text-slate-400">Your second memory</span>
      </motion.div>

      {/* 2. Main Title */}
      <motion.h1
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.08] mb-5"
      >
        Your second{' '}
        <span className="font-serif italic font-normal bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 dark:from-teal-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
          memory.
        </span>
      </motion.h1>

      {/* 3. Subtitle with zero layout shift / flicker */}
      <div className="max-w-xl mx-auto h-12 sm:h-11 relative flex items-center justify-center mb-3 px-2 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={subtitleSlides[subtitleIndex].id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="w-full flex items-center justify-center font-['Outfit',sans-serif] text-sm sm:text-base text-slate-600 dark:text-slate-300 font-normal leading-snug text-center"
          >
            {subtitleSlides[subtitleIndex].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Subtle indicator dots */}
      <div className="flex items-center justify-center gap-1.5 mb-8">
        {subtitleSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSubtitleIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              i === subtitleIndex
                ? 'w-6 bg-teal-500 dark:bg-teal-400'
                : 'w-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
            aria-label={`Subtitle slide ${i + 1}`}
          />
        ))}
      </div>

      {/* 4. Action Buttons (Ultra-minimal in dark mode, no harsh white blocks) */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.3, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          onClick={onFocusSearch}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-100 font-medium text-sm shadow-md border border-transparent dark:border-slate-700/80 cursor-pointer"
        >
          <Search className="w-4 h-4 text-teal-400" />
          <span>Ask Your Memory</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          onClick={onFocusCapture}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium text-sm border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Save Memory</span>
        </motion.button>
      </motion.div>

      {/* 5. Minimal stats indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 1.0 }}
        className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500"
      >
        <Sparkles className="w-3.5 h-3.5 text-teal-500" />
        <span>{memoryCount} {memoryCount === 1 ? 'memory' : 'memories'} cached in browser</span>
        <span>·</span>
        <span>Private & local</span>
      </motion.div>
    </header>
  );
};
