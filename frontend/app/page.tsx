'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

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

export default function SplashPage() {
  const router = useRouter();
  const [splashProgress, setSplashProgress] = useState(0);

  const { data: profileData, error } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token'),
    retry: false
  });

  // Handle splash loading progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setSplashProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Route security checks
  useEffect(() => {
    if (splashProgress >= 100) {
      const token = localStorage.getItem('lifetrack_token');
      if (!token || error) {
        router.push('/login');
      } else if (profileData) {
        if (!profileData.is_onboarded) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Fallback if data is still loading
        const checkInterval = setInterval(() => {
          const freshToken = localStorage.getItem('lifetrack_token');
          if (!freshToken) {
            clearInterval(checkInterval);
            router.push('/login');
          } else if (profileData) {
            clearInterval(checkInterval);
            if (!profileData.is_onboarded) {
              router.push('/onboarding');
            } else {
              router.push('/dashboard');
            }
          }
        }, 100);
        return () => clearInterval(checkInterval);
      }
    }
  }, [splashProgress, profileData, error, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-primary">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent-water text-white font-extrabold text-3xl flex items-center justify-center mx-auto shadow-[0_8px_30px_rgba(37,99,235,0.25)] animate-pulse">
          L
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            LifeTrack
          </h1>
          <p className="text-xs text-text-secondary mt-1">Your Personal Health & Habit Assistant</p>
        </div>
        <div className="w-48 h-1.5 bg-border/40 rounded-full mx-auto overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${splashProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
