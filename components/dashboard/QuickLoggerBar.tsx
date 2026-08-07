"use client";

import React, { useState } from "react";
import { Droplet, Footprints, Flame, Utensils, Plus, Check } from "lucide-react";

interface QuickLoggerBarProps {
  onRefresh?: () => void;
}

export default function QuickLoggerBar({ onRefresh }: QuickLoggerBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleQuickWater = async () => {
    setLoading("water");
    try {
      const res = await fetch("/api/dashboard/log-water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ glasses: 1 }),
      });
      if (res.ok) {
        showSuccess("water");
        onRefresh?.();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleQuickSteps = async () => {
    setLoading("steps");
    try {
      const res = await fetch("/api/dashboard/log-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: 1000 }),
      });
      if (res.ok) {
        showSuccess("steps");
        onRefresh?.();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleQuickWorkout = async () => {
    setLoading("workout");
    try {
      const res = await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseName: "30-Min Cardio Walk",
          duration: 30,
          calories: 150,
        }),
      });
      if (res.ok) {
        showSuccess("workout");
        onRefresh?.();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleQuickSnack = async () => {
    setLoading("snack");
    try {
      const res = await fetch("/api/food/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: "SNACK",
          foodName: "Healthy Apple & Almonds",
          calories: 200,
          protein: 6,
        }),
      });
      if (res.ok) {
        showSuccess("snack");
        onRefresh?.();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const showSuccess = (key: string) => {
    setSuccess(key);
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-extrabold text-gray-900 dark:text-white text-sm tracking-tight">Quick 1-Tap Loggers</h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Instantly update your daily metrics with a single click</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        {/* +1 Glass Water */}
        <button
          onClick={handleQuickWater}
          disabled={loading === "water"}
          className="flex items-center justify-between p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100/50 rounded-2xl transition-all group cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Droplet className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-gray-900 dark:text-blue-200 truncate">+1 Water</div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">250 ml</div>
            </div>
          </div>
          {success === "water" ? (
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 ml-1" />
          ) : (
            <Plus className="w-4 h-4 text-blue-400 group-hover:scale-125 transition-all flex-shrink-0 ml-1" />
          )}
        </button>

        {/* +1k Steps */}
        <button
          onClick={handleQuickSteps}
          disabled={loading === "steps"}
          className="flex items-center justify-between p-3 bg-cyan-50/60 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/50 hover:bg-cyan-100/50 rounded-2xl transition-all group cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Footprints className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-gray-900 dark:text-cyan-200 truncate">+1k Steps</div>
              <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold truncate">Walk</div>
            </div>
          </div>
          {success === "steps" ? (
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 ml-1" />
          ) : (
            <Plus className="w-4 h-4 text-cyan-400 group-hover:scale-125 transition-all flex-shrink-0 ml-1" />
          )}
        </button>

        {/* +30m Workout */}
        <button
          onClick={handleQuickWorkout}
          disabled={loading === "workout"}
          className="flex items-center justify-between p-3 bg-orange-50/60 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/50 hover:bg-orange-100/50 rounded-2xl transition-all group cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-gray-900 dark:text-orange-200 truncate">+30m Workout</div>
              <div className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold truncate">150 kcal</div>
            </div>
          </div>
          {success === "workout" ? (
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 ml-1" />
          ) : (
            <Plus className="w-4 h-4 text-orange-400 group-hover:scale-125 transition-all flex-shrink-0 ml-1" />
          )}
        </button>

        {/* +Snack */}
        <button
          onClick={handleQuickSnack}
          disabled={loading === "snack"}
          className="flex items-center justify-between p-3 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100/50 rounded-2xl transition-all group cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-gray-900 dark:text-emerald-200 truncate">+Snack</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">200 kcal</div>
            </div>
          </div>
          {success === "snack" ? (
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 ml-1" />
          ) : (
            <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-125 transition-all flex-shrink-0 ml-1" />
          )}
        </button>
      </div>
    </div>
  );
}
