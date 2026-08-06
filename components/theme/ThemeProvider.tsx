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

  useEffect(() => {
    const saved = (localStorage.getItem("lifetrack_theme") as Theme) || "light";
    setThemeState(saved);
    applyThemeClass(saved);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("lifetrack_theme", newTheme);
    applyThemeClass(newTheme);
  };

  const applyThemeClass = (targetTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove("dark", "cyberpunk");
    if (targetTheme === "dark") {
      root.classList.add("dark");
    } else if (targetTheme === "cyberpunk") {
      root.classList.add("dark", "cyberpunk");
    }
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
