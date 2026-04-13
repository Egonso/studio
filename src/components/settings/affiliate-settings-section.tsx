'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAuth } from '@/context/auth-context';
import {
  getAffiliateCommissionHistory,
  getAffiliateProfile,
} from '@/app/actions/affiliate';
import type {
  AffiliateCommission,
  AffiliateRecord,
} from '@/lib/affiliate/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEur(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AffiliateSettingsSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<AffiliateRecord | null>(null);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [copied, setCopied] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectChecking, setConnectChecking] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const profile = await getAffiliateProfile(idToken);
      if (profile.isAffiliate) {
        setAffiliate(profile.affiliate);
        const comms = await getAffiliateCommissionHistory(idToken, 20);
        setCommissions(comms);
      } else {
        setAffiliate(null);
      }
    } catch (error) {
      console.error('Failed to load affiliate data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Check connect status on return from Stripe
  useEffect(() => {
    if (!user || !affiliate?.stripeConnectAccountId) return;

    const url = new URL(window.location.href);
    const connectParam = url.searchParams.get('connect');
    if (connectParam === 'complete' || connectParam === 'refresh') {
      setConnectChecking(true);
      user
        .getIdToken()
        .then((idToken) =>
          fetch('/api/affiliate/connect/callback', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        )
        .then(() => loadData())
        .finally(() => setConnectChecking(false));

      // Clean up URL
      url.searchParams.delete('connect');
      window.history.replaceState({}, '', url.toString());
    }
  }, [user, affiliate?.stripeConnectAccountId, loadData]);

  const handleCopy = async () => {
    if (!affiliate) return;
    await navigator.clipboard.writeText(
      `https://kiregister.com/ref/${affiliate.slug}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectStripe = async () => {
    if (!user) return;
    setConnectLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/affiliate/connect/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to create Connect account:', error);
    } finally {
      setConnectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!affiliate) {
    return null; // Not an affiliate – tab shouldn't be visible
  }

  const affiliateLink = `https://kiregister.com/ref/${affiliate.slug}`;

  return (
    <div className="space-y-6">
      {/* Affiliate Link */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            <CardTitle>Dein Affiliate-Link</CardTitle>
          </div>
          <CardDescription>
            Teile diesen Link mit deinem Netzwerk. Jeder Kauf über diesen Link wird dir als Provision gutgeschrieben.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border bg-muted/50 px-4 py-3">
              <code className="text-sm font-medium break-all">{affiliateLink}</code>
            </div>
            <Button onClick={handleCopy} variant="outline" size="lg">
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? 'Kopiert!' : 'Kopieren'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Klicks" value={affiliate.totalClicks.toString()} />
        <StatCard label="Registrierungen" value={affiliate.totalSignups.toString()} />
        <StatCard label="Käufe" value={affiliate.totalPurchases.toString()} />
        <StatCard label="Einnahmen" value={formatEur(affiliate.totalEarnings)} highlight />
      </div>

      {/* Stripe Connect */}
      <Card>
        <CardHeader>
          <CardTitle>Auszahlung via Stripe</CardTitle>
          <CardDescription>
            Verbinde dein Stripe-Konto, um Provisionen automatisch ausgezahlt zu bekommen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliate.stripeConnectOnboardingComplete ? (
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-green-600 text-white">
                <Check className="mr-1 h-3 w-3" />
                Stripe verbunden
              </Badge>
              <span className="text-sm text-muted-foreground">
                Ausgezahlt: {formatEur(affiliate.totalPaidOut)}
              </span>
            </div>
          ) : connectChecking ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verbindung wird überprüft...
            </div>
          ) : (
            <div className="space-y-3">
              {affiliate.stripeConnectAccountId && (
                <p className="text-sm text-amber-600">
                  Dein Stripe-Onboarding ist noch nicht abgeschlossen. Bitte schließe die Einrichtung ab.
                </p>
              )}
              <Button onClick={handleConnectStripe} disabled={connectLoading}>
                {connectLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <ExternalLink className="mr-2 h-4 w-4" />
                {affiliate.stripeConnectAccountId
                  ? 'Onboarding fortsetzen'
                  : 'Stripe-Konto verbinden'}
              </Button>
              {!affiliate.stripeConnectAccountId && (
                <p className="text-xs text-muted-foreground">
                  Provisionen werden gesammelt und ausgezahlt, sobald dein Stripe-Konto verbunden ist.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Provisionen</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Provisionen. Teile deinen Link, um loszulegen!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead className="text-right">Umsatz</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Provision</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => (
                  <TableRow key={c.commissionId}>
                    <TableCell className="text-sm">
                      {new Date(c.createdAt).toLocaleDateString('de-DE')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {maskEmail(c.referredEmail)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatEur(c.grossAmount)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {c.commissionRate}%
                      {c.isBoostPeriod && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Boost
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatEur(c.commissionAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.payoutStatus === 'transferred'
                            ? 'default'
                            : c.payoutStatus === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-xs"
                      >
                        {c.payoutStatus === 'transferred'
                          ? 'Ausgezahlt'
                          : c.payoutStatus === 'failed'
                            ? 'Fehler'
                            : c.payoutStatus === 'no_connect_account'
                              ? 'Kein Konto'
                              : 'Ausstehend'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? 'text-green-700' : ''}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
