import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          // Variants
          variant === 'primary' && "bg-primary text-white hover:bg-primary-hover hover:shadow-[0_4px_14px_rgba(37,99,235,0.25)]",
          variant === 'secondary' && "bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-text-primary hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600",
          variant === 'destructive' && "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-accent-calories hover:bg-accent-calories hover:text-white",
          variant === 'outline' && "border border-slate-200 dark:border-slate-700 bg-transparent text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800",
          variant === 'ghost' && "bg-transparent text-text-secondary hover:text-text-primary hover:bg-slate-100/70 dark:hover:bg-slate-800/70",
          // Sizes
          size === 'sm' && "h-8 px-3 text-xs",
          size === 'md' && "h-10 px-5 text-sm",
          size === 'lg' && "h-12 px-7 text-base",
          size === 'icon' && "h-10 w-10 rounded-full p-0",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
