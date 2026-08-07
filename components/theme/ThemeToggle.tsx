"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl border border-gray-200 dark:border-slate-700/60 shadow-inner">
      <button
        onClick={() => setTheme("light")}
        title="Light Mode"
        className={`p-1.5 rounded-lg transition-all relative ${
          theme === "light"
            ? "text-amber-500 font-bold shadow-sm"
            : "text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
      >
        {theme === "light" && (
          <motion.div
            layoutId="theme-active"
            className="absolute inset-0 bg-white rounded-lg -z-10 shadow-sm"
          />
        )}
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme("dark")}
        title="Dark Mode"
        className={`p-1.5 rounded-lg transition-all relative ${
          theme === "dark"
            ? "text-indigo-400 font-bold shadow-sm"
            : "text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
      >
        {theme === "dark" && (
          <motion.div
            layoutId="theme-active"
            className="absolute inset-0 bg-slate-900 rounded-lg -z-10 shadow-sm"
          />
        )}
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme("cyberpunk")}
        title="Cyberpunk Mode"
        className={`p-1.5 rounded-lg transition-all relative ${
          theme === "cyberpunk"
            ? "text-cyan-400 font-bold shadow-sm"
            : "text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
      >
        {theme === "cyberpunk" && (
          <motion.div
            layoutId="theme-active"
            className="absolute inset-0 bg-cyan-950/80 rounded-lg -z-10 shadow-sm border border-cyan-500/30"
          />
        )}
        <Zap className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
