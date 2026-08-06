"use client";

import React, { useEffect, useState } from "react";
import { Flame, Trophy, Award, Sparkles, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface GamificationData {
  streakDays: number;
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXP: number;
  levelProgressPercent: number;
  achievements: { id: string; title: string; description: string; unlockedAt: string }[];
  newUnlocked?: string[];
}

export default function GamificationBadge({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<GamificationData | null>(null);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  const fetchGamification = async () => {
    try {
      const res = await fetch("/api/gamification");
      if (res.ok) {
        const json = await res.json();
        setData(json);

        // If new badge was unlocked, fire celebratory confetti!
        if (json.newUnlocked && json.newUnlocked.length > 0) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }
    } catch (e) {
      console.error("Failed to load gamification data", e);
    }
  };

  useEffect(() => {
    fetchGamification();
    const interval = setInterval(fetchGamification, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Streak Flame Pill */}
        <div 
          onClick={() => setShowAchievementsModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl cursor-pointer hover:scale-105 transition-all shadow-sm"
          title="Click to view Achievements"
        >
          <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
          <span className="text-xs font-black text-amber-700 dark:text-amber-400">
            {data.streakDays} Day Streak
          </span>
        </div>

        {/* Level Pill */}
        <div 
          onClick={() => setShowAchievementsModal(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl cursor-pointer hover:scale-105 transition-all"
        >
          <Trophy className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-300">
            Lvl {data.level}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-indigo-500/30">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          {/* User Level & XP */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Trophy className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  Level {data.level}
                </span>
                <span className="text-sm font-semibold text-gray-300">{data.levelTitle}</span>
              </div>
              <h2 className="text-2xl font-black mt-1 tracking-tight">{data.xp.toLocaleString()} XP</h2>
            </div>
          </div>

          {/* Streak Flame Counter */}
          <div 
            onClick={() => setShowAchievementsModal(true)}
            className="flex items-center gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md cursor-pointer hover:bg-white/10 transition-all"
          >
            <div className="p-2 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl shadow-md">
              <Flame className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400">Current Streak</div>
              <div className="text-xl font-black text-orange-400">{data.streakDays} Days Active</div>
            </div>
          </div>
        </div>

        {/* Progress bar to next level */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-gray-400 font-medium">Level Progress</span>
            <span className="font-bold text-amber-400">{data.levelProgressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.levelProgressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Achievements Modal */}
      <AnimatePresence>
        {showAchievementsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-500" />
                  <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Achievements & Badges</h3>
                </div>
                <button
                  onClick={() => setShowAchievementsModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 font-bold hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {data.achievements.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-amber-300">{badge.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
                    </div>
                  </div>
                ))}
                {data.achievements.length === 0 && (
                  <p className="text-center text-gray-400 py-6 text-sm">
                    Complete your daily goals to unlock your first achievement badge! 🏆
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
