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
  const [activeAlert, setActiveAlert] = useState<{ 
    type: string; 
    title: string; 
    message: string; 
    alertCount: number; 
    maxAlerts: number; 
  } | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const checkedTimesRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sequenceTimersRef = useRef<NodeJS.Timeout[]>([]);
  const isDismissedRef = useRef<boolean>(false);

  // Clear all pending 3-repeat sequence timers
  const clearAlertSequence = () => {
    sequenceTimersRef.current.forEach(timer => clearTimeout(timer));
    sequenceTimersRef.current = [];
  };

  const dismissAlert = () => {
    isDismissedRef.current = true;
    clearAlertSequence();
    setActiveAlert(null);
  };

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
      const hasAsked = localStorage.getItem("has_asked_sensors_permissions");
      if (!hasAsked) {
        setShowPermissionModal(true);
      }

      const pollInterval = setInterval(fetchReminders, 30000);

      const handleRemindersUpdated = () => {
        console.log("Reminders updated event detected. Refreshing manager...");
        fetchReminders();
      };
      window.addEventListener("reminders-updated", handleRemindersUpdated);

      return () => {
        clearInterval(pollInterval);
        window.removeEventListener("reminders-updated", handleRemindersUpdated);
      };
    } else {
      setReminders([]);
    }
  }, [user]);

  // Unlock AudioContext on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (typeof window !== "undefined") {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass && !audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
    };

    const handleUnlock = () => {
      initAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(e => console.log("AudioContext resume blocked:", e));
      }
    };

    window.addEventListener("click", handleUnlock);
    window.addEventListener("touchstart", handleUnlock);
    return () => {
      window.removeEventListener("click", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
    };
  }, []);

  // 2. Dynamic Audio Siren Generator using Web Audio API
  const playSirenAlarm = () => {
    try {
      let ctx = audioCtxRef.current;
      if (!ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        ctx = new AudioContextClass();
        audioCtxRef.current = ctx;
      }
      
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
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
      
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 5.0);
      
      osc.start(now);
      osc.stop(now + 5.0);
    } catch (e) {
      console.error("Failed to output Web Audio siren:", e);
    }
  };

  // 3. Vibration patterns
  const triggerVibration = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([500, 250, 500, 250, 500]);
    }
  };

  // Helper to send browser system notification
  const sendSystemNotification = (title: string, message: string, count: number) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const displayTitle = `${title} (Alert ${count}/3)`;
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(displayTitle, {
            body: message,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            vibrate: [500, 250, 500, 250, 500],
            tag: `reminder-${count}`,
            renotify: true,
            data: { url: "/dashboard" }
          } as any);
        }).catch(() => {
          new Notification(displayTitle, { body: message, icon: "/icon-192.png" });
        });
      } else {
        new Notification(displayTitle, { body: message, icon: "/icon-192.png" });
      }
    }
  };

  // 4. Request device permissions
  const handleRequestPermissions = async () => {
    localStorage.setItem("has_asked_sensors_permissions", "true");
    setShowPermissionModal(false);

    if ("Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.error("Notification permission error:", err);
      }
    }

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

  // Trigger 3-repeat notification alert sequence (Immediate, +12s, +24s)
  const trigger3RepeatAlertSequence = (type: string, baseTitle: string, message: string) => {
    clearAlertSequence();
    isDismissedRef.current = false;

    const fireSingleAlert = (count: number) => {
      if (isDismissedRef.current) return;

      triggerVibration();
      playSirenAlarm();
      sendSystemNotification(baseTitle, message, count);

      setActiveAlert({
        type,
        title: baseTitle,
        message,
        alertCount: count,
        maxAlerts: 3,
      });
    };

    // Alert 1: Immediate
    fireSingleAlert(1);

    // Alert 2: 12 Seconds Later
    const t2 = setTimeout(() => {
      fireSingleAlert(2);
    }, 12000);

    // Alert 3: 24 Seconds Later (Final)
    const t3 = setTimeout(() => {
      fireSingleAlert(3);
    }, 24000);

    sequenceTimersRef.current = [t2, t3];
  };

  // 5. Background Scheduler interval (runs every 10 seconds)
  useEffect(() => {
    if (!user || reminders.length === 0) return;

    const checkRemindersInterval = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeKey = `${currentHours}:${currentMinutes}`;
      const nowMs = Date.now();

      reminders.forEach((reminder) => {
        let isTriggered = false;
        let title = "LifeTrack Reminder";
        let message = "";

        const lastTriggeredKey = `reminder_last_triggered_${reminder.id}`;
        const lastTriggeredTime = parseInt(localStorage.getItem(lastTriggeredKey) || "0", 10);

        // Check if reminder has a recurring interval (e.g., WATER or interval_0.5h / interval_1h)
        let intervalMins = 0;
        const intervalMatch = reminder.repeat.match(/(\d+(\.\d+)?)/);
        
        if (reminder.type === "WATER" || reminder.repeat.includes("interval")) {
          if (intervalMatch) {
            intervalMins = Math.round(parseFloat(intervalMatch[1]) * 60);
          } else {
            intervalMins = 120; // Default 2 hours
          }
        }

        if (intervalMins > 0) {
          const intervalMs = intervalMins * 60 * 1000;
          const timeSinceLastAlert = nowMs - lastTriggeredTime;

          // Check if time since last alert exceeded the set interval (e.g. 30 mins or 60 mins)
          // OR if current time hits exact clock boundary
          const currentMinsFromMidnight = now.getHours() * 60 + now.getMinutes();
          const isClockBoundary = (currentMinsFromMidnight % intervalMins === 0);

          if (lastTriggeredTime === 0) {
            // First time setup: set last triggered to now and skip immediate alert to prevent spam on reload
            localStorage.setItem(lastTriggeredKey, nowMs.toString());
          } else if (timeSinceLastAlert >= intervalMs || (isClockBoundary && timeSinceLastAlert > 60000)) {
            isTriggered = true;
            if (reminder.type === "WATER") {
              const label = intervalMins < 60 ? `${intervalMins} minutes` : `${intervalMins / 60} hour(s)`;
              title = "💧 Hydration Reminder!";
              message = `Time to drink a fresh glass of water! (Repeats every ${label})`;
            } else if (reminder.type === "WORKOUT") {
              title = "🏋️ Workout Interval!";
              message = "Time for your scheduled workout routine. Stay active, stay strong!";
            } else {
              title = `⏰ ${reminder.type} Reminder!`;
              message = "Time for your scheduled health habit check-in!";
            }
          }
        } else {
          // Specific time reminder (HH:MM format)
          if (reminder.time === currentTimeKey && !checkedTimesRef.current.has(`${reminder.id}_${currentTimeKey}`)) {
            isTriggered = true;
            checkedTimesRef.current.add(`${reminder.id}_${currentTimeKey}`);

            if (reminder.type === "WORKOUT") {
              title = "🏋️ Workout Reminder!";
              message = "Time for your scheduled workout routine. Stay active, stay strong!";
            } else if (reminder.type === "SLEEP") {
              title = "🌙 Sleep Reminder!";
              message = "Time to wind down and prepare for sleep. Rest is key to recovery!";
            } else {
              title = `⏰ ${reminder.type} Reminder!`;
              message = "Time for your scheduled health habit check-in!";
            }
          }
        }

        if (isTriggered) {
          localStorage.setItem(lastTriggeredKey, nowMs.toString());
          trigger3RepeatAlertSequence(reminder.type, title, message);
        }
      });
    };

    const timer = setInterval(checkRemindersInterval, 10000);
    checkRemindersInterval(); // Check immediately on mount/update

    return () => clearInterval(timer);
  }, [reminders, user]);

  const handleQuickLogWater = async () => {
    dismissAlert();
    try {
      await fetch("/api/dashboard/log-water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1 }),
      });
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
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-150 dark:border-slate-800 text-center"
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100/50 dark:border-blue-900/50">
                <Bell className="w-6 h-6 animate-swing" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-snug">
                Enable Active Motion <br />& Smart Reminders
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Allow LifeTrack to access motion sensors to auto-count steps, and send 3-repeat alerts with sounds and vibrations when it's time to drink water or exercise.
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
                  className="w-full py-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-550 dark:text-gray-300 rounded-2xl text-xs font-bold transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Custom 3-Repeat Alarm Reminder Alert Modal Overlay */}
      <AnimatePresence>
        {activeAlert && (
          <div className="fixed bottom-6 right-6 z-[98] p-4 max-w-sm w-full">
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-3xl p-5 relative overflow-hidden flex flex-col gap-3 text-gray-900 dark:text-white"
            >
              <button 
                onClick={dismissAlert}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-3 items-start">
                <div className={`p-2.5 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${
                  activeAlert.type === "WATER" ? "bg-indigo-600" :
                  activeAlert.type === "WORKOUT" ? "bg-blue-600" : "bg-purple-650"
                }`}>
                  {activeAlert.type === "WATER" ? <Droplet className="w-5 h-5" /> :
                   activeAlert.type === "WORKOUT" ? <Activity className="w-5 h-5" /> :
                   <Moon className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-gray-800 dark:text-white tracking-tight leading-none truncate">{activeAlert.title}</h4>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex-shrink-0">
                      Alert {activeAlert.alertCount}/3
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{activeAlert.message}</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-gray-50 dark:border-slate-800">
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
                    onClick={dismissAlert}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-[10px] font-bold shadow-sm text-center"
                  >
                    Log Workout
                  </a>
                )}
                <button
                  onClick={dismissAlert}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-650 dark:text-gray-300 rounded-xl text-[10px] font-bold"
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
