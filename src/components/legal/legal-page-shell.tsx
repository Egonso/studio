import Link from 'next/link';

import { MarketingShell } from '@/components/product-shells';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';

export function LegalPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <MarketingShell>
      <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950"
          >
            <ThemeAwareLogo
              alt="AI Register"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span>AI Register</span>
          </Link>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <Link
              href="/downloads"
              className="underline-offset-4 hover:text-slate-950 hover:underline"
            >
              Downloads
            </Link>
            <a
              href="/downloads/KIregister_Whitepaper_EU_AI_Act.pdf"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:text-slate-950 hover:underline"
            >
              Whitepaper
            </a>
          </div>
        </header>

        <div className="space-y-10">
          <section className="space-y-3 border-b border-slate-200 pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Legal
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              {description}
            </p>
          </section>

          <div className="space-y-10 text-sm leading-7 text-slate-700">
            {children}
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
