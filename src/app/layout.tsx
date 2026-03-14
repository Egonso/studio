import type { Metadata } from 'next';

import './globals.css';
import { AppClientShell } from '@/components/app-client-shell';

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
        className="antialiased bg-background"
      >
        <AppClientShell>{children}</AppClientShell>
      </body>
    </html>
  );
}
