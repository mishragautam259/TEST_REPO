import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { BrainCacheLogo } from './BrainCacheLogo';

interface IntroAnimationProps {
  onComplete: () => void;
}

// Cinematic, slow & smooth opening animation before the main website functions appear
export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [, setStage] = useState<'orb' | 'title' | 'exit'>('orb');

  useEffect(() => {
    // Stage 1: Orb breathes and expands
    const timer1 = setTimeout(() => {
      setStage('title');
    }, 700);

    // Stage 2: Title and subtitle glow and reveal
    const timer2 = setTimeout(() => {
      setStage('exit');
    }, 2400);

    // Stage 3: Smooth curtain unveil and handoff to main app
    const timer3 = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white overflow-hidden cursor-pointer"
      onClick={() => onComplete()}
      title="Click anywhere to skip intro"
    >
      {/* Slow organic morphing background light aura */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          rotate: [0, 90, 180],
          borderRadius: [
            '45% 55% 65% 35% / 40% 45% 55% 60%',
            '60% 40% 30% 70% / 50% 35% 65% 50%',
            '45% 55% 65% 35% / 40% 45% 55% 60%',
          ],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-[440px] h-[440px] bg-gradient-to-tr from-teal-500/20 via-indigo-500/20 to-pink-500/15 blur-[90px] pointer-events-none"
      />

      {/* Main Intro Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Animated Central Core with BrainCacheLogo */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          {/* Pulsing outer glow ring */}
          <motion.div
            animate={{
              scale: [1, 1.35, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-teal-500/25 to-purple-500/25 blur-md"
          />

          <BrainCacheLogo size={68} className="rounded-2xl" />
        </motion.div>

        {/* Brand Name with slow letter tracking expansion */}
        <motion.h1
          initial={{ opacity: 0, y: 20, letterSpacing: '-0.04em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0.02em' }}
          transition={{ duration: 1.3, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-3"
        >
          Brain Cache
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base text-teal-300 font-medium tracking-wide flex items-center gap-2 mb-8"
        >
          <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
          <span>Your second memory</span>
        </motion.p>

        {/* Elegant slow progress bar indicator */}
        <div className="w-44 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.2, delay: 0.3, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-500"
          />
        </div>

        {/* Skip hint */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-[11px] text-slate-500 mt-4 tracking-wider uppercase font-mono"
        >
          Entering experience · click to skip
        </motion.span>
      </div>
    </motion.div>
  );
};
