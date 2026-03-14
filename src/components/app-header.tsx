'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, LogOut, Settings, UserCircle } from 'lucide-react';

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
  ROUTE_PATHS,
} from '@/lib/navigation/route-manifest';
import { appendWorkspaceScope } from '@/lib/navigation/workspace-scope';
import { useScopedRouteHrefs } from '@/lib/navigation/use-scoped-route-hrefs';
import { useWorkspaceScope } from '@/lib/navigation/use-workspace-scope';

export function AppHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { plan } = useCapability('trustPortal');
  const area = getProductAreaForPathname(pathname);
  const workspaceScope = useWorkspaceScope();
  const scopedHrefs = useScopedRouteHrefs();
  const brandHref = user
    ? area === 'paid_governance_control'
      ? scopedHrefs.control
      : scopedHrefs.register
    : ROUTE_PATHS.marketingHome;

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
        <div className="flex min-h-14 items-center gap-4 py-1.5">
          <Link href={brandHref} className="flex min-w-0 items-center gap-2.5" prefetch={false}>
            <ThemeAwareLogo
              alt="KI-Register"
              width={30}
              height={30}
              className="h-7 w-auto"
            />
            <div className="truncate text-[15px] font-semibold tracking-tight text-slate-950">
              KI-Register
            </div>
          </Link>

          {user ? (
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <WorkspaceSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                    <UserCircle className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
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
                      Einstellungen
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/gesetz"
                      className="flex cursor-pointer items-center gap-2"
                      prefetch={false}
                    >
                      <BookOpen className="h-4 w-4" />
                      Gesetz
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
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Abmelden
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
