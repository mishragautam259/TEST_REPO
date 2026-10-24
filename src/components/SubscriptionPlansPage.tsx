import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  GraduationCap,
  ShieldCheck,
  Search,
  FileText,
  FileSpreadsheet,
  Presentation,
  Lock,
  Cloud,
  ChevronDown,
  HelpCircle,
  X,
  CreditCard,
  QrCode,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { BrainCacheLogo } from './BrainCacheLogo';
import { ThemeMode } from '../utils/theme';

interface SubscriptionPlansPageProps {
  onBack: () => void;
  currentUser?: any;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const SubscriptionPlansPage: React.FC<SubscriptionPlansPageProps> = ({
  onBack,
  currentUser,
  currentTheme,
  onThemeChange,
}) => {
  const [activePlan, setActivePlan] = useState<string>('free');
  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<{
    id: string;
    title: string;
    price: string;
  } | null>(null);

  // Student verification form state
  const [studentName, setStudentName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentVerified, setStudentVerified] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);

  // Checkout simulation state
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [upiId, setUpiId] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleOpenCheckout = (planId: string, title: string, price: string) => {
    if (planId === 'free') {
      onBack();
      return;
    }
    if (planId === 'student') {
      setShowStudentModal(true);
      return;
    }
    setSelectedCheckoutPlan({ id: planId, title, price });
    setShowCheckoutModal(true);
  };

