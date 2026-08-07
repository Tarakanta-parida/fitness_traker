"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "cyberpunk";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  const applyThemeClass = (targetTheme: Theme) => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const body = document.body;

    root.classList.remove("dark", "cyberpunk");
    if (body) {
      body.classList.remove("theme-light", "theme-dark", "theme-cyberpunk", "theme-forest");
    }

    if (targetTheme === "dark") {
      root.classList.add("dark");
      if (body) body.classList.add("theme-dark");
    } else if (targetTheme === "cyberpunk") {
      root.classList.add("dark", "cyberpunk");
      if (body) body.classList.add("theme-dark", "theme-cyberpunk");
    } else {
      if (body) body.classList.add("theme-light");
    }
  };

  useEffect(() => {
    const saved = (localStorage.getItem("lifetrack_theme") || localStorage.getItem("theme") || "light") as Theme;
    setThemeState(saved);
    applyThemeClass(saved);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("lifetrack_theme", newTheme);
    localStorage.setItem("theme", newTheme);
    applyThemeClass(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
