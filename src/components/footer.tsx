import Image from 'next/image';
import Link from 'next/link';

const WHITEPAPER_HREF = '/downloads/KIregister_Whitepaper_EU_AI_Act.pdf';
const PRODUCT_LINKS = [
  { href: '/', label: 'Startseite' },
  { href: '/downloads', label: 'Downloads' },
  { href: '/my-register', label: 'Register' },
  { href: '/control', label: 'Bericht' },
];
const TRUST_LINKS = [
  { href: WHITEPAPER_HREF, label: 'Whitepaper', external: true },
  { href: '/impressum', label: 'Impressum' },
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/agb', label: 'AGB' },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-600">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 border-b border-slate-200 pb-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-slate-950 transition-opacity hover:opacity-80"
            >
              <Image
                src="/register-logo.png"
                alt="KI-Register"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  KI-Register
                </p>
                <p className="text-sm font-medium leading-6 text-slate-900">
                  Dokumentation, Governance und Nachweisführung an einem Ort.
                </p>
              </div>
            </Link>

            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Für Register, Quick Capture, Governance-Berichte und belastbare
              Nachweise rund um den KI-Einsatz in Organisationen.
            </p>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
                Alle Nutzerdaten bleiben in der EU
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
                Ein Produktfluss für Register, Bericht und Trust-Signale
              </span>
            </div>
          </div>

          <nav aria-label="Produktnavigation" className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Produkt
            </p>
            <ul className="space-y-3 text-sm">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-slate-950"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Recht und Ressourcen" className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Recht &amp; Ressourcen
            </p>
            <ul className="space-y-3 text-sm">
              {TRUST_LINKS.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-slate-950"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-slate-950"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-2 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} KI-Register by ZukunftBilden GmbH
            &amp; BewusstseinBilden UG
          </p>
          <p>Offener Dokumentationsstandard für nachvollziehbare KI-Governance.</p>
        </div>
      </div>
    </footer>
  );
}
