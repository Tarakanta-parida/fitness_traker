/**
 * Web Worker for Motion Sensor Processing & Step Detection Engine
 * 
 * Runs signal processing (Gravity Removal, Low-Pass filter, 32-point FFT,
 * Walking State Machine, and Pocket/Shake/Vehicle detection) off the main thread.
 */

// Buffers for raw and processed samples
const BUFFER_SIZE = 32; // 32 samples at ~20Hz = ~1.6 seconds window
let rawX = new Float32Array(BUFFER_SIZE);
let rawY = new Float32Array(BUFFER_SIZE);
let rawZ = new Float32Array(BUFFER_SIZE);
let magnitudes = new Float32Array(BUFFER_SIZE).fill(9.81);
let bufferIdx = 0;
let samplesCount = 0;

// Gravity estimation baseline vectors
let gravityX = 0;
let gravityY = 9.81;
let gravityZ = 0;
const GRAVITY_BETA = 0.02; // slow IIR filter rate for gravity tracking

// Low-pass filter smoothing states
let smoothedX = 0;
let smoothedY = 0;
let smoothedZ = 0;
const SMOOTHING_ALPHA = 0.22; // low-pass filter rate to remove sensor tremors

// Walking state variables
let lastStepTime = 0;
let isAboveThreshold = false;
let consecutiveRhythmicSteps = 0;
let walkingState = "IDLE"; // IDLE, MOVEMENT_DETECTED, CONFIRMED_WALKING

// Configuration constants
const MIN_STEP_INTERVAL = 380; // ~158 steps/min max (allows walk/jog)
const MAX_STEP_INTERVAL = 1500; // 1.5s max between steps (rhythm timeout)
const WALK_VERIFY_THRESHOLD = 6; // Requires 6 consecutive steps to verify walk state
const VERTICAL_STEP_MIN_DELTA = 0.85; // Min force peak delta above gravity
const SHAKE_VIOLENT_THRESHOLD = 4.8; // Reject vertical forces above 4.8 m/s^2 as shakes
const TABLE_VIB_MIN_FREQ = 8; // Table vibrations > 8Hz

// Complex number class for FFT calculation
class ComplexArray {
  constructor(size) {
    this.real = new Float32Array(size);
    this.imag = new Float32Array(size);
  }
}

// 32-Point Radix-2 Decimation-in-Time FFT
function computeFFT(inputReal) {
  const n = inputReal.length;
  const fft = new ComplexArray(n);
  
  // Copy input and bit-reverse ordering
  for (let i = 0; i < n; i++) {
    let rev = 0;
    let temp = i;
    for (let j = 0; j < 5; j++) { // log2(32) = 5
      rev = (rev << 1) | (temp & 1);
      temp >>= 1;
    }
    fft.real[rev] = inputReal[i];
    fft.imag[rev] = 0;
  }
  
  // FFT Radix-2 loop
  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2;
    const tabStep = n / size;
    for (let i = 0; i < n; i += size) {
      for (let j = i, k = 0; j < i + halfSize; j++, k += tabStep) {
        // Twiddle factor: W_n^k = exp(-2*pi*i*k/n)
        const angle = (-2 * Math.PI * k) / n;
        const wr = Math.cos(angle);
        const wi = Math.sin(angle);
        
        const tr = fft.real[j + halfSize] * wr - fft.imag[j + halfSize] * wi;
        const ti = fft.real[j + halfSize] * wi + fft.imag[j + halfSize] * wr;
        
        fft.real[j + halfSize] = fft.real[j] - tr;
        fft.imag[j + halfSize] = fft.imag[j] - ti;
        
        fft.real[j] += tr;
        fft.imag[j] += ti;
      }
    }
  }
  
  // Compute power spectrum magnitude
  const spectrum = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    spectrum[i] = Math.sqrt(fft.real[i] * fft.real[i] + fft.imag[i] * fft.imag[i]);
  }
  return spectrum;
}

// Pocket and environment detection using signal variance
function analyzeMovementType(magHistory) {
  let mean = 0;
  for (let i = 0; i < magHistory.length; i++) {
    mean += magHistory[i];
  }
  mean /= magHistory.length;

  let variance = 0;
  for (let i = 0; i < magHistory.length; i++) {
    variance += (magHistory[i] - mean) ** 2;
  }
  variance /= magHistory.length;

  // High variance indicates violent shake
  if (variance > 15.0) {
    return "SHAKE";
  }
  // Extremely low variance indicates standing still or stable vehicle speed
  if (variance < 0.02) {
    return "IDLE_OR_VEHICLE";
  }

  return "WALK_RUN_CANDIDATE";
}

