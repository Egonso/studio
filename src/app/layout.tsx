import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';

// Node.js 25 compatibility fix: provide a minimal localStorage mock if missing or incomplete on the server
if (typeof window === 'undefined') {
  try {
    if (typeof global !== 'undefined') {
      // Create a robust mock
      const mock = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { },
        key: () => null,
        length: 0
      };

      // Aggressively override global.localStorage to ensure compatibility
      Object.defineProperty(global, 'localStorage', {
        value: mock,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  } catch (_e) {
    // Silent fail in production
  }
}

import './globals.css';
import { Footer } from '@/components/footer';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { SiteChatbotWidget } from '@/components/site-chatbot-widget';
import { CommandPalette } from '@/components/register/command-palette';
import { DynamicFavicon } from '@/components/dynamic-favicon';

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
  description: 'AI Governance Register (Free Entry) und AI Governance Control (Paid Layer).',
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
      <body className={`${inter.variable} ${playfairDisplay.variable} font-body antialiased bg-background`}>
        <AuthProvider>
          <DynamicFavicon />
          {children}
          <Toaster />
          <CommandPalette />
          <SiteChatbotWidget />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
