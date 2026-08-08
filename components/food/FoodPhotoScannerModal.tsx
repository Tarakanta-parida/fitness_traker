"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  X, 
  Loader2, 
  Flame, 
  Award, 
  DollarSign, 
  Utensils,
  RefreshCw,
  Zap,
  Video,
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";
import confetti from "canvas-confetti";

interface FoodPhotoScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ScanResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  estimatedCost: number;
  mealType: string;
  confidence: number;
  description: string;
}

export default function FoodPhotoScannerModal({
  isOpen,
  onClose,
  onSuccess,
}: FoodPhotoScannerModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [logging, setLogging] = useState(false);
  
  // Live Camera Viewfinder States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-start live camera stream when modal opens
  useEffect(() => {
    if (isOpen) {
      startLiveCamera();
    } else {
      stopLiveCamera();
      resetState();
    }
  }, [isOpen]);

  // Start Live Camera Feed using WebRTC getUserMedia
  const startLiveCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    setIsCameraActive(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // Prefer rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera permission denied or camera unavailable. Try uploading a photo.");
      stopLiveCamera();

      // Trigger native mobile camera input fallback if WebRTC is blocked
      cameraInputRef.current?.click();
    } finally {
      setCameraLoading(false);
    }
  };

  // Stop Live Camera Tracks
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture Frame from Live Camera Viewfinder
  const captureLivePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Str = canvas.toDataURL("image/jpeg", 0.9);

    stopLiveCamera();
    setSelectedImage(base64Str);
    setFileName("instant_camera_snap.jpg");
    setResult(null);
    analyzePhoto(base64Str, "instant_camera_snap.jpg");
  };

  // Handle File Upload Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Str = reader.result as string;
      setSelectedImage(base64Str);
      setResult(null);
      analyzePhoto(base64Str, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Trigger AI Vision Photo Analysis
  const analyzePhoto = async (base64Image: string, name: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/food/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Image, fileName: name }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          setResult(json.result);
        }
      }
    } catch (err) {
      console.error("Failed to analyze photo:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Log Analyzed Calories to Daily Food Logs
  const handleConfirmLog = async () => {
    if (!result) return;
    setLogging(true);

    try {
      const res = await fetch("/api/food/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: result.mealType,
          foodName: result.foodName,
          calories: Number(result.calories),
          protein: Number(result.protein),
          price: Number(result.estimatedCost),
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 60,
          spread: 50,
          colors: ["#3b82f6", "#10b981", "#f59e0b"]
        });
        onSuccess();
        onClose();
        resetState();
      }
    } catch (err) {
      console.error("Failed to log meal:", err);
    } finally {
      setLogging(false);
    }
  };

  const resetState = () => {
    stopLiveCamera();
    setSelectedImage(null);
    setFileName("");
    setResult(null);
    setAnalyzing(false);
    setCameraError(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white relative overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  AI Food Photo Scanner
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                    Vision AI
                  </span>
                </h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Snap a photo with camera or upload image</p>
              </div>
            </div>
            <button
              onClick={() => { onClose(); resetState(); }}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {/* Fallback Native Camera Input */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* LIVE CAMERA VIEW-FINDER */}
          {isCameraActive ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-gray-200 dark:border-slate-800 h-64 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Camera Viewfinder Crosshair Target */}
                <div className="absolute inset-8 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400 absolute top-2 left-2" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400 absolute top-2 right-2" />
                  <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400 absolute bottom-2 left-2" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400 absolute bottom-2 right-2" />
                  <span className="text-[10px] text-white/80 bg-slate-900/80 px-2 py-0.5 rounded-full font-bold">
                    Align Dish Inside Frame
                  </span>
                </div>

                {cameraLoading && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="text-xs text-gray-300 font-bold">Opening Camera...</span>
                  </div>
                )}
              </div>

              {/* Camera Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={captureLivePhoto}
                  className="flex-[2] py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  📸 Take Food Snap
                </button>
              </div>
            </div>
          ) : !selectedImage ? (
            /* Upload / Camera Drop Zone Options */
            <div className="space-y-3 my-2">
              {cameraError && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-3xl p-6 text-center transition-all bg-gray-50/50 dark:bg-slate-800/40 group">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-900/50 group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-sm text-gray-800 dark:text-white">Scan Your Meal Photo</h4>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">
                  Instant camera snap or gallery upload. AI vision automatically calculates dish name, calories & protein.
                </p>

                {/* Instant Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Camera className="w-4 h-4 text-cyan-200 animate-pulse" />
                    Open Camera (Instant Snap)
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-blue-500" />
                    Upload from Gallery
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Photo Preview Card with Scanner Beam */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 max-h-56 bg-slate-950 group">
                <img
                  src={selectedImage}
                  alt="Food dish"
                  className="w-full h-56 object-cover"
                />
                
                {/* Laser Scanning Beam Animation while Analyzing */}
                {analyzing && (
                  <motion.div
                    initial={{ top: "0%" }}
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-20"
                  />
                )}

                {/* Overlaid status badge */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                  {analyzing ? (
                    <>
                      <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                      Analyzing Calories with AI...
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Scan Complete
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={resetState}
                  className="absolute bottom-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white rounded-xl text-[10px] font-bold border border-white/10 flex items-center gap-1 transition-all"
                >
                  <RefreshCw className="w-3 h-3" /> Change Photo
                </button>
              </div>

              {/* AI Analysis Result Display */}
              {analyzing ? (
                <div className="py-6 text-center space-y-2">
                  <Sparkles className="w-6 h-6 text-blue-500 animate-bounce mx-auto" />
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Vision AI Estimating Macronutrients</h4>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">Detecting portion sizes, calorie density, and protein ratio...</p>
                </div>
              ) : result ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50/80 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">AI Identified Dish</span>
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">{result.foodName}</h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-snug mt-0.5">{result.description}</p>
                    </div>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1 flex-shrink-0">
                      <Zap className="w-2.5 h-2.5" />
                      {result.confidence}% Match
                    </span>
                  </div>

                  {/* Macronutrient Grid */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-2 text-center">
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold block uppercase">Calories</span>
                      <span className="text-xs font-black text-orange-500 block mt-0.5">{result.calories} kcal</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-2 text-center">
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold block uppercase">Protein</span>
                      <span className="text-xs font-black text-blue-500 block mt-0.5">{result.protein}g</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-2 text-center">
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold block uppercase">Carbs</span>
                      <span className="text-xs font-black text-emerald-500 block mt-0.5">{result.carbs}g</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-2 text-center">
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold block uppercase">Est. Cost</span>
                      <span className="text-xs font-black text-gray-800 dark:text-gray-200 block mt-0.5">₹{result.estimatedCost}</span>
                    </div>
                  </div>

                  {/* Meal Category Selection */}
                  <div className="pt-2 flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Meal Category:</label>
                    <select
                      value={result.mealType}
                      onChange={(e) => setResult({ ...result, mealType: e.target.value })}
                      className="px-2.5 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold"
                    >
                      <option value="BREAKFAST">Breakfast</option>
                      <option value="LUNCH">Lunch</option>
                      <option value="DINNER">Dinner</option>
                      <option value="SNACKS">Snacks</option>
                    </select>
                  </div>
                </motion.div>
              ) : null}

              {/* Action Buttons */}
              {result && (
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { onClose(); resetState(); }}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={logging}
                    onClick={handleConfirmLog}
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-bold hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {logging ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Logging Calories...
                      </>
                    ) : (
                      <>
                        Log {result.calories} kcal to Food Goal
                        <Check className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
