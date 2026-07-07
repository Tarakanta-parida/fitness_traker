'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Footprints, GlassWater, Dumbbell, Moon, Utensils, 
  Plus, Smile, Calendar
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { LoadingScreen } from '../../../components/ui/loading-screen';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const getHeaders = () => {
  const token = localStorage.getItem('lifetrack_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const fetchTodaySummary = async () => {
  const res = await fetch(`${BACKEND_URL}/api/v1/logs/today`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch today log');
  return res.json();
};

const fetchMealPlan = async () => {
  const res = await fetch(`${BACKEND_URL}/api/v1/meals`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch meal plan');
  const data = await res.json();
  return data.mealPlan;
};

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Queries
  const { data: todayData, isLoading } = useQuery({
    queryKey: ['todaySummary'],
    queryFn: fetchTodaySummary,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  const { data: mealPlanData } = useQuery({
    queryKey: ['mealPlan'],
    queryFn: fetchMealPlan,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    const nameStr = todayData?.profile?.name || 'Tarak';
    if (hour < 12) return `Good Morning, ${nameStr}`;
    if (hour < 18) return `Good Afternoon, ${nameStr}`;
    return `Good Evening, ${nameStr}`;
  };

  const stepsTargetNum = todayData?.profile?.stepsTarget || 10000;
  const currentStepsNum = todayData?.log?.steps || 0;
  const stepStreak = currentStepsNum >= stepsTargetNum ? 1 : 0;

  const getDailySplit = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const splits: any = {
      'Monday': { title: 'Chest Day', desc: 'Bench press, Incline dumbbell flies, Pushups' },
      'Tuesday': { title: 'Back Day', desc: 'Pullups, Barbell rows, Lat pulldowns' },
      'Wednesday': { title: 'Legs Day', desc: 'Squats, Lunges, Calf raises' },
      'Thursday': { title: 'Cardio Focus', desc: '30 min Running, Cycling or HIIT' },
      'Friday': { title: 'Shoulders Day', desc: 'Overhead press, Lateral raises, Shrugs' },
      'Saturday': { title: 'Core Split', desc: 'Planks, Leg raises, Russian twists' },
      'Sunday': { title: 'Active Rest Day', desc: 'Gentle yoga stretch or 45 min walk' }
    };
    return splits[currentDay] || { title: 'Rest Day', desc: 'Relax and recover' };
  };

  if (!mounted || isLoading) {
    return <LoadingScreen message="Loading health dashboard..." />;
  }

  return (
    <main className="flex-1 p-6 md:p-10 pb-[90px] md:pb-10 min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Here is your clean health overview report.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="hidden sm:inline-flex">
            <Calendar size={16} /> July 5, 2026
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Progress Ring Card */}
          <Card className="lg:col-span-4 p-6 flex flex-col items-center justify-center">
            <h3 className="font-bold text-sm mb-4 text-center text-text-primary">Daily Goal Progress</h3>
            
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle className="fill-none stroke-slate-100 stroke-[12]" cx="80" cy="80" r="70" />
                <circle 
                  className="fill-none stroke-[url(#grad)] stroke-[12] stroke-linecap-round transition-all duration-700" 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  strokeDasharray="440"
                  strokeDashoffset={440 - (440 * Math.min(100, Math.round(((currentStepsNum / stepsTargetNum) + ((todayData?.log?.water || 0) / (todayData?.profile?.waterTarget || 3000))) / 2 * 100))) / 100}
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-text-primary">
                  {Math.round(((currentStepsNum / stepsTargetNum) + ((todayData?.log?.water || 0) / (todayData?.profile?.waterTarget || 3000))) / 2 * 100)}%
                </span>
                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Goal</span>
              </div>
            </div>
            
            <p className="mt-6 text-xs text-text-secondary text-center max-w-[200px]">
              {Math.round(((currentStepsNum / stepsTargetNum) + ((todayData?.log?.water || 0) / (todayData?.profile?.waterTarget || 3000))) / 2 * 100) >= 100 
                ? "Amazing job! Goals completed! 🎉" 
                : "Keep up the momentum! You're making progress."}
            </p>
          </Card>

          {/* Summary Columns */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Steps Summary */}
            <Card className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-steps/10 text-accent-steps flex items-center justify-center"><Footprints size={24} /></div>
              <div className="flex-1">
                <span className="text-xs text-text-secondary uppercase font-bold">Steps</span>
                <h4 className="text-2xl font-extrabold text-text-primary">{currentStepsNum.toLocaleString()}</h4>
                <span className="text-[10px] text-text-secondary">Target: {stepsTargetNum.toLocaleString()}</span>
              </div>
            </Card>

            {/* Water Summary */}
            <Card className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-water/10 text-accent-water flex items-center justify-center"><GlassWater size={24} /></div>
              <div className="flex-1">
                <span className="text-xs text-text-secondary uppercase font-bold">Water</span>
                <h4 className="text-2xl font-extrabold text-text-primary">{(todayData?.log?.water || 0).toLocaleString()} mL</h4>
                <span className="text-[10px] text-text-secondary">Target: {(todayData?.profile?.waterTarget || 3000).toLocaleString()} mL</span>
              </div>
            </Card>

            {/* Calories Summary */}
            <Card className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-calories/10 text-accent-calories flex items-center justify-center"><Dumbbell size={24} /></div>
              <div className="flex-1">
                <span className="text-xs text-text-secondary uppercase font-bold">Calories</span>
                <h4 className="text-2xl font-extrabold text-text-primary">{((todayData?.log?.caloriesConsumed || 0) - (todayData?.log?.caloriesBurned || 0)).toLocaleString()} kcal</h4>
                <span className="text-[10px] text-text-secondary">
                  {todayData?.log?.caloriesConsumed || 0} In / {todayData?.log?.caloriesBurned || 0} Out
                </span>
              </div>
            </Card>

            {/* Sleep Summary */}
            <Card className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-sleep/10 text-accent-sleep flex items-center justify-center"><Moon size={24} /></div>
              <div className="flex-1">
                <span className="text-xs text-text-secondary uppercase font-bold">Sleep</span>
                <h4 className="text-2xl font-extrabold text-text-primary">{todayData?.log?.sleep || 0} hrs</h4>
                <span className="text-[10px] text-text-secondary">Target: {todayData?.profile?.sleepTarget || 8} hrs</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-4 text-text-primary">Today's Quick Streaks</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background border border-border/80 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs text-text-secondary font-bold block">Steps Streak</span>
                <span className="text-lg font-bold text-text-primary mt-1">{stepStreak} Days</span>
              </div>
              <Footprints className="text-accent-steps" size={24} />
            </div>
            <div className="p-4 bg-background border border-border/80 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs text-text-secondary font-bold block">Logs Activity</span>
                <span className="text-lg font-bold text-text-primary mt-1">1 Day</span>
              </div>
              <Smile className="text-accent-mood" size={24} />
            </div>
          </div>
        </Card>

        {/* Today's Meal & Today's Exercise */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Today's Meal */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Utensils size={18} className="text-primary" /> Today's Meal
              </h3>
              {mealPlanData ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs p-2 bg-background rounded-xl">
                    <span className="font-bold text-text-primary">Breakfast</span>
                    <span className="text-text-secondary">{mealPlanData.meals?.breakfast?.name || 'Oatmeal bowl'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-2 bg-background rounded-xl">
                    <span className="font-bold text-text-primary">Lunch</span>
                    <span className="text-text-secondary">{mealPlanData.meals?.lunch?.name || 'Brown Rice & Chicken'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs p-2 bg-background rounded-xl">
                    <span className="font-bold text-text-primary">Dinner</span>
                    <span className="text-text-secondary">{mealPlanData.meals?.dinner?.name || 'Chicken Stir Fry'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-secondary">No custom meal planner generated. Generate one in the Food tab.</p>
              )}
            </div>
            <Button variant="secondary" className="mt-4" onClick={() => router.push('/food')}>
              Configure Meal Planner
            </Button>
          </Card>

          {/* Today's Exercise */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Dumbbell size={18} className="text-accent-workout" /> Today's Exercise
              </h3>
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {todayData?.workouts?.length === 0 ? (
                  <div className="text-left text-xs text-text-secondary p-2 bg-background rounded-xl">
                    No exercises logged today yet. Today's target: <span className="font-bold text-primary">{getDailySplit().title}</span> ({getDailySplit().desc})
                  </div>
                ) : (
                  todayData?.workouts?.map((w: any) => (
                    <div key={w.id} className="p-2 bg-background rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-text-primary">{w.type}</span>
                        <span className="text-text-secondary ml-2">({w.duration} mins)</span>
                      </div>
                      <span className="font-bold text-accent-workout">+{w.calories} kcal</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <Button variant="primary" className="mt-4" onClick={() => router.push('/activity')}>
              Log Workout
            </Button>
          </Card>
        </div>

        {/* Weekly Progress Chart */}
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-4">Weekly Steps Progress</h3>
          <div className="h-[200px] flex items-end justify-around gap-4 pt-6">
            {[7200, 9400, 11000, 5200, 8300, 12200, currentStepsNum].map((val, idx) => {
              const stepsPercent = Math.min(100, (val / stepsTargetNum) * 100);
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div 
                    className="w-8 bg-primary/70 hover:bg-primary rounded-t-lg transition-all duration-300 relative"
                    style={{ height: `${stepsPercent}%` }}
                  >
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-border shadow-sm text-[9px] font-bold p-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 text-text-primary">
                      {val.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-secondary font-semibold mt-2">{days[idx]}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </main>
  );
}
