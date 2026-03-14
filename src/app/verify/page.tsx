'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, QrCode, ShieldCheck } from 'lucide-react';

import { MarketingShell } from '@/components/product-shells';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function normalizeCertificateCode(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

export default function VerifyLookupPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedCode = normalizeCertificateCode(code);
    if (!normalizedCode) {
      setError('Bitte geben Sie einen Zertifikatscode ein.');
      return;
    }

    setError(null);
    router.push(`/verify/${encodeURIComponent(normalizedCode)}`);
  };

  return (
    <MarketingShell>
      <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-12 flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Öffentliche Verifikation
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section className="space-y-8">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Zertifikate direkt im KI-Register prüfen
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Zertifikat prüfen
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                Prüfen Sie den Status eines Zertifikats über den Code auf dem Dokument, dem
                Badge oder dem QR-Code. Aktive, abgelaufene und widerrufene Nachweise werden
                hier transparent ausgewiesen.
              </p>
            </div>

            <form
              className="space-y-4 border-y border-slate-200 py-8"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  autoComplete="off"
                  className="h-12 flex-1 rounded-none border-slate-300 font-mono text-base uppercase tracking-[0.16em]"
                  inputMode="text"
                  name="certificate-code"
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="KI-EU-2024-6752"
                  value={code}
                />
                <Button className="h-12 rounded-none px-6 text-base" type="submit">
                  Zertifikat prüfen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Beispielcode: KI-EU-2024-6752
              </p>
              {error ? <p className="text-sm text-slate-900">{error}</p> : null}
            </form>
          </section>

          <aside className="space-y-4">
            <div className="border border-slate-200 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center border border-slate-900 text-slate-950">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-slate-950">Was wird geprüft?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Status, Zertifikatscode, zertifizierte Person, Ausstellungsdatum, Gültigkeit
                und Zertifizierungsumfang.
              </p>
            </div>

            <div className="border border-slate-200 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center border border-slate-900 text-slate-950">
                <QrCode className="h-4 w-4" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-slate-950">Badge oder QR-Code</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Ein Klick auf den Badge oder das Scannen des QR-Codes führt direkt zur
                gleichen Verifikationsansicht mit dem zugehörigen Zertifikatscode.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </MarketingShell>
  );
}
