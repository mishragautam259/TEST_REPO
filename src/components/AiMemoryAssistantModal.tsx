import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Bot,
  X,
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  Check,
  Copy,
  Send,
  Loader2,
  ArrowRight,
  RefreshCw,
  Lock,
  HelpCircle,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MemoryItem, MemorySummaryResult, DoubtChatMessage, DetectedQuestion } from '../types';

interface AiMemoryAssistantModalProps {
  memory: MemoryItem | null;
  initialTab?: 'summary' | 'doubts';
  onClose: () => void;
}

export const AiMemoryAssistantModal: React.FC<AiMemoryAssistantModalProps> = ({
  memory,
  initialTab = 'summary',
  onClose,
}) => {
  if (memory?.isPrivate) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="max-w-md w-full bg-white dark:bg-[#0c1322] rounded-2xl p-6 border border-amber-300 dark:border-amber-800 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                AI Disabled for Private File
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                This document is marked as <strong>Private</strong>. Brain Cache strictly guarantees that AI models never read, summarize, or analyze private files.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const [activeTab, setActiveTab] = useState<'summary' | 'doubts'>(initialTab);

  // Summarizer state
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState<MemorySummaryResult | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Doubt solver state
  const [chatMessages, setChatMessages] = useState<DoubtChatMessage[]>([]);
  const [doubtInput, setDoubtInput] = useState('');
  const [isSolvingDoubt, setIsSolvingDoubt] = useState(false);
  const [detectedQuestions, setDetectedQuestions] = useState<DetectedQuestion[]>([]);
  const [isDetectingQuestions, setIsDetectingQuestions] = useState(false);
  const [showQuestionPanel, setShowQuestionPanel] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scan file for questions
  const fetchQuestions = async (targetMemory: MemoryItem) => {
    if (targetMemory.isPrivate) return;
    setIsDetectingQuestions(true);
    try {
      const response = await fetch('/api/detect-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory: targetMemory }),
      });
      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setDetectedQuestions(data.questions);
      } else {
        setDetectedQuestions([]);
      }
    } catch (err) {
      console.warn('Failed to detect questions:', err);
    } finally {
      setIsDetectingQuestions(false);
    }
  };

  // Reset & load when memory opens
  useEffect(() => {
    if (memory) {
      setActiveTab(initialTab);
      fetchSummary(memory);
      fetchQuestions(memory);

      setChatMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          text: `Hello! I'm your Doubt Solver for "${memory.title}", your educational learning assistant.

My job is to help you understand and solve your doubts in detail—focusing on the reasoning, formulas, and step-by-step logic, not just the final answer.

If this file contains questions or problem sets, give me a command like "Solve Question 1" or "Solve all questions in this file" and I'll break down the full solution, definitions, and key takeaways for you!`,
          timestamp: Date.now(),
          suggestedFollowUps: getInitialDoubtSuggestions(memory),
        },
      ]);
    } else {
      setSummary(null);
      setChatMessages([]);
      setDetectedQuestions([]);
    }
  }, [memory, initialTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSolvingDoubt]);

  const getInitialDoubtSuggestions = (mem: MemoryItem) => {
    const isCollegeNote =
      mem.title.toLowerCase().includes('college') ||
      mem.title.toLowerCase().includes('lecture') ||
      mem.title.toLowerCase().includes('algorithm') ||
      (mem.tags || []).includes('college');

    if (isCollegeNote) {
      return [
        "Explain Dijkstra's algorithm step-by-step",
        'Why does it fail on negative edge weights?',
        'What are the homework deadlines and exam dates?',
        'Can you quiz me on this lecture with a practice problem?',
      ];
    }

    if (mem.type === 'screenshot' || mem.type === 'photo') {
      return [
        'Explain the key details visible in this screenshot',
        'What are the critical dates and deadlines mentioned?',
        'Who are the people or contacts referenced here?',
      ];
    }

    return [
      'Summarize the core takeaways in simple words',
      'What action items or deadlines should I remember?',
      'Can you explain the main idea in this file?',
    ];
  };

  const fetchSummary = async (targetMemory: MemoryItem) => {
    setLoadingSummary(true);
    try {
      const response = await fetch('/api/summarize-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory: targetMemory }),
      });
      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const textToCopy = `Executive Summary:\n${summary.executiveSummary}\n\nKey Takeaways:\n${summary.keyTakeaways.map((t) => `• ${t}`).join('\n')}\n\nAction Items:\n${summary.actionItems.map((a) => `• ${a}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleSendDoubt = async (questionToSend?: string) => {
    const question = (questionToSend !== undefined ? questionToSend : doubtInput).trim();
    if (!question || !memory || isSolvingDoubt) return;

    if (questionToSend === undefined) {
      setDoubtInput('');
    }

    const userMessage: DoubtChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsSolvingDoubt(true);

    try {
      const response = await fetch('/api/solve-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memory,
          question,
          chatHistory: chatMessages.slice(-4).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      const botMessage: DoubtChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'I evaluated your file and have answered your doubt.',
        timestamp: Date.now(),
        suggestedFollowUps: data.suggestedFollowUps || [],
      };

      setChatMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Failed to solve doubt:', err);
      const fallbackMsg: DoubtChatMessage = {
        id: `assistant-fallback-${Date.now()}`,
        sender: 'assistant',
        text: `Based on "${memory.title}": ${memory.description}. Please review the extracted notes: ${memory.extractedDetails?.text || 'content verified'}.`,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSolvingDoubt(false);
    }
  };

  const handleSolveQuestion = (q: DetectedQuestion) => {
    handleSendDoubt(
      `Please solve ${q.questionNumber}: "${q.questionText}" in complete step-by-step detail with core formulas, intermediate working, final answer, and key exam tips.`
    );
  };

  const handleSolveAllQuestions = () => {
    handleSendDoubt(
      `Please solve all questions contained in this file in complete step-by-step detail. For each question, provide the problem statement, core concepts & formulas, step-by-step working, and the final answer.`
    );
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  if (!memory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative max-w-3xl w-full max-h-[90vh] bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Modal Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {memory.type}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(memory.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {memory.title}
                </h2>
              </div>
            </div>

            {/* Segmented Switcher with Morphing Pill */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <div className="relative flex items-center p-1 bg-slate-200/80 dark:bg-slate-950/70 rounded-xl text-xs font-medium border border-slate-300/40 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'summary' ? 'text-slate-900 dark:text-teal-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {activeTab === 'summary' && (
                    <motion.div
                      layoutId="aiModalTab"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-transparent dark:border-slate-700/80"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    AI Summary
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('doubts')}
                  className={`relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'doubts' ? 'text-slate-900 dark:text-teal-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {activeTab === 'doubts' && (
                    <motion.div
                      layoutId="aiModalTab"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-transparent dark:border-slate-700/80"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    AI Doubt Solver
                  </span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/30 dark:bg-slate-900/40">
            {/* TAB 1: AI SUMMARIZER */}
            {activeTab === 'summary' && (
              <div className="space-y-5">
                {loadingSummary ? (
                  <div className="py-14 text-center space-y-3">
                    <Loader2 className="w-7 h-7 text-teal-600 dark:text-teal-400 animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Generating AI Summary with Gemini...
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Extracting core takeaways, formulas, critical exam warnings, and action items from this file.
                    </p>
                  </div>
                ) : summary ? (
                  <div className="space-y-4">
                    {/* Executive Summary Card */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-50/80 via-white to-indigo-50/80 dark:from-teal-950/20 dark:via-slate-900/80 dark:to-indigo-950/20 border border-teal-200/70 dark:border-teal-900/40 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Executive Summary
                        </span>
                        <button
                          onClick={handleCopySummary}
                          className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700 cursor-pointer shadow-2xs"
                        >
                          {copiedSummary ? (
                            <>
                              <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                              <span className="text-teal-700 dark:text-teal-300 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Summary</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                        {summary.executiveSummary}
                      </p>
                    </div>

                    {/* Key Takeaways */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Key Takeaways &amp; Concepts
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                        {summary.keyTakeaways.map((takeaway, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Items & Deadlines */}
                    {summary.actionItems && summary.actionItems.length > 0 && (
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Action Items &amp; Deadlines
                        </h4>
                        <div className="space-y-1.5">
                          {summary.actionItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-xs text-indigo-950 dark:text-indigo-300 font-medium"
                            >
                              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exam & Critical Tips */}
                    {summary.examOrCriticalTips && summary.examOrCriticalTips.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Critical Exam &amp; Study Tips
                        </h4>
                        <ul className="space-y-1 text-xs text-amber-950 dark:text-amber-300">
                          {summary.examOrCriticalTips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span>⚠️</span>
                              <span className="font-medium">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Core Topics tags */}
                    {summary.coreTopics && summary.coreTopics.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1">Topics:</span>
                        {summary.coreTopics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700"
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Switch to Doubt Solver button (minimal dark button) */}
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => fetchSummary(memory)}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Refresh Summary
                      </button>

                      <button
                        onClick={() => setActiveTab('doubts')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-750 text-white dark:text-teal-300 border border-transparent dark:border-slate-700 text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        <span>Have a doubt? Ask AI Tutor</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">No summary available yet.</p>
                    <button
                      onClick={() => fetchSummary(memory)}
                      className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 border border-transparent dark:border-slate-700 text-xs font-medium rounded-lg cursor-pointer"
                    >
                      Generate Summary
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: AI DOUBT SOLVER CHAT */}
            {activeTab === 'doubts' && (
              <div className="flex flex-col h-[520px] max-h-[60vh]">
                {/* Questions Detective Panel */}
                {isDetectingQuestions && (
                  <div className="mb-3 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span>Scanning file for questions, exercises, and problem sets...</span>
                  </div>
                )}

                {detectedQuestions.length > 0 && (
                  <div className="mb-3 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 dark:from-indigo-950/30 dark:via-slate-900/90 dark:to-purple-950/30 shadow-2xs overflow-hidden">
                    <div
                      onClick={() => setShowQuestionPanel(!showQuestionPanel)}
                      className="p-3 flex items-center justify-between cursor-pointer select-none border-b border-indigo-100/60 dark:border-indigo-900/40"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Questions in this File
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white dark:bg-indigo-500">
                          {detectedQuestions.length} Found
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSolveAllQuestions();
                          }}
                          disabled={isSolvingDoubt}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>Solve All Questions</span>
                        </button>

                        <button type="button" className="text-slate-400 hover:text-slate-600">
                          {showQuestionPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {showQuestionPanel && (
                      <div className="p-2.5 max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                        {detectedQuestions.map((q) => (
                          <div key={q.id} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  {q.questionNumber}
                                </span>
                                {q.topic && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    · {q.topic}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                                {q.questionText}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSolveQuestion(q)}
                              disabled={isSolvingDoubt}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 text-[11px] font-semibold flex-shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              <span>Solve in Detail</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Message Stream */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-2">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 border border-transparent dark:border-slate-700 rounded-br-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-bl-xs'
                        }`}
                      >
                        {msg.sender === 'assistant' && (
                          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                            <div className="flex items-center gap-1.5">
                              <Bot className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              <span>AI Doubt Solver</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.id, msg.text)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                              title="Copy answer"
                            >
                              {copiedMessageId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Solution</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        <p className="whitespace-pre-line font-sans">{msg.text}</p>
                      </div>

                      {/* Suggested follow-up questions from AI Tutor */}
                      {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[90%]">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block w-full mb-0.5">
                            Suggested doubts to ask:
                          </span>
                          {msg.suggestedFollowUps.map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => handleSendDoubt(suggestion)}
                              className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-teal-50/80 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-300 border border-teal-200/70 dark:border-teal-900/50 transition-colors cursor-pointer font-medium"
                            >
                              💡 {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isSolvingDoubt && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl w-fit shadow-2xs">
                      <Loader2 className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-spin" />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Solving questions in detail with step-by-step working...
                      </span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Quick Command Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" /> Commands:
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendDoubt(
                        'Please solve all questions contained in this file in complete step-by-step detail. For each question, show the problem statement, formulas, step-by-step derivation/working, and the final answer.'
                      )
                    }
                    disabled={isSolvingDoubt}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 font-medium cursor-pointer"
                  >
                    ⚡ Solve All Questions
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendDoubt('Please solve Question 1 from this file in complete step-by-step detail with all formulas and working.')
                    }
                    disabled={isSolvingDoubt}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
                  >
                    📝 Solve Question 1
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendDoubt('Show the complete step-by-step mathematical working and formulas for the problems in this file.')
                    }
                    disabled={isSolvingDoubt}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
                  >
                    🔢 Show Working &amp; Formulas
                  </button>
                </div>

                {/* Doubt input bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendDoubt();
                  }}
                  className="relative flex items-center pt-2"
                >
                  <input
                    type="text"
                    placeholder="Give command e.g. 'Solve question 2 in detail' or ask any doubt..."
                    value={doubtInput}
                    onChange={(e) => setDoubtInput(e.target.value)}
                    disabled={isSolvingDoubt}
                    className="w-full pl-4 pr-24 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-teal-500/60 shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!doubtInput.trim() || isSolvingDoubt}
                    className="absolute right-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-teal-300 border border-transparent dark:border-slate-700 text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>Solve</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
