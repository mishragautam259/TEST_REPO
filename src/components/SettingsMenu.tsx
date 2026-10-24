import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MoreVertical,
  Sun,
  Moon,
  Laptop,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  User,
  LogIn,
  LogOut,
} from 'lucide-react';
import { ThemeMode } from '../utils/theme';

interface SettingsMenuProps {
  currentTheme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onReplayIntro?: () => void;
  onRestoreSamples?: () => void;
  currentUser?: any;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  onOpenPro?: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  currentTheme,
  onThemeChange,
  onReplayIntro,
  onRestoreSamples,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  onOpenPro,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const themeOptions: { mode: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System Default', icon: Laptop },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* 3 Dots Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer ${
          isOpen ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white' : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
        }`}
        title="Settings"
        aria-label="Settings"
      >
        <MoreVertical className="w-4 h-4" />
      </motion.button>

      {/* Settings Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-2 z-50 text-slate-800 dark:text-slate-200"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                Settings
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
                Preferences
              </span>
            </div>

            {/* Account Status / Auth Action */}
            <div className="py-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Account
              </div>
              {currentUser ? (
                <div className="px-3 py-1.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                    <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                    <span className="truncate">{currentUser.displayName || currentUser.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onSignOut?.();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="px-2 pt-1">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenAuthModal?.();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In / Create Account</span>
                  </button>
                </div>
              )}
            </div>

            {/* Pro & Subscriptions Link */}
            {onOpenPro && (
              <div className="py-1 border-b border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenPro();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>BrainCache Pro Plans</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    ₹0 Student
                  </span>
                </button>
              </div>
            )}

            {/* Appearance / Theme Options */}
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Appearance
              </div>
              <div className="space-y-0.5 mt-1">
                {themeOptions.map(({ mode, label, icon: Icon }) => {
                  const isActive = currentTheme === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        onThemeChange(mode);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span>{label}</span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional extra actions */}
            {(onReplayIntro || onRestoreSamples) && (
              <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800/80">
                {onReplayIntro && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onReplayIntro();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Play Intro Experience</span>
                  </button>
                )}

                {onRestoreSamples && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onRestoreSamples();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Reload Demo Data</span>
                  </button>
                )}
              </div>
            )}

            {/* Launch Website in New Tab */}
            <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800/80">
              <a
                href={typeof window !== 'undefined' ? window.location.href : '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Open App in New Tab</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Full Page</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
