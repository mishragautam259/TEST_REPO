import React from 'react';
import { Mail, Sparkles } from 'lucide-react';
import { BrainCacheLogo } from './BrainCacheLogo';

// Minimal, modern footer with Brain Cache contact details and dark mode support
export const Footer: React.FC = () => {
  const scrollToContact = () => {
    const el = document.getElementById('contact-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="mt-20 py-10 border-t border-slate-200/70 dark:border-slate-800/80 bg-white/50 dark:bg-[#0b0f17]/70 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2.5">
          <BrainCacheLogo size={22} />
          <span className="font-semibold text-slate-900 dark:text-slate-200">Brain Cache</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span>Your second memory</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={scrollToContact}
            className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Contact: support@braincache.ai</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Built with Google AI Studio and Gemini</span>
        </div>
      </div>
    </footer>
  );
};
