/**
 * Web Worker for Motion Sensor Processing & Adaptive Step Detection Engine
 * 
 * Works at ALL sample rates (10Hz to 120Hz) on mobile devices (Android / iOS / Desktop).
 */

let lastStepTime = 0;
let isAboveThreshold = false;
let consecutiveSteps = 0;

// Dynamic Peak-Valley tracking
let peak = 9.81;
let valley = 9.81;
let smoothedMag = 9.81;
const SMOOTHING_FACTOR = 0.25;

const MIN_STEP_INTERVAL = 300;  // 300ms min step interval (allows running/walking)
const MAX_STEP_INTERVAL = 2000; // 2.0s max step interval before rhythm resets
const VERIFY_THRESHOLD = 3;     // Only 3 steps needed to confirm walking state

self.onmessage = function (e) {
  const { x, y, z, timestamp } = e.data;
  if (x === undefined || y === undefined || z === undefined) return;

  // 1. Calculate raw magnitude (3D acceleration vector length)
  const rawMag = Math.sqrt(x * x + y * y + z * z);

  // 2. Low-pass filter to smooth magnitude & remove high-frequency noise
  smoothedMag = smoothedMag * (1 - SMOOTHING_FACTOR) + rawMag * SMOOTHING_FACTOR;

  // 3. Track rolling peak and valley bounds
  if (smoothedMag > peak) peak = smoothedMag;
  if (smoothedMag < valley) valley = smoothedMag;

  // Decay peak and valley slightly toward gravity (9.81) for adaptive responsiveness
  peak -= 0.05;
  valley += 0.05;

  const dynamicThreshold = (peak + valley) / 2;
  const peakValleyDiff = peak - valley;

  // 4. Step detection trigger logic:
  // Requires peak-valley difference >= 1.2 m/s^2 (filters tiny hand tremors)
  if (!isAboveThreshold && smoothedMag > dynamicThreshold && peakValleyDiff >= 1.2) {
    const timeSinceLastStep = timestamp - lastStepTime;

    if (timeSinceLastStep >= MIN_STEP_INTERVAL) {
      isAboveThreshold = true;
      lastStepTime = timestamp;

      if (timeSinceLastStep > MAX_STEP_INTERVAL) {
        // Rhythm was broken; start new sequence from 1
        consecutiveSteps = 1;
        self.postMessage({ type: "STATE_CHANGE", state: "MOVEMENT_DETECTED" });
      } else {
        consecutiveSteps++;

        if (consecutiveSteps === VERIFY_THRESHOLD) {
          // Walking confirmed! Send accumulated initial steps
          self.postMessage({ type: "STATE_CHANGE", state: "CONFIRMED_WALKING" });
          self.postMessage({
            type: "STEPS_DETECTED",
            count: VERIFY_THRESHOLD,
            isWalking: true,
            isRunning: peakValleyDiff > 4.5,
            frequency: 1000 / timeSinceLastStep
          });
        } else if (consecutiveSteps > VERIFY_THRESHOLD) {
          // Continual walking: Send step immediately
          self.postMessage({ type: "STATE_CHANGE", state: "CONFIRMED_WALKING" });
          self.postMessage({
            type: "STEPS_DETECTED",
            count: 1,
            isWalking: true,
            isRunning: peakValleyDiff > 4.5,
            frequency: 1000 / timeSinceLastStep
          });
        }
      }
    }
  } else if (isAboveThreshold && smoothedMag < dynamicThreshold) {
    // Reset trigger state when signal drops below dynamic threshold
    isAboveThreshold = false;
  }
};
