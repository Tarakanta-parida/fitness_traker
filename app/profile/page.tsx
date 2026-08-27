"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  User, 
  Settings, 
  Award, 
  Activity, 
  Save, 
  HelpCircle,
  Loader2,
  Check,
  ShieldAlert,
  AlertCircle,
  LogOut
} from "lucide-react";
import confetti from "canvas-confetti";

import { useTheme } from "@/components/theme/ThemeProvider";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as any);
    confetti({
      particleCount: 40,
      spread: 30,
      colors: newTheme === "forest" ? ["#10b981", "#059669"] : ["#3b82f6", "#10b981"]
    });
  };

  // Form State
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("WEIGHT_LOSS");
  const [stepsTarget, setStepsTarget] = useState("10000");
  const [sleepTarget, setSleepTarget] = useState("8");
  const [budget, setBudget] = useState("150");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Populate fields on load
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAge(user.age?.toString() || "28");
      setGender(user.gender || "male");
      setHeight(user.height?.toString() || "175");
      setWeight(user.weight?.toString() || "70");
      setGoal(user.goal || "WEIGHT_LOSS");
      setStepsTarget(user.stepsTarget?.toString() || "10000");
      setSleepTarget(user.sleepTarget?.toString() || "8");
      setBudget(user.budget?.toString() || "150");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          age,
          gender,
          height,
          weight,
          goal,
          budget,
          stepsTarget,
          sleepTarget
        }),
      });

      if (res.ok) {
        await refreshUser();
        setMessage("Profile updated successfully!");
        confetti({
          particleCount: 60,
          spread: 40,
          colors: ["#3b82f6", "#10b981"]
        });
      } else {
        const json = await res.json();
        setError(json.error || "Failed to update profile settings");
      }
    } catch (err) {
      setError("An unexpected error occurred saving changes.");
    } finally {
      setSaving(false);
    }
  };

  const currentWeightNum = parseFloat(weight);
  const currentHeightNum = parseFloat(height);
  const bmi = (currentWeightNum && currentHeightNum) 
    ? (currentWeightNum / ((currentHeightNum / 100) * (currentHeightNum / 100))).toFixed(1) 
    : "N/A";

  let bmiCategory = "Unknown";
  let bmiColor = "text-gray-500";
  if (bmi !== "N/A") {
    const val = parseFloat(bmi);
    if (val < 18.5) {
      bmiCategory = "Underweight";
      bmiColor = "text-yellow-600 bg-yellow-50";
    } else if (val >= 18.5 && val < 24.9) {
      bmiCategory = "Normal weight";
      bmiColor = "text-green-600 bg-green-50";
    } else if (val >= 25 && val < 29.9) {
      bmiCategory = "Overweight";
      bmiColor = "text-orange-650 bg-orange-50";
    } else {
      bmiCategory = "Obesity";
      bmiColor = "text-red-600 bg-red-50";
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 bg-gray-50/10 min-h-screen">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Account Panel</span>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-1">Profile Settings</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Customize health metrics, calorie trackers, and security credentials.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column Stack - Summary & Theme selection */}
        <div className="col-span-1 flex flex-col gap-6 w-full">
          {/* Profile Card Summary */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-5">
            <div className="font-black text-5xl text-blue-600 dark:text-blue-400 tracking-tight leading-none py-2 select-none">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-800 dark:text-white">{user?.name}</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500">{user?.email}</span>
            </div>
            
            <div className="border-t border-gray-50 dark:border-slate-800 pt-4 w-full text-xs space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-gray-400 dark:text-gray-500 font-semibold">BMI Score</span>
                <span className={`px-2 py-0.5 font-bold rounded-full ${bmiColor}`}>{bmi} &bull; {bmiCategory}</span>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-gray-400 dark:text-gray-500 font-semibold">Weekly Budget</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">${user?.budget ? Number(user.budget).toFixed(2) : "150.00"}</span>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100/75 border border-red-100 dark:border-red-900/40 text-red-655 dark:text-red-400 rounded-2xl text-xs font-bold transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm col-span-1 lg:col-span-2 space-y-6">
          <div>
            <h3 className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-tight">Personal Parameters</h3>
            <p className="text-[11px] text-gray-450 dark:text-gray-500 mt-0.5">Modify values and click save to apply shifts.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
              <div className="bg-green-50/10 dark:bg-green-950/30 border border-green-200/50 dark:border-green-900/50 text-green-700 dark:text-green-400 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-50/10 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-555 dark:text-gray-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Email (Immutable)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-gray-50 dark:bg-slate-800/60 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-555 dark:text-gray-400 uppercase mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-555 dark:text-gray-400 uppercase mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-555 dark:text-gray-400 uppercase mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-555 dark:text-gray-400 uppercase mb-1">Weekly Budget (₹ INR)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-555 dark:text-gray-400 uppercase mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-50 dark:border-slate-800 pt-4">
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-555 dark:text-gray-400 uppercase mb-1">Daily Steps Target</label>
                <input
                  type="number"
                  value={stepsTarget}
                  onChange={(e) => setStepsTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-555 dark:text-gray-400 uppercase mb-1">Sleep Target (Hours)</label>
                <input
                  type="number"
                  value={sleepTarget}
                  onChange={(e) => setSleepTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-semibold text-gray-555 dark:text-gray-400 uppercase mb-1">Primary Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="WEIGHT_LOSS">Weight Loss</option>
                  <option value="FITNESS">Maintain Fitness</option>
                  <option value="MUSCLE_GAIN">Muscle Gain</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-50 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Parameters
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
