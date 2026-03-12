import type { Metadata } from 'next';

import {
  LegalPageShell,
  LegalSection,
} from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Datenschutz | KI-Register',
  description:
    'Hinweise zur Verarbeitung personenbezogener Daten im KI-Register.',
};

export default function DatenschutzPage() {
  return (
    <LegalPageShell
      title="Datenschutzerklaerung"
      description="Hinweise zur Verarbeitung personenbezogener Daten im KI-Register. Die Inhalte basieren auf der bisherigen Datenschutzerklaerung und wurden auf die aktuelle Register-, Intake-, Export- und Governance-Loesung angepasst."
    >
      <LegalSection title="1. Verantwortliche Stellen">
        <p>
          Verantwortliche fuer die Datenverarbeitung im Zusammenhang mit dem
          KI-Register sind gemeinsam:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
            <p>Magazinstrasse 4/Top 5, 5020 Salzburg, Oesterreich</p>
            <p>E-Mail: office@momofeichtinger.com</p>
            <p>Telefon: +43 681 816 55313</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">
              BewusstseinBilden UG (haftungsbeschraenkt)
            </p>
            <p>Auerfeldstr. 24 Rgb, 81541 Muenchen, Deutschland</p>
            <p>E-Mail: zoltangal@web.de</p>
            <p>Telefon: +49 (0) 179 204 4465</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="2. Welche Daten wir verarbeiten">
        <p>Wir verarbeiten insbesondere folgende Datenkategorien:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Konto- und Profildaten wie Name, E-Mail-Adresse und Login-Daten</li>
          <li>
            Register-, Organisations- und Use-Case-Daten, die von Nutzerinnen
            und Nutzern dokumentiert werden
          </li>
          <li>
            Daten aus externen Einreichungen, etwa ueber Zugangscode oder
            Lieferantenlink
          </li>
          <li>
            technische Nutzungsdaten, Server-Logs und sicherheitsrelevante
            Ereignisse
          </li>
          <li>
            Zahlungs- und Abrechnungsdaten, soweit kostenpflichtige Leistungen
            gebucht werden
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Zwecke und Rechtsgrundlagen">
        <p>Die Verarbeitung erfolgt insbesondere zu folgenden Zwecken:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Bereitstellung und Betrieb des KI-Registers</li>
          <li>Dokumentation, Bearbeitung und Export von KI-Einsatzfaellen</li>
          <li>Abwicklung von Anmeldung, Login und Team-Zugriffen</li>
          <li>Entgegennahme und Nachverfolgung externer Einreichungen</li>
          <li>Abrechnung kostenpflichtiger Leistungen</li>
          <li>Stabilitaet, Sicherheit, Missbrauchsverhinderung und Support</li>
        </ul>
        <p>
          Rechtsgrundlagen sind insbesondere Art. 6 Abs. 1 lit. b DSGVO
          (Vertrag und vorvertragliche Massnahmen), Art. 6 Abs. 1 lit. c DSGVO
          (rechtliche Verpflichtungen) und Art. 6 Abs. 1 lit. f DSGVO
          (berechtigtes Interesse an sicherem und zuverlaessigem Betrieb).
        </p>
      </LegalSection>

      <LegalSection title="4. Hosting, Infrastruktur und Datenstandort">
        <p>
          Das KI-Register ist auf EU-Datenhaltung ausgelegt. Registerdaten,
          Organisationsdaten, Use-Case-Dokumentation und externe Einreichungen
          werden innerhalb der EU verarbeitet und gespeichert.
        </p>
        <p>
          Fuer Authentifizierung, Datenbank, Speicher, Serverfunktionen und
          Plattformbetrieb nutzen wir technische Dienstleister im Umfeld von
          Google Firebase und Google Cloud. Soweit Zahlungsabwicklung erfolgt,
          setzen wir Stripe ein.
        </p>
        <p>
          Dienstleister erhalten nur insoweit Zugriff, wie dies fuer die
          Erbringung ihrer Leistungen erforderlich ist und auf geeigneten
          vertraglichen Grundlagen beruht.
        </p>
      </LegalSection>

      <LegalSection title="5. Externe Einreichungen und No-Login-Erfassung">
        <p>
          Wenn Angaben ueber Zugangscode oder signierten Lieferantenlink
          eingereicht werden, speichern wir die uebermittelten Inhalte,
          Absenderangaben, Zeitpunkt, Einreichungsquelle und zugehoerige
          Referenzen, um die Einreichung intern pruefen und revisionssicher
          nachvollziehen zu koennen.
        </p>
        <p>
          Diese Verarbeitung erfolgt zur Durchfuehrung des jeweiligen
          Einreichungsprozesses und zur Wahrung berechtigter Interessen an
          Nachweis, Sicherheit und Governance.
        </p>
      </LegalSection>

      <LegalSection title="6. Zahlungsabwicklung">
        <p>
          Fuer kostenpflichtige Leistungen kann die Zahlungsabwicklung ueber
          Stripe erfolgen. Zahlungsdaten werden dabei direkt vom jeweiligen
          Zahlungsdienstleister verarbeitet. Im KI-Register speichern wir nur
          die fuer Entitlement, Abrechnung, Nachweis und Support erforderlichen
          Vertrags- und Referenzdaten.
        </p>
      </LegalSection>

      <LegalSection title="7. Speicherdauer">
        <p>
          Personenbezogene Daten speichern wir nur so lange, wie dies fuer den
          jeweiligen Zweck erforderlich ist oder gesetzliche
          Aufbewahrungspflichten bestehen.
        </p>
        <p>
          Register- und Auditdaten koennen zusaetzlich laenger gespeichert
          werden, soweit dies fuer Nachweis, Export, Governance oder rechtliche
          Pflichten erforderlich ist.
        </p>
      </LegalSection>

      <LegalSection title="8. Ihre Rechte">
        <p>Sie haben insbesondere folgende Rechte nach der DSGVO:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Recht auf Auskunft gemaess Art. 15 DSGVO</li>
          <li>Recht auf Berichtigung gemaess Art. 16 DSGVO</li>
          <li>Recht auf Loeschung gemaess Art. 17 DSGVO</li>
          <li>Recht auf Einschraenkung gemaess Art. 18 DSGVO</li>
          <li>Recht auf Datenuebertragbarkeit gemaess Art. 20 DSGVO</li>
          <li>Widerspruchsrecht gemaess Art. 21 DSGVO</li>
        </ul>
        <p>
          Zusaetzlich steht Ihnen ein Beschwerderecht bei einer zustaendigen
          Datenschutzaufsichtsbehoerde zu.
        </p>
      </LegalSection>

      <LegalSection title="9. Kontakt fuer Datenschutzanliegen">
        <p>
          Datenschutzanfragen koennen Sie an
          {' '}
          <a
            href="mailto:office@momofeichtinger.com"
            className="underline underline-offset-4"
          >
            office@momofeichtinger.com
          </a>
          {' '}
          richten.
        </p>
      </LegalSection>

      <LegalSection title="10. Aenderungen dieser Datenschutzerklaerung">
        <p>
          Wir passen diese Datenschutzerklaerung an, wenn dies wegen
          Weiterentwicklungen des Produkts, geaenderter Prozesse oder neuer
          rechtlicher Anforderungen erforderlich wird.
        </p>
      </LegalSection>

      <p className="text-xs text-slate-500">Stand: 12. Maerz 2026</p>
    </LegalPageShell>
  );
}
