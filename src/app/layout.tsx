import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { DynamicFavicon } from '@/components/dynamic-favicon';
import { GlobalChrome } from '@/components/global-chrome';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-playfair-display',
});

export const metadata: Metadata = {
  title: 'AI Governance Control',
  description:
    'AI Governance Register (Free Entry) und AI Governance Control (Paid Layer).',
  icons: {
    icon: [
      { url: '/register-logo.png', media: '(prefers-color-scheme: light)' },
      { url: '/register-logo-dark.png', media: '(prefers-color-scheme: dark)' },
    ],
    shortcut: [
      { url: '/register-logo.png', media: '(prefers-color-scheme: light)' },
      { url: '/register-logo-dark.png', media: '(prefers-color-scheme: dark)' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head />
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${playfairDisplay.variable} font-body antialiased bg-background`}
      >
        <AuthProvider>
          <DynamicFavicon />
          {children}
          <Toaster />
          <GlobalChrome />
        </AuthProvider>
      </body>
    </html>
  );
}
