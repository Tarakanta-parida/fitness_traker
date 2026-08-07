"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useClerk } from "@clerk/nextjs";
import { 
  Home, 
  Activity, 
  Utensils, 
  BarChart2, 
  User, 
  LogOut,
  Sparkles,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";

import ThemeToggle from "@/components/theme/ThemeToggle";
import GamificationBadge from "@/components/gamification/GamificationBadge";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { signOut } = useClerk();

  // If user is not logged in or not onboarded, we don't show the navigation bar
  if (!user || !user.isOnboarded) return null;

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Activity", href: "/activity", icon: Activity },
    { label: "Food", href: "/food", icon: Utensils },
    { label: "Analytics", href: "/analytics", icon: BarChart2 },
    { label: "Reminders", href: "/reminders", icon: Bell },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 h-screen sticky top-0 left-0 p-5 justify-between shadow-sm z-30 overflow-y-auto">
        <div className="flex flex-col gap-5">
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-green-400 via-emerald-500 to-blue-500 flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-xl bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-400 dark:to-green-400 bg-clip-text text-transparent truncate tracking-tight leading-none">
                LifeTrack
              </span>
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 tracking-wider uppercase truncate mt-0.5">
                Fitness Tracker
              </span>
            </div>
          </div>

          {/* Theme Switcher Bar */}
          <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-gray-50/80 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Theme</span>
            <ThemeToggle />
          </div>

          {/* Compact Gamification Streak & Level Badge */}
          <div className="w-full">
            <GamificationBadge compact />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                    isActive 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl -z-10 border border-blue-100/50 dark:border-blue-900/50"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & LogOut */}
        <div className="flex flex-col gap-3 border-t border-gray-100 dark:border-slate-800 pt-4 mt-auto">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900/60 font-extrabold text-sm text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 select-none">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{user.name}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user.email}</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: "/login" })}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-all"
          >
            <LogOut className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 px-2 py-1.5 flex justify-between items-center z-50 shadow-lg pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-1 px-1 flex-1 min-w-0 relative"
            >
              {isActive && (
                <motion.span
                  layoutId="active-dot"
                  className="absolute -top-1.5 w-1.5 h-1.5 rounded-full bg-blue-500"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon 
                className={`w-4.5 h-4.5 transition-colors ${
                  isActive ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                }`} 
              />
              <span 
                className={`text-[9px] font-bold tracking-tight transition-colors truncate w-full text-center ${
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
