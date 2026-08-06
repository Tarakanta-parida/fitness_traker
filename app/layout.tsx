import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/hooks/use-auth";
import Sidebar from "@/components/navigation/Sidebar";
import ReminderNotificationManager from "@/components/reminders/ReminderNotificationManager";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter" 
});

export const metadata: Metadata = {
  title: "LifeTrack - Personal Health & Habit Tracker",
  description: "Track activities, sleep, meals, water, and budget targets to improve your daily lifestyle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const theme = localStorage.getItem('lifetrack_theme') || 'light';
                    if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else if (theme === 'cyberpunk') {
                      document.documentElement.classList.add('dark', 'cyberpunk');
                    }
                  } catch (e) {}
  
                  // Register PWA Service Worker
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').then(function(reg) {
                        console.log('PWA Service Worker registered successfully:', reg.scope);
                      }).catch(function(err) {
                        console.log('PWA Service Worker registration failed:', err);
                      });
                    });
                  }
                })();
              `,
            }}
          />
        </head>
        <body className={`${inter.variable} font-sans antialiased text-gray-900 dark:text-gray-100 bg-gray-50/30 dark:bg-slate-950 transition-colors`}>
          <ThemeProvider>
            <AuthProvider>
              <div className="flex flex-col md:flex-row min-h-screen">
                <Sidebar />
                <main className="flex-1 w-full pb-24 md:pb-0 overflow-x-hidden">
                  {children}
                </main>
              </div>
              <ReminderNotificationManager />
            </AuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
