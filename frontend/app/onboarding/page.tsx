'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { CustomSelect } from '../../components/ui/custom-select';
import { Check, ArrowRight, ArrowLeft, Footprints, Droplet, Moon, Utensils, DollarSign, Bell } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const getHeaders = () => {
  const token = localStorage.getItem('lifetrack_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Personal Info
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('175');
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState('male');

  // Step 2: Health Goals
  const [goal, setGoal] = useState('maintain');
  const [stepsTarget, setStepsTarget] = useState('10000');
  const [waterTarget, setWaterTarget] = useState('3000');
  const [sleepTarget, setSleepTarget] = useState('8.0');

  // Step 3: Budget Setup
  const [diet, setDiet] = useState('veg');
  const [preference, setPreference] = useState('balanced');
  const [allergy, setAllergy] = useState('none');
  const [budget, setBudget] = useState('150');

  // Step 4: Reminders Setup
  const [waterActive, setWaterActive] = useState(true);
  const [waterInterval, setWaterInterval] = useState('2');
  const [workoutActive, setWorkoutActive] = useState(true);
  const [sleepActive, setSleepActive] = useState(true);
  const [sleepTime, setSleepTime] = useState('22:30');
  const [mealActive, setMealActive] = useState(true);
  const [mealBreakfast, setMealBreakfast] = useState('08:00');
  const [mealLunch, setMealLunch] = useState('13:00');
  const [mealDinner, setMealDinner] = useState('20:00');
  const [walkActive, setWalkActive] = useState(false);
  const [walkInterval, setWalkInterval] = useState('60');

  // Auth gate check
  useEffect(() => {
    const token = localStorage.getItem('lifetrack_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleNext = () => {
    setError('');
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Submit Profile Data & Set isOnboarded = true
      const profileRes = await fetch(`${BACKEND_URL}/api/v1/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          gender,
          age: parseInt(age),
          weight: parseFloat(weight),
          height: parseFloat(height),
          goal,
          stepsTarget: parseInt(stepsTarget),
          waterTarget: parseInt(waterTarget),
          sleepTarget: parseFloat(sleepTarget),
          isOnboarded: true
        })
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.error || 'Failed to save profile onboarding details.');

      // 2. Submit Reminders Configuration
      const remindersRes = await fetch(`${BACKEND_URL}/api/v1/profile/reminders`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          waterActive,
          waterInterval: parseInt(waterInterval) * 60,
          waterTarget: parseInt(waterTarget),
          workoutActive,
          workoutDays: ['Monday', 'Wednesday', 'Friday'], // default split days
          sleepActive,
          sleepTime,
          mealActive,
          mealBreakfast,
          mealLunch,
          mealDinner,
          walkActive,
          walkInterval: parseInt(walkInterval)
        })
      });

      const remindersData = await remindersRes.json();
      if (!remindersRes.ok) throw new Error(remindersData.error || 'Failed to save reminder preferences.');

      // 3. Onboarding complete - Redirect to Dashboard
      router.push('/');
      router.refresh();

    } catch (err: any) {
      setError(err.message || 'Connection failure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-[500px] p-8 relative">
        
        {/* Onboarding progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-border/40 rounded-t-xl overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="mb-6 flex justify-between items-center text-xs text-text-secondary font-bold uppercase tracking-wider">
          <span>Profile Onboarding</span>
          <span className="text-primary">Step {step} of 4</span>
        </div>

        {error && (
          <div className="bg-accent-calories/10 border border-accent-calories/20 text-accent-calories rounded-xl p-3 text-xs mb-4 text-center">
            {error}
          </div>
        )}

        {/* STEP 1: Personal Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight">Personal Dimensions</h2>
              <p className="text-xs text-text-secondary mt-1">Let's calculate your BMI and BMR targets.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="weight">Weight (kg)</label>
                <input
                  id="weight"
                  type="number"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  placeholder="e.g. 70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="height">Height (cm)</label>
                <input
                  id="height"
                  type="number"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  placeholder="e.g. 175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="age">Age (Years)</label>
                <input
                  id="age"
                  type="number"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  placeholder="e.g. 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="gender">Gender</label>
                <CustomSelect
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' }
                  ]}
                  value={gender}
                  onChange={setGender}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Health Goal Setup */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight">Health Goals Setup</h2>
              <p className="text-xs text-text-secondary mt-1">Configure your daily intake and movement targets.</p>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="goal">Primary Health Goal</label>
              <CustomSelect
                options={[
                  { value: 'lose', label: 'Weight Loss (Caloric Deficit)' },
                  { value: 'maintain', label: 'Maintain Weight' },
                  { value: 'gain', label: 'Weight Gain (Caloric Surplus)' }
                ]}
                value={goal}
                onChange={setGoal}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="text-[10px] text-text-secondary font-semibold mb-1 flex items-center gap-1" htmlFor="steps-target">
                  <Footprints size={12} className="text-accent-steps" /> Steps Target
                </label>
                <input
                  id="steps-target"
                  type="number"
                  className="bg-background border border-border rounded-xl p-2 text-text-primary text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  value={stepsTarget}
                  onChange={(e) => setStepsTarget(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-text-secondary font-semibold mb-1 flex items-center gap-1" htmlFor="water-target">
                  <Droplet size={12} className="text-accent-water" /> Water (mL)
                </label>
                <input
                  id="water-target"
                  type="number"
                  className="bg-background border border-border rounded-xl p-2 text-text-primary text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  value={waterTarget}
                  onChange={(e) => setWaterTarget(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-text-secondary font-semibold mb-1 flex items-center gap-1" htmlFor="sleep-target">
                  <Moon size={12} className="text-accent-sleep" /> Sleep (hrs)
                </label>
                <input
                  id="sleep-target"
                  type="number"
                  step="0.5"
                  className="bg-background border border-border rounded-xl p-2 text-text-primary text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  value={sleepTarget}
                  onChange={(e) => setSleepTarget(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Budget Setup */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight font-heading">Diet & Grocery Budget</h2>
              <p className="text-xs text-text-secondary mt-1">Configure budget meal recommendation options.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="diet">Dietary Focus</label>
                <CustomSelect
                  options={[
                    { value: 'veg', label: 'Vegetarian' },
                    { value: 'nonveg', label: 'Non-Vegetarian' }
                  ]}
                  value={diet}
                  onChange={setDiet}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="pref">Gym Target</label>
                <CustomSelect
                  options={[
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'highprotein', label: 'High Protein' },
                    { value: 'lowcarb', label: 'Low Carb' }
                  ]}
                  value={preference}
                  onChange={setPreference}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="allergy">Allergies</label>
                <CustomSelect
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'nuts', label: 'Nut Free' },
                    { value: 'gluten', label: 'Gluten Free' },
                    { value: 'dairy', label: 'Lactose Free' }
                  ]}
                  value={allergy}
                  onChange={setAllergy}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1 flex items-center gap-1" htmlFor="budget">
                  <DollarSign size={12} className="text-accent-steps" /> Weekly Budget ($)
                </label>
                <input
                  id="budget"
                  type="number"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Reminder Setup */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight font-heading">Habits Reminder Setup</h2>
              <p className="text-xs text-text-secondary mt-1">Configure automated notifications settings.</p>
            </div>
            
            <div className="space-y-3">
              {/* Water Toggle */}
              <div className="flex justify-between items-center p-3 bg-background border border-border/80 rounded-xl">
                <div className="flex items-center gap-2">
                  <Droplet className="text-accent-water" size={16} />
                  <span className="text-xs font-semibold text-text-primary">Water Reminders (Every {waterInterval} hrs)</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={waterActive} 
                  onChange={(e) => setWaterActive(e.target.checked)}
                  className="cursor-pointer w-4 h-4 rounded-sm border-slate-300 text-primary focus:ring-primary/20" 
                />
              </div>

              {/* Sleep Toggle */}
              <div className="flex justify-between items-center p-3 bg-background border border-border/80 rounded-xl">
                <div className="flex items-center gap-2">
                  <Moon className="text-accent-sleep" size={16} />
                  <span className="text-xs font-semibold text-text-primary">Sleep Alert (Target {sleepTime})</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={sleepActive} 
                  onChange={(e) => setSleepActive(e.target.checked)}
                  className="cursor-pointer w-4 h-4 rounded-sm border-slate-300 text-primary focus:ring-primary/20" 
                />
              </div>

              {/* Meal Toggle */}
              <div className="flex justify-between items-center p-3 bg-background border border-border/80 rounded-xl">
                <div className="flex items-center gap-2">
                  <Utensils className="text-accent-calories" size={16} />
                  <span className="text-xs font-semibold text-text-primary">Meal Time Notifications</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={mealActive} 
                  onChange={(e) => setMealActive(e.target.checked)}
                  className="cursor-pointer w-4 h-4 rounded-sm border-slate-300 text-primary focus:ring-primary/20" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Buttons Controls */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-border/40">
          {step > 1 && (
            <Button variant="secondary" onClick={handleBack} className="flex-1 py-3" disabled={loading}>
              <ArrowLeft size={16} /> Back
            </Button>
          )}
          {step < 4 ? (
            <Button variant="primary" onClick={handleNext} className="flex-1 py-3">
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleComplete} className="flex-1 py-3" disabled={loading}>
              {loading ? 'Submitting details...' : 'Complete Profile'} <Check size={16} />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
