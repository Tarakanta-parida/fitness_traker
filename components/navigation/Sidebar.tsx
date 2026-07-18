"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
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

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 left-0 p-6 justify-between shadow-sm">
        <div className="flex flex-col gap-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              LifeTrack
            </span>
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${
                    isActive 
                      ? "text-blue-600" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-blue-50/50 rounded-xl -z-10 border border-blue-100/50"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? "text-blue-500" : "text-gray-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & LogOut */}
        <div className="flex flex-col gap-4 border-t border-gray-50 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="font-extrabold text-xl text-blue-600 tracking-tight leading-none px-2 select-none">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-800 truncate">{user.name}</span>
              <span className="text-xs text-gray-400 truncate">{user.email}</span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/50 transition-all"
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-2 flex justify-around items-center z-50 shadow-lg pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-1 px-3 relative"
            >
              {isActive && (
                <motion.span
                  layoutId="active-dot"
                  className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-blue-500"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon 
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-blue-500" : "text-gray-400"
                }`} 
              />
              <span 
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-blue-600" : "text-gray-400"
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
