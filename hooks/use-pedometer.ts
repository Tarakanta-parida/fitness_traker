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
  engineState: string; // IDLE, MOVEMENT_DETECTED, CONFIRMED_WALKING, SHAKE, VEHICLE, etc.
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

  const [isTracking, setIsTracking] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load offline cached steps for today on mount to prevent count resetting on page reload
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
  }, []);

  // Sync offline caches immediately when internet connection returns
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      console.log("Device is online. Triggering IndexedDB server sync...");
      syncOfflineStepsWithServer();
    };

    window.addEventListener("online", handleOnline);
    // Trigger a sync check on mount
    handleOnline();

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Start / Stop Web Worker sensor loops
  useEffect(() => {
    if (!isTracking) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      setState(prev => ({ ...prev, isWalking: false, isRunning: false, engineState: "IDLE" }));
      return;
    }

    // 1. Initialize Web Worker from static public route
    const worker = new Worker("/sensor-worker.js");
    workerRef.current = worker;

    // 2. Handle verified steps and state changes returned by the worker
    worker.onmessage = async (e) => {
      const { type, count, isWalking, isRunning, frequency, state: engineState } = e.data;

      if (type === "STATE_CHANGE") {
        setState(prev => ({ ...prev, engineState }));
      } else if (type === "STEPS_DETECTED") {
        const stepDelta = count || 1;
        const distDelta = stepDelta * 0.000762; // ~0.76 meters average stride
        const kcalDelta = stepDelta * 0.04; // ~0.04 kcal per step average

        // Accumulate in memory state
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

        // 3. Cache the step delta to IndexedDB for offline protection
        await cacheStepsOffline(stepDelta, distDelta, kcalDelta, Math.round(stepDelta * 0.6));

        // 4. Try syncing to PostgreSQL if online
        if (navigator.onLine) {
          await syncOfflineStepsWithServer();
        }
      }
    };

    // 5. Connect motion listeners (DeviceMotion + Generic Sensor API for Android PWAs)
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

    // Fallback/Secondary sensor listener for Android Chrome / PWA standalone mode
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

    // Save tracking preference to localStorage
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

  // Request hardware sensor permission (required for iOS Safari)
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
    // Android or standard Desktop Chrome requires no explicit prompt
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
