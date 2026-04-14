import './globals.css';

// Minimal root layout – locale-specific layout lives in [locale]/layout.tsx
// next-intl middleware handles locale detection and prefix routing
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning className="antialiased bg-background">
        {children}
      </body>
    </html>
  );
}
