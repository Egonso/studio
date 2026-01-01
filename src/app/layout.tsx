import type { Metadata } from 'next';

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
  } catch (e) {
    // Silent fail in production
  }
}

import './globals.css';
import { Footer } from '@/components/footer';
import { Toaster } from "@/components/ui/toaster";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'AI Compliance OS',
  description: 'Navigate EU AI Act compliance with confidence. Get status checks, parameter configuration, and AI-powered advice for your SME.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <AuthProvider>
          {children}
          <Toaster />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