// Main sensor data input handler
self.onmessage = function (e) {
  const { x, y, z, timestamp } = e.data;

  // 1. Slow-adapt the direction of gravity baseline
  gravityX = gravityX * (1 - GRAVITY_BETA) + x * GRAVITY_BETA;
  gravityY = gravityY * (1 - GRAVITY_BETA) + y * GRAVITY_BETA;
  gravityZ = gravityZ * (1 - GRAVITY_BETA) + z * GRAVITY_BETA;

  const gravMag = Math.sqrt(gravityX * gravityX + gravityY * gravityY + gravityZ * gravityZ) || 9.81;

  // 2. Normalize gravity vector components
  const uX = gravityX / gravMag;
  const uY = gravityY / gravMag;
  const uZ = gravityZ / gravMag;

  // 3. Apply low-pass smoothing filter to raw inputs
  smoothedX = smoothedX * (1 - SMOOTHING_ALPHA) + x * SMOOTHING_ALPHA;
  smoothedY = smoothedY * (1 - SMOOTHING_ALPHA) + y * SMOOTHING_ALPHA;
  smoothedZ = smoothedZ * (1 - SMOOTHING_ALPHA) + z * SMOOTHING_ALPHA;

  // 4. Dot-Product Projection: Project the current acceleration vector onto the Earth gravity vector
  // Isolates the true vertical acceleration component (up/down relative to Earth), ignoring horizontal shakes!
  const verticalAcceleration = smoothedX * uX + smoothedY * uY + smoothedZ * uZ;

  // Save current values into sliding window buffers
  rawX[bufferIdx] = x;
  rawY[bufferIdx] = y;
  rawZ[bufferIdx] = z;
  magnitudes[bufferIdx] = Math.sqrt(x * x + y * y + z * z);
  bufferIdx = (bufferIdx + 1) % BUFFER_SIZE;
  samplesCount++;

  // Warm-up phase check
  if (samplesCount < BUFFER_SIZE) {
    return;
  }

  // Analyze sliding buffer metrics once it's full
  const motionClass = analyzeMovementType(magnitudes);

  if (motionClass === "SHAKE") {
    // Shaking is occurring. Reset verified walking sequence immediately and ignore steps.
    consecutiveRhythmicSteps = 0;
    walkingState = "IDLE";
    isAboveThreshold = false;
    self.postMessage({ type: "STATE_CHANGE", state: "SHAKE" });
    return;
  }

  if (motionClass === "IDLE_OR_VEHICLE") {
    // Constant speed or no movement at all.
    consecutiveRhythmicSteps = 0;
    walkingState = "IDLE";
    isAboveThreshold = false;
    self.postMessage({ type: "STATE_CHANGE", state: "IDLE" });
    return;
  }

  // 5. Run FFT to check gait frequency (run FFT on the last 32 magnitudes)
  const powerSpectrum = computeFFT(magnitudes);
  
  // Find dominant frequency peak index (excluding DC offset bin 0)
  let maxSpectrumVal = 0;
  let dominantBin = 1;
  for (let i = 1; i < powerSpectrum.length; i++) {
    if (powerSpectrum[i] > maxSpectrumVal) {
      maxSpectrumVal = powerSpectrum[i];
      dominantBin = i;
    }
  }

  // Frequency mapping: Sample rate is ~20Hz, FFT size 32.
  // frequencyPerBin = 20 / 32 = 0.625 Hz.
  const dominantFrequency = dominantBin * 0.625;

  // Ignore signals outside normal walking/running cadences (0.8Hz to 4.5Hz)
  if (dominantFrequency < 0.8 || dominantFrequency > 4.5) {
    if (dominantFrequency >= TABLE_VIB_MIN_FREQ) {
      self.postMessage({ type: "STATE_CHANGE", state: "TABLE_VIBRATION" });
    }
    consecutiveRhythmicSteps = 0;
    walkingState = "IDLE";
    return;
  }

  // 6. Step detection algorithm on the isolated vertical acceleration
  const stepUpperThreshold = gravMag + VERTICAL_STEP_MIN_DELTA;
  const stepLowerThreshold = gravMag - 0.45;

  // Reject step candidates that are too violent (e.g. throwing/hitting the phone)
  const maxWalkingVertical = gravMag + SHAKE_VIOLENT_THRESHOLD;

  if (!isAboveThreshold && verticalAcceleration > stepUpperThreshold && verticalAcceleration < maxWalkingVertical) {
    const timeSinceLastStep = timestamp - lastStepTime;

    if (timeSinceLastStep > MIN_STEP_INTERVAL) {
      isAboveThreshold = true;
      lastStepTime = timestamp;

      // Validate cadence rhythm
      if (timeSinceLastStep > MAX_STEP_INTERVAL) {
        // Rhythm was broken or first step. Start a new verification sequence.
        consecutiveRhythmicSteps = 1;
        walkingState = "MOVEMENT_DETECTED";
        self.postMessage({ type: "STATE_CHANGE", state: "MOVEMENT_DETECTED" });
      } else {
        // Rhythmic step candidate detected!
        consecutiveRhythmicSteps++;

        // State Transition: CONFIRMED_WALKING
        if (consecutiveRhythmicSteps === WALK_VERIFY_THRESHOLD) {
          walkingState = "CONFIRMED_WALKING";
          self.postMessage({ type: "STATE_CHANGE", state: "CONFIRMED_WALKING" });
          
          // Commit all verified steps accumulated during confirmation phase
          self.postMessage({
            type: "STEPS_DETECTED",
            count: WALK_VERIFY_THRESHOLD,
            isWalking: true,
            isRunning: dominantFrequency > 2.5,
            frequency: dominantFrequency
          });
        } else if (consecutiveRhythmicSteps > WALK_VERIFY_THRESHOLD) {
          // Actively walking: Commit step immediately
          self.postMessage({
            type: "STEPS_DETECTED",
            count: 1,
            isWalking: true,
            isRunning: dominantFrequency > 2.5,
            frequency: dominantFrequency
          });
        }
      }
    }
  } else if (isAboveThreshold && verticalAcceleration < stepLowerThreshold) {
    // Foot strike recovery phase completed: reset trigger
    isAboveThreshold = false;
  }
};
