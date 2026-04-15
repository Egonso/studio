'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const WHITEPAPER_HREF = '/downloads/KIregister_Whitepaper_EU_AI_Act.pdf';

export function Footer() {
  const t = useTranslations();

  const FOOTER_LINKS = [
    { href: '/', label: t('footer.home') },
    { href: '/downloads', label: 'Downloads' },
    { href: '/my-register', label: 'Register' },
    { href: '/control', label: t('footer.report') },
    { href: '/legal-notice', label: t('footer.legalNotice') },
    { href: '/privacy', label: t('footer.privacy') },
    { href: '/terms', label: t('footer.terms') },
    { href: WHITEPAPER_HREF, label: 'Whitepaper', external: true },
  ];

  return (
    <footer className="w-full border-t border-slate-200 bg-white/95 text-slate-500 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 text-xs sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-medium text-slate-700">AI Register</span>
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
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p>{t('footer.allDataInEU')}</p>
        </div>
      </div>
    </footer>
  );
}
