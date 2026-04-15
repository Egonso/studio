import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { AppClientShell } from '@/components/app-client-shell';
import { routing } from '@/i18n/routing';

const icons: Metadata['icons'] = {
  icon: [
    { url: '/register-logo.png', media: '(prefers-color-scheme: light)' },
    { url: '/register-logo-dark.png', media: '(prefers-color-scheme: dark)' },
  ],
  shortcut: [
    { url: '/register-logo.png', media: '(prefers-color-scheme: light)' },
    { url: '/register-logo-dark.png', media: '(prefers-color-scheme: dark)' },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
    icons,
  };
}

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
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppClientShell>{children}</AppClientShell>
    </NextIntlClientProvider>
  );
}
