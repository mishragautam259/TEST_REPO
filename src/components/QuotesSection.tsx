import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Quote, RefreshCw, Copy, Check } from 'lucide-react';

interface QuoteItem {
  id: string;
  quote: string;
  author: string;
  target: 'Student' | 'Workplace' | 'Mindset';
}

const ALL_QUOTES: QuoteItem[] = [
  {
    id: '1',
    quote: 'Your brain is for having ideas, not holding them.',
    author: 'David Allen',
    target: 'Mindset',
  },
  {
    id: '2',
    quote: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
    target: 'Student',
  },
  {
    id: '3',
    quote: 'Identify the essential. Eliminate the rest.',
    author: 'Leo Babauta',
    target: 'Workplace',
  },
  {
    id: '4',
    quote: 'Breaking complex tasks into small parts is the secret of getting ahead.',
    author: 'Mark Twain',
    target: 'Student',
  },
  {
    id: '5',
    quote: 'Knowledge is only power when it can be found and applied.',
    author: 'Dale Carnegie',
    target: 'Workplace',
  },
  {
    id: '6',
    quote: 'Organizing before you work prevents everything from getting mixed up.',
    author: 'A.A. Milne',
    target: 'Mindset',
  },
];

// Pro & Minimal Quotes Section — Exactly 3 compact quotes, minimal vertical space, zero clutter
export const QuotesSection: React.FC = () => {
  const [startIndex, setStartIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Show only 3 quotes at a time
  const visibleQuotes = [
    ALL_QUOTES[startIndex % ALL_QUOTES.length],
    ALL_QUOTES[(startIndex + 1) % ALL_QUOTES.length],
    ALL_QUOTES[(startIndex + 2) % ALL_QUOTES.length],
  ];

  const handleNextQuotes = () => {
    setStartIndex((prev) => (prev + 3) % ALL_QUOTES.length);
  };

  const handleCopy = (id: string, text: string, author: string) => {
    navigator.clipboard.writeText(`"${text}" — ${author}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="my-8 max-w-4xl mx-auto px-4">
      {/* Sleek, minimal header bar */}
      <div className="flex items-center justify-between mb-3 px-1 text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Perspectives
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            · For students &amp; professionals
          </span>
        </div>

        <button
          onClick={handleNextQuotes}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Show next quotes"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Shuffle</span>
        </button>
      </div>

      {/* Exactly 3 Pro & Minimal Quote Cards in a single row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {visibleQuotes.map((item) => (
          <div
            key={item.id}
            className="group relative bg-white/80 dark:bg-[#090e17]/80 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                  {item.target}
                </span>

                <button
                  onClick={() => handleCopy(item.id, item.quote, item.author)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity cursor-pointer"
                  title="Copy quote"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                "{item.quote}"
              </p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-semibold text-slate-900 dark:text-slate-200">
              — {item.author}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
