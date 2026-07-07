'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText
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

const fetchHistory = async () => {
  const res = await fetch(`${BACKEND_URL}/api/v1/logs/history`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch history logs');
  return res.json();
};

export default function HistoryPage() {
  const [historyFilter, setHistoryFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  // Queries
  const { data: todayData } = useQuery({
    queryKey: ['todaySummary'],
    queryFn: fetchTodaySummary,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  const { data: historyLogs, isLoading } = useQuery({
    queryKey: ['historyLogs'],
    queryFn: fetchHistory,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  const currentStepsNum = todayData?.log?.steps || 0;

  if (isLoading) {
    return <LoadingScreen message="Loading historical records..." />;
  }

  return (
    <main className="flex-1 p-6 md:p-10 pb-[90px] md:pb-10 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-8 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Logs History
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Review your logs history database.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-sm text-text-primary">Historical Records</h3>
            <Button variant="secondary" onClick={() => window.print()}>
              <FileText size={16} /> Export Progress PDF
            </Button>
          </div>

          <div className="flex gap-2 mb-4 bg-background p-1 rounded-xl border border-border/80 w-max">
            {['daily', 'weekly', 'monthly', 'yearly'].map((f) => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f as any)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${historyFilter === f ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} records
              </button>
            ))}
          </div>

          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="bg-background border-b border-border text-text-secondary font-semibold text-[10px] tracking-wider uppercase">
                  <th className="p-3">Time Period</th>
                  <th className="p-3">Steps</th>
                  <th className="p-3">Water</th>
                  <th className="p-3">Consumed</th>
                  <th className="p-3">Burned</th>
                  <th className="p-3">Sleep</th>
                  <th className="p-3">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-text-primary font-medium">
                {historyLogs?.history?.length === 0 ? (
                  <tr className="hover:bg-background/50">
                    <td className="p-3 font-bold">2026-07-05 (Today)</td>
                    <td className="p-3">{currentStepsNum.toLocaleString()}</td>
                    <td className="p-3">{todayData?.log?.water || 0} ml</td>
                    <td className="p-3">{todayData?.log?.caloriesConsumed || 0} kcal</td>
                    <td className="p-3">{todayData?.log?.caloriesBurned || 0} kcal</td>
                    <td className="p-3">{todayData?.log?.sleep || 0} hrs</td>
                    <td className="p-3">{todayData?.log?.weight || 0} kg</td>
                  </tr>
                ) : (
                  historyLogs?.history?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-background/50">
                      <td className="p-3 font-bold">{row.date?.split('T')[0] || '2026-07-05'}</td>
                      <td className="p-3">{parseInt(row.steps || 0).toLocaleString()}</td>
                      <td className="p-3">{row.water_intake || 0} mL</td>
                      <td className="p-3">{row.consumed || 0} kcal</td>
                      <td className="p-3">{row.calories_burned || 0} kcal</td>
                      <td className="p-3">{parseFloat(row.sleep_hours || 0).toFixed(1)} hrs</td>
                      <td className="p-3">{parseFloat(row.weight || 0).toFixed(1)} kg</td>
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
