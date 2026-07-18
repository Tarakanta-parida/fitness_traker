import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import Sidebar from "@/components/navigation/Sidebar";

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
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  if (theme !== 'light') {
                    document.body.classList.add('theme-' + theme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased text-gray-900 bg-gray-50/30`}>
        <AuthProvider>
          <div className="flex flex-col md:flex-row min-h-screen">
            <Sidebar />
            <main className="flex-1 w-full pb-24 md:pb-0 overflow-x-hidden">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

