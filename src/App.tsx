import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ExternalLink, User, LogIn, LogOut, Cloud, Loader2, Sparkles } from 'lucide-react';
import { FloatingDotsCanvas } from './components/FloatingDotsCanvas';
import { Hero } from './components/Hero';
import { QuotesSection } from './components/QuotesSection';
import { MemorySearch } from './components/MemorySearch';
import { MemoryCapture } from './components/MemoryCapture';
import { MemoryLibrary } from './components/MemoryLibrary';
import { ContactSection } from './components/ContactSection';
import { ImageModal } from './components/ImageModal';
import { AiMemoryAssistantModal } from './components/AiMemoryAssistantModal';
import { HowToModal } from './components/HowToModal';
import { AuthModal } from './components/AuthModal';
import { SubscriptionPlansPage } from './components/SubscriptionPlansPage';
import { SettingsMenu } from './components/SettingsMenu';
import { BrainCacheLogo } from './components/BrainCacheLogo';
import { Footer } from './components/Footer';
import { IntroAnimation } from './components/IntroAnimation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MemoryItem } from './types';
import {
  getSavedMemories,
  saveMemoryItem,
  deleteMemoryItem,
  clearAllSavedMemories,
  restoreSampleMemories,
} from './utils/storage';
import { getStoredTheme, applyTheme, ThemeMode } from './utils/theme';
import {
  auth,
  onAuthStateChanged,
  signOut,
  fetchUserMemories,
  saveUserMemory,
  deleteUserMemory,
  migrateLocalMemoriesToCloud,
  FirebaseUser,
} from './utils/firebase';

