"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  BarChart2, 
  Flame, 
  Activity, 
  Droplet, 
  Moon, 
  TrendingUp, 
  Award,
  Loader2,
  Calendar,
  Sparkles,
  Zap
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

interface DailyStat {
  dayName: string;
  steps: number;
  caloriesBurned: number;
  caloriesConsumed: number;
  waterGlasses: number;
  sleepHours: number;
}

interface WeightLog {
  date: string;
  weight: number;
  bmi: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        setStreak(json.currentStreak || 0);
        setDailyStats(json.dailyStats || []);
        setWeightLogs(json.weightTrend || []);
      } else {
        setError("Failed to fetch analytics summaries");
      }
    } catch (err) {
      setError("An error occurred connecting to the analytics engine");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
        <div className="bg-red-50/10 border border-red-200/50 p-6 rounded-3xl text-center max-w-sm">
          <p className="text-red-650 font-bold mb-2">Analytics Error</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Encouraging streak message
  let streakMsg = "Start hitting your step goal to begin a streak!";
  if (streak > 0 && streak < 3) streakMsg = "Great start! Keep it up for a weekly badge.";
  if (streak >= 3 && streak < 7) streakMsg = "Excellent consistency! You are building healthy habit loops.";
  if (streak >= 7) streakMsg = "Superb! You are officially an active health achiever! 🔥";

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-gray-50/10 min-h-screen">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Habit Loop Analytics</span>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Progress Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Visualize your step counts, calorie balances, sleep ratings, and weight trends.</p>
      </div>

      {/* Streak & Weight Target Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak card */}
        <div className="bg-gradient-to-r from-orange-450/10 via-amber-450/5 to-yellow-450/10 border border-orange-100 rounded-3xl p-6 shadow-sm flex items-center justify-between col-span-1 md:col-span-2">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-yellow-450 rounded-2xl flex items-center justify-center text-white shadow-md">
              <Zap className="w-7 h-7 fill-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active Streak</span>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{streak} {streak === 1 ? "Day" : "Days"}</h3>
              <p className="text-xs text-gray-500 mt-1">{streakMsg}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 font-bold text-xs text-orange-600">
            <Award className="w-4 h-4" />
            <span>Habit Streak</span>
          </div>
        </div>

        {/* BMI gauge */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between col-span-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase">Current BMI</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-black text-gray-800">
              {weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].bmi.toFixed(1) : "N/A"}
            </span>
            <p className="text-xs text-gray-450 font-medium mt-1">
              Weight: {weightLogs.length > 0 ? `${weightLogs[weightLogs.length - 1].weight} kg` : `${user?.weight} kg`}
            </p>
          </div>
          <div className="text-xs text-blue-600 font-semibold bg-blue-50/40 px-2.5 py-1 rounded-xl w-fit">
            Healthy Range: 18.5 - 24.9
          </div>
        </div>
      </div>

      {/* Progress Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Steps chart */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-gray-800 uppercase tracking-tight">Steps Count (Last 7 Days)</h3>
            <p className="text-[10px] text-gray-400">Total daily walking and running steps accumulated.</p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="dayName" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f3f4f6" }} />
                <Bar dataKey="steps" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calorie Balance chart */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-gray-800 uppercase tracking-tight">Calorie Balance</h3>
            <p className="text-[10px] text-gray-400">Calories consumed (meals) vs Active calories burned (workout/steps).</p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="dayName" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f3f4f6" }} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="caloriesConsumed" name="Consumed" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="caloriesBurned" name="Active Burned" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Water Intake chart */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-gray-800 uppercase tracking-tight">Water Intake</h3>
            <p className="text-[10px] text-gray-400">Glasses of water logged daily.</p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="dayName" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f3f4f6" }} />
                <Bar dataKey="waterGlasses" name="Glasses" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep tracker chart */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-gray-800 uppercase tracking-tight">Sleep Duration</h3>
            <p className="text-[10px] text-gray-400">Hours of night sleep logged daily.</p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="dayName" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f3f4f6" }} />
                <Line type="monotone" dataKey="sleepHours" name="Hours Slept" stroke="#a855f7" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weight trend chart */}
        {weightLogs.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <div>
              <h3 className="font-bold text-sm text-gray-800 uppercase tracking-tight">Weight Trend Logs</h3>
              <p className="text-[10px] text-gray-400">Track weight fluctuations over your recent check-ins.</p>
            </div>
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" axisLine={false} tickLine={false} />
                  <YAxis domain={["dataMin - 3", "dataMax + 3"]} stroke="#9ca3af" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f3f4f6" }} />
                  <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#06b6d4" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
