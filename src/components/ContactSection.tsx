import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Copy, Check, ArrowUpRight } from 'lucide-react';

// Contact details component for Brain Cache with understated dark mode
export const ContactSection: React.FC = () => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const contactEmails = [
    {
      role: 'Support & Assistance',
      email: 'support@braincache.ai',
      description: 'Need help with memory recall, screenshot analysis, or account queries?',
      badge: '24/7 Support',
    },
    {
      role: 'Product Feedback & Ideas',
      email: 'feedback@braincache.ai',
      description: 'Have ideas to make Brain Cache even smarter? We read every submission.',
      badge: 'Direct to Team',
    },
    {
      role: 'General Inquiries & Hello',
      email: 'hello@braincache.ai',
      description: 'Say hi to the Brain Cache creators or discuss collaborations & API access.',
      badge: 'General',
    },
  ];

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <motion.section
      id="contact-section"
      initial={{ opacity: 0, y: 35 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.3, delay: 1.55, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto px-4 my-16"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 text-xs font-medium mb-3 border border-slate-200/60 dark:border-slate-800">
          <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Brain Cache Contact</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Get in touch with Brain Cache
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-2">
          Have questions, suggestions, or need assistance? Reach out to our team at any of our official email addresses below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contactEmails.map((item, idx) => {
          const isCopied = copiedEmail === item.email;
          return (
            <motion.div
              key={item.email}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-teal-400 dark:hover:border-teal-500/60 hover:shadow-xl hover:shadow-teal-500/5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                    {item.role}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
                    {item.badge}
                  </span>
                </div>

                <a
                  href={`mailto:${item.email}?subject=Inquiry for Brain Cache`}
                  className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors inline-flex items-center gap-1 mb-2"
                >
                  <span>{item.email}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* Minimal dark button, not blinding white */}
                <a
                  href={`mailto:${item.email}?subject=Hello Brain Cache`}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-200 border border-transparent dark:border-slate-700 text-xs font-medium text-center transition-all shadow-2xs hover:shadow-sm"
                >
                  Send Email
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(item.email)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
                  title="Copy email address"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};