export default function App() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [previewMemory, setPreviewMemory] = useState<MemoryItem | null>(null);
  const [aiAssistantState, setAiAssistantState] = useState<{
    memory: MemoryItem;
    tab: 'summary' | 'doubts';
  } | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Active View: 'home' | 'pro'
  const [activeView, setActiveView] = useState<'home' | 'pro'>('home');

  // How To modal state
  const [showHowToModal, setShowHowToModal] = useState<boolean>(false);

  // Theme state: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

  // Intro animation starts automatically when user enters the website
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // Listen to hash changes (e.g. #pro, #plans)
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#pro' || window.location.hash === '#plans') {
        setActiveView('pro');
      } else {
        setActiveView('home');
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Apply theme on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const handleThemeChange = (newMode: ThemeMode) => {
    setTheme(newMode);
    applyTheme(newMode);
  };

  // Listen to Firebase Auth state change & restore files for logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsSyncing(true);
        try {
          // Fetch cloud memories from Firestore
          const cloudMemories = await fetchUserMemories(user.uid);
          if (cloudMemories.length > 0) {
            setMemories(cloudMemories);
          } else {
            // New user account: Migrate any initial local samples/files to their cloud vault
            const local = getSavedMemories();
            if (local.length > 0) {
              await migrateLocalMemoriesToCloud(user.uid, local);
              setMemories(local);
            } else {
              setMemories([]);
            }
          }
        } catch (err) {
          console.warn('Error loading cloud memories for user:', err);
          setMemories(getSavedMemories());
        } finally {
          setIsSyncing(false);
        }
      } else {
        // Guest mode: load from browser storage
        setCurrentUser(null);
        const loaded = getSavedMemories();
        setMemories(loaded);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSaveMemory = async (newMemory: MemoryItem) => {
    // Save to Firestore if user is logged in
    if (currentUser) {
      try {
        await saveUserMemory(currentUser.uid, newMemory);
      } catch (err) {
        console.warn('Cloud sync note:', err);
      }
    }
    // Also save in local state / browser cache
    const updated = saveMemoryItem(newMemory);
    setMemories(updated);
  };

  const handleDeleteMemory = async (id: string) => {
    if (currentUser) {
      try {
        await deleteUserMemory(currentUser.uid, id);
      } catch (err) {
        console.warn('Cloud delete note:', err);
      }
    }
    const updated = deleteMemoryItem(id);
    setMemories(updated);
  };

  const handleClearAllMemories = async () => {
    if (currentUser) {
      for (const m of memories) {
        try {
          await deleteUserMemory(currentUser.uid, m.id);
        } catch (e) {
          // ignore
        }
      }
    }
    const empty = clearAllSavedMemories();
    setMemories(empty);
  };

  const handleRestoreSamples = async () => {
    const samples = restoreSampleMemories();
    if (currentUser) {
      await migrateLocalMemoriesToCloud(currentUser.uid, samples);
    }
    setMemories(samples);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setMemories(getSavedMemories());
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  const scrollToSearch = () => {
    const el = document.getElementById('memory-search-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const input = document.getElementById('search-input');
      if (input) input.focus();
    }
  };

  const scrollToCapture = () => {
    const el = document.getElementById('memory-capture-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToContact = () => {
    const el = document.getElementById('contact-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenAiAssistant = (memory: MemoryItem, tab: 'summary' | 'doubts') => {
    setAiAssistantState({ memory, tab });
  };

  if (activeView === 'pro') {
    return (
      <ErrorBoundary>
        <SubscriptionPlansPage
          onBack={() => {
            setActiveView('home');
            window.location.hash = '';
          }}
          currentUser={currentUser}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen text-slate-800 dark:text-slate-300 font-sans antialiased selection:bg-teal-200 selection:text-teal-900 dark:selection:bg-teal-950 dark:selection:text-teal-300 overflow-x-hidden transition-colors duration-300">
        {/* Cinematic Intro Animation */}
        <AnimatePresence>
          {showIntro && (
            <IntroAnimation onComplete={() => setShowIntro(false)} />
          )}
        </AnimatePresence>

        {/* Modern ambient background */}
        <div className="fixed inset-0 pointer-events-none -z-10 ambient-bg transition-colors duration-500" />

        {/* Interactive cursor graphic & floating dots canvas */}
        <FloatingDotsCanvas />

        {/* Main Website Functions Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showIntro ? 0 : 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col min-h-screen"
        >
          {/* Navigation Bar */}
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? -20 : 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-[#080b11]/85 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300"
          >
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              {/* Logo with minimal icon */}
              <div
                className="flex items-center gap-2.5 group cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <BrainCacheLogo size={28} />
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Brain Cache
                </span>
              </div>

              {/* Navigation items + Auth + Settings */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* How To Button */}
                <button
                  onClick={() => setShowHowToModal(true)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/70 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center gap-1.5 border border-transparent hover:border-teal-200/60 dark:hover:border-slate-700/60"
                  title="How to upload, save, and search memories"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>How To</span>
                </button>

                {/* Open in Separate Tab */}
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-850 transition-colors cursor-pointer border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60"
                  title="Open Brain Cache in a new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>New Tab</span>
                </a>

                <button
                  onClick={scrollToSearch}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                >
                  Search
                </button>

                <button
                  onClick={scrollToContact}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                >
                  Contact
                </button>

                {/* Pro Subscriptions Button */}
                <button
                  onClick={() => {
                    setActiveView('pro');
                    window.location.hash = '#pro';
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white text-xs font-bold shadow-xs hover:shadow-md hover:scale-[1.03] transition-all cursor-pointer"
                  title="BrainCache Pro Plans & 6-Month Free Student Pass"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pro</span>
                </button>

                {/* User Auth Status / Sign In Button */}
                {currentUser ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60 text-teal-800 dark:text-teal-300 text-xs font-semibold">
                    {isSyncing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600 dark:text-teal-400" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span className="hidden sm:inline max-w-[110px] truncate">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="p-0.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer ml-0.5"
                      title="Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    title="Sign in with your email so files stay visible across tab closes"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                )}

                {/* 3 Dots Settings Dropdown */}
                <SettingsMenu
                  currentTheme={theme}
                  onThemeChange={handleThemeChange}
                  onReplayIntro={() => setShowIntro(true)}
                  onRestoreSamples={handleRestoreSamples}
                  currentUser={currentUser}
                  onOpenAuthModal={() => setShowAuthModal(true)}
                  onSignOut={handleSignOut}
                  onOpenPro={() => {
                    setActiveView('pro');
                    window.location.hash = '#pro';
                  }}
                />
              </div>
            </div>
          </motion.nav>

          {/* Hero Section */}
          <Hero
            memoryCount={memories.length}
            onFocusSearch={scrollToSearch}
            onFocusCapture={scrollToCapture}
          />

          {/* Natural Language AI Search */}
          <MemorySearch
            memories={memories}
            onPreviewImage={(mem) => setPreviewMemory(mem)}
            onDeleteMemory={handleDeleteMemory}
            onOpenAiAssistant={handleOpenAiAssistant}
          />

          {/* Quick Capture Box */}
          <MemoryCapture onSave={handleSaveMemory} />

          {/* Quotes for Students & Office Professionals */}
          <QuotesSection />

          {/* Library & Clear Memory */}
          <MemoryLibrary
            memories={memories}
            onPreviewImage={(mem) => setPreviewMemory(mem)}
            onDeleteMemory={handleDeleteMemory}
            onClearAll={handleClearAllMemories}
            onRestoreSamples={handleRestoreSamples}
            onOpenAiAssistant={handleOpenAiAssistant}
          />

          {/* Brain Cache Contact Details Section */}
          <ContactSection />

          {/* How To Interactive Guide Modal */}
          <HowToModal
            isOpen={showHowToModal}
            onClose={() => setShowHowToModal(false)}
            onGoToSearch={scrollToSearch}
            onGoToCapture={scrollToCapture}
          />

          {/* Universal Document, File, & Image Viewer Modal */}
          <ImageModal
            memory={previewMemory}
            onClose={() => setPreviewMemory(null)}
            onOpenAiAssistant={handleOpenAiAssistant}
          />

          {/* AI Summarizer and AI Doubt Solver Modal */}
          <AiMemoryAssistantModal
            memory={aiAssistantState?.memory || null}
            initialTab={aiAssistantState?.tab || 'summary'}
            onClose={() => setAiAssistantState(null)}
          />

          {/* Cloud Auth / Login Modal */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={(user) => {
              setCurrentUser(user);
            }}
          />

          {/* Footer */}
          <Footer />
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
