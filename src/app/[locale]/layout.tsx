import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AppClientShell } from '@/components/app-client-shell';
import { routing } from '@/i18n/routing';

export const metadata: Metadata = {
  title: 'AI Register',
  description:
    'Use-case-first AI Register for documentation, governance and evidence management under the EU AI Act.',
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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppClientShell>{children}</AppClientShell>
    </NextIntlClientProvider>
  );
}
