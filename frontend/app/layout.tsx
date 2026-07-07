import type { Metadata } from 'next';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'LifeTrack - Personal Health & Habit Tracker',
  description: 'LifeTrack is your premium personal health assistant. Track steps, water, sleep, calories, and workouts. Plan budgets, set custom notifications, and analyze progress.',
  authors: [{ name: 'LifeTrack Team' }],
  viewport: 'width=device-width, initial-scale=1.0'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
