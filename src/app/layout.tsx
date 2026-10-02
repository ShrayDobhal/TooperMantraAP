import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Topper Mantra - Admin & Mentor Web Control Panel',
  description: 'Command center for platform analytics, mentor shuffling, school licenses, and doubt resolution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0b0f17] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
