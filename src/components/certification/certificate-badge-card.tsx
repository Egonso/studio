'use client';

import { useMemo, useState } from 'react';
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
}

export function CertificateBadgeCard({
  certificateCode,
  holderName,
  badgeAssetUrl,
  className,
}: CertificateBadgeCardProps) {
  const [alignment, setAlignment] = useState<BadgeAlignment>('center');
  const [copied, setCopied] = useState(false);

  const markup = useMemo(
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

  const verifyUrl = buildCertificateVerifyUrl(certificateCode);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markup);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card className={className}>
      <CardHeader className="space-y-3">
        <CardTitle className="text-lg">HTML/CSS-Badge</CardTitle>
        <Tabs
          value={alignment}
          onValueChange={(value) => setAlignment(value as BadgeAlignment)}
        >
          <TabsList>
            <TabsTrigger value="left">Links</TabsTrigger>
            <TabsTrigger value="center">Mitte</TabsTrigger>
            <TabsTrigger value="right">Rechts</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-950/95 p-6">
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
            {copied ? 'Badge kopiert' : 'Embed-Code kopieren'}
          </Button>
          <Button variant="outline" asChild>
            <a href={verifyUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Verifikation öffnen
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
              QR anzeigen
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
