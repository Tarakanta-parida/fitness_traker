"use client";

import React from "react";
import { motion } from "framer-motion";
import { PieChart, Zap, Shield, Flame } from "lucide-react";

interface MacroProps {
  proteinCurrent: number; // in grams
  proteinTarget?: number;
  carbsCurrent?: number;
  carbsTarget?: number;
  fatCurrent?: number;
  fatTarget?: number;
  caloriesCurrent: number;
  caloriesTarget: number;
}

export default function MacroBreakdown({
  proteinCurrent = 0,
  proteinTarget = 140,
  carbsCurrent = 0,
  carbsTarget = 220,
  fatCurrent = 0,
  fatTarget = 65,
  caloriesCurrent = 0,
  caloriesTarget = 2000,
}: MacroProps) {
  // Estimate Carbs & Fat from calories if not provided
  const estCarbs = carbsCurrent || Math.round((caloriesCurrent * 0.45) / 4);
  const estFat = fatCurrent || Math.round((caloriesCurrent * 0.25) / 9);

  const proteinPercent = Math.min(100, Math.round((proteinCurrent / (proteinTarget || 140)) * 100));
  const carbsPercent = Math.min(100, Math.round((estCarbs / (carbsTarget || 220)) * 100));
  const fatPercent = Math.min(100, Math.round((estFat / (fatTarget || 65)) * 100));

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-500">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Macro-Nutrient Balance</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Daily targets for Protein, Carbs, and Fats</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Protein Progress */}
        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Protein
            </span>
            <span className="font-extrabold text-gray-800 dark:text-gray-200">
              {proteinCurrent}g / {proteinTarget}g
            </span>
          </div>
          <div className="w-full h-2 bg-indigo-200/50 dark:bg-indigo-900/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${proteinPercent}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-indigo-600 rounded-full"
            />
          </div>
          <div className="text-[10px] font-semibold text-indigo-500/80 text-right">
            {proteinPercent}% Achieved
          </div>
        </div>

        {/* Carbs Progress */}
        <div className="p-4 bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Carbohydrates
            </span>
            <span className="font-extrabold text-gray-800 dark:text-gray-200">
              {estCarbs}g / {carbsTarget}g
            </span>
          </div>
          <div className="w-full h-2 bg-cyan-200/50 dark:bg-cyan-900/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${carbsPercent}%` }}
              transition={{ duration: 1, delay: 0.1 }}
              className="h-full bg-cyan-500 rounded-full"
            />
          </div>
          <div className="text-[10px] font-semibold text-cyan-500/80 text-right">
            {carbsPercent}% Achieved
          </div>
        </div>

        {/* Fats Progress */}
        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4" /> Healthy Fats
            </span>
            <span className="font-extrabold text-gray-800 dark:text-gray-200">
              {estFat}g / {fatTarget}g
            </span>
          </div>
          <div className="w-full h-2 bg-amber-200/50 dark:bg-amber-900/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fatPercent}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-amber-500 rounded-full"
            />
          </div>
          <div className="text-[10px] font-semibold text-amber-500/80 text-right">
            {fatPercent}% Achieved
          </div>
        </div>
      </div>
    </div>
  );
}
