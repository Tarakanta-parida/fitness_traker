"use client";

import { useState, useEffect, useRef } from "react";
import { cacheStepsOffline, syncOfflineStepsWithServer, getLocalStepsForDate } from "@/lib/db-sync";

export interface PedometerState {
  steps: number;
  distance: number;
  caloriesBurned: number;
  isWalking: boolean;
  isRunning: boolean;
  cadence: number;
  engineState: string;
}

export function usePedometer(initialSteps = 0, initialDistance = 0, initialCalories = 0) {
  const [state, setState] = useState<PedometerState>({
    steps: initialSteps,
    distance: initialDistance,
    caloriesBurned: initialCalories,
    isWalking: false,
    isRunning: false,
    cadence: 0,
    engineState: "IDLE"
  });

  const [isTracking, setIsTracking] = useState(true); // Default enabled for automatic background step tracking
  const workerRef = useRef<Worker | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 1. Load offline cached steps for today on mount & register Background Sync
  useEffect(() => {
    async function loadTodayCache() {
      const todayStr = new Date().toLocaleDateString("sv-SE");
      const cached = await getLocalStepsForDate(todayStr);
      if (cached && cached.steps > 0) {
        setState(prev => ({
          ...prev,
          steps: Math.max(prev.steps, cached.steps),
          distance: Math.max(prev.distance, cached.distance),
          caloriesBurned: Math.max(prev.caloriesBurned, cached.calories)
        }));
      }
    }
    loadTodayCache();

    // Register PWA Background Sync and Periodic Sync if Service Worker is active
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (registration: any) => {
        try {
          if ("sync" in registration) {
            await registration.sync.register("sync-steps-data");
          }
          if ("periodicSync" in registration) {
            await registration.periodicSync.register("background-step-sync", {
              minInterval: 15 * 60 * 1000 // Every 15 minutes
            });
          }
        } catch (err) {
          console.log("PWA Background Sync registration status:", err);
        }
      });

      // Listen for background sync triggers sent from Service Worker
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "SYNC_OFFLINE_STEPS") {
          syncOfflineStepsWithServer();
        }
      };
      navigator.serviceWorker.addEventListener("message", handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handleSwMessage);
      };
    }
  }, []);

  // 2. Sync offline caches when connection returns OR when user switches back to tab/app
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSync = () => {
      syncOfflineStepsWithServer();
      const todayStr = new Date().toLocaleDateString("sv-SE");
      getLocalStepsForDate(todayStr).then(cached => {
        if (cached && cached.steps > 0) {
          setState(prev => ({
            ...prev,
            steps: Math.max(prev.steps, cached.steps),
            distance: Math.max(prev.distance, cached.distance),
            caloriesBurned: Math.max(prev.caloriesBurned, cached.calories)
          }));
        }
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleSync();
      }
    };

    window.addEventListener("online", handleSync);
    window.addEventListener("focus", handleSync);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    handleSync();

    return () => {
      window.removeEventListener("online", handleSync);
      window.removeEventListener("focus", handleSync);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 3. Start / Stop Web Worker sensor loops
  useEffect(() => {
    if (!isTracking) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      setState(prev => ({ ...prev, isWalking: false, isRunning: false, engineState: "IDLE" }));
      return;
    }

    const worker = new Worker("/sensor-worker.js");
    workerRef.current = worker;

    worker.onmessage = async (e) => {
      const { type, count, isWalking, isRunning, frequency, state: engineState } = e.data;

      if (type === "STATE_CHANGE") {
        setState(prev => ({ ...prev, engineState }));
      } else if (type === "STEPS_DETECTED") {
        const stepDelta = count || 1;
        const distDelta = stepDelta * 0.000762;
        const kcalDelta = stepDelta * 0.04;

        setState(prev => {
          const nextSteps = prev.steps + stepDelta;
          return {
            ...prev,
            steps: nextSteps,
            distance: parseFloat((prev.distance + distDelta).toFixed(4)),
            caloriesBurned: parseFloat((prev.caloriesBurned + kcalDelta).toFixed(2)),
            isWalking: isWalking || false,
            isRunning: isRunning || false,
            cadence: parseFloat(frequency.toFixed(2)) || 0
          };
        });

        await cacheStepsOffline(stepDelta, distDelta, kcalDelta, Math.round(stepDelta * 0.6));

        if (navigator.onLine) {
          await syncOfflineStepsWithServer();
        }
      }
    };

    let sensorObj: any = null;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity || event.acceleration;
      if (!accel || !workerRef.current) return;

      const x = accel.x || 0;
      const y = accel.y || 0;
      const z = accel.z || 0;

      workerRef.current.postMessage({
        x,
        y,
        z,
        timestamp: Date.now()
      });
    };

    window.addEventListener("devicemotion", handleDeviceMotion);

    if (typeof window !== "undefined" && "LinearAccelerationSensor" in window) {
      try {
        sensorObj = new (window as any).LinearAccelerationSensor({ frequency: 20 });
        sensorObj.addEventListener("reading", () => {
          if (workerRef.current && sensorObj) {
            workerRef.current.postMessage({
              x: sensorObj.x || 0,
              y: (sensorObj.y || 0) + 9.81,
              z: sensorObj.z || 0,
              timestamp: Date.now()
            });
          }
        });
        sensorObj.start();
      } catch (err) {
        console.log("Generic sensor fallback inactive:", err);
      }
    }

    localStorage.setItem("step_tracking_enabled", "true");

    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion);
      if (sensorObj) {
        try { sensorObj.stop(); } catch (e) {}
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [isTracking]);

  const requestPermission = async (): Promise<boolean> => {
    const DeviceMotionEventClass = (window as any).DeviceMotionEvent;
    if (
      DeviceMotionEventClass &&
      typeof DeviceMotionEventClass.requestPermission === "function"
    ) {
      try {
        const state = await DeviceMotionEventClass.requestPermission();
        if (state === "granted") {
          setIsTracking(true);
          return true;
        }
      } catch (err) {
        console.error("iOS sensor permission error:", err);
      }
      return false;
    }
    setIsTracking(true);
    return true;
  };

  const startTracking = () => requestPermission();
  const stopTracking = () => {
    setIsTracking(false);
    localStorage.setItem("step_tracking_enabled", "false");
  };

  return {
    ...state,
    isTracking,
    startTracking,
    stopTracking,
    toggleTracking: () => (isTracking ? stopTracking() : startTracking())
  };
}
