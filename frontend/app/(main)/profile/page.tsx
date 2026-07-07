'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const fetchProfile = async () => {
  const res = await fetch(`${BACKEND_URL}/api/v1/profile`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch profile');
  const data = await res.json();
  return data.profile;
};

export default function ProfilePage() {
  const queryClient = useQueryClient();

  // Form states
  const [profileName, setProfileName] = useState('');
  const [profileGender, setProfileGender] = useState('male');
  const [profileAge, setProfileAge] = useState('28');
  const [profileWeight, setProfileWeight] = useState('');
  const [profileHeight, setProfileHeight] = useState('');
  const [profileGoal, setProfileGoal] = useState('maintain');
  const [profileStepsTarget, setProfileStepsTarget] = useState('10000');
  const [profileWaterTarget, setProfileWaterTarget] = useState('3000');
  const [profileSleepTarget, setProfileSleepTarget] = useState('8.0');

  // Queries
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  useEffect(() => {
    if (profileData) {
      setProfileName(profileData.name || '');
      setProfileGender(profileData.gender);
      setProfileAge(profileData.age.toString());
      setProfileWeight(profileData.weight.toString());
      setProfileHeight(profileData.height.toString());
      setProfileGoal(profileData.goal);
      setProfileStepsTarget((profileData.steps_target || 10000).toString());
      setProfileWaterTarget((profileData.water_target || 3000).toString());
      setProfileSleepTarget((profileData.sleep_target || 8.0).toString());
    }
  }, [profileData]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: profileName,
      gender: profileGender,
      age: parseInt(profileAge),
      weight: parseFloat(profileWeight),
      height: parseFloat(profileHeight),
      goal: profileGoal,
      stepsTarget: parseInt(profileStepsTarget),
      waterTarget: parseInt(profileWaterTarget),
      sleepTarget: parseFloat(profileSleepTarget)
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading user profile..." />;
  }

  return (
    <main className="flex-1 p-6 md:p-10 pb-[90px] md:pb-10 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-8 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            User Profile
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Update your dimensions and goals settings.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-6 pb-2 border-b border-border/40">Personal Dimensions</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Gender</label>
                <CustomSelect
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' }
                  ]}
                  value={profileGender}
                  onChange={setProfileGender}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Age (Years)</label>
                <input
                  type="number"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                  value={profileAge}
                  onChange={(e) => setProfileAge(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                  value={profileWeight}
                  onChange={(e) => setProfileWeight(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Height (cm)</label>
                <input
                  type="number"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                  value={profileHeight}
                  onChange={(e) => setProfileHeight(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Daily Goal</label>
                <CustomSelect
                  options={[
                    { value: 'lose', label: 'Weight Loss' },
                    { value: 'maintain', label: 'Maintain Weight' },
                    { value: 'gain', label: 'Weight Gain' }
                  ]}
                  value={profileGoal}
                  onChange={setProfileGoal}
                />
              </div>
            </div>

            <h3 className="font-bold text-sm mb-6 pt-4 pb-2 border-b border-border/40">Daily Target Goals</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Steps Target</label>
                <input
                  type="number"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary font-bold"
                  value={profileStepsTarget}
                  onChange={(e) => setProfileStepsTarget(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Water Target (mL)</label>
                <input
                  type="number"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary font-bold"
                  value={profileWaterTarget}
                  onChange={(e) => setProfileWaterTarget(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-text-secondary font-semibold mb-1">Sleep Target (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary font-bold"
                  value={profileSleepTarget}
                  onChange={(e) => setProfileSleepTarget(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="text-right">
              <Button type="submit" className="py-3 px-6" disabled={updateProfileMutation.isPending}>
                Update Profile settings
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
