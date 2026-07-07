'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GlassWater, Moon, Utensils, Save
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { LoadingScreen } from '../../../components/ui/loading-screen';
import { CustomSelect } from '../../../components/ui/custom-select';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const getHeaders = () => {
  const token = localStorage.getItem('lifetrack_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const fetchReminders = async () => {
  const res = await fetch(`${BACKEND_URL}/api/v1/profile/reminders`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch reminders');
  const data = await res.json();
  return data.reminders;
};

export default function RemindersPage() {
  const queryClient = useQueryClient();

  // Switch states
  const [waterActive, setWaterActive] = useState(true);
  const [waterInterval, setWaterInterval] = useState('2');
  const [waterTarget, setWaterTarget] = useState('3000');
  const [workoutActive, setWorkoutActive] = useState(true);
  const [sleepActive, setSleepActive] = useState(true);
  const [sleepTime, setSleepTime] = useState('22:30');
  const [mealActive, setMealActive] = useState(true);
  const [mealBreakfast, setMealBreakfast] = useState('08:00');
  const [mealLunch, setMealLunch] = useState('13:00');
  const [mealDinner, setMealDinner] = useState('20:00');
  const [walkActive, setWalkActive] = useState(false);
  const [walkInterval, setWalkInterval] = useState('60');

  // Queries
  const { data: remindersData, isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: fetchReminders,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  useEffect(() => {
    if (remindersData) {
      setWaterActive(remindersData.water_active);
      setWaterInterval((remindersData.water_interval / 60).toString() || '2');
      setWaterTarget(remindersData.water_target.toString() || '3000');
      setWorkoutActive(remindersData.workout_active);
      setSleepActive(remindersData.sleep_active);
      setSleepTime(remindersData.sleep_time?.substring(0, 5) || '22:30');
      setMealActive(remindersData.meal_active);
      setMealBreakfast(remindersData.meal_breakfast?.substring(0, 5) || '08:00');
      setMealLunch(remindersData.meal_lunch?.substring(0, 5) || '13:00');
      setMealDinner(remindersData.meal_dinner?.substring(0, 5) || '20:00');
      setWalkActive(remindersData.walk_active);
      setWalkInterval(remindersData.walk_interval.toString() || '60');
    }
  }, [remindersData]);

  // Mutations
  const saveRemindersMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/reminders`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });

  const handleSaveRemindersSubmit = () => {
    saveRemindersMutation.mutate({
      waterActive,
      waterInterval: parseInt(waterInterval) * 60,
      waterTarget: parseInt(waterTarget),
      workoutActive,
      sleepActive,
      sleepTime,
      mealActive,
      mealBreakfast,
      mealLunch,
      mealDinner,
      walkActive,
      walkInterval: parseInt(walkInterval)
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading reminders settings..." />;
  }

  return (
    <main className="flex-1 p-6 md:p-10 pb-[90px] md:pb-10 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-8 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Habit Reminders
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Set custom timers and notification schedules.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Water reminder */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <GlassWater className="text-accent-water" />
                  <div>
                    <h4 className="font-bold text-sm text-text-primary">Water Intake</h4>
                    <p className="text-[10px] text-text-secondary">Track hydration alerts</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={waterActive} 
                  onChange={(e) => setWaterActive(e.target.checked)}
                  className="cursor-pointer w-4 h-4 rounded-sm border-slate-300 text-primary" 
                />
              </div>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <label className="text-[10px] text-text-secondary mb-1">Alert Interval (Hours)</label>
                  <CustomSelect
                    options={[
                      { value: '1', label: 'Every 1 Hour' },
                      { value: '2', label: 'Every 2 Hours' },
                      { value: '3', label: 'Every 3 Hours' }
                    ]}
                    value={waterInterval}
                    onChange={setWaterInterval}
                    size="sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-text-secondary mb-1">Daily Target (mL)</label>
                  <input
                    type="number"
                    className="bg-background border border-border rounded-xl p-2 text-text-primary text-xs focus:outline-none focus:border-primary"
                    value={waterTarget}
                    onChange={(e) => setWaterTarget(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Bedtime reminder */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-2">
                <Moon className="text-accent-sleep" />
                <div>
                  <h4 className="font-bold text-sm text-text-primary">Bedtime Wind-down</h4>
                  <p className="text-[10px] text-text-secondary">Protect sleep timing</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={sleepActive} 
                onChange={(e) => setSleepActive(e.target.checked)}
                className="cursor-pointer w-4 h-4 rounded-sm border-slate-300 text-primary" 
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] text-text-secondary mb-1">Bedtime target clock</label>
              <input
                type="time"
                className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-text-secondary mt-4">
              Alerts prompt 30 minutes before sleep target to start winding down.
            </p>
          </Card>

          {/* Meal alarms */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-2">
                <Utensils className="text-accent-calories" size={20} />
                <div>
                  <h4 className="font-bold text-sm text-text-primary">Meal Alerts</h4>
                  <p className="text-[10px] text-text-secondary">Consistent nourishment intervals</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={mealActive} 
                onChange={(e) => setMealActive(e.target.checked)}
                className="cursor-pointer w-4 h-4 rounded-sm border-slate-300 text-primary" 
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col">
                <label className="text-[9px] text-text-secondary mb-1">Breakfast</label>
                <input
                  type="time"
                  className="bg-background border border-border rounded-xl p-1.5 text-text-primary text-[10px] focus:outline-none focus:border-primary"
                  value={mealBreakfast}
                  onChange={(e) => setMealBreakfast(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[9px] text-text-secondary mb-1">Lunch</label>
                <input
                  type="time"
                  className="bg-background border border-border rounded-xl p-1.5 text-text-primary text-[10px] focus:outline-none focus:border-primary"
                  value={mealLunch}
                  onChange={(e) => setMealLunch(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[9px] text-text-secondary mb-1">Dinner</label>
                <input
                  type="time"
                  className="bg-background border border-border rounded-xl p-1.5 text-text-primary text-[10px] focus:outline-none focus:border-primary"
                  value={mealDinner}
                  onChange={(e) => setMealDinner(e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="text-right">
          <Button variant="primary" onClick={handleSaveRemindersSubmit} disabled={saveRemindersMutation.isPending}>
            <Save size={16} /> Save Reminder Configurations
          </Button>
        </div>
      </div>
    </main>
  );
}
