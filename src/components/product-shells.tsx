import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

import { AppHeader } from '@/components/app-header';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ProductAreaId } from '@/lib/navigation/route-manifest';
import { cn } from '@/lib/utils';

interface ShellAction {
  href: string;
  label: string;
  variant?: 'default' | 'outline' | 'ghost';
}

interface AreaBadgeProps {
  area: ProductAreaId;
  className?: string;
}

const AREA_SECTION_LABELS: Record<ProductAreaId, string> = {
  public_marketing: 'Öffentlicher Einstieg',
  public_external_intake: 'Öffentliche Einreichung',
  signed_in_free_register: 'Register',
  paid_governance_control: 'Organisationssteuerung',
};

export function AreaBadge({ area, className }: AreaBadgeProps) {
  void area;
  void className;
  return null;
}

interface MarketingShellProps {
  children: React.ReactNode;
}

export function MarketingShell({ children }: MarketingShellProps) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}

interface PublicIntakeShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  meta?: React.ReactNode;
  asideTitle?: string;
  asideDescription?: string;
  asidePoints?: string[];
  actions?: ShellAction[];
}

export function PublicIntakeShell({
  title,
  description,
  children,
  meta,
  asideTitle = 'Einreichung und Prüfung',
  asideDescription = 'Die Angaben werden strukturiert entgegengenommen, intern geprüft und dem zuständigen Register zugeordnet.',
  asidePoints = [],
  actions = [],
}: PublicIntakeShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-semibold tracking-tight text-slate-950"
          >
            <ThemeAwareLogo
              alt="KI-Register"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span>KI-Register</span>
          </Link>
          {actions.length > 0 ? (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              {actions.map((action) => (
                <Button
                  key={`${action.href}-${action.label}`}
                  asChild
                  variant={action.variant ?? 'outline'}
                  size="sm"
                >
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
            </div>
          ) : null}
        </header>

        <div className="grid flex-1 gap-8 py-8 lg:gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
          <section className="space-y-8 pt-2">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {AREA_SECTION_LABELS.public_external_intake}
              </p>
              <h1 className="max-w-3xl text-3xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                {description}
              </p>
            </div>

            {meta ? (
              <div className="border-l-2 border-slate-300 pl-4 text-sm leading-6 text-slate-600">
                {meta}
              </div>
            ) : null}

            <div className="space-y-5 border-t border-slate-200 pt-8">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-950">{asideTitle}</p>
                <p className="max-w-2xl text-sm leading-7 text-slate-600">
                  {asideDescription}
                </p>
              </div>
              {asidePoints.length > 0 ? (
                <ul className="space-y-4">
                  {asidePoints.map((point) => (
                    <li key={point} className="flex items-start gap-4 text-sm leading-7 text-slate-700">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          <div className="mx-auto w-full max-w-xl">{children}</div>
        </div>
      </div>
    </div>
  );
}

interface SignedInAreaFrameProps {
  area: Extract<
    ProductAreaId,
    'signed_in_free_register' | 'paid_governance_control'
  >;
  brandHref?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  nextStep?: string;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  width?: '5xl' | '6xl';
  headerMode?: 'default' | 'hidden';
}

export function SignedInAreaFrame({
  area,
  brandHref,
  title,
  description,
  children,
  nextStep,
  actions,
  aside,
  width = '6xl',
  headerMode = 'default',
}: SignedInAreaFrameProps) {
  const showHeader = headerMode !== 'hidden';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader brandHref={brandHref} />
      <main className="flex-1 px-4 py-4 sm:px-6 md:px-8">
        <div
          className={cn(
            'mx-auto space-y-6',
            width === '5xl' ? 'max-w-5xl' : 'max-w-6xl',
          )}
        >
          {showHeader ? (
            <div
              className={cn(
                'gap-8',
                aside ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start' : '',
              )}
            >
              <section className="space-y-3 border-b border-slate-200 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {AREA_SECTION_LABELS[area]}
                </p>
                <div className="space-y-2">
                  <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-950 sm:text-[30px]">
                    {title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-slate-600">
                    {description}
                  </p>
                </div>
                {nextStep ? (
                  <div className="border-l-2 border-slate-300 pl-4 text-sm leading-6 text-slate-700">
                    <span className="font-medium text-slate-950">Nächster Schritt:</span>{' '}
                    {nextStep}
                  </div>
                ) : null}
                {actions ? <div className="flex flex-wrap gap-2 pt-2">{actions}</div> : null}
              </section>

              {aside ? <aside className="space-y-4">{aside}</aside> : null}
            </div>
          ) : null}

          {children}
        </div>
      </main>
    </div>
  );
}

interface PageStatePanelProps {
  title: string;
  description: string;
  area?: ProductAreaId;
  tone?: 'default' | 'error' | 'success' | 'loading';
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageStatePanel({
  title,
  description,
  area = 'signed_in_free_register',
  tone = 'default',
  icon,
  actions,
}: PageStatePanelProps) {
  void area;

  const Icon =
    icon ??
    (tone === 'success'
      ? CheckCircle2
      : tone === 'error'
        ? AlertTriangle
        : tone === 'loading'
          ? Loader2
          : FileText);

  const iconClassName =
    tone === 'success'
      ? 'text-gray-700'
      : tone === 'error'
        ? 'text-slate-700'
        : 'text-slate-500';

  const panelClassName =
    tone === 'success'
      ? 'border-gray-200'
      : tone === 'error'
        ? 'border-slate-300'
        : 'border-slate-200';

  return (
    <Card className={cn('overflow-hidden', panelClassName)}>
      <CardContent className="flex flex-col items-start gap-4 py-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <Icon
              className={cn('h-5 w-5', tone === 'loading' && 'animate-spin', iconClassName)}
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
