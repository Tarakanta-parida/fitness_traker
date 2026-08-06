"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Droplet, Moon, Utensils, Info, ChevronDown, ChevronUp } from "lucide-react";

interface HealthScoreProps {
  stepsCurrent: number;
  stepsTarget: number;
  waterCurrent: number;
  waterTarget: number;
  sleepCurrent: number;
  sleepTarget: number;
  caloriesCurrent: number;
  caloriesTarget: number;
}

export default function HealthScoreGauge({
  stepsCurrent = 0,
  stepsTarget = 10000,
  waterCurrent = 0,
  waterTarget = 10,
  sleepCurrent = 0,
  sleepTarget = 8,
  caloriesCurrent = 0,
  caloriesTarget = 2000,
}: HealthScoreProps) {
  const [showDetails, setShowDetails] = useState(false);

  // 1. Calculate Component Ratios (0.0 to 1.0)
  const stepsRatio = Math.min(1, stepsCurrent / (stepsTarget || 10000));
  const waterRatio = Math.min(1, waterCurrent / (waterTarget || 10));
  const sleepRatio = Math.min(1, sleepCurrent / (sleepTarget || 8));
  // Calorie balance: ideal is meeting target, penalized if 0 or over-eating significantly
  const calRatio = Math.min(1, caloriesCurrent / (caloriesTarget || 2000));

  // 2. Weighted Overall Score Calculation (out of 100)
  const stepsScore = Math.round(stepsRatio * 35);
  const waterScore = Math.round(waterRatio * 25);
  const sleepScore = Math.round(sleepRatio * 20);
  const caloriesScore = Math.round(calRatio * 20);

  const totalScore = Math.min(100, stepsScore + waterScore + sleepScore + caloriesScore);

  // Score Badge Grade & Color Scheme
  let statusText = "Needs Focus";
  let statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/30";
  let strokeColor = "#f59e0b"; // amber

  if (totalScore >= 85) {
    statusText = "Excellent";
    statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    strokeColor = "#10b981"; // emerald
  } else if (totalScore >= 65) {
    statusText = "Optimal";
    statusColor = "text-cyan-500 bg-cyan-500/10 border-cyan-500/30";
    strokeColor = "#06b6d4"; // cyan
  } else if (totalScore >= 40) {
    statusText = "On Track";
    statusColor = "text-blue-500 bg-blue-500/10 border-blue-500/30";
    strokeColor = "#3b82f6"; // blue
  }

  // SVG Gauge Math
  const radius = 64;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Left Info Section */}
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Daily Wellness Gauge
            </span>
            <span className={`text-xs font-extrabold px-3 py-0.5 rounded-full border ${statusColor}`}>
              {statusText}
            </span>
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Health Score: {totalScore} <span className="text-lg text-gray-400 font-normal">/ 100</span>
          </h2>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
            Composite health score generated from your steps, hydration, sleep duration, and calorie balance today.
          </p>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-2"
          >
            {showDetails ? "Hide Score Breakdown" : "View Score Breakdown"}
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right Circular Gauge */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Track Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-gray-100 dark:text-slate-800 fill-none"
            />
            {/* Glowing Progress Circle */}
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              className="fill-none drop-shadow-md"
            />
          </svg>
          {/* Inner Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {totalScore}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Points
            </span>
          </div>
        </div>

      </div>

      {/* Expandable Breakdown Drawer */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {/* Steps Breakdown */}
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold">Steps (35%)</span>
            </div>
            <div className="text-lg font-black text-gray-900 dark:text-white">
              {stepsScore} <span className="text-xs font-normal text-gray-400">/ 35</span>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {stepsCurrent.toLocaleString()} / {stepsTarget.toLocaleString()} steps
            </div>
          </div>

          {/* Water Breakdown */}
          <div className="p-3 bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 rounded-2xl">
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 mb-1">
              <Droplet className="w-4 h-4" />
              <span className="text-xs font-bold">Water (25%)</span>
            </div>
            <div className="text-lg font-black text-gray-900 dark:text-white">
              {waterScore} <span className="text-xs font-normal text-gray-400">/ 25</span>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {waterCurrent} / {waterTarget} glasses
            </div>
          </div>

          {/* Sleep Breakdown */}
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1">
              <Moon className="w-4 h-4" />
              <span className="text-xs font-bold">Sleep (20%)</span>
            </div>
            <div className="text-lg font-black text-gray-900 dark:text-white">
              {sleepScore} <span className="text-xs font-normal text-gray-400">/ 20</span>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {sleepCurrent} / {sleepTarget} hrs
            </div>
          </div>

          {/* Calories Breakdown */}
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
              <Utensils className="w-4 h-4" />
              <span className="text-xs font-bold">Calories (20%)</span>
            </div>
            <div className="text-lg font-black text-gray-900 dark:text-white">
              {caloriesScore} <span className="text-xs font-normal text-gray-400">/ 20</span>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {caloriesCurrent} / {caloriesTarget} kcal
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
