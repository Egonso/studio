import type { Metadata } from 'next';

import {
  LegalPageShell,
  LegalSection,
} from '@/components/legal/legal-page-shell';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'de') {
    return {
      title: 'Impressum | KI Register',
      description:
        'Anbieterangaben, Kontaktdaten und Pflichtinformationen für das KI Register.',
    };
  }

  return {
    title: 'Legal Notice | AI Registry',
    description:
      'Provider information, contact details and mandatory legal disclosures for AI Registry.',
  };
}

export default async function LegalNoticePage({ params }: Props) {
  const { locale } = await params;

  if (locale === 'de') {
    return (
      <LegalPageShell
        title="Impressum"
        description="Anbieterangaben und gesetzlich vorgeschriebene Offenlegungen für das KI Register gemäß E-Commerce-Richtlinie Art. 5, § 5 DDG und § 25 MedienG. Die nachstehenden Angaben basieren auf den bestehenden Live-Offenlegungen und wurden für die aktuelle Register-Lösung konsolidiert."
      >
        <LegalSection title="Angaben gemäß § 5 DDG und § 25 MedienG">
          <p>Das KI Register wird von zwei gleichberechtigten Partnern betrieben:</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
              <p>Magazinstrasse 4/Top 5</p>
              <p>5020 Salzburg</p>
              <p>Österreich</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">
                BewusstseinBilden UG (haftungsbeschränkt)
              </p>
              <p>Auerfeldstr. 24 Rgb</p>
              <p>81541 München</p>
              <p>Deutschland</p>
            </div>
          </div>
        </LegalSection>

        <LegalSection title="Register- und Unternehmensdaten">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
              <p>Firmenbuchnummer: FN 619238 w</p>
              <p>Firmenbuchgericht: Landesgericht Salzburg</p>
              <p>UID: ATU80300513</p>
              <p>Gründungsdatum: 04.01.2024</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">
                BewusstseinBilden UG (haftungsbeschränkt)
              </p>
              <p>Handelsregister: HRB 304412</p>
              <p>Registergericht: Amtsgericht München</p>
              <p>Status: Aktiv</p>
            </div>
          </div>
        </LegalSection>

        <LegalSection title="Vertretungsberechtigte Personen">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
              <p>Momo Maximilian Feichtinger</p>
              <p>Einzelvertretungsbefugt</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">
                BewusstseinBilden UG (haftungsbeschränkt)
              </p>
              <p>Alexander Zoltan Gal</p>
              <p>Geschäftsführer</p>
            </div>
          </div>
        </LegalSection>

        <LegalSection title="Kontakt">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
              <p>E-Mail: office@momofeichtinger.com</p>
              <p>Telefon: +43 681 816 55313</p>
              <p>Adresse: Magazinstrasse 4/Top 5, 5020 Salzburg, Österreich</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">
                BewusstseinBilden UG (haftungsbeschränkt)
              </p>
              <p>E-Mail: zoltangal@web.de</p>
              <p>Telefon: +49 (0) 179 204 4465</p>
              <p>Adresse: Auerfeldstr. 24 Rgb, 81541 München, Deutschland</p>
            </div>
          </div>
          <p>Website: https://airegist.com</p>
        </LegalSection>

        <LegalSection title="Unternehmensgegenstand">
          <p>
            Das KI Register dient Organisationen als internes Werkzeug zur
            Dokumentation, Steuerung und Nachweisführung von KI-Einsatzfällen
            sowie zur Bereitstellung von Trainings-, Export- und
            Governance-Funktionen.
          </p>
          <p>
            Gegenstand der gemeinsamen Tätigkeit der Anbieter ist die
            Entwicklung und der Betrieb der Plattform sowie die Bereitstellung
            von Materialien, Kursen und begleitenden Leistungen in den Bereichen
            EU AI Act Compliance, Governance-Strukturen und revisionssichere
            Dokumentation.
          </p>
        </LegalSection>

        <LegalSection title="Aufsichtsbehörde, Berufsrecht und Streitbeilegung">
          <p>Aufsichtsbehörde: Bezirkshauptmannschaft Salzburg-Stadt</p>
          <p>Es gelten insbesondere folgende Regelwerke:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Gewerbeordnung (GewO), Österreich</li>
            <li>Unternehmensgesetzbuch (UGB)</li>
            <li>Datenschutz-Grundverordnung (DSGVO)</li>
          </ul>
          <p>
            Die Europäische Kommission stellt eine Plattform zur
            Online-Streitbeilegung bereit:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
          <p>
            Wir sind weder verpflichtet noch bereit, an
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen.
          </p>
        </LegalSection>

        <LegalSection title="Haftung und Hinweise">
          <p>
            Eigene Inhalte unterliegen den jeweils geltenden gesetzlichen
            Bestimmungen. Für verlinkte externe Inhalte sind ausschließlich die
            jeweiligen Anbieter verantwortlich.
          </p>
          <p>
            Sämtliche Inhalte dieser Website und der Plattform sind
            urheberrechtlich geschützt. Downloads und Vervielfältigungen sind
            nur im gesetzlich zulässigen Umfang gestattet.
          </p>
          <p>
            Keine Rechtsberatung: Das KI Register und die begleitenden Inhalte
            dienen der Dokumentation, Strukturierung und Wissensvermittlung. Sie
            stellen keine individuelle Rechtsberatung dar und ersetzen diese
            nicht.
          </p>
        </LegalSection>

        <p className="text-xs text-slate-500">Stand: 12. März 2026</p>
      </LegalPageShell>
    );
  }

  return (
    <LegalPageShell
      title="Legal Notice"
      description="Provider information and mandatory disclosures for AI Registry pursuant to E-Commerce Directive Art. 5, Section 5 DDG and Section 25 MedienG (Austrian Media Act). The details below are based on the existing live disclosures and have been consolidated for the current register solution."
    >
      <LegalSection title="Information pursuant to Section 5 DDG and Section 25 MedienG">
        <p>AI Registry is jointly operated by two equal partners:</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
            <p>Magazinstrasse 4/Top 5</p>
            <p>5020 Salzburg</p>
            <p>Austria</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">
              BewusstseinBilden UG (haftungsbeschraenkt)
            </p>
            <p>Auerfeldstr. 24 Rgb</p>
            <p>81541 Muenchen</p>
            <p>Germany</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Registration and Company Details">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
            <p>Commercial Register Number: FN 619238 w</p>
            <p>Commercial Register Court: Landesgericht Salzburg</p>
            <p>VAT ID: ATU80300513</p>
            <p>Incorporation date: 04.01.2024</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">
              BewusstseinBilden UG (haftungsbeschraenkt)
            </p>
            <p>Commercial Register: HRB 304412</p>
            <p>Register Court: Local Court (Amtsgericht) Muenchen</p>
            <p>Status: Active</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Authorised Managing Directors">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
            <p>Momo Maximilian Feichtinger</p>
            <p>Sole power of representation</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">
              BewusstseinBilden UG (haftungsbeschraenkt)
            </p>
            <p>Alexander Zoltan Gal</p>
            <p>Managing Director</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Contact">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
            <p>Email: office@momofeichtinger.com</p>
            <p>Telephone: +43 681 816 55313</p>
            <p>Address: Magazinstrasse 4/Top 5, 5020 Salzburg, Austria</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">
              BewusstseinBilden UG (haftungsbeschraenkt)
            </p>
            <p>Email: zoltangal@web.de</p>
            <p>Telephone: +49 (0) 179 204 4465</p>
            <p>Address: Auerfeldstr. 24 Rgb, 81541 Muenchen, Germany</p>
          </div>
        </div>
        <p>Website: https://airegist.com</p>
      </LegalSection>

      <LegalSection title="Business Purpose">
        <p>
          AI Registry serves as an internal tool for organisations to document,
          manage and evidence AI use cases, and to provide training, export and
          governance features for businesses and organisations.
        </p>
        <p>
          The joint activity of the providers is the development and operation
          of the platform as well as the provision of materials, courses and
          accompanying services in the areas of EU AI Act compliance,
          governance structures and audit-proof documentation.
        </p>
      </LegalSection>

      <LegalSection title="Supervisory Authority, Professional Regulations and Dispute Resolution">
        <p>Supervisory authority: Bezirkshauptmannschaft Salzburg-Stadt</p>
        <p>The following regulatory frameworks apply in particular:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Trade Regulation Act (GewO), Austria</li>
          <li>Austrian Commercial Code (UGB)</li>
          <li>General Data Protection Regulation (GDPR)</li>
        </ul>
        <p>
          The European Commission provides a platform for online dispute
          resolution:{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            https://ec.europa.eu/consumers/odr
          </a>
        </p>
        <p>
          We are neither obliged nor willing to participate in dispute
          resolution proceedings before a consumer arbitration body.
        </p>
      </LegalSection>

      <LegalSection title="Liability and Notices">
        <p>
          Our own content is subject to the applicable statutory provisions.
          Linked external content remains the responsibility of the respective
          provider.
        </p>
        <p>
          All content on this website and on the platform is protected by
          copyright. Downloads and copies are only permitted to the extent
          allowed by law.
        </p>
        <p>
          No legal advice: AI Registry and accompanying content are intended for
          documentation, structuring and knowledge sharing. They do not
          constitute and are no substitute for individual legal advice from a
          qualified legal professional.
        </p>
      </LegalSection>

      <p className="text-xs text-slate-500">Last updated: 12 March 2026</p>
    </LegalPageShell>
  );
}
