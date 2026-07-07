'use client';

import React, { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export default function SettingsPage() {
  const [metricUnits, setMetricUnits] = useState(true);
  const [googleFitSync, setGoogleFitSync] = useState(false);
  const [appleHealthSync, setAppleHealthSync] = useState(false);
  const [healthConnectSync, setHealthConnectSync] = useState(false);
  const [offlineSync, setOfflineSync] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const handleThemeEvent = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };
    handleThemeEvent();
    window.addEventListener('theme-change', handleThemeEvent);
    return () => window.removeEventListener('theme-change', handleThemeEvent);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
    window.dispatchEvent(new Event('theme-change'));
  };

  const handleSaveSettings = () => {
    alert('System settings and sync integrations saved successfully!');
  };

  return (
    <main className="flex-1 p-6 md:p-10 pb-[90px] md:pb-10 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-8 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            System Settings
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage your units preference and health integrations.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {/* Units Configuration */}
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-4 text-text-primary">Units Preferences</h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-primary block">Measurement System</span>
              <span className="text-[10px] text-text-secondary">Choose metric (kg/cm/mL) or imperial (lbs/inches/fl oz)</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={metricUnits ? 'primary' : 'secondary'} 
                onClick={() => setMetricUnits(true)}
                size="sm"
              >
                Metric (SI)
              </Button>
              <Button 
                variant={!metricUnits ? 'primary' : 'secondary'} 
                onClick={() => setMetricUnits(false)}
                size="sm"
              >
                Imperial
              </Button>
            </div>
          </div>
        </Card>

        {/* Theme Preferences */}
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-4 text-text-primary">Theme Preferences</h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-primary block">Application Theme</span>
              <span className="text-[10px] text-text-secondary">Switch between Light Mode and Dark Mode</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={theme === 'light' ? 'primary' : 'secondary'} 
                onClick={() => handleThemeChange('light')}
                size="sm"
              >
                Light Theme
              </Button>
              <Button 
                variant={theme === 'dark' ? 'primary' : 'secondary'} 
                onClick={() => handleThemeChange('dark')}
                size="sm"
              >
                Dark Theme
              </Button>
            </div>
          </div>
        </Card>

        {/* Third-Party Integrations */}
        <Card className="p-6">
          <h3 className="font-bold text-sm mb-6 text-text-primary">Health Sync Integrations</h3>
          <div className="space-y-4">
            {/* Google Fit */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div>
                <span className="text-xs font-bold text-text-primary block">Google Fit API</span>
                <span className="text-[10px] text-text-secondary">Sync steps, distance and activity metrics in background</span>
              </div>
              <input 
                type="checkbox"
                checked={googleFitSync}
                onChange={(e) => setGoogleFitSync(e.target.checked)}
                className="w-4 h-4 rounded-sm border-slate-300 text-primary cursor-pointer"
              />
            </div>

            {/* Apple Health */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div>
                <span className="text-xs font-bold text-text-primary block">Apple HealthKit</span>
                <span className="text-[10px] text-text-secondary">Link sleep cycles and body dimensions datasets</span>
              </div>
              <input 
                type="checkbox"
                checked={appleHealthSync}
                onChange={(e) => setAppleHealthSync(e.target.checked)}
                className="w-4 h-4 rounded-sm border-slate-300 text-primary cursor-pointer"
              />
            </div>

            {/* Health Connect */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div>
                <span className="text-xs font-bold text-text-primary block">Android Health Connect</span>
                <span className="text-[10px] text-text-secondary">Sync central telemetry across device-level apps</span>
              </div>
              <input 
                type="checkbox"
                checked={healthConnectSync}
                onChange={(e) => setHealthConnectSync(e.target.checked)}
                className="w-4 h-4 rounded-sm border-slate-300 text-primary cursor-pointer"
              />
            </div>

            {/* Offline Sync */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-text-primary block">Offline Cache Sync</span>
                <span className="text-[10px] text-text-secondary">Store inputs locally during offline state and sync automatically</span>
              </div>
              <input 
                type="checkbox"
                checked={offlineSync}
                onChange={(e) => setOfflineSync(e.target.checked)}
                className="w-4 h-4 rounded-sm border-slate-300 text-primary cursor-pointer"
              />
            </div>
          </div>
        </Card>

        <div className="text-right">
          <Button variant="primary" onClick={handleSaveSettings} className="py-3 px-6">
            Save System Configurations
          </Button>
        </div>
      </div>
    </main>
  );
}
