import type { Metadata } from 'next';

import './globals.css';
import { AppClientShell } from '@/components/app-client-shell';

export const metadata: Metadata = {
  title: 'KI-Register',
  description:
    'Use-case-first KI-Register fuer Dokumentation, Governance und Nachweisfuehrung.',
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
