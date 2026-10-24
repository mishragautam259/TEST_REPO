import React from 'react';
import { motion } from 'motion/react';
import { UploadCloud, MessageSquare, Sparkles } from 'lucide-react';

// Minimal, modern "How it works" section with staggered reveal animations and dark mode
export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Drop it in',
      desc: 'Upload any file (PDF, Excel, Word, PPT, screenshots), paste notes, or record voice memos. Gemini extracts a clean, minimal summary automatically.',
      icon: UploadCloud,
    },
    {
      num: '02',
      title: 'Ask in plain words',
      desc: 'Type natural questions like "Find that screenshot where someone sent me the internship deadline" or "Where is the Wi-Fi password?".',
      icon: MessageSquare,
    },
    {
      num: '03',
      title: 'Get the memory',
      desc: 'Gemini compares your query against all saved memories and surfaces the top 3 best matches with a crystal-clear one-line reason.',
      icon: Sparkles,
    },
  ];

  return (
    <motion.section
      id="how-to-section"
      initial={{ opacity: 0, y: 35 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.3, delay: 1.25, ease: [0.16, 1, 0.3, 1] }}
      className="my-16 max-w-4xl mx-auto px-4"
    >
      <div className="mb-8">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500 mb-1">
          Process
        </h2>
        <p className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          How it works
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.num}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-300 dark:hover:border-teal-500/60 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                    {item.num}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};
