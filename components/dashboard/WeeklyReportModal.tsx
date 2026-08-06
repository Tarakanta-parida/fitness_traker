"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Share2, Download, Check, Sparkles, Activity, Droplet, Moon, Flame } from "lucide-react";

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  totalSteps?: number;
  avgWater?: number;
  avgSleep?: number;
  totalCalories?: number;
}

export default function WeeklyReportModal({
  isOpen,
  onClose,
  userName = "LifeTrack User",
  totalSteps = 42500,
  avgWater = 9.5,
  avgSleep = 7.8,
  totalCalories = 2450,
}: WeeklyReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    const shareText = `🏃‍♂️ My LifeTrack Weekly Summary:\n• Total Steps: ${totalSteps.toLocaleString()}\n• Avg Hydration: ${avgWater} glasses/day\n• Avg Sleep: ${avgSleep} hrs/night\n• Calories Burned: ${totalCalories.toLocaleString()} kcal\nJoin me on LifeTrack!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "LifeTrack Weekly Summary",
          text: shareText,
          url: window.location.href,
        });
      } catch (e) {
        console.log("Share cancelled", e);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800"
        >
          {/* Top Header Card */}
          <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="inline-flex p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-3 border border-white/20">
              <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">{userName}'s Weekly Report</h2>
            <p className="text-xs text-blue-100 font-medium mt-1">7-Day Fitness & Wellness Performance Summary</p>
          </div>

          {/* Stats Grid */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Total Steps */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-2xl">
                <div className="flex items-center gap-1.5 text-blue-500 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-bold">Total Steps</span>
                </div>
                <div className="text-xl font-black text-gray-900 dark:text-white">
                  {totalSteps.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-400">Past 7 Days</div>
              </div>

              {/* Calories Burned */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-2xl">
                <div className="flex items-center gap-1.5 text-orange-500 mb-1">
                  <Flame className="w-4 h-4" />
                  <span className="text-xs font-bold">Calories Burned</span>
                </div>
                <div className="text-xl font-black text-gray-900 dark:text-white">
                  {totalCalories.toLocaleString()} <span className="text-xs font-normal">kcal</span>
                </div>
                <div className="text-[10px] text-gray-400">Total Energy</div>
              </div>

              {/* Avg Water */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-2xl">
                <div className="flex items-center gap-1.5 text-cyan-500 mb-1">
                  <Droplet className="w-4 h-4" />
                  <span className="text-xs font-bold">Avg Water</span>
                </div>
                <div className="text-xl font-black text-gray-900 dark:text-white">
                  {avgWater} <span className="text-xs font-normal">gl/day</span>
                </div>
                <div className="text-[10px] text-gray-400">Optimal Hydration</div>
              </div>

              {/* Avg Sleep */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-2xl">
                <div className="flex items-center gap-1.5 text-indigo-500 mb-1">
                  <Moon className="w-4 h-4" />
                  <span className="text-xs font-bold">Avg Sleep</span>
                </div>
                <div className="text-xl font-black text-gray-900 dark:text-white">
                  {avgSleep} <span className="text-xs font-normal">hrs/night</span>
                </div>
                <div className="text-[10px] text-gray-400">Rest & Recovery</div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-green-300" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied to Clipboard!" : "Share Summary"}
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
