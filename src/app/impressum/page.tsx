import type { Metadata } from 'next';

import {
  LegalPageShell,
  LegalSection,
} from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Impressum | KI-Register',
  description:
    'Anbieterangaben, Kontakt und rechtliche Pflichtinformationen zum KI-Register.',
};

export default function ImpressumPage() {
  return (
    <LegalPageShell
      title="Impressum"
      description="Anbieterangaben und Pflichtinformationen fuer das KI-Register. Die Inhalte basieren auf den bisherigen Live-Angaben und wurden fuer die aktuelle Register-Loesung zusammengefuehrt."
    >
      <LegalSection title="Angaben gemaess § 5 TMG und § 25 MedienG">
        <p>
          Das KI-Register wird gemeinsam von zwei gleichberechtigten Partnern
          betrieben:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
            <p>Magazinstrasse 4/Top 5</p>
            <p>5020 Salzburg</p>
            <p>Oesterreich</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">
              BewusstseinBilden UG (haftungsbeschraenkt)
            </p>
            <p>Auerfeldstr. 24 Rgb</p>
            <p>81541 Muenchen</p>
            <p>Deutschland</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Register- und Unternehmensangaben">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
            <p>Firmenbuchnummer: FN 619238 w</p>
            <p>Firmenbuchgericht: Landesgericht Salzburg</p>
            <p>UID-Nummer: ATU80300513</p>
            <p>Beginn der Rechtsform: 04.01.2024</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">
              BewusstseinBilden UG (haftungsbeschraenkt)
            </p>
            <p>Handelsregister: HRB 304412</p>
            <p>Registergericht: Amtsgericht Muenchen</p>
            <p>Status: Aktiv</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Vertretungsberechtigte Geschaeftsfuehrung">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
            <p>Momo Maximilian Feichtinger</p>
            <p>Alleinvertretungsberechtigt</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">
              BewusstseinBilden UG (haftungsbeschraenkt)
            </p>
            <p>Alexander Zoltan Gal</p>
            <p>Geschaeftsfuehrer</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Kontakt">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
            <p>E-Mail: office@momofeichtinger.com</p>
            <p>Telefon: +43 681 816 55313</p>
            <p>Adresse: Magazinstrasse 4/Top 5, 5020 Salzburg, Oesterreich</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">
              BewusstseinBilden UG (haftungsbeschraenkt)
            </p>
            <p>E-Mail: zoltangal@web.de</p>
            <p>Telefon: +49 (0) 179 204 4465</p>
            <p>Adresse: Auerfeldstr. 24 Rgb, 81541 Muenchen, Deutschland</p>
          </div>
        </div>
        <p>Website: https://kiregister.com</p>
      </LegalSection>

      <LegalSection title="Unternehmensgegenstand">
        <p>
          Das KI-Register dient der organisationsinternen Dokumentation,
          Steuerung und Nachweisfuehrung von KI-Einsatzfaellen sowie der
          Bereitstellung von Schulungs-, Export- und Governance-Funktionen fuer
          Unternehmen und Organisationen.
        </p>
        <p>
          Gemeinsame Taetigkeit der Anbieter ist die Entwicklung und der Betrieb
          der Plattform sowie die Bereitstellung von Materialien, Kursen und
          begleitenden Services im Umfeld von EU-AI-Act-Compliance,
          Governance-Strukturen und revisionssicherer Dokumentation.
        </p>
      </LegalSection>

      <LegalSection title="Aufsicht, Berufsrecht und Streitbeilegung">
        <p>Aufsichtsbehoerde: Bezirkshauptmannschaft Salzburg-Stadt</p>
        <p>Es gelten insbesondere folgende Regelwerke:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Gewerbeordnung (GewO) Oesterreich</li>
          <li>Unternehmensgesetzbuch (UGB) Oesterreich</li>
          <li>Datenschutz-Grundverordnung (DSGVO)</li>
        </ul>
        <p>
          Die Europaeische Kommission stellt eine Plattform zur
          Online-Streitbeilegung bereit:
          {' '}
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
          Wir sind nicht bereit oder verpflichtet, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </LegalSection>

      <LegalSection title="Haftung und Hinweise">
        <p>
          Fuer eigene Inhalte gelten die allgemeinen gesetzlichen Vorschriften.
          Verlinkte externe Inhalte liegen in der Verantwortung der jeweiligen
          Anbieter.
        </p>
        <p>
          Alle Inhalte dieser Website und der Plattform sind urheberrechtlich
          geschuetzt. Downloads und Kopien sind nur im gesetzlich zulaessigen
          Umfang gestattet.
        </p>
        <p>
          Keine Rechtsberatung: Das KI-Register und begleitende Inhalte dienen
          der Dokumentation, Strukturierung und Wissensvermittlung. Sie ersetzen
          keine individuelle rechtliche Beratung durch eine zugelassene
          Rechtsanwaeltin oder einen zugelassenen Rechtsanwalt.
        </p>
      </LegalSection>

      <p className="text-xs text-slate-500">Stand: 12. Maerz 2026</p>
    </LegalPageShell>
  );
}
