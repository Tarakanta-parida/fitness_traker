'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  LayoutDashboard, Activity, Utensils, Bell, 
  LineChart, History as HistoryIcon, User, LogOut, 
  Plus, GlassWater, Footprints, Dumbbell, Moon, Sun, Settings
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogCloseButton } from '../../components/ui/dialog';

// --- API Helpers ---
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

const fetchProfile = async () => {
  const res = await fetch(`${BACKEND_URL}/api/v1/profile`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch profile');
  const data = await res.json();
  return data.profile;
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: string }[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Dialog fields
  const [logWater, setLogWater] = useState('');
  const [logCals, setLogCals] = useState('');
  const [logSleep, setLogSleep] = useState('');
  const [logWeight, setLogWeight] = useState('');

  // Sync theme status on load and listen to changes
  useEffect(() => {
    const handleThemeEvent = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };
    handleThemeEvent();
    window.addEventListener('theme-change', handleThemeEvent);
    return () => window.removeEventListener('theme-change', handleThemeEvent);
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
    window.dispatchEvent(new Event('theme-change'));
  };

  // Toaster Trigger Helper
  const triggerToast = (msg: string, type: string = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- React Queries ---
  const { data: todayData } = useQuery({
    queryKey: ['todaySummary'],
    queryFn: fetchTodaySummary,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('lifetrack_token')
  });

  // Guard checks
  useEffect(() => {
    const token = localStorage.getItem('lifetrack_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // --- Quick Log Mutation ---
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
      triggerToast('Metrics logged successfully', 'success');
    }
  });

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {};
    if (logWater) payload.water = (todayData?.log?.water || 0) + parseInt(logWater);
    if (logCals) payload.caloriesConsumed = (todayData?.log?.caloriesConsumed || 0) + parseInt(logCals);
    if (logSleep) payload.sleep = parseFloat(logSleep);
    if (logWeight) payload.weight = parseFloat(logWeight);

    updateMetricsMutation.mutate(payload);
    setLogWater('');
    setLogCals('');
    setLogSleep('');
    setLogWeight('');
    setIsLogModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('lifetrack_token');
    localStorage.removeItem('lifetrack_user');
    router.push('/login');
  };

  // Safe navigation checker
  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      {/* Toast Notification Box */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className="pointer-events-auto p-4 rounded-xl border border-border/80 border-l-4 shadow-premium bg-surface min-w-[280px] text-sm font-semibold flex items-center gap-2 animate-bounce border-l-primary"
          >
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40">
        <button
          onClick={() => setIsLogModalOpen(true)}
          className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all duration-300 group"
          title="Quick Log Metrics"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-[260px] h-screen fixed left-0 top-0 hidden md:flex flex-col border-r border-border bg-surface px-4 py-6 z-40">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-water text-white font-extrabold text-lg flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.2)]">L</div>
          <span className="font-bold text-xl tracking-tight text-text-primary">LifeTrack</span>
        </div>

        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => router.push('/dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/dashboard') ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' : 'text-text-secondary hover:bg-background hover:text-text-primary'}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            onClick={() => router.push('/activity')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/activity') ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' : 'text-text-secondary hover:bg-background hover:text-text-primary'}`}
          >
            <Activity size={18} /> Log Activity
          </button>
          <button 
            onClick={() => router.push('/food')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/food') ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' : 'text-text-secondary hover:bg-background hover:text-text-primary'}`}
          >
            <Utensils size={18} /> Meal Planner
          </button>
          <button 
            onClick={() => router.push('/reminders')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/reminders') ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' : 'text-text-secondary hover:bg-background hover:text-text-primary'}`}
          >
            <Bell size={18} /> Reminders
          </button>
          <button 
            onClick={() => router.push('/analytics')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/analytics') ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' : 'text-text-secondary hover:bg-background hover:text-text-primary'}`}
          >
            <LineChart size={18} /> Analytics
          </button>
          <button 
            onClick={() => router.push('/history')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/history') ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' : 'text-text-secondary hover:bg-background hover:text-text-primary'}`}
          >
            <HistoryIcon size={18} /> History
          </button>
          <button 
            onClick={() => router.push('/profile')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/profile') ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' : 'text-text-secondary hover:bg-background hover:text-text-primary'}`}
          >
            <User size={18} /> Profile
          </button>
          <button 
            onClick={() => router.push('/settings')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive('/settings') ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' : 'text-text-secondary hover:bg-background hover:text-text-primary'}`}
          >
            <Settings size={18} /> Settings
          </button>
        </nav>

        <div className="border-t border-border pt-4 mt-auto">
          <button 
            onClick={toggleTheme} 
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:bg-background hover:text-text-primary transition mb-2"
          >
            {theme === 'dark' ? <Sun size={16} className="text-accent-mood" /> : <Moon size={16} className="text-primary" />}
            <span>Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-background transition cursor-pointer mb-2" onClick={() => router.push('/profile')}>
            <div className="w-10 h-10 rounded-full bg-background text-primary flex items-center justify-center font-bold text-sm border border-border">TP</div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-text-primary truncate">{profileData?.name || 'Tarakanta Parida'}</span>
              <span className="text-[10px] text-text-secondary">Premium User</span>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-accent-calories hover:bg-red-50/10 transition">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-surface border-t border-border flex md:hidden items-center justify-around z-40 px-2 shadow-lg">
        <button onClick={() => router.push('/dashboard')} className={`flex flex-col items-center gap-1 text-[10px] ${isActive('/dashboard') ? 'text-primary' : 'text-text-secondary'}`}>
          <LayoutDashboard size={20} /> Home
        </button>
        <button onClick={() => router.push('/activity')} className={`flex flex-col items-center gap-1 text-[10px] ${isActive('/activity') ? 'text-primary' : 'text-text-secondary'}`}>
          <Activity size={20} /> Activity
        </button>
        <button onClick={() => router.push('/food')} className={`flex flex-col items-center gap-1 text-[10px] ${isActive('/food') ? 'text-primary' : 'text-text-secondary'}`}>
          <Utensils size={20} /> Food
        </button>
        <button onClick={() => router.push('/analytics')} className={`flex flex-col items-center gap-1 text-[10px] ${isActive('/analytics') ? 'text-primary' : 'text-text-secondary'}`}>
          <LineChart size={20} /> Analytics
        </button>
        <button onClick={() => router.push('/profile')} className={`flex flex-col items-center gap-1 text-[10px] ${isActive('/profile') ? 'text-primary' : 'text-text-secondary'}`}>
          <User size={20} /> Profile
        </button>
      </nav>

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col md:pl-[260px]">
        {children}
      </div>

      {/* QUICK LOG DIALOG MODAL */}
      <Dialog open={isLogModalOpen} onClose={() => setIsLogModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Log Health Metric</DialogTitle>
          <DialogCloseButton onClick={() => setIsLogModalOpen(false)} />
        </DialogHeader>
        <form onSubmit={handleQuickLogSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="quick-water">Water Intake (mL)</label>
              <input
                id="quick-water"
                type="number"
                className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. +250 or +500"
                value={logWater}
                onChange={(e) => setLogWater(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="quick-calories">Calories Intake (kcal)</label>
              <input
                id="quick-calories"
                type="number"
                className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. +350"
                value={logCals}
                onChange={(e) => setLogCals(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="quick-sleep">Sleep Log (Hours)</label>
              <input
                id="quick-sleep"
                type="number"
                step="0.1"
                className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. 7.5"
                value={logSleep}
                onChange={(e) => setLogSleep(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="quick-weight">Weight Log (kg)</label>
              <input
                id="quick-weight"
                type="number"
                step="0.1"
                className="bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. 70.2"
                value={logWeight}
                onChange={(e) => setLogWeight(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full py-3 mt-4">
            Log Metric Record
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
