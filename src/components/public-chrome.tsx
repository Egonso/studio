import Link from 'next/link';

import { ThemeAwareLogo } from '@/components/theme-aware-logo';

/**
 * Einheitlicher Header für öffentliche Seiten (Plattform, Fortbildung, …).
 * Spiegelt die Chrome-Navigation der Landing: Anmelden · Beitreten · Anlegen.
 */
export function SiteHeader({ locale }: { locale: string }) {
  const isEn = locale === 'en';

  return (
    <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
      <Link
        href={`/${locale}`}
        className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950"
      >
        <ThemeAwareLogo
          alt="KI Register"
          width={34}
          height={34}
          className="h-8 w-auto"
        />
        <span>{isEn ? 'AI Register' : 'KI Register'}</span>
      </Link>
      <nav className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 sm:w-auto">
        <Link
          href={`/${locale}/academy/ki-kompetenz`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
        >
          {isEn ? 'Free training (DE)' : 'Kostenlose Schulung'}
        </Link>
        <Link
          href={`/${locale}/fortbildung`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
        >
          {isEn ? 'Training package' : 'Fortbildung'}
        </Link>
        <Link
          href={`/${locale}?mode=login`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
        >
          {isEn ? 'Sign in' : 'Anmelden'}
        </Link>
        <Link
          href={`/${locale}?mode=signup&intent=join_register`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
        >
          {isEn ? 'Join a register' : 'Register beitreten'}
        </Link>
        <Link
          href={`/${locale}?mode=signup&intent=create_register`}
          className="border border-slate-950 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-slate-950 hover:text-white"
        >
          {isEn ? 'Set up register' : 'Register anlegen'}
        </Link>
      </nav>
    </header>
  );
}
