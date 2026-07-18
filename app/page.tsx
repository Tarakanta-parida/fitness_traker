"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle,
  Activity,
  Droplet,
  Utensils,
  Moon
} from "lucide-react";

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-medium">Checking session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50/20 via-white to-green-50/20 flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            LifeTrack
          </span>
        </div>

        <div>
          {user ? (
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center flex-1">
        <div className="flex flex-col gap-6 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50/50 border border-green-150/30 rounded-full text-xs font-semibold text-green-700 w-fit"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Your AI-Powered Daily Health Coach
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight"
          >
            Simplify your fitness, <br />
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Elevate your lifestyle.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-base sm:text-lg leading-relaxed"
          >
            LifeTrack is a clean, minimal personal health coach. Track steps, log water and sleep, configure intervals, and receive custom budget-friendly meal planners without complex menus.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 mt-2"
          >
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl text-sm font-semibold hover:shadow-lg transition-all shadow-md"
              >
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl text-sm font-semibold hover:shadow-lg transition-all shadow-md"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </motion.div>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          {[
            { 
              title: "Step Counter", 
              desc: "Goal tracking & sync", 
              color: "bg-blue-50/50 border-blue-100/30 text-blue-600", 
              icon: Activity 
            },
            { 
              title: "Hydration", 
              desc: "Interval alerts", 
              color: "bg-indigo-50/50 border-indigo-100/30 text-indigo-600", 
              icon: Droplet 
            },
            { 
              title: "Meal Plans", 
              desc: "Budget recommendations", 
              color: "bg-green-50/50 border-green-100/30 text-green-600", 
              icon: Utensils 
            },
            { 
              title: "Sleep Track", 
              desc: "Hours & quality analysis", 
              color: "bg-purple-50/50 border-purple-100/30 text-purple-600", 
              icon: Moon 
            }
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx}
                className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${feat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">{feat.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 bg-white/40">
        <div className="max-w-7xl mx-auto w-full px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} LifeTrack Inc. All rights reserved.</span>
          <div className="flex gap-6">
            <span className="hover:text-gray-600 cursor-pointer">Privacy</span>
            <span className="hover:text-gray-600 cursor-pointer">Terms</span>
            <span className="hover:text-gray-600 cursor-pointer">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
