'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, QrCode } from 'lucide-react';

import { buildCertificateBadgeMarkup } from '@/lib/certification/badge';
import type { BadgeAlignment } from '@/lib/certification/types';
import { buildCertificateVerifyUrl } from '@/lib/certification/public';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CertificateBadgeCardProps {
  certificateCode: string;
  holderName: string;
  badgeAssetUrl?: string;
  className?: string;
  labels?: Partial<{
    title: string;
    copied: string;
    copy: string;
    openVerification: string;
    showQr: string;
    left: string;
    center: string;
    right: string;
  }>;
}

const DEFAULT_LABELS = {
  title: 'HTML/CSS-Badge',
  copied: 'Badge kopiert',
  copy: 'Embed-Code kopieren',
  openVerification: 'Verifikation öffnen',
  showQr: 'QR anzeigen',
  left: 'Links',
  center: 'Mitte',
  right: 'Rechts',
} as const;

export function CertificateBadgeCard({
  certificateCode,
  holderName,
  badgeAssetUrl,
  className,
  labels,
}: CertificateBadgeCardProps) {
  const [alignment, setAlignment] = useState<BadgeAlignment>('center');
  const [copied, setCopied] = useState(false);
  const [serverMarkup, setServerMarkup] = useState<string | null>(null);

  const copy = useMemo(
    () => ({
      ...DEFAULT_LABELS,
      ...labels,
    }),
    [labels],
  );

  const localMarkup = useMemo(
    () =>
      buildCertificateBadgeMarkup(
        {
          certificateCode,
          holderName,
        },
        alignment,
        badgeAssetUrl,
      ),
    [alignment, badgeAssetUrl, certificateCode, holderName],
  );
  const markup = serverMarkup ?? localMarkup;

  const verifyUrl = buildCertificateVerifyUrl(certificateCode);

  useEffect(() => {
    if (typeof badgeAssetUrl === 'string') {
      setServerMarkup(null);
      return;
    }

    let cancelled = false;

    async function loadMarkup() {
      try {
        const response = await fetch(
          `/api/certification/badge?code=${encodeURIComponent(certificateCode)}&alignment=${encodeURIComponent(alignment)}`,
        );
        if (!response.ok) {
          throw new Error('Badge preview unavailable');
        }

        const payload = (await response.json()) as { html?: string };
        if (!cancelled && payload.html) {
          setServerMarkup(payload.html);
        }
      } catch {
        if (!cancelled) {
          setServerMarkup(null);
        }
      }
    }

    void loadMarkup();

    return () => {
      cancelled = true;
    };
  }, [alignment, badgeAssetUrl, certificateCode]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markup);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card className={className}>
      <CardHeader className="space-y-3">
        <CardTitle className="text-lg">{copy.title}</CardTitle>
        <Tabs
          value={alignment}
          onValueChange={(value) => setAlignment(value as BadgeAlignment)}
        >
          <TabsList>
            <TabsTrigger value="left">{copy.left}</TabsTrigger>
            <TabsTrigger value="center">{copy.center}</TabsTrigger>
            <TabsTrigger value="right">{copy.right}</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div
            dangerouslySetInnerHTML={{ __html: markup }}
            className="min-h-14"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCopy}>
            {copied ? (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? copy.copied : copy.copy}
          </Button>
          <Button variant="outline" asChild>
            <a href={verifyUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {copy.openVerification}
            </a>
          </Button>
          <Button variant="ghost" asChild>
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                verifyUrl,
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <QrCode className="mr-2 h-4 w-4" />
              {copy.showQr}
            </a>
          </Button>
        </div>

        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
          {markup}
        </pre>
      </CardContent>
    </Card>
  );
}
