"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  ChevronRight, 
  ChevronLeft, 
  Target, 
  DollarSign, 
  Bell, 
  Check, 
  Loader2,
  Activity,
  Droplet
} from "lucide-react";

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [age, setAge] = useState("28");
  const [gender, setGender] = useState("male");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("70");
  const [goal, setGoal] = useState("WEIGHT_LOSS"); // WEIGHT_LOSS, FITNESS, MUSCLE_GAIN
  const [stepsTarget, setStepsTarget] = useState("10000");
  const [sleepTarget, setSleepTarget] = useState("8");
  const [budget, setBudget] = useState("150");
  const [dietPref, setDietPref] = useState("non-veg");

  // Reminders State
  const [waterInterval, setWaterInterval] = useState("2"); // Every 2 hours
  const [workoutReminder, setWorkoutReminder] = useState("08:00");
  const [waterEnabled, setWaterEnabled] = useState(true);
  const [workoutEnabled, setWorkoutEnabled] = useState(true);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    // Prepare reminders list
    const reminders = [];
    if (waterEnabled) {
      reminders.push({
        type: "WATER",
        time: "08:00", // Start daily reminders at 8AM
        repeat: `interval_${waterInterval}h`,
        enabled: true
      });
    }
    if (workoutEnabled) {
      reminders.push({
        type: "WORKOUT",
        time: workoutReminder,
        repeat: "daily",
        enabled: true
      });
    }

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age,
          gender,
          height,
          weight,
          goal,
          budget,
          stepsTarget,
          sleepTarget,
          reminders
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshUser();
        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to save profile settings");
        setLoading(false);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Personal Info", icon: User },
    { num: 2, label: "Health Goals", icon: Target },
    { num: 3, label: "Budget & Diet", icon: DollarSign },
    { num: 4, label: "Reminders", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50/30 via-white to-green-50/30 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl w-full mx-auto">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex justify-between items-center px-2 mb-4">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Onboarding Flow</span>
            <span className="text-xs text-gray-400 font-medium">Step {step} of 4</span>
          </div>
          <div className="flex gap-2">
            {stepsList.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="flex-1 flex flex-col gap-2">
                  <div className={`h-1.5 rounded-full transition-colors duration-300 ${
                    s.num <= step ? "bg-blue-600" : "bg-gray-100"
                  }`} />
                  <div className="hidden sm:flex items-center gap-1.5 px-1">
                    <Icon className={`w-3.5 h-3.5 ${
                      s.num <= step ? "text-blue-600" : "text-gray-400"
                    }`} />
                    <span className={`text-[10px] font-semibold ${
                      s.num <= step ? "text-gray-800" : "text-gray-450"
                    }`}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
          {error && (
            <div className="bg-red-50/10 border border-red-200/50 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium mb-6">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Tell us about yourself</h3>
                  <p className="text-xs text-gray-500 mt-1">We use these metrics to calculate BMI and calibrate goals.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-inner text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      placeholder="e.g. 28"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-inner text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      placeholder="e.g. 175"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-inner text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      placeholder="e.g. 70"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">What is your primary goal?</h3>
                  <p className="text-xs text-gray-500 mt-1">Select a program that matches your focus.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { val: "WEIGHT_LOSS", title: "Weight Loss", desc: "Burn fat, trim calories, and log water intake." },
                    { val: "FITNESS", title: "Maintain Fitness", desc: "Build consistent healthy habit loops." },
                    { val: "MUSCLE_GAIN", title: "Muscle Gain", desc: "High protein meal plans and strength targets." }
                  ].map((g) => (
                    <div
                      key={g.val}
                      onClick={() => setGoal(g.val)}
                      className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                        goal === g.val 
                          ? "border-blue-500 bg-blue-50/20" 
                          : "border-gray-150 hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-sm text-gray-800">{g.title}</span>
                        <p className="text-[11px] text-gray-500 mt-0.5">{g.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        goal === g.val ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300"
                      }`}>
                        {goal === g.val && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Daily Steps Target</label>
                    <input
                      type="number"
                      value={stepsTarget}
                      onChange={(e) => setStepsTarget(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-inner text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Sleep Target (Hours)</label>
                    <input
                      type="number"
                      value={sleepTarget}
                      onChange={(e) => setSleepTarget(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-inner text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Nutrition & Budget</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure your weekly food budget and preferences.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Weekly Food Budget ($)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-inner text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Estimates budget meal recipes and grocery calculations.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Dietary Preference</label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {[
                      { val: "veg", title: "Vegetarian" },
                      { val: "non-veg", title: "Non-Veg" }
                    ].map((d) => (
                      <div
                        key={d.val}
                        onClick={() => setDietPref(d.val)}
                        className={`p-4 border rounded-2xl text-center cursor-pointer transition-all ${
                          dietPref === d.val 
                            ? "border-green-500 bg-green-50/20 font-semibold text-green-700" 
                            : "border-gray-150 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-sm">{d.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Configure Reminders</h3>
                  <p className="text-xs text-gray-500 mt-1">Set intervals for daily healthy notifications.</p>
                </div>

                <div className="space-y-4">
                  {/* Water Reminder */}
                  <div className="p-4 border border-gray-100 bg-gray-50/30 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Droplet className="w-5 h-5 text-blue-550" />
                        <div>
                          <span className="font-semibold text-sm text-gray-800">Water Reminder</span>
                          <p className="text-[10px] text-gray-400">Interval reminders to drink water.</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={waterEnabled}
                        onChange={(e) => setWaterEnabled(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    {waterEnabled && (
                      <div className="flex items-center gap-3 mt-1 pl-7">
                        <span className="text-xs text-gray-500">Remind me every</span>
                        <select
                          value={waterInterval}
                          onChange={(e) => setWaterInterval(e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="1">1 Hour</option>
                          <option value="2">2 Hours</option>
                          <option value="3">3 Hours</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Workout Reminder */}
                  <div className="p-4 border border-gray-100 bg-gray-50/30 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Activity className="w-5 h-5 text-green-550" />
                        <div>
                          <span className="font-semibold text-sm text-gray-800">Workout Reminder</span>
                          <p className="text-[10px] text-gray-400">Daily alert to complete exercises.</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={workoutEnabled}
                        onChange={(e) => setWorkoutEnabled(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    {workoutEnabled && (
                      <div className="flex items-center gap-3 mt-1 pl-7">
                        <span className="text-xs text-gray-500">Alert time:</span>
                        <input
                          type="time"
                          value={workoutReminder}
                          onChange={(e) => setWorkoutReminder(e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between gap-4 border-t border-gray-50 pt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-1 px-5 py-3 border border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 text-gray-600 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-sm font-semibold rounded-xl text-white transition-all shadow-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-sm font-semibold rounded-xl text-white transition-all shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing setup...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
