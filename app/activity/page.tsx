"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Flame, 
  Clock, 
  Smartphone, 
  Plus, 
  Check, 
  History,
  TrendingUp,
  RotateCw,
  Loader2
} from "lucide-react";
import confetti from "canvas-confetti";

interface ActivityLog {
  id: string;
  steps: number;
  distance: string;
  caloriesBurned: number;
  exerciseTime: number;
  date: string;
}

interface ExerciseLog {
  id: string;
  exerciseName: string;
  duration: number;
  calories: number;
  date: string;
}

export default function ActivityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  // Log Form State
  const [showLogModal, setShowLogModal] = useState(false);
  const [exerciseName, setExerciseName] = useState("Running");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchActivityData = async () => {
    try {
      const res = await fetch("/api/activity");
      if (res.ok) {
        const json = await res.json();
        setActivities(json.activities || []);
        setExercises(json.exercises || []);
      }
    } catch (err) {
      setError("Failed to load activity details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/activity/sync", {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        
        // Celebrate!
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });

        alert(json.message);
        await fetchActivityData();
      } else {
        alert("Failed to sync health sensors.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred connecting to Health Connect.");
    } finally {
      setSyncing(false);
    }
  };

  const handleLogExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName || !duration || !calories) return;
    setFormLoading(true);

    try {
      const res = await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseName,
          duration: parseInt(duration),
          calories: parseInt(calories),
        }),
      });

      if (res.ok) {
        setExerciseName("Running");
        setDuration("");
        setCalories("");
        setShowLogModal(false);
        await fetchActivityData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // Auto calculate calories based on exercise selection & duration
  useEffect(() => {
    if (!duration || isNaN(Number(duration))) return;
    const mins = parseInt(duration);
    
    // Simple estimates for calorie burn rates per minute
    let MET = 6.0; // Running
    if (exerciseName === "Cycling") MET = 7.5;
    if (exerciseName === "Yoga") MET = 2.5;
    if (exerciseName === "Workout") MET = 5.0;
    if (exerciseName === "Walking") MET = 3.5;

    // Calories = MET * 3.5 * weightKg / 200 * durationMins
    const userWeight = user?.weight ? Number(user.weight) : 70;
    const burn = Math.round(MET * 3.5 * userWeight * mins / 200);
    setCalories(burn.toString());
  }, [exerciseName, duration, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Calculate statistics
  const todayActivity = activities[0]; // because sorted desc
  const stepsToday = todayActivity ? todayActivity.steps : 0;
  const stepsGoal = user?.stepsTarget || 10000;
  const stepPercent = Math.min(100, Math.round((stepsToday / stepsGoal) * 100));
  const kcalToday = todayActivity ? todayActivity.caloriesBurned : 0;
  const activeMinsToday = todayActivity ? todayActivity.exerciseTime : 0;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-gray-50/10 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Habit Loop</span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Activity Tracking</h1>
          <p className="text-xs text-gray-400 mt-0.5">Track your daily steps, distance, active routines, and device syncs.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-5 py-3 border border-gray-200 hover:bg-gray-50 bg-white rounded-xl text-xs font-bold text-gray-700 shadow-sm transition-all disabled:opacity-50"
          >
            {syncing ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-blue-500" />
                Syncing Google Fit...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-blue-500" />
                Sync Health Connect
              </>
            )}
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Log Workout
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Steps completeness */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 block uppercase">Steps Progress</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-full">{stepPercent}%</span>
          </div>
          <div className="my-6">
            <span className="text-3xl font-black text-gray-800">{stepsToday.toLocaleString()}</span>
            <span className="text-xs text-gray-400 font-medium block mt-1">Goal: {stepsGoal.toLocaleString()} steps</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${stepPercent}%` }} />
          </div>
        </div>

        {/* Active Calories */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 block uppercase">Active Energy</span>
            <Flame className="w-5 h-5 text-green-500" />
          </div>
          <div className="my-6">
            <span className="text-3xl font-black text-gray-800">{kcalToday} kcal</span>
            <span className="text-xs text-gray-400 font-medium block mt-1">Total active calories burned today</span>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-550" />
            <span>Includes steps and logged exercises</span>
          </div>
        </div>

        {/* Active Minutes */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 block uppercase">Active Time</span>
            <Clock className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="my-6">
            <span className="text-3xl font-black text-gray-800">{activeMinsToday} mins</span>
            <span className="text-xs text-gray-400 font-medium block mt-1">Total workout duration logged</span>
          </div>
          <div className="text-xs text-gray-500">
            Coach recommendation: <span className="font-semibold text-gray-800">30 mins daily</span>
          </div>
        </div>
      </div>

      {/* Exercise Logs History */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-gray-400" />
          <h3 className="text-base font-bold text-gray-800 tracking-tight uppercase">Recent Workouts</h3>
        </div>

        {exercises.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-2xl">
            No workouts logged yet. Use the 'Log Workout' button to add your first activity!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-450 uppercase font-bold tracking-wider">
                  <th className="py-4 px-2">Activity Name</th>
                  <th className="py-4 px-2">Date Logged</th>
                  <th className="py-4 px-2">Duration</th>
                  <th className="py-4 px-2">Est. Burned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {exercises.map((ex) => (
                  <tr key={ex.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-2 font-bold text-gray-800 capitalize">{ex.exerciseName}</td>
                    <td className="py-4 px-2 text-gray-400">
                      {new Date(ex.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-2 text-gray-600 font-semibold">{ex.duration} mins</td>
                    <td className="py-4 px-2 text-green-600 font-bold">-{ex.calories} kcal</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Workout Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lg border border-gray-50"
            >
              <h3 className="text-base font-bold text-gray-800 mb-1">Log Workout</h3>
              <p className="text-xs text-gray-400 mb-4 font-medium">Record a physical routine to update active statistics.</p>
              
              <form onSubmit={handleLogExercise} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-550 uppercase mb-1">Select Activity</label>
                  <select
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Running">Running</option>
                    <option value="Cycling">Cycling</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Workout">Strength Training</option>
                    <option value="Walking">Walking</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-550 uppercase mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      required
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. 30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-550 uppercase mb-1">Energy Burned (kcal)</label>
                    <input
                      type="number"
                      required
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50/50"
                      placeholder="Estimated"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowLogModal(false); }}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Logging...
                      </>
                    ) : (
                      <>
                        Save workout
                        <Check className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
