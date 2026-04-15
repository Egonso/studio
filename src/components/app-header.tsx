'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './locale-switcher';
import { BookOpen, Bot, Link2, LogOut, Settings, UserCircle } from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { clearActiveProjectId } from '@/lib/data-service';
import { isAdminEmail } from '@/lib/admin-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { WorkspaceSwitcher } from './layout/workspace-switcher';
import { ThemeAwareLogo } from './theme-aware-logo';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useCapability } from '@/lib/compliance-engine/capability/useCapability';
import {
  getProductAreaForPathname,
  getVisiblePremiumControlNav,
  isPremiumControlNavActive,
} from '@/lib/navigation/route-manifest';
import { resolveAppHeaderBrandHref } from '@/lib/navigation/app-header-brand';
import { appendWorkspaceScope } from '@/lib/navigation/workspace-scope';
import { useScopedRouteHrefs } from '@/lib/navigation/use-scoped-route-hrefs';
import { useWorkspaceScope } from '@/lib/navigation/use-workspace-scope';
import { useIsAffiliate } from '@/lib/affiliate/use-is-affiliate';

interface AppHeaderProps {
  brandHref?: string;
}

export function AppHeader({ brandHref: brandHrefOverride }: AppHeaderProps = {}) {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { plan } = useCapability('trustPortal');
  const area = getProductAreaForPathname(pathname);
  const workspaceScope = useWorkspaceScope();
  const scopedHrefs = useScopedRouteHrefs();
  const resolvedBrandHref = resolveAppHeaderBrandHref({
    area,
    isAuthenticated: Boolean(user),
    scopedRegisterHref: scopedHrefs.register,
    scopedControlHref: scopedHrefs.control,
    overrideHref: brandHrefOverride,
  });

  const { isAffiliate } = useIsAffiliate();
  const premiumNavItems = getVisiblePremiumControlNav(plan);
  const showControlNav =
    area === 'paid_governance_control' && premiumNavItems.length > 0;

  const handleLogout = async () => {
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      await auth.signOut();
      clearActiveProjectId();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 pt-2 md:px-6">
        <div className="flex min-h-14 flex-wrap items-center gap-3 py-1.5 sm:flex-nowrap sm:gap-4">
          <Link
            href={resolvedBrandHref}
            className="flex min-w-0 flex-1 items-center gap-2.5 sm:flex-none"
            prefetch={false}
          >
            <ThemeAwareLogo
              alt="AI Register"
              width={30}
              height={30}
              className="h-7 w-auto"
            />
            <div className="truncate text-[15px] font-semibold tracking-tight text-slate-950">
              {t('metadata.appName')}
            </div>
          </Link>

          {user ? (
            <div className="flex w-full items-center justify-end gap-2 sm:ml-auto sm:w-auto sm:gap-3">
              <LocaleSwitcher />
              <WorkspaceSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                    <UserCircle className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={scopedHrefs.settings}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      {t('nav.settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={scopedHrefs.settingsAgentKit}
                      className="flex cursor-pointer items-center gap-2"
                      prefetch={false}
                    >
                      <Bot className="h-4 w-4" />
                      {t('nav.agentKit')}
                    </Link>
                  </DropdownMenuItem>
                  {isAffiliate ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings?section=affiliate"
                        className="flex cursor-pointer items-center gap-2"
                        prefetch={false}
                      >
                        <Link2 className="h-4 w-4" />
                        {t('nav.affiliate')}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem asChild>
                    <Link
                      href="/law"
                      className="flex cursor-pointer items-center gap-2"
                      prefetch={false}
                    >
                      <BookOpen className="h-4 w-4" />
                      {t('nav.law')}
                    </Link>
                  </DropdownMenuItem>
                  {isAdminEmail(user.email) ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin"
                        className="flex cursor-pointer items-center gap-2"
                        prefetch={false}
                      >
                        <Settings className="h-4 w-4" />
                        {t('nav.admin')}
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>
      </div>

      {user && showControlNav ? (
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <nav className="flex items-center gap-5 overflow-x-auto pb-2 pt-0.5">
            {premiumNavItems.map((item) => {
              const active = isPremiumControlNavActive(
                item,
                pathname,
                searchParams,
              );

              return (
                <Link
                  key={item.id}
                  href={appendWorkspaceScope(item.href, workspaceScope)}
                  prefetch={false}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center border-b-2 px-0 text-[14px] font-medium transition-colors',
                    active
                      ? 'border-slate-950 text-slate-950'
                      : 'border-transparent text-slate-600 hover:text-slate-950',
                  )}
                  title={item.description}
                >
                  {item.id === 'overview' ? 'Control' : item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
