"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Droplet, Activity, Moon, X } from "lucide-react";

interface ReminderItem {
  id: string;
  type: string;
  time: string;
  repeat: string;
  enabled: boolean;
}

export default function ReminderNotificationManager() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [activeAlert, setActiveAlert] = useState<{ type: string; title: string; message: string } | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const checkedTimesRef = useRef<Set<string>>(new Set());

  // 1. Fetch user's active reminders list
  const fetchReminders = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/reminders");
      if (res.ok) {
        const json = await res.json();
        // Format time to HH:MM format
        const formatted = (json.reminders || []).map((r: any) => {
          const dateObj = new Date(r.time);
          const hrs = String(dateObj.getUTCHours()).padStart(2, '0');
          const mins = String(dateObj.getUTCMinutes()).padStart(2, '0');
          return {
            ...r,
            time: `${hrs}:${mins}`
          };
        });
        setReminders(formatted.filter((r: any) => r.enabled));
      }
    } catch (err) {
      console.error("Failed to load reminders:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReminders();
      // Check if we need to request permission (if not granted/denied already)
      const hasAsked = localStorage.getItem("has_asked_sensors_permissions");
      if (!hasAsked) {
        setShowPermissionModal(true);
      }
    } else {
      setReminders([]);
    }
  }, [user]);

  // 2. Dynamic Audio Siren Generator using Web Audio API
  const playSirenAlarm = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      // Play a toggling police/ambulance siren tone (between 660Hz and 880Hz)
      osc.frequency.setValueAtTime(660, now);
      for (let i = 0; i < 10; i++) {
        osc.frequency.setValueAtTime(660, now + i * 0.5);
        osc.frequency.setValueAtTime(880, now + i * 0.5 + 0.25);
      }
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 5.0); // fade out over 5s
      
      osc.start(now);
      osc.stop(now + 5.0);
    } catch (e) {
      console.error("Failed to output Web Audio siren:", e);
    }
  };

  // 3. Vibration patterns
  const triggerVibration = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      // Vibrate 500ms, pause 250ms, vibrate 500ms
      navigator.vibrate([500, 250, 500, 250, 500]);
    }
  };

  // 4. Request device permissions
  const handleRequestPermissions = async () => {
    localStorage.setItem("has_asked_sensors_permissions", "true");
    setShowPermissionModal(false);

    // Request Notification permission
    if ("Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.error("Notification permission error:", err);
      }
    }

    // Request DeviceMotion permission (for iOS)
    const DeviceMotionEventClass = (window as any).DeviceMotionEvent;
    if (
      DeviceMotionEventClass &&
      typeof DeviceMotionEventClass.requestPermission === "function"
    ) {
      try {
        await DeviceMotionEventClass.requestPermission();
      } catch (err) {
        console.error("DeviceMotion permission request error:", err);
      }
    }
  };

  // 5. Background Scheduler interval (runs every 15 seconds)
  useEffect(() => {
    if (!user || reminders.length === 0) return;

    const checkRemindersInterval = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeKey = `${currentHours}:${currentMinutes}`;

      // Only alert once per minute
      if (checkedTimesRef.current.has(currentTimeKey)) return;

      reminders.forEach((reminder) => {
        let isTriggered = false;
        let title = "LifeTrack Reminder";
        let message = "";

        if (reminder.type === "WORKOUT" && reminder.time === currentTimeKey) {
          isTriggered = true;
          title = "🏋️ Workout Reminder!";
          message = "Time for your scheduled workout routine. Stay active, stay strong!";
        } else if (reminder.type === "SLEEP" && reminder.time === currentTimeKey) {
          isTriggered = true;
          title = "🌙 Sleep Reminder!";
          message = "Time to wind down and prepare for sleep. Rest is key to recovery!";
        } else if (reminder.type === "WATER") {
          // For periodic water intake, e.g. "Every 2 hours". Check if current minute is 00 and hour matches interval
          const intervalHrs = parseInt(reminder.repeat.match(/\d+/) ? (reminder.repeat.match(/\d+/)![0]) : "2");
          const hourNum = now.getHours();
          const minNum = now.getMinutes();

          // Trigger on the hour mark if it fits the interval (e.g. divisible by 2 hours between 8 AM and 10 PM)
          if (minNum === 0 && hourNum >= 8 && hourNum <= 22 && hourNum % intervalHrs === 0) {
            isTriggered = true;
            title = "💧 Hydration Reminder!";
            message = "Time to drink a fresh glass of water to stay hydrated!";
          }
        }

        if (isTriggered) {
          checkedTimesRef.current.add(currentTimeKey);
          triggerVibration();
          playSirenAlarm();
          setActiveAlert({ type: reminder.type, title, message });

          // Send browser push notification if permitted
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(title, {
              body: message,
              icon: "/icon-192.png"
            });
          }
        }
      });
    };

    const timer = setInterval(checkRemindersInterval, 15000);
    return () => clearInterval(timer);
  }, [reminders, user]);

  const handleQuickLogWater = async () => {
    setActiveAlert(null);
    try {
      await fetch("/api/dashboard/log-water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1 }),
      });
      // Fire celebratory details
      triggerVibration();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* 1. Sensors & Notifications Permission Invite Modal */}
      <AnimatePresence>
        {showPermissionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-150 text-center"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100/50">
                <Bell className="w-6 h-6 animate-swing" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 leading-snug">
                Enable Active Motion <br />& Smart Reminders
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Allow LifeTrack to access motion sensors to auto-count steps, and send alerts with sounds and vibrations when it's time to drink water or exercise.
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  onClick={handleRequestPermissions}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Authorize Sensors & Alerts
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("has_asked_sensors_permissions", "true");
                    setShowPermissionModal(false);
                  }}
                  className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-550 rounded-2xl text-xs font-bold transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Custom Alarm Reminder Alert Modal Overlay */}
      <AnimatePresence>
        {activeAlert && (
          <div className="fixed bottom-6 right-6 z-[98] p-4 max-w-sm w-full">
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-100 shadow-2xl rounded-3xl p-5 relative overflow-hidden flex flex-col gap-3"
            >
              <button 
                onClick={() => setActiveAlert(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-650"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-3 items-start">
                <div className={`p-2.5 rounded-xl flex items-center justify-center text-white ${
                  activeAlert.type === "WATER" ? "bg-indigo-600" :
                  activeAlert.type === "WORKOUT" ? "bg-blue-600" : "bg-purple-650"
                }`}>
                  {activeAlert.type === "WATER" ? <Droplet className="w-5 h-5" /> :
                   activeAlert.type === "WORKOUT" ? <Activity className="w-5 h-5" /> :
                   <Moon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-extrabold text-gray-800 tracking-tight leading-none">{activeAlert.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{activeAlert.message}</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-gray-50">
                {activeAlert.type === "WATER" && (
                  <button
                    onClick={handleQuickLogWater}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-[10px] font-bold shadow-sm"
                  >
                    Log +1 Glass Water
                  </button>
                )}
                {activeAlert.type === "WORKOUT" && (
                  <a
                    href="/activity"
                    onClick={() => setActiveAlert(null)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-[10px] font-bold shadow-sm text-center"
                  >
                    Log Workout
                  </a>
                )}
                <button
                  onClick={() => setActiveAlert(null)}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-650 rounded-xl text-[10px] font-bold"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
