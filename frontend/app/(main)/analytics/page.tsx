'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Award, Calendar
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
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

export default function AnalyticsPage() {
  const [analyticsFilter, setAnalyticsFilter] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  // Queries
  const { data: todayData, isLoading } = useQuery({
    queryKey: ['todaySummary'],
    queryFn: fetchTodaySummary,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  const stepsTargetNum = todayData?.profile?.stepsTarget || 10000;
  const currentStepsNum = todayData?.log?.steps || 0;

  if (isLoading) {
    return <LoadingScreen message="Loading health analytics..." />;
  }

  return (
    <main className="flex-1 p-6 md:p-10 pb-[90px] md:pb-10 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-8 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Analytics Report
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Visualizing your health progression and trends.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex gap-2 bg-surface p-2 rounded-xl border border-border/80 w-max">
          {['weekly', 'monthly', 'yearly'].map((f) => (
            <button
              key={f}
              onClick={() => setAnalyticsFilter(f as any)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${analyticsFilter === f ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} charts
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hydration vs Steps Tracker */}
          <Card className="p-6">
            <h3 className="font-bold text-sm mb-4">Hydration & Movement Chart</h3>
            <div className="h-[240px] flex items-end justify-around gap-2 pt-6">
              {[6500, 8900, 10200, 4300, 7800, 11400, 9200, 8100, 12000, currentStepsNum].map((val, idx) => {
                const stepsPercent = Math.min(100, (val / stepsTargetNum) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    <div 
                      className="w-4 bg-accent-steps/60 hover:bg-accent-steps rounded-t-lg transition-all duration-300 relative"
                      style={{ height: `${stepsPercent}%` }}
                    >
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-border text-[9px] font-bold p-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 text-text-primary shadow-sm">
                        {val.toLocaleString()} steps
                      </span>
                    </div>
                    <span className="text-[9px] text-text-secondary mt-2">7/{(25 + idx)}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Weight Trend Tracker */}
          <Card className="p-6">
            <h3 className="font-bold text-sm mb-4">Weight Trend Curve</h3>
            <div className="h-[240px] w-full relative pt-6">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                <line x1="0" y1="50" x2="400" y2="50" stroke="hsl(var(--border-color) / 0.5)" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="hsl(var(--border-color) / 0.5)" />
                <line x1="0" y1="150" x2="400" y2="150" stroke="hsl(var(--border-color) / 0.5)" />
                
                <path 
                  d="M 10 150 Q 100 120 200 90 T 390 110" 
                  fill="none" 
                  stroke="#2563eb" 
                  strokeWidth="3" 
                />
                <path 
                  d="M 10 150 Q 100 120 200 90 T 390 110 L 390 200 L 10 200 Z" 
                  fill="url(#weight-grad)" 
                />

                <defs>
                  <linearGradient id="weight-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute top-1 left-2 text-[10px] text-text-secondary font-bold uppercase">Weight Limits: 68kg - 72kg</div>
            </div>
          </Card>
        </div>

        {/* Achievements List */}
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Award className="text-primary" /> Health Achievements Badges
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-background border border-border/80 rounded-xl flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-accent-steps/10 text-accent-steps flex items-center justify-center font-bold">✓</div>
              <div>
                <h4 className="font-bold text-xs text-text-primary">Hydration King</h4>
                <p className="text-[10px] text-text-secondary mt-0.5">Target water goals achieved</p>
              </div>
            </div>
            <div className="p-4 bg-background border border-border/80 rounded-xl flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">✓</div>
              <div>
                <h4 className="font-bold text-xs text-text-primary">Step Master</h4>
                <p className="text-[10px] text-text-secondary mt-0.5">10,000 steps targets met</p>
              </div>
            </div>
            <div className="p-4 bg-background border border-border/80 rounded-xl flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-accent-sleep/10 text-accent-sleep flex items-center justify-center font-bold">✓</div>
              <div>
                <h4 className="font-bold text-xs text-text-primary">Sleep Champion</h4>
                <p className="text-[10px] text-text-secondary mt-0.5">8.0 hrs restful sleep logged</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
