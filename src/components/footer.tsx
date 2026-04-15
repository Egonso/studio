'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { localizeHref } from '@/lib/i18n/localize-href';

const WHITEPAPER_HREF = '/downloads/KIregister_Whitepaper_EU_AI_Act.pdf';

export function Footer() {
  const locale = useLocale();
  const t = useTranslations();
  const appName = t('metadata.appName');

  const FOOTER_LINKS = [
    { href: localizeHref(locale, '/'), label: t('footer.home') },
    { href: localizeHref(locale, '/downloads'), label: t('nav.downloads') },
    { href: localizeHref(locale, '/my-register'), label: t('nav.register') },
    { href: localizeHref(locale, '/control'), label: t('footer.report') },
    { href: localizeHref(locale, '/legal-notice'), label: t('footer.legalNotice') },
    { href: localizeHref(locale, '/privacy'), label: t('footer.privacy') },
    { href: localizeHref(locale, '/terms'), label: t('footer.terms') },
    { href: WHITEPAPER_HREF, label: t('nav.whitepaper'), external: true },
  ];

  return (
    <footer className="w-full border-t border-slate-200 bg-white/95 text-slate-500 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 text-xs sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-medium text-slate-700">{appName}</span>
          {FOOTER_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-slate-950"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-slate-950"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {`© ${new Date().getFullYear()} ${appName} – ZukunftBilden GmbH & BewusstseinBilden UG (haftungsbeschränkt)`}
          </p>
          <p>{t('footer.allDataInEU')}</p>
        </div>
      </div>
    </footer>
  );
}
