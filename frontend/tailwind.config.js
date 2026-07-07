/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--bg-base) / <alpha-value>)",
        surface: "hsl(var(--bg-surface) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          hover: "hsl(var(--primary-hover) / <alpha-value>)",
        },
        accent: {
          steps: "hsl(var(--accent-steps) / <alpha-value>)",
          water: "hsl(var(--accent-water) / <alpha-value>)",
          calories: "hsl(var(--accent-calories) / <alpha-value>)",
          sleep: "hsl(var(--accent-sleep) / <alpha-value>)",
          workout: "hsl(var(--accent-workout) / <alpha-value>)",
          mood: "hsl(var(--accent-mood) / <alpha-value>)",
        },
        border: "hsl(var(--border-color) / <alpha-value>)",
        text: {
          primary: "hsl(var(--text-primary) / <alpha-value>)",
          secondary: "hsl(var(--text-secondary) / <alpha-value>)",
          muted: "hsl(var(--text-muted) / <alpha-value>)",
        }
      },
      borderRadius: {
        lg: "var(--border-radius-lg)",
        md: "var(--border-radius-md)",
        sm: "var(--border-radius-sm)",
      },
      boxShadow: {
        premium: "var(--shadow-premium)",
      }
    },
  },
  plugins: [],
}
