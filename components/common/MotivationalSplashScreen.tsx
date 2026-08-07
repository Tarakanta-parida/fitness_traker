"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Dumbbell, Zap } from "lucide-react";

const MOTIVATIONAL_QUOTES = [
  { quote: "The only bad workout is the one that didn't happen.", author: "Fitness Wisdom" },
  { quote: "Push yourself, because no one else is going to do it for you.", author: "Daily Grit" },
  { quote: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { quote: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Mind Over Body" },
  { quote: "Consistency is what transforms average into excellence.", author: "Habit Masters" },
  { quote: "Strive for progress, not perfection.", author: "Daily Fitness" },
  { quote: "Success starts with self-discipline and daily action.", author: "LifeTrack Coach" },
];

export default function MotivationalSplashScreen() {
  const [visible, setVisible] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Pick a random quote on each page open/refresh
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setSelectedQuote(MOTIVATIONAL_QUOTES[randomIndex]);

    // Animate 4-second progress bar (4000ms)
    const startTime = Date.now();
    const DURATION = 4000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setProgress(currentPct);

      if (elapsed >= DURATION) {
        clearInterval(progressInterval);
        setVisible(false);
      }
    }, 40);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden select-none"
        >
          {/* Ambient Background Glowing Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-md w-full text-center flex flex-col items-center gap-6">
            {/* App Logo Container with Pulse Aura */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.95, 1.05, 1], opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500 rounded-full blur-2xl opacity-50 animate-pulse" />
              <div className="relative w-28 h-28 flex items-center justify-center">
                <img
                  src="/app-logo.png"
                  alt="LifeTrack Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(16,185,129,0.4)]"
                />
              </div>
            </motion.div>

            {/* Brand Title */}
            <div>
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                Daily Workout Motivation
              </span>
              <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent tracking-tight">
                LifeTrack
              </h1>
            </div>

            {/* Motivational Quote Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-2xl relative w-full"
            >
              <div className="text-emerald-400 mb-2 flex justify-center">
                <Dumbbell className="w-6 h-6 text-emerald-400 animate-bounce" />
              </div>
              <p className="text-sm md:text-base font-extrabold text-slate-100 leading-relaxed italic">
                "{selectedQuote.quote}"
              </p>
              <span className="text-[11px] font-bold text-emerald-400 block mt-3 uppercase tracking-wider">
                — {selectedQuote.author}
              </span>
            </motion.div>

            {/* 4-Second Loading Progress Bar */}
            <div className="w-full space-y-2 mt-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Preparing Dashboard...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
