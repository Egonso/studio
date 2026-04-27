'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  getVisiblePremiumControlNav,
  isPremiumControlNavActive,
  isPremiumControlNavItemLocked,
} from '@/lib/navigation/route-manifest';
import { getPremiumControlNavCopy } from '@/lib/i18n/governance-copy';
import { appendWorkspaceScope } from '@/lib/navigation/workspace-scope';
import { useWorkspaceScope } from '@/lib/navigation/use-workspace-scope';
import type { SubscriptionPlan } from '@/lib/register-first/types';
import { cn } from '@/lib/utils';

interface ControlNavCardProps {
  plan: SubscriptionPlan | null | undefined;
  pathname: string;
}

export function ControlNavCard({ plan, pathname }: ControlNavCardProps) {
  const locale = useLocale();
  const workspaceScope = useWorkspaceScope();
  const items = getVisiblePremiumControlNav(plan);
  const copy =
    locale === 'de'
      ? {
          title: 'Governance-Navigation',
          description: 'Organisationsweite Bereiche in klarer Struktur.',
          locked: 'in der Organisationssteuerung verfügbar',
        }
      : {
          title: 'Governance Navigation',
          description: 'Organisation-wide areas in a clear structure.',
          locked: 'available in organisation controls',
        };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="space-y-1 pb-3">
        <h2 className="text-base font-semibold text-slate-950">
          {copy.title}
        </h2>
        <p className="text-sm text-slate-600">
          {copy.description}
        </p>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const active = isPremiumControlNavActive(item, pathname);
          const locked = isPremiumControlNavItemLocked(item, plan);
          const navCopy = getPremiumControlNavCopy(item.id, locale);

          return (
            <Link
              key={item.id}
              href={appendWorkspaceScope(item.href, workspaceScope)}
              className={cn(
                'block rounded-md border px-3 py-3 transition-colors',
                active
                  ? 'border-slate-900 bg-white text-slate-950'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-white',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{navCopy.label}</div>
                  <p
                    className={cn(
                      'text-xs leading-5',
                      active ? 'text-slate-700' : 'text-slate-600',
                    )}
                  >
                    {navCopy.description}
                  </p>
                </div>
                {locked ? (
                  <span className="text-[11px] text-slate-500">
                    {copy.locked}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
