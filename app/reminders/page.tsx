"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Droplet, 
  Activity, 
  Moon, 
  Utensils, 
  Clock, 
  Check, 
  Loader2,
  Calendar,
  AlertCircle
} from "lucide-react";

interface ReminderItem {
  id: string;
  type: string;
  time: string; // Time representation
  repeat: string;
  enabled: boolean;
}

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Quick form configurations
  const [waterInterval, setWaterInterval] = useState("2");
  const [workoutTime, setWorkoutTime] = useState("08:00");
  const [sleepTime, setSleepTime] = useState("22:00");
  
  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/reminders");
      if (res.ok) {
        const json = await res.json();
        
        // Clean times for form inputs
        const formatted = (json.reminders || []).map((r: any) => {
          const dateObj = new Date(r.time);
          const hrs = String(dateObj.getUTCHours()).padStart(2, '0');
          const mins = String(dateObj.getUTCMinutes()).padStart(2, '0');
          return {
            ...r,
            time: `${hrs}:${mins}`
          };
        });

        setReminders(formatted);

        // Populate quick inputs if found
        const waterRem = formatted.find((r: any) => r.type === "WATER");
        if (waterRem) {
          const hoursMatch = waterRem.repeat.match(/\d+/);
          if (hoursMatch) setWaterInterval(hoursMatch[0]);
        }

        const workRem = formatted.find((r: any) => r.type === "WORKOUT");
        if (workRem) setWorkoutTime(workRem.time);

        const sleepRem = formatted.find((r: any) => r.type === "SLEEP");
        if (sleepRem) setSleepTime(sleepRem.time);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !currentStatus } : r));
    try {
      const res = await fetch("/api/reminders/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled: !currentStatus }),
      });
      if (!res.ok) fetchReminders(); // Rollback
    } catch (err) {
      fetchReminders(); // Rollback
    }
  };

  const handleSaveReminder = async (type: string, time: string, repeat: string) => {
    setSaving(type);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, time, repeat, enabled: true }),
      });
      if (res.ok) {
        await fetchReminders();
        alert(`${type.charAt(0) + type.slice(1).toLowerCase()} reminder updated successfully!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  const waterRem = reminders.find(r => r.type === "WATER");
  const workoutRem = reminders.find(r => r.type === "WORKOUT");
  const sleepRem = reminders.find(r => r.type === "SLEEP");

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 bg-gray-50/10 min-h-screen">
      {/* Page Header */}
      <div>
        <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Habit Scheduler</span>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Notification Reminders</h1>
        <p className="text-xs text-gray-400 mt-0.5">Configure daily alarms and intervals to help you stay on track.</p>
      </div>

      {/* Reminder Config Cards */}
      <div className="grid grid-cols-1 gap-6">
        {/* Water Reminder Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 bg-indigo-50/50 border border-indigo-100/30 text-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Droplet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800 text-base">Water Intake Reminders</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  waterRem?.enabled ? "text-green-600 bg-green-50/50" : "text-gray-400 bg-gray-50/50"
                }`}>
                  {waterRem?.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Alerts you throughout the day to drink water and reach your daily target of 10 glasses.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-gray-500">Frequency:</span>
                <select
                  value={waterInterval}
                  onChange={(e) => setWaterInterval(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="1">Every Hour</option>
                  <option value="2">Every 2 Hours</option>
                  <option value="3">Every 3 Hours</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto justify-end border-t md:border-none pt-4 md:pt-0">
            <button
              onClick={() => {
                if (waterRem) {
                  handleToggle(waterRem.id, waterRem.enabled);
                } else {
                  handleSaveReminder("WATER", "08:00", `interval_${waterInterval}h`);
                }
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all border ${
                waterRem?.enabled 
                  ? "bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100" 
                  : "bg-blue-50 border-blue-100/50 text-blue-600 hover:bg-blue-100/50"
              }`}
            >
              {waterRem?.enabled ? "Disable" : "Enable"}
            </button>
            <button
              onClick={() => handleSaveReminder("WATER", "08:00", `interval_${waterInterval}h`)}
              disabled={saving === "WATER"}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving === "WATER" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Frequency
            </button>
          </div>
        </div>

        {/* Workout Reminder Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 bg-green-50/50 border border-green-100/30 text-green-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800 text-base">Exercise Routine Reminders</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  workoutRem?.enabled ? "text-green-600 bg-green-50/50" : "text-gray-400 bg-gray-50/50"
                }`}>
                  {workoutRem?.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Alerts you at your preferred exercise hour to complete your daily activity routines.
              </p>
              
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-gray-500">Reminder Time:</span>
                <input
                  type="time"
                  value={workoutTime}
                  onChange={(e) => setWorkoutTime(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto justify-end border-t md:border-none pt-4 md:pt-0">
            <button
              onClick={() => {
                if (workoutRem) {
                  handleToggle(workoutRem.id, workoutRem.enabled);
                } else {
                  handleSaveReminder("WORKOUT", workoutTime, "daily");
                }
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all border ${
                workoutRem?.enabled 
                  ? "bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100" 
                  : "bg-blue-50 border-blue-100/50 text-blue-600 hover:bg-blue-100/50"
              }`}
            >
              {workoutRem?.enabled ? "Disable" : "Enable"}
            </button>
            <button
              onClick={() => handleSaveReminder("WORKOUT", workoutTime, "daily")}
              disabled={saving === "WORKOUT"}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving === "WORKOUT" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Time
            </button>
          </div>
        </div>

        {/* Sleep Reminder Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 bg-purple-50/50 border border-purple-100/30 text-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800 text-base">Bedtime Reminders</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  sleepRem?.enabled ? "text-green-600 bg-green-50/50" : "text-gray-400 bg-gray-50/50"
                }`}>
                  {sleepRem?.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                Alerts you when it is time to unwind and log sleep quality, tracking targets of {user?.sleepTarget || 8} hours.
              </p>
              
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-gray-500">Bedtime:</span>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto justify-end border-t md:border-none pt-4 md:pt-0">
            <button
              onClick={() => {
                if (sleepRem) {
                  handleToggle(sleepRem.id, sleepRem.enabled);
                } else {
                  handleSaveReminder("SLEEP", sleepTime, "daily");
                }
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all border ${
                sleepRem?.enabled 
                  ? "bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100" 
                  : "bg-blue-50 border-blue-100/50 text-blue-600 hover:bg-blue-100/50"
              }`}
            >
              {sleepRem?.enabled ? "Disable" : "Enable"}
            </button>
            <button
              onClick={() => handleSaveReminder("SLEEP", sleepTime, "daily")}
              disabled={saving === "SLEEP"}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving === "SLEEP" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Time
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
