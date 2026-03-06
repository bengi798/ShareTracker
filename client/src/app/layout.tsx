import type { Metadata } from 'next';
import './globals.css';
import { Work_Sans } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';

const workSans = Work_Sans({ subsets: ['latin'], variable: '--font-work-sans' });

export const metadata: Metadata = {
  title: 'ShareTracker',
  description: 'Track your share purchases and sales',
};

const clerkAppearance = {
  variables: {
    colorPrimary:         '#0038a8',
    colorBackground:      '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText:       '#111827',
    colorText:            '#111827',
    colorTextSecondary:   '#6b7280',
    borderRadius:         '0px',
    fontFamily:           "'Work Sans', system-ui, sans-serif",
  },
  elements: {
    card:                     { boxShadow: 'none', border: '1px solid #111827' },
    formFieldInput:           { border: '1px solid #111827' },
    socialButtonsBlockButton: { border: '1px solid #111827' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" suppressHydrationWarning className={workSans.variable}>
        <body className="antialiased bg-[#f5f5f3] dark:bg-[#111111] text-gray-900 dark:text-gray-100 font-sans">
          <AuthProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
