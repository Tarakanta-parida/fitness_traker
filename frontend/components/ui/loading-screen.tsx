'use client';

import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 min-h-[300px]">
      <div className="relative mb-6 animate-runner-container">
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-20 h-20 animate-logo-float"
        >
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--accent-mood))" />
              <stop offset="100%" stopColor="hsl(var(--accent-workout))" />
            </linearGradient>
          </defs>
          
          {/* Top Bar */}
          <path
            d="M 26,18 L 74,18 L 68,26 L 32,26 Z"
            fill="url(#logo-grad)"
            className="animate-part-top"
          />
          
          {/* Middle Shape (Stylized "F") */}
          <path
            d="M 26,34 L 68,34 L 62,42 L 38,42 L 26,58 L 8,58 Z"
            fill="url(#logo-grad)"
            className="animate-part-mid"
          />
          
          {/* Right Shape (Zig-zag) */}
          <path
            d="M 74,34 L 86,34 L 77,46 L 56,46 L 44,62 L 32,62 L 44,46 L 65,46 Z"
            fill="url(#logo-grad)"
            className="animate-part-right"
          />
        </svg>
      </div>
      <p className="text-text-secondary text-xs font-semibold tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
}
