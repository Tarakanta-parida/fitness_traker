"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Activity, 
  Droplet, 
  Moon, 
  Utensils, 
  Plus, 
  Flame, 
  TrendingUp,
  Award,
  ChevronRight,
  TrendingDown,
  Loader2,
  Download
} from "lucide-react";
import confetti from "canvas-confetti";

interface SummaryData {
  date: string;
  steps: number;
  stepsGoal: number;
  distance: number;
  caloriesBurned: number;
  caloriesConsumed: number;
  proteinConsumed: number;
  waterGlasses: number;
  waterGoal: number;
  sleepHours: number | null;
  sleepQuality: string | null;
  workoutMinutes: number;
  workoutCompleted: boolean;
  todayFoodCost: number;
  budgetRemaining: number;
  currentWeight: number;
  currentBmi: number | null;
  meals: any[];
  exercises: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SummaryData | null>(null);
  const [currentLocalDate, setCurrentLocalDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal / Inputs state
  const [showStepsInput, setShowStepsInput] = useState(false);
  const [quickSteps, setQuickSteps] = useState("");
  const [stepsLoading, setStepsLoading] = useState(false);

  // Real-time Motion Step Tracking state
  const [isTrackingSteps, setIsTrackingSteps] = useState(false);
  const [stepPermissionGranted, setStepPermissionGranted] = useState(false);
  const [pendingStepsSync, setPendingStepsSync] = useState(0);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent default browser install dialog
      e.preventDefault();
      // Store event for triggering installation later
      setDeferredPrompt(e);
      // Update UI to render the custom install promo card
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Turn off install offer if already running inside app standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User prompt installation outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };
  
  const [showMealInput, setShowMealInput] = useState(false);
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("BREAKFAST");
  const [mealCalories, setMealCalories] = useState("");
  const [mealProtein, setMealProtein] = useState("");
  const [mealPrice, setMealPrice] = useState("");
  const [mealLoading, setMealLoading] = useState(false);

