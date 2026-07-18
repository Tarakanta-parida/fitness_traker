"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  height?: string | number;
  weight?: string | number;
  goal?: string;
  budget?: string | number;
  isOnboarded: boolean;
  stepsTarget: number;
  sleepTarget: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to load auth session", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Handle route protection
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/login", "/signup", "/"];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push("/login");
    } else if (user && isPublicRoute && pathname !== "/") {
      if (!user.isOnboarded) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } else if (user && !user.isOnboarded && pathname !== "/onboarding" && !publicRoutes.includes(pathname)) {
      router.push("/onboarding");
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        await refreshUser();
        // Redirect will be handled by the route protection effect or manually
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (err) {
      return { success: false, error: "An error occurred. Please try again." };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        await refreshUser();
        return { success: true };
      } else {
        return { success: false, error: data.error || "Registration failed" };
      }
    } catch (err) {
      return { success: false, error: "An error occurred. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
