import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Copy,
  Check,
  Maximize2,
  Trash2,
  FileText,
  Sparkles,
  Bot,
  FileSpreadsheet,
  Presentation,
  File,
  ImageIcon,
  Eye,
  Download,
  ExternalLink,
  Lock,
  Unlock,
  Key,
  X,
  HelpCircle,
} from 'lucide-react';
import { MemoryItem } from '../types';
import { generateNewTabPreviewUrl } from '../utils/previewTabGenerator';

interface MemoryCardProps {
  memory: MemoryItem;
  matchReason?: string;
  rank?: number;
  onPreviewImage?: (memory: MemoryItem) => void;
  onDelete?: (id: string) => void;
  onOpenAiAssistant?: (memory: MemoryItem, tab: 'summary' | 'doubts') => void;
  highlight?: boolean;
  layout?: 'grid' | 'row';
}

// Pro & Minimal File Presentation — Supports both Row (File Bar) and Grid modes + Password Vault Protection
export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  matchReason,
  rank,
  onPreviewImage,
  onDelete,
  onOpenAiAssistant,
  highlight = false,
  layout = 'grid',
}) => {
  const [copied, setCopied] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(!memory.password);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const formattedDate = new Date(memory.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const renderDocIcon = () => {
    switch (memory.type) {
      case 'presentation':
        return <Presentation className="w-4 h-4 text-amber-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case 'document':
        return <File className="w-4 h-4 text-blue-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'screenshot':
      case 'photo':
        return <ImageIcon className="w-4 h-4 text-teal-500" />;
      default:
        return <FileText className="w-4 h-4 text-purple-500" />;
    }
  };

  const getBadgeStyle = () => {
    switch (memory.type) {
      case 'presentation':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'spreadsheet':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'document':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'pdf':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'screenshot':
      case 'photo':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      default:
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
  };

  const handlePreviewClick = () => {
    if (memory.password && !isUnlocked) {
      setShowPasswordModal(true);
      setPasswordError(null);
      return;
    }
    onPreviewImage?.(memory);
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword === memory.password) {
      setIsUnlocked(true);
      setShowPasswordModal(false);
      onPreviewImage?.(memory);
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const downloadUrl = memory.fileDataUrl || memory.imageBase64 || memory.rawFileUrl;
  const newTabUrl = generateNewTabPreviewUrl(memory);
  const fileName =
    memory.fileName || `${memory.title.toLowerCase().replace(/\s+/g, '-')}.${memory.type === 'presentation' ? 'pptx' : 'file'}`;

  // ==========================================
  // 1. PRO & MINIMAL FILE BAR (ROW VIEW)
  // ==========================================
  if (layout === 'row') {
    return (
      <>
        <div
          className={`group relative flex items-center justify-between gap-3 px-3.5 py-3 sm:px-4 bg-white/90 dark:bg-[#090e17]/90 hover:bg-slate-50/90 dark:hover:bg-[#0c1322] rounded-xl border transition-all duration-200 ${
            highlight
              ? 'border-teal-500/80 ring-1 ring-teal-500/20 shadow-md'
              : memory.isPrivate
              ? 'border-amber-300/80 dark:border-amber-800/80 hover:border-amber-400 dark:hover:border-amber-700 shadow-2xs hover:shadow-xs'
              : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs'
          }`}
        >
          {/* Left: Icon, File Details & Metadata */}
          <div
            onClick={handlePreviewClick}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 group-hover:scale-105 transition-transform">
              {memory.isPrivate && memory.password && !isUnlocked ? (
                <Lock className="w-4 h-4 text-amber-500" />
              ) : (
                renderDocIcon()
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {memory.fileName || memory.title}
                </span>

                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${getBadgeStyle()}`}
                >
                  {memory.type}
                </span>

                {memory.isPrivate && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{memory.password ? (isUnlocked ? 'Unlocked' : 'Locked') : 'Private'}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                {memory.fileSize && <span>{memory.fileSize}</span>}
                {memory.fileSize && <span>·</span>}
                <span>{formattedDate}</span>
                <span className="hidden md:inline">·</span>
                <span className="hidden md:inline truncate max-w-sm text-slate-400">
                  {memory.isPrivate ? 'Private document (Zero AI access)' : memory.description}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Direct Preview Button */}
            <button
              onClick={handlePreviewClick}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                memory.password && !isUnlocked
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-teal-600 hover:bg-teal-500'
              }`}
              title={memory.password && !isUnlocked ? 'Unlock with password to preview' : 'Open exact file preview'}
            >
              {memory.password && !isUnlocked ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{memory.password && !isUnlocked ? 'Unlock' : 'Preview'}</span>
            </button>

            {/* Open in New Tab (Available when unlocked) */}
            {newTabUrl && (!memory.password || isUnlocked) && (
              <a
                href={newTabUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Open preview in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Download Original File (Available when unlocked) */}
            {downloadUrl && (!memory.password || isUnlocked) && (
              <a
                href={downloadUrl}
                download={fileName}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            )}

            {/* AI Summary - Disabled for Private files */}
            {onOpenAiAssistant && (
              memory.isPrivate ? (
                <span
                  className="p-1.5 rounded-lg text-slate-300 dark:text-slate-700 cursor-not-allowed"
                  title="AI analysis disabled for private file"
                >
                  <Sparkles className="w-3.5 h-3.5 opacity-30" />
                </span>
              ) : (
                <button
                  onClick={() => onOpenAiAssistant(memory, 'summary')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="AI Summary"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )
            )}

            {/* AI Doubt Solver - Solve questions in file */}
            {onOpenAiAssistant && !memory.isPrivate && (
              <button
                onClick={() => onOpenAiAssistant(memory, 'doubts')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="AI Doubt Solver · Solve Questions in this file"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              </button>
            )}

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={() => onDelete(memory.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Delete from storage"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Password Unlock Modal */}
        {showPasswordModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
            onClick={(e) => {
              e.stopPropagation();
              setShowPasswordModal(false);
            }}
          >
            <div
              className="max-w-xs w-full bg-white dark:bg-[#0c1322] rounded-2xl p-5 border border-amber-300/80 dark:border-amber-700/80 shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Lock className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Locked File</h4>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {memory.fileName || memory.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter password to unlock and preview this file.
                </p>
              </div>

              <form onSubmit={handleUnlockSubmit} className="space-y-2.5">
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="password"
                    autoFocus
                    placeholder="Enter password"
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {passwordError && (
                  <p className="text-[11px] text-red-500 font-medium">{passwordError}</p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-xs cursor-pointer"
                  >
                    Unlock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // ==========================================
  // 2. PRO & MINIMAL GRID VIEW
  // ==========================================
  return (
    <>
      <article
        className={`group relative flex flex-col justify-between bg-white/90 dark:bg-[#090e17]/90 rounded-2xl border overflow-hidden transition-all duration-200 ${
          highlight
            ? 'border-teal-500/80 ring-1 ring-teal-500/20 shadow-md'
            : memory.isPrivate
            ? 'border-amber-300/80 dark:border-amber-800/80 hover:border-amber-400 dark:hover:border-amber-700 shadow-2xs hover:shadow-xs'
            : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs'
        }`}
      >
        <div className="p-4 flex-1 flex flex-col">
          {/* Clickable Preview Area */}
          <div
            onClick={handlePreviewClick}
            className="w-full h-28 mb-3 rounded-xl bg-slate-50 dark:bg-[#05080e] hover:bg-teal-50/20 dark:hover:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 hover:border-teal-400/80 dark:hover:border-teal-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs group/box"
            title="Click to preview file"
          >
            {memory.isPrivate && memory.password && !isUnlocked ? (
              <div className="flex flex-col items-center gap-1.5 text-amber-500">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex items-center justify-center shadow-2xs group-hover/box:scale-105 transition-transform">
                  <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  Password Protected (Click to unlock)
                </span>
              </div>
            ) : memory.imageBase64 && (memory.type === 'screenshot' || memory.type === 'photo') ? (
              <img
                src={memory.imageBase64}
                alt={memory.title}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs group-hover/box:scale-105 transition-transform">
                  {renderDocIcon()}
                </div>
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1 group-hover/box:underline">
                  <Eye className="w-3.5 h-3.5" /> Preview File
                </span>
              </>
            )}
          </div>

          {/* Title & Category Badge */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3
              onClick={handlePreviewClick}
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              {memory.fileName || memory.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${getBadgeStyle()}`}
              >
                {memory.type}
              </span>
              {memory.isPrivate && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{memory.password ? (isUnlocked ? 'Unlocked' : 'Locked') : 'Private'}</span>
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {memory.isPrivate ? 'Private document (Zero AI access)' : memory.description}
          </p>

          {/* Metadata Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
            <span>{formattedDate}</span>
            {memory.fileSize && <span className="font-mono">{memory.fileSize}</span>}
          </div>
        </div>

        {/* Card Action Toolbar */}
        <div className="px-4 py-2 bg-slate-50/70 dark:bg-[#060a12]/70 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            onClick={handlePreviewClick}
            className={`text-xs font-semibold inline-flex items-center gap-1 cursor-pointer hover:underline ${
              memory.password && !isUnlocked
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-teal-600 dark:text-teal-400'
            }`}
          >
            {memory.password && !isUnlocked ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{memory.password && !isUnlocked ? 'Unlock' : 'Preview'}</span>
          </button>

          <div className="flex items-center gap-1">
            {newTabUrl && (!memory.password || isUnlocked) && (
              <a
                href={newTabUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {downloadUrl && (!memory.password || isUnlocked) && (
              <a
                href={downloadUrl}
                download={fileName}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            )}
            {onOpenAiAssistant && (
              memory.isPrivate ? (
                <span
                  className="p-1 rounded text-slate-300 dark:text-slate-700 cursor-not-allowed"
                  title="AI analysis disabled for private file"
                >
                  <Sparkles className="w-3.5 h-3.5 opacity-30" />
                </span>
              ) : (
                <button
                  onClick={() => onOpenAiAssistant(memory, 'summary')}
                  className="p-1 rounded text-slate-400 hover:text-teal-500 cursor-pointer"
                  title="AI Summary"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )
            )}
            {onOpenAiAssistant && !memory.isPrivate && (
              <button
                onClick={() => onOpenAiAssistant(memory, 'doubts')}
                className="p-1 rounded text-slate-400 hover:text-indigo-500 cursor-pointer"
                title="AI Doubt Solver · Solve Questions in this file"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(memory.id)}
                className="p-1 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Password Unlock Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
          onClick={(e) => {
            e.stopPropagation();
            setShowPasswordModal(false);
          }}
        >
          <div
            className="max-w-xs w-full bg-white dark:bg-[#0c1322] rounded-2xl p-5 border border-amber-300/80 dark:border-amber-700/80 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Lock className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Locked File</h4>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {memory.fileName || memory.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter password to unlock and preview this file.
              </p>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-2.5">
              <div className="relative">
                <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter password"
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {passwordError && (
                <p className="text-[11px] text-red-500 font-medium">{passwordError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-xs cursor-pointer"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