  const [showExerciseInput, setShowExerciseInput] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseDuration, setExerciseDuration] = useState("");
  const [exerciseCalories, setExerciseCalories] = useState("");
  const [exerciseLoading, setExerciseLoading] = useState(false);

  const [showSleepInput, setShowSleepInput] = useState(false);
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState("good");
  const [sleepLoading, setSleepLoading] = useState(false);

  // Real-time Motion Step Tracker Effect
  useEffect(() => {
    if (!isTrackingSteps || !data) return;

    let magnitudeThreshold = 12.5; // Acceleration peak threshold representing a footstep (average walking impact)
    let baseThreshold = 10.2; // Return threshold (near gravity 9.8 m/s^2)
    let lastStepTime = 0;
    let isAboveThreshold = false;

    // Exponential smoothing factor for low-pass filter (smoothes out hand shakes)
    const alpha = 0.25;
    let smoothedMagnitude = 9.81;

    const handleMotion = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity;
      if (!accel) return;

      const x = accel.x || 0;
      const y = accel.y || 0;
      const z = accel.z || 0;

      // Magnitude of current acceleration vector
      const currentMagnitude = Math.sqrt(x * x + y * y + z * z);

      // Low-pass filter to smooth out noise
      smoothedMagnitude = (smoothedMagnitude * (1 - alpha)) + (currentMagnitude * alpha);

      const now = Date.now();

      // Step detection: check if smoothed acceleration magnitude crosses threshold
      if (!isAboveThreshold && smoothedMagnitude > magnitudeThreshold && (now - lastStepTime) > 350) {
        isAboveThreshold = true;
        lastStepTime = now;

        // Optimistically update steps, distance, and calories in the UI
        setData(prevData => {
          if (!prevData) return null;
          const nextSteps = prevData.steps + 1;
          return {
            ...prevData,
            steps: nextSteps,
            distance: nextSteps * 0.000762,
            caloriesBurned: prevData.caloriesBurned + 0.04
          };
        });

        // Trigger step sound or small action if needed, track pending sync count
        setPendingStepsSync(prev => prev + 1);
      } else if (isAboveThreshold && smoothedMagnitude < baseThreshold) {
        isAboveThreshold = false;
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [isTrackingSteps, data]);

  // Debounced auto-sync of steps back to Railway DB
  useEffect(() => {
    if (pendingStepsSync >= 5 && data) {
      syncStepsToServer(data.steps);
      setPendingStepsSync(0);
    }
  }, [pendingStepsSync, data]);

  const syncStepsToServer = async (totalStepsCount: number) => {
    try {
      await fetch("/api/dashboard/log-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: totalStepsCount }),
      });
    } catch (err) {
      console.error("Auto sync steps failed:", err);
    }
  };

  const toggleStepTracking = async () => {
    if (isTrackingSteps) {
      // Turn off: Sync any leftover steps
      if (pendingStepsSync > 0 && data) {
        await syncStepsToServer(data.steps);
        setPendingStepsSync(0);
      }
      setIsTrackingSteps(false);
    } else {
      // Turn on: Request permissions if required (Safari/iOS compatibility)
      const DeviceMotionEventClass = (window as any).DeviceMotionEvent;
      if (
        DeviceMotionEventClass &&
        typeof DeviceMotionEventClass.requestPermission === "function"
      ) {
        try {
          const permissionState = await DeviceMotionEventClass.requestPermission();
          if (permissionState === "granted") {
            setStepPermissionGranted(true);
            setIsTrackingSteps(true);
          } else {
            alert("Motion permission denied. Cannot auto-count steps.");
          }
        } catch (error) {
          console.error("DeviceMotion permission error:", error);
          alert("Please open this page in HTTPS / secure context to enable motion tracking.");
        }
      } else {
        // Android/Chrome grants permission implicitly
        setStepPermissionGranted(true);
        setIsTrackingSteps(true);
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json.summary);
      } else {
        setError("Failed to load dashboard summaries");
      }
    } catch (err) {
      setError("An error occurred loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    setCurrentLocalDate(new Date());

    // Check every 30 seconds if the day has changed to auto-refresh daily records
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentLocalDate((prevDate) => {
        if (prevDate && now.getDate() !== prevDate.getDate()) {
          // Midnight crossed: trigger data re-fetch for the new day
          fetchDashboardData();
        }
        return now;
      });
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const handleQuickWater = async () => {
    if (!data) return;
    // Optimistic Update
    setData({
      ...data,
      waterGlasses: data.waterGlasses + 1,
    });
    
    // Trigger water drop sound or splash animation (confetti for water goal!)
    if (data.waterGlasses + 1 >= data.waterGoal) {
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#3b82f6", "#60a5fa", "#93c5fd"],
      });
    }

    try {
      const res = await fetch("/api/dashboard/log-water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1 }),
      });
      if (!res.ok) {
        fetchDashboardData(); // Rollback
      }
    } catch (err) {
      fetchDashboardData(); // Rollback
    }
  };

  const handleLogSteps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSteps || isNaN(Number(quickSteps))) return;
    setStepsLoading(true);

    try {
      const res = await fetch("/api/dashboard/log-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: quickSteps }),
      });
      if (res.ok) {
        setShowStepsInput(false);
        setQuickSteps("");
        await fetchDashboardData();
        
        // Trigger celebratory confetti if steps exceed goal!
        const stepsVal = parseInt(quickSteps);
        if (data && stepsVal >= data.stepsGoal) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStepsLoading(false);
    }
  };

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName || !mealCalories || !mealProtein || !mealPrice) return;
    setMealLoading(true);

    try {
      const res = await fetch("/api/food/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType,
          foodName: mealName,
          calories: parseInt(mealCalories),
          protein: parseInt(mealProtein),
          price: parseFloat(mealPrice),
        }),
      });
      if (res.ok) {
        setShowMealInput(false);
        setMealName("");
        setMealCalories("");
        setMealProtein("");
        setMealPrice("");
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMealLoading(false);
    }
  };

  const handleLogExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName || !exerciseDuration || !exerciseCalories) return;
    setExerciseLoading(true);

    try {
      const res = await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseName,
          duration: parseInt(exerciseDuration),
          calories: parseInt(exerciseCalories),
        }),
      });
      if (res.ok) {
        setShowExerciseInput(false);
        setExerciseName("");
        setExerciseDuration("");
        setExerciseCalories("");
        await fetchDashboardData();
        confetti({
          particleCount: 50,
          spread: 40,
          colors: ["#10b981", "#34d399"]
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExerciseLoading(false);
    }
  };

  const handleLogSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sleepHours || isNaN(Number(sleepHours))) return;
    setSleepLoading(true);

    try {
      const res = await fetch("/api/history/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours: parseFloat(sleepHours),
          quality: sleepQuality,
        }),
      });
      if (res.ok) {
        setShowSleepInput(false);
        setSleepHours("");
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSleepLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <span className="text-sm text-gray-400 font-medium">Calibrating coach parameters...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
        <div className="bg-red-50/10 border border-red-200/50 p-6 rounded-3xl text-center max-w-md">
          <p className="text-red-650 font-bold mb-2">System Sync Failed</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={() => { setLoading(true); setError(""); fetchDashboardData(); }} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">Retry Connection</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Calculations for Ring progress
  const stepPercent = Math.min(100, Math.round((data.steps / data.stepsGoal) * 100));
  const waterPercent = Math.min(100, Math.round((data.waterGlasses / data.waterGoal) * 100));
  const exercisePercent = Math.min(100, Math.round((data.workoutMinutes / 60) * 100)); // Default 60 mins workout goal
  const caloriesBurntPercent = Math.min(100, Math.round((data.caloriesBurned / 500) * 100)); // Default 500 active kcal goal

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good Morning";
    if (hrs < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // SVG parameters
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-gray-50/10 min-h-screen">
      {/* Greetings */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Personal Coach</span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1 flex items-center gap-2">
            {getGreeting()}, {user?.name.split(" ")[0]} <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          </h1>
          <p className="text-xs text-gray-450 mt-0.5">Let's check in on your habits for today.</p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs font-bold text-gray-400">TODAY'S DATE</span>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">
            {currentLocalDate
              ? currentLocalDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
              : new Date(data.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* PWA Install Promo Banner */}
      {isInstallable && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 via-indigo-650 to-blue-700 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row justify-between items-center gap-4 border border-blue-500/20"
        >
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <Download className="w-5 h-5 animate-bounce text-blue-200" /> Download & Install LifeTrack App
            </h3>
            <p className="text-xs text-blue-100 mt-1 max-w-xl">
              Save this web tracking dashboard directly to your mobile home screen or computer dock. Get instant launcher access and offline caching metrics!
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={handleInstallApp}
              className="px-5 py-2.5 bg-white text-blue-700 rounded-2xl text-xs font-bold shadow-md hover:bg-blue-50 transition-all flex-1 md:flex-none text-center"
            >
              Install App
            </button>
            <button
              onClick={() => setIsInstallable(false)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-semibold transition-all"
            >
              Later
            </button>
          </div>
        </motion.div>
      )}

      {/* Hero Analytics Ring & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Ring Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center gap-6 col-span-1 lg:col-span-1">
          <div className="text-center">
            <span className="text-xs font-semibold text-gray-400">TODAY'S GOAL</span>
            <h3 className="text-lg font-bold text-gray-800 mt-0.5">Habit Completeness</h3>
          </div>
          
          <div className="relative" style={{ width: size, height: size }}>
            {/* Background SVG Circle */}
            <svg className="transform -rotate-90 w-full h-full">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-gray-100 fill-transparent"
                strokeWidth={strokeWidth}
              />
              {/* Active Progress Rings */}
              {/* Outer Ring: Steps */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-blue-500 fill-transparent transition-all duration-500 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (stepPercent / 100) * circumference}
                strokeLinecap="round"
              />
              {/* Innermost Ring: Active Calories */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius - 16}
                className="stroke-green-400 fill-transparent transition-all duration-500 ease-out"
                strokeWidth={10}
                strokeDasharray={(radius - 16) * 2 * Math.PI}
                strokeDashoffset={(radius - 16) * 2 * Math.PI - (caloriesBurntPercent / 100) * ((radius - 16) * 2 * Math.PI)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-blue-600 leading-none">{stepPercent}%</span>
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mt-0.5">Steps</span>
              
              <div className="w-8 h-px bg-gray-100 my-1.5" />
              
              <span className="text-xl font-black text-green-650 leading-none">{data.caloriesBurned}</span>
              <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider mt-0.5">Kcal</span>
            </div>
          </div>

          <div className="flex gap-6 w-full justify-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-gray-500 font-medium">Steps ({stepPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-gray-500 font-medium">Active Kcal ({caloriesBurntPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Quick Summary Grid */}
        <div className="grid grid-cols-2 gap-4 col-span-1 lg:col-span-2">
          {/* Steps Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            {isTrackingSteps && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping mt-3 mr-3" />
            )}
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-blue-50/50 border border-blue-100/30 text-blue-500 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <button 
                onClick={toggleStepTracking}
                className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase transition-all shadow-sm flex items-center gap-1 ${
                  isTrackingSteps 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "bg-blue-50/50 text-blue-600 hover:bg-blue-100/70"
                }`}
              >
                {isTrackingSteps ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Tracking Live
                  </>
                ) : (
                  "Sensor Off"
                )}
              </button>
            </div>
            <div className="mt-4">
              <span className="text-xs text-gray-400 font-semibold block">Steps Count</span>
              <span className="text-2xl font-black text-gray-800 block mt-1">{data.steps.toLocaleString()}</span>
              <span className="text-[11px] text-gray-500 mt-1 block">Goal: {data.stepsGoal.toLocaleString()} ({data.distance.toFixed(1)} km)</span>
            </div>
          </div>

          {/* Active Calories Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-green-50/50 border border-green-100/30 text-green-500 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-green-600 bg-green-50/50 px-2 py-0.5 rounded-full uppercase">Kcal</span>
            </div>
            <div className="mt-4">
              <span className="text-xs text-gray-400 font-semibold block">Active Burned</span>
              <span className="text-2xl font-black text-gray-800 block mt-1">{data.caloriesBurned} kcal</span>
              <span className="text-[11px] text-gray-500 mt-1 block">Workout Duration: {data.workoutMinutes} mins</span>
            </div>
          </div>

          {/* Water Intake Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-indigo-50/50 border border-indigo-100/30 text-indigo-500 rounded-xl flex items-center justify-center">
                <Droplet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase">Hydration</span>
            </div>
            <div className="mt-4">
              <span className="text-xs text-gray-400 font-semibold block">Water Intake</span>
              <span className="text-2xl font-black text-gray-800 block mt-1">{data.waterGlasses} glasses</span>
              <span className="text-[11px] text-gray-500 mt-1 block">Goal: {data.waterGoal} (Drink: +1 glass action)</span>
            </div>
          </div>

          {/* Sleep Tracking Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-purple-50/50 border border-purple-100/30 text-purple-500 rounded-xl flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50/50 px-2 py-0.5 rounded-full uppercase">Rest</span>
            </div>
            <div className="mt-4">
              <span className="text-xs text-gray-400 font-semibold block">Sleep Duration</span>
              <span className="text-2xl font-black text-gray-800 block mt-1">
                {data.sleepHours !== null ? `${data.sleepHours} hrs` : "No Log"}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block capitalize">
                Quality: {data.sleepQuality || "No rating"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4 tracking-tight">QUICK HABIT LOGGER</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={handleQuickWater}
            className="flex items-center justify-center gap-2 p-4 bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100/30 rounded-2xl transition-all group active:scale-[0.98]"
          >
            <Droplet className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="text-xs font-bold text-indigo-900 block">+1 Glass Water</span>
              <span className="text-[9px] text-indigo-500 block">Quick drink log</span>
            </div>
          </button>

          <button
            onClick={() => setShowStepsInput(true)}
            className="flex items-center justify-center gap-2 p-4 bg-blue-50/40 hover:bg-blue-50 border border-blue-100/30 rounded-2xl transition-all group active:scale-[0.98]"
          >
            <Activity className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="text-xs font-bold text-blue-900 block">Log Step Count</span>
              <span className="text-[9px] text-blue-500 block">Add steps manually</span>
            </div>
          </button>

          <button
            onClick={() => setShowMealInput(true)}
            className="flex items-center justify-center gap-2 p-4 bg-green-50/40 hover:bg-green-50 border border-green-100/30 rounded-2xl transition-all group active:scale-[0.98]"
          >
            <Utensils className="w-5 h-5 text-green-550 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="text-xs font-bold text-green-900 block">Log Today's Meal</span>
              <span className="text-[9px] text-green-500 block">Calorie & price log</span>
            </div>
          </button>

          <button
            onClick={() => setShowSleepInput(true)}
            className="flex items-center justify-center gap-2 p-4 bg-purple-50/40 hover:bg-purple-50 border border-purple-100/30 rounded-2xl transition-all group active:scale-[0.98]"
          >
            <Moon className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="text-xs font-bold text-purple-900 block">Log Sleep Hours</span>
              <span className="text-[9px] text-purple-500 block">Night rest logs</span>
            </div>
          </button>
        </div>
      </div>

      {/* Meal & Workout Logs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Meals Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[250px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 tracking-tight uppercase">Today's Meals</h3>
              <span className="text-xs font-semibold text-green-600 bg-green-55/10 px-2 py-0.5 rounded-full">
                {data.caloriesConsumed} kcal consumed
              </span>
            </div>
            
            {data.meals.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No meals logged today. Use Quick Action to add.
              </div>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {data.meals.map((meal) => (
                  <div key={meal.id} className="flex justify-between items-center p-3 border border-gray-50 rounded-xl text-xs bg-gray-50/30">
                    <div>
                      <span className="font-semibold text-gray-800 block capitalize">{meal.foodName}</span>
                      <span className="text-[10px] text-gray-400 block capitalize">{meal.mealType.toLowerCase()} &bull; {meal.protein}g protein</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-800 block">{meal.calories} kcal</span>
                      <span className="text-[10px] text-gray-400 block">${Number(meal.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-gray-50 pt-4 flex justify-between items-center mt-4">
            <div className="text-xs text-gray-450">
              Weekly budget remaining: <span className="font-bold text-gray-800">${data.budgetRemaining.toFixed(2)}</span>
            </div>
            <button onClick={() => setShowMealInput(true)} className="text-xs font-semibold text-blue-600 flex items-center hover:underline">
              Add Meal <Plus className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Today's Exercises Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[250px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 tracking-tight uppercase">Today's Workouts</h3>
              <span className="text-xs font-semibold text-blue-600 bg-blue-55/10 px-2 py-0.5 rounded-full">
                {data.workoutMinutes} mins active
              </span>
            </div>
            
            {data.exercises.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No exercises logged today. Stay active!
              </div>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {data.exercises.map((ex) => (
                  <div key={ex.id} className="flex justify-between items-center p-3 border border-gray-50 rounded-xl text-xs bg-gray-50/30">
                    <div>
                      <span className="font-semibold text-gray-800 block capitalize">{ex.exerciseName}</span>
                      <span className="text-[10px] text-gray-400 block">{ex.duration} minutes</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600 block">-{ex.calories} kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-gray-50 pt-4 flex justify-between items-center mt-4">
            <div className="text-xs text-gray-450">
              Status: <span className="font-bold text-gray-800">{data.workoutCompleted ? "Completed Today's Routine" : "Rest Day or Pending"}</span>
            </div>
            <button onClick={() => setShowExerciseInput(true)} className="text-xs font-semibold text-blue-600 flex items-center hover:underline">
              Log Workout <Plus className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      <AnimatePresence>
        {/* Steps Modal */}
        {showStepsInput && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lg border border-gray-50"
            >
              <h3 className="text-base font-bold text-gray-800 mb-1">Log Steps Manually</h3>
              <p className="text-xs text-gray-400 mb-4">Enter your current accumulated steps for today.</p>
              <form onSubmit={handleLogSteps} className="space-y-4">
                <input
                  type="number"
                  required
                  value={quickSteps}
                  onChange={(e) => setQuickSteps(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-inner"
                  placeholder="e.g. 8450"
                />
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowStepsInput(false); setQuickSteps(""); }}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-gray-650"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={stepsLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {stepsLoading ? "Saving..." : "Log Steps"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Meal Modal */}
        {showMealInput && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-lg border border-gray-50"
            >
              <h3 className="text-base font-bold text-gray-800 mb-1">Log Today's Meal</h3>
              <p className="text-xs text-gray-400 mb-4">Enter food nutritional details and estimated pricing.</p>
              <form onSubmit={handleLogMeal} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Meal Type</label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="BREAKFAST">Breakfast</option>
                      <option value="LUNCH">Lunch</option>
                      <option value="DINNER">Dinner</option>
                      <option value="SNACKS">Snacks</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Food Name</label>
                    <input
                      type="text"
                      required
                      value={mealName}
                      onChange={(e) => setMealName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. Scrambled Eggs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Calories (kcal)</label>
                    <input
                      type="number"
                      required
                      value={mealCalories}
                      onChange={(e) => setMealCalories(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                      placeholder="350"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Protein (g)</label>
                    <input
                      type="number"
                      required
                      value={mealProtein}
                      onChange={(e) => setMealProtein(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                      placeholder="18"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={mealPrice}
                      onChange={(e) => setMealPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                      placeholder="4.50"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMealInput(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-gray-650"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mealLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {mealLoading ? "Logging..." : "Log Meal"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Exercise Modal */}
        {showExerciseInput && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lg border border-gray-50"
            >
              <h3 className="text-base font-bold text-gray-800 mb-1">Log Workout Session</h3>
              <p className="text-xs text-gray-400 mb-4">Enter exercise type, duration, and calories burned.</p>
              <form onSubmit={handleLogExercise} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Workout Activity</label>
                  <input
                    type="text"
                    required
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                    placeholder="e.g. Yoga, Jogging, Cycling"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      required
                      value={exerciseDuration}
                      onChange={(e) => setExerciseDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                      placeholder="e.g. 45"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Burned (kcal)</label>
                    <input
                      type="number"
                      required
                      value={exerciseCalories}
                      onChange={(e) => setExerciseCalories(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                      placeholder="e.g. 320"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExerciseInput(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-gray-655"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={exerciseLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {exerciseLoading ? "Logging..." : "Log Workout"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Sleep Modal */}
        {showSleepInput && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lg border border-gray-50"
            >
              <h3 className="text-base font-bold text-gray-800 mb-1">Log Sleep Duration</h3>
              <p className="text-xs text-gray-400 mb-4">Enter rest hours and rate sleep quality.</p>
              <form onSubmit={handleLogSleep} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Hours Slept</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                    placeholder="e.g. 7.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Sleep Quality</label>
                  <select
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSleepInput(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-gray-650"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sleepLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sleepLoading ? "Logging..." : "Log Sleep"}
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
