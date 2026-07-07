'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Footprints, Dumbbell, Trash2, Calendar
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

const fetchTodaySummary = async () => {
  const res = await fetch(`${BACKEND_URL}/api/v1/logs/today`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch today log');
  return res.json();
};

export default function ActivityPage() {
  const queryClient = useQueryClient();
  const [stepsInput, setStepsInput] = useState('');
  const [workoutType, setWorkoutType] = useState('Walking');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutStart, setWorkoutStart] = useState('');
  const [workoutDistance, setWorkoutDistance] = useState('0');

  // Queries
  const { data: todayData, isLoading } = useQuery({
    queryKey: ['todaySummary'],
    queryFn: fetchTodaySummary,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  // Set default start time for workouts
  useEffect(() => {
    const now = new Date();
    setWorkoutStart(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  }, []);

  // Mutations
  const updateMetricsMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${BACKEND_URL}/api/v1/logs/update`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
    }
  });

  const addWorkoutMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${BACKEND_URL}/api/v1/logs/workout`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
    }
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`${BACKEND_URL}/api/v1/logs/workout/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
    }
  });

  // Handlers
  const handleStepsAdd = (amt: number) => {
    const currentSteps = todayData?.log?.steps || 0;
    updateMetricsMutation.mutate({ steps: currentSteps + amt });
  };

  const handleWorkoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addWorkoutMutation.mutate({
      type: workoutType,
      startTime: workoutStart,
      duration: parseInt(workoutDuration),
      distance: parseFloat(workoutDistance)
    });
    setWorkoutDuration('');
    setWorkoutDistance('0');
  };

  if (isLoading) {
    return <LoadingScreen message="Loading activity logs..." />;
  }

  return (
    <main className="flex-1 p-6 md:p-10 pb-[90px] md:pb-10 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-8 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Log Activity
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Add details about your movements, workouts, and steps.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="hidden sm:inline-flex">
            <Calendar size={16} /> July 5, 2026
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step Logger */}
          <Card className="p-6">
            <h3 className="font-bold text-sm mb-4">Steps Tracker</h3>
            <div className="text-center mb-6">
              <h4 className="text-5xl font-extrabold text-text-primary">{(todayData?.log?.steps || 0).toLocaleString()}</h4>
              <p className="text-xs text-text-secondary mt-1">Steps logged today</p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                className="flex-1 bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                placeholder="e.g. 1500"
                value={stepsInput}
                onChange={(e) => setStepsInput(e.target.value)}
              />
              <Button variant="primary" onClick={() => {
                handleStepsAdd(parseInt(stepsInput) || 0);
                setStepsInput('');
              }}>Add Steps</Button>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="secondary" size="sm" onClick={() => handleStepsAdd(500)}>+500</Button>
              <Button variant="secondary" size="sm" onClick={() => handleStepsAdd(1000)}>+1000</Button>
              <Button variant="secondary" size="sm" onClick={() => handleStepsAdd(2000)}>+2000</Button>
            </div>
          </Card>

          {/* Workout Logger Form */}
          <Card className="p-6">
            <h3 className="font-bold text-sm mb-4">Log Exercise / Sport</h3>
            <form onSubmit={handleWorkoutSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col">
                  <label className="text-xs text-text-secondary font-semibold mb-1">Activity Type</label>
                  <CustomSelect
                    options={[
                      { value: 'Walking', label: 'Walking' },
                      { value: 'Running', label: 'Running' },
                      { value: 'Cycling', label: 'Cycling' },
                      { value: 'Workout', label: 'Workout (Gym)' },
                      { value: 'Yoga', label: 'Yoga' }
                    ]}
                    value={workoutType}
                    onChange={setWorkoutType}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-text-secondary font-semibold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                    placeholder="e.g. 45"
                    value={workoutDuration}
                    onChange={(e) => setWorkoutDuration(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs text-text-secondary font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                    value={workoutStart}
                    onChange={(e) => setWorkoutStart(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-text-secondary font-semibold mb-1">Distance (km)</label>
                  <input
                    type="number"
                    className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                    step="0.1"
                    value={workoutDistance}
                    onChange={(e) => setWorkoutDistance(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full py-3" disabled={addWorkoutMutation.isPending}>
                Save Activity Entry
              </Button>
            </form>
          </Card>
        </div>

        {/* Table of workouts */}
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-4">Today's Activity Log</h3>
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="bg-background border-b border-border text-text-secondary font-semibold text-[10px] uppercase tracking-wider">
                  <th className="p-3">Type</th>
                  <th className="p-3">Time Period</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Distance</th>
                  <th className="p-3">Calories Burned</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-text-primary font-medium">
                {todayData?.workouts?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-text-secondary text-xs">No activities logged today.</td>
                  </tr>
                ) : (
                  todayData?.workouts?.map((w: any) => (
                    <tr key={w.id} className="hover:bg-background/50">
                      <td className="p-3 font-bold text-text-primary">{w.type}</td>
                      <td className="p-3 text-text-secondary">{w.start_time?.substring(0, 5)} - {w.end_time?.substring(0, 5)}</td>
                      <td className="p-3 text-text-secondary">{w.duration} mins</td>
                      <td className="p-3 text-text-secondary">{w.distance > 0 ? `${w.distance} km` : '-'}</td>
                      <td className="p-3 text-accent-workout font-bold">+{w.calories} kcal</td>
                      <td className="p-3">
                        <button 
                          onClick={() => deleteWorkoutMutation.mutate(w.id)}
                          className="p-1 text-accent-calories hover:bg-accent-calories/10 rounded-xl transition"
                          disabled={deleteWorkoutMutation.isPending}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
