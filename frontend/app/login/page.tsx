'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated, redirect to workspace
    const token = localStorage.getItem('lifetrack_token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const endpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/signup';

    try {
      const payload = isLogin ? { email, password } : { name, email, password };
      
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please check your credentials.');
      }

      // Save token and user details to localStorage
      localStorage.setItem('lifetrack_token', data.token);
      localStorage.setItem('lifetrack_user', JSON.stringify(data.user));

      router.push('/');
      router.refresh();
      
    } catch (err: any) {
      setError(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError('');
    setLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const endpoint = `/api/v1/auth/${provider}`;

    try {
      const payload = {
        name: 'Tarakanta Parida',
        email: 'tarakanta@example.com'
      };

      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OAuth failed.');

      localStorage.setItem('lifetrack_token', data.token);
      localStorage.setItem('lifetrack_user', JSON.stringify(data.user));
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-[420px] p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent-water text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-[0_4px_15px_rgba(37,99,235,0.2)]">
            L
          </div>
          <h2 className="text-2xl font-bold mt-4 tracking-tight text-text-primary">
            {isLogin ? 'Welcome back to LifeTrack' : 'Create an Account'}
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {isLogin ? 'Sign in to monitor your health goals' : 'Start your fitness and habit tracking journey'}
          </p>
        </div>

        {error && (
          <div className="bg-accent-calories/10 border border-accent-calories/20 text-accent-calories rounded-xl p-3 text-xs mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="flex flex-col">
              <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                className="w-full bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                placeholder="e.g. Tarakanta Parida"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="w-full bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
              placeholder="e.g. tarakanta@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-text-secondary font-semibold mb-1" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="w-full bg-background border border-border rounded-xl p-3 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full py-3 mt-2" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <span className="relative bg-surface px-3 text-xs text-text-muted">Or continue with</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => handleOAuth('google')} disabled={loading}>
            Google
          </Button>
          <Button variant="secondary" onClick={() => handleOAuth('apple')} disabled={loading}>
            Apple
          </Button>
        </div>

        <div className="text-center mt-6 text-xs text-text-secondary">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold ml-1 hover:underline focus:outline-none"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </Card>
    </div>
  );
}