  const handleVerifyStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeName.trim() || !studentEmail.trim()) return;

    setStudentLoading(true);
    setTimeout(() => {
      setStudentLoading(false);
      setStudentVerified(true);
      setActivePlan('student_pro');
    }, 1200);
  };

  const handleCompletePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      if (selectedCheckoutPlan) {
        setActivePlan(selectedCheckoutPlan.id);
      }
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#070b13] text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-300">
      {/* 1. TOP ANNOUNCEMENT BANNER (Exact Google AI Header Style) */}
      <div className="w-full bg-[#f8fafd] dark:bg-[#0a1120] border-b border-slate-200/80 dark:border-slate-800 py-2.5 px-4 text-center text-xs">
        <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
          <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-slate-700 dark:text-slate-300">
            <strong>Students:</strong> Get a <strong>Pro plan at no cost for 6 months</strong> with verified Student ID.
          </span>
          <button
            onClick={() => setShowStudentModal(true)}
            className="text-blue-600 dark:text-blue-400 font-semibold underline hover:text-blue-700 dark:hover:text-blue-300 ml-1 cursor-pointer"
          >
            Claim now
          </button>
        </div>
      </div>

      {/* 2. SUB-HEADER / NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#070b13]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to BrainCache</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <BrainCacheLogo size={24} />
              <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                BrainCache Plans
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Signed in as <strong className="text-slate-800 dark:text-slate-200">{currentUser.displayName || currentUser.email}</strong>
              </div>
            )}
            {activePlan !== 'free' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {activePlan === 'student_pro' ? '🎓 Student 6-Mo Pass Active' : '⭐ Pro Active'}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO HEADLINE */}
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Choose the BrainCache plan that works for you
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2.5 max-w-2xl mx-auto">
          Scale your memory library, unlock plain-language AI search, office file viewers, and instant study tutors.
        </p>
      </div>

      {/* 4. PLANS COMPARISON GRID (Matching uploaded Google AI screenshot) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">

          {/* ======================================================= */}
          {/* PLAN 1: Free of charge */}
          {/* ======================================================= */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
            <div>
              <div className="min-h-[70px]">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  Free of charge
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Get everyday help from BrainCache to tackle notes, college lectures, and files.
                </p>
              </div>

              {/* Price */}
              <div className="my-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-slate-500 align-super">₹</span>
                  <span className="text-4xl font-bold text-slate-950 dark:text-white">0</span>
                  <span className="text-xs text-slate-500 font-medium">INR/month</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">with a BrainCache Account</p>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => onBack()}
                className="w-full py-2.5 px-4 rounded-full border border-slate-700 dark:border-slate-400 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                {activePlan === 'free' ? 'Current Plan' : 'Get started'}
              </button>

              {/* Feature List Header */}
              <div className="mt-7 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                {/* Item 1 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>BrainCache Storage</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Your personal, proactive memory cache
                  </p>
                  <ul className="pl-5.5 space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span>50 saved memories</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span>Notes &amp; file storage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span>Basic search</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span>Perfect for getting started</span>
                    </li>
                  </ul>
                </div>

                {/* Item 2 */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Basic AI Organization</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5 mt-0.5">
                    Automatic dates and contact detail extraction
                  </p>
                </div>

                {/* Item 3 */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Cloud className="w-3.5 h-3.5 text-slate-500" />
                    <span>Local &amp; Cloud Vault</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5 mt-0.5">
                    Offline browser persistence + Free cloud sync
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* PLAN 2: BrainCache Pro (Most Popular) */}
          {/* ======================================================= */}
          <div className="relative rounded-3xl border-2 border-blue-500 bg-white dark:bg-[#0c1322] p-6 flex flex-col justify-between shadow-lg shadow-blue-500/5 transition-all">
            {/* Top pill badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-xs uppercase tracking-wider">
              ⭐ Most Popular
            </div>

            <div>
              <div className="min-h-[70px]">
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-0.5 uppercase tracking-wide">
                  Recommended for Professionals
                </div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  BrainCache Pro
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Get more access to new and powerful features to boost your productivity.
                </p>
              </div>

              {/* Price */}
              <div className="my-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 align-super">₹</span>
                  <span className="text-4xl font-bold text-slate-950 dark:text-white">99</span>
                  <span className="text-xs text-slate-500 font-medium">INR/month</span>
                </div>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                  10x higher memory limit than Free
                </p>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleOpenCheckout('pro', 'BrainCache Pro', '₹99')}
                className="w-full py-2.5 px-4 rounded-full bg-[#1a73e8] hover:bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                {activePlan === 'pro' ? 'Current Plan' : 'Get started'}
              </button>

              {/* Header: Everything in free and: */}
              <div className="mt-5 mb-2 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600" />
                <span>Everything in Free and:</span>
              </div>

              {/* Feature List */}
              <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>500 Saved Memories</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Preserve 10x more files, PDFs, slides, and screenshots
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <Search className="w-3.5 h-3.5 text-blue-600" />
                    <span>Advanced AI Search</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Plain-language reasoning with contextual one-line answers
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Unlimited Notes &amp; Dictation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Speech-to-text dictation with Gemini transcription
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <Presentation className="w-3.5 h-3.5 text-blue-600" />
                    <span>File &amp; Document Support</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Exact in-browser preview for PowerPoint, Word, Excel &amp; PDF
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Smart Memory Capture &amp; Private Vault</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Priority processing with zero-AI private password protection
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* PLAN 3: BrainCache Pro+ */}
          {/* ======================================================= */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
            <div>
              <div className="min-h-[70px]">
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5 uppercase tracking-wide">
                  Maximum Intelligence
                </div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  BrainCache Pro+
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Unlock the highest level of access to unlimited memories and AI tutoring.
                </p>
              </div>

              {/* Price */}
              <div className="my-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 align-super">₹</span>
                  <span className="text-4xl font-bold text-slate-950 dark:text-white">199</span>
                  <span className="text-xs text-slate-500 font-medium">INR/month</span>
                </div>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                  Unlimited memories + Large file support
                </p>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleOpenCheckout('pro_plus', 'BrainCache Pro+', '₹199')}
                className="w-full py-2.5 px-4 rounded-full bg-[#1a73e8] hover:bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                {activePlan === 'pro_plus' ? 'Current Plan' : 'Get started'}
              </button>

              {/* Header: Everything in Pro and: */}
              <div className="mt-5 mb-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>Everything in BrainCache Pro and:</span>
              </div>

              {/* Feature List */}
              <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Unlimited Memories</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Save without limits across semesters, projects, and work
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Large File Support</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    High-resolution documents, spreadsheets &amp; presentations up to 50MB
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Smart Summaries &amp; Doubt Solver</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Deep multi-turn academic doubt solving &amp; executive summaries
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Priority AI Processing</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Dedicated low-latency queue powered by Gemini models
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Early Access to New Features</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Be the first to try advanced visual memory and audio agent tools
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* PLAN 4: On Student ID (Free for 6 Months) */}
          {/* ======================================================= */}
          <div className="relative rounded-3xl border border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
            {/* Top pill badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Offer</span>
            </div>

            <div>
              <div className="min-h-[70px]">
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5 uppercase tracking-wide">
                  Verified College ID
                </div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  Student Pass
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Full Pro benefits free of charge for students and university scholars.
                </p>
              </div>

              {/* Price */}
              <div className="my-5 pb-5 border-b border-emerald-200/60 dark:border-emerald-900/50">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-emerald-600 align-super">₹</span>
                  <span className="text-4xl font-bold text-slate-950 dark:text-white">0</span>
                  <span className="text-xs text-slate-500 font-medium">/ 6 Months</span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  100% Free on Student ID verification
                </p>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setShowStudentModal(true)}
                className="w-full py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {studentVerified ? '✓ Verified Student' : 'Verify Student ID'}
              </button>

              {/* Header */}
              <div className="mt-5 mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full Pro features included:</span>
              </div>

              {/* Feature List */}
              <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Free for 6 Months</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Zero charges with valid college/university credentials
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>500 Saved Memories</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Syllabus, class notes, research PDFs &amp; PPT slides
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <Search className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Advanced AI Doubt Solver</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Instant clarification on formulas, code, and exam concepts
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lecture Audio Dictation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Transcribe voice lectures directly into structured notes
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cloud Sync Across Devices</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Access from your laptop, tablet, or college lab computers
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 5. FAQ / COMMON QUESTIONS */}
        <section className="mt-16 max-w-3xl mx-auto pt-10 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">
            Frequently Asked Questions
          </h3>

          <div className="space-y-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                How does the Student 6-month free offer work?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Any verified student with an educational email (.edu / .ac.in / college domain) or valid university ID gets 6 full months of BrainCache Pro at ₹0. No credit card is required to activate.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                What happens to my files if I switch or cancel?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Your memories and files are never deleted when downgrading. You maintain full access to download, view, and search your previously saved documents.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                What payment methods are supported?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                We accept all major Indian payment methods including UPI (GPay, PhonePe, Paytm, BHIM), RuPay/Visa/MasterCard Debit &amp; Credit cards, and NetBanking.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ======================================================= */}
      {/* STUDENT VERIFICATION MODAL */}
      {/* ======================================================= */}
      <AnimatePresence>
        {showStudentModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md"
            onClick={() => setShowStudentModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-[#090e17] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowStudentModal(false)}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Student Verification
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Get 6 months of BrainCache Pro at ₹0 with your student details.
                </p>
              </div>

              {studentVerified ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Student ID Verified!
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Your 6-month free BrainCache Pro pass is now active on your account.
                  </p>
                  <button
                    onClick={() => {
                      setShowStudentModal(false);
                      onBack();
                    }}
                    className="mt-3 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Start Using Pro Features
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyStudent} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                      College / University Name
                    </label>
                    <div className="relative flex items-center">
                      <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Delhi University / IIT Bombay / NIT"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Student / College Email (.edu / .ac.in or personal)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student@college.edu or gmail"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={studentLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    {studentLoading ? 'Verifying Student Status...' : 'Claim 6 Months Free Pro'}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">
                    Instant approval for registered academic institutions. No credit card required.
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* CHECKOUT & PAYMENT MODAL */}
      {/* ======================================================= */}
      <AnimatePresence>
        {showCheckoutModal && selectedCheckoutPlan && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md"
            onClick={() => setShowCheckoutModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-[#090e17] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center border border-blue-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Upgrade to {selectedCheckoutPlan.title}
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    {selectedCheckoutPlan.price} / month · Cancel anytime
                  </p>
                </div>
              </div>

              {paymentSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Payment Successful!
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Your {selectedCheckoutPlan.title} subscription has been activated.
                  </p>
                  <button
                    onClick={() => {
                      setShowCheckoutModal(false);
                      onBack();
                    }}
                    className="mt-3 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Go to BrainCache
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCompletePayment} className="space-y-3.5">
                  {/* Payment method selector */}
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-850 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>UPI / QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cards / NetBanking</span>
                    </button>
                  </div>

                  {paymentMethod === 'upi' ? (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Enter UPI ID
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="yourname@okhdfcbank or @upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <p className="text-[10px] text-slate-400">
                        Supports Google Pay, PhonePe, Paytm, BHIM and all major bank UPI apps.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="4532 •••• •••• ••••"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="MM / YY"
                          className="w-1/2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                        <input
                          type="password"
                          placeholder="CVV"
                          maxLength={4}
                          className="w-1/2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full py-2.5 rounded-xl bg-[#1a73e8] hover:bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-3"
                  >
                    {isProcessingPayment ? 'Processing Transaction...' : `Pay ${selectedCheckoutPlan.price} & Activate`}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>256-bit SSL encrypted · Recurring billing can be cancelled anytime</span>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
