import { ShieldCheck } from 'lucide-react';

interface VerificationScopePanelProps {
  locale: string;
  issuer: string;
  version: string;
  integrity: string;
  status: string;
  verifiedAt: string;
  scope: string[];
  limitation: string;
}

export function VerificationScopePanel({
  locale,
  issuer,
  version,
  integrity,
  status,
  verifiedAt,
  scope,
  limitation,
}: VerificationScopePanelProps) {
  const isGerman = locale === 'de';
  const rows = [
    [isGerman ? 'Herausgeber' : 'Issuer', issuer],
    [isGerman ? 'Version' : 'Version', version],
    [isGerman ? 'Integrität' : 'Integrity', integrity],
    [isGerman ? 'Status' : 'Status', status],
    [isGerman ? 'Geprüft am' : 'Verified at', verifiedAt],
  ] as const;

  return (
    <section className="border border-slate-200 bg-white px-6 py-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-slate-700" />
        <h2 className="text-sm font-medium text-slate-950">
          {isGerman ? 'Was genau wurde verifiziert?' : 'What exactly was verified?'}
        </h2>
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {label}
            </dt>
            <dd className="mt-2 text-sm leading-6 text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {isGerman ? 'Geltungsbereich' : 'Scope'}
        </p>
        <ul className="mt-3 space-y-2">
          {scope.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 border-t border-slate-200 pt-5 text-sm leading-7 text-slate-600">
        {limitation}
      </p>
    </section>
  );
}
