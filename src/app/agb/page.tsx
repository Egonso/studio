import type { Metadata } from 'next';

import {
  LegalPageShell,
  LegalSection,
} from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'AGB | KI-Register',
  description:
    'Allgemeine Geschaeftsbedingungen fuer die Nutzung des KI-Registers.',
};

export default function AgbPage() {
  return (
    <LegalPageShell
      title="Allgemeine Geschaeftsbedingungen"
      description="Bedingungen fuer Nutzung, Buchung und Bereitstellung des KI-Registers. Die Inhalte wurden aus den bisherigen AGB uebernommen und auf die aktuelle Register-, Governance- und Download-Loesung angepasst."
    >
      <LegalSection title="1. Geltungsbereich">
        <p>
          Diese Allgemeinen Geschaeftsbedingungen gelten fuer alle
          Vertragsverhaeltnisse zwischen den Anbietern ZukunftBilden GmbH und
          BewusstseinBilden UG (haftungsbeschraenkt), nachfolgend gemeinsam
          Anbieter, und den Kundinnen und Kunden sowie Nutzerinnen und Nutzern
          des KI-Registers.
        </p>
        <p>
          Sie gelten fuer die Nutzung des KI-Registers, fuer kostenpflichtige
          Governance-, Export- oder Academy-Leistungen, fuer Downloads sowie
          fuer damit verbundene Zusatzleistungen.
        </p>
      </LegalSection>

      <LegalSection title="2. Vertragsschluss und Zugang">
        <p>
          Die Darstellung von Leistungen auf der Website stellt noch kein
          verbindliches Angebot dar, sondern eine Aufforderung zur Abgabe einer
          Bestellung oder Registrierung.
        </p>
        <p>
          Ein Nutzungsverhaeltnis kommt durch Registrierung, Freischaltung eines
          Kontos, Bestaetigung einer Bestellung oder Bereitstellung eines
          gebuchten Leistungsumfangs zustande.
        </p>
        <p>
          Bei Teambeitritt, Einladungscode oder externer Einreichung gelten
          zusaetzlich die jeweils angezeigten Zugangsvoraussetzungen und
          Kontexte.
        </p>
      </LegalSection>

      <LegalSection title="3. Preise und Zahlung">
        <p>
          Soweit kostenpflichtige Leistungen gebucht werden, gelten die zum
          Zeitpunkt der Bestellung angezeigten Preise.
        </p>
        <p>
          Die Zahlung kann insbesondere ueber Stripe abgewickelt werden. Zugang
          zu kostenpflichtigen Leistungsbestandteilen wird nach bestaetigtem
          Zahlungseingang oder bestaetigter Entitlement-Zuordnung freigeschaltet.
        </p>
      </LegalSection>

      <LegalSection title="4. Leistungsumfang">
        <p>
          Der konkrete Leistungsumfang ergibt sich aus der jeweils gebuchten
          oder freigeschalteten Produktstufe. Dazu koennen insbesondere
          gehoeren:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Registerfuehrung fuer KI-Einsatzfaelle</li>
          <li>Erfassung interner und externer Einreichungen</li>
          <li>Review-, Audit- und Exportfunktionen</li>
          <li>Governance-Einstellungen und Organisationssteuerung</li>
          <li>Academy-, Kurs- und Lerninhalte</li>
          <li>Downloads und Quick-Capture-Werkzeuge</li>
        </ul>
        <p>
          Inhalte, Vorlagen und Funktionen duerfen weiterentwickelt, aktualisiert
          oder ersetzt werden, sofern der Vertragszweck dadurch nicht
          unzumutbar beeintraechtigt wird.
        </p>
      </LegalSection>

      <LegalSection title="5. Nutzungsrechte und Nutzerkonten">
        <p>
          Alle Inhalte, Vorlagen, Texte, Grafiken, Exporte, Kursmaterialien und
          Softwarebestandteile des KI-Registers sind urheberrechtlich
          geschuetzt.
        </p>
        <p>
          Mit der Nutzung wird ein einfaches, nicht uebertragbares Recht zur
          vertragsgemaessen Nutzung eingeraeumt. Eine Weitergabe von
          Zugangsdaten oder eine unberechtigte Vervielfaeltigung von Inhalten
          ist unzulaessig.
        </p>
      </LegalSection>

      <LegalSection title="6. Pflichten der Nutzerinnen und Nutzer">
        <ul className="list-disc space-y-1 pl-5">
          <li>Zugangsdaten sind vertraulich zu behandeln.</li>
          <li>Angaben bei Registrierung und Nutzung muessen zutreffend sein.</li>
          <li>
            Das System darf nicht missbraeuchlich genutzt oder technisch
            beeintraechtigt werden.
          </li>
          <li>
            Fuer Inhalte in Registereintraegen und Einreichungen bleibt die
            nutzende Organisation verantwortlich.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Widerruf fuer Verbraucher">
        <p>
          Verbraucherinnen und Verbraucher haben grundsaetzlich ein gesetzliches
          Widerrufsrecht. Zur Ausuebung genuegt eine eindeutige Erklaerung per
          E-Mail oder Post an einen der Anbieter.
        </p>
        <p>
          Bei digitalen Inhalten kann das Widerrufsrecht vorzeitig erloeschen,
          wenn mit der Leistungsausfuehrung erst begonnen wurde, nachdem die
          ausdrueckliche Zustimmung hierzu erteilt und die Kenntnis ueber das
          Erloeschen bestaetigt wurde.
        </p>
      </LegalSection>

      <LegalSection title="8. Haftung und Gewaehrleistung">
        <p>
          Die Anbieter haften unbeschraenkt bei Vorsatz, grober Fahrlaessigkeit
          sowie fuer Schaeden aus der Verletzung von Leben, Koerper oder
          Gesundheit.
        </p>
        <p>
          Im Uebrigen ist die Haftung auf den vorhersehbaren, vertragstypischen
          Schaden begrenzt, soweit wesentliche Vertragspflichten verletzt
          wurden.
        </p>
        <p>
          Das KI-Register dient der Dokumentation, Steuerung und Nachweisfuehrung.
          Es ersetzt keine individuelle Rechtsberatung. Eine Garantie dafuer,
          dass durch die Nutzung saemtliche rechtlichen Anforderungen eines
          konkreten Einzelfalls erfuellt werden, wird nicht uebernommen.
        </p>
      </LegalSection>

      <LegalSection title="9. Datenschutz">
        <p>
          Personenbezogene Daten werden ausschliesslich nach Massgabe der
          gesetzlichen Vorschriften und der gesonderten Datenschutzerklaerung
          verarbeitet.
        </p>
      </LegalSection>

      <LegalSection title="10. Vertragsbeendigung">
        <p>
          Vertrage ueber Einmalleistungen enden mit vollstaendiger Erbringung
          der gebuchten Leistung, soweit nichts anderes vereinbart wurde.
        </p>
        <p>
          Das Recht zur ausserordentlichen Kuendigung aus wichtigem Grund bleibt
          unberuehrt, insbesondere bei Missbrauch, Weitergabe von Zugangsdaten
          oder schwerwiegenden Verstoessen gegen diese Bedingungen.
        </p>
      </LegalSection>

      <LegalSection title="11. Schlussbestimmungen">
        <p>
          Es gilt das Recht der Republik Oesterreich unter Ausschluss des
          UN-Kaufrechts, soweit dem keine zwingenden Verbraucherschutzvorschriften
          entgegenstehen.
        </p>
        <p>
          Gerichtsstand fuer Kaufleute, juristische Personen des oeffentlichen
          Rechts oder oeffentlich-rechtliche Sondervermoegen ist Salzburg,
          Oesterreich.
        </p>
        <p>
          Sollten einzelne Bestimmungen unwirksam sein oder werden, bleibt die
          Wirksamkeit der uebrigen Bestimmungen unberuehrt.
        </p>
      </LegalSection>

      <LegalSection title="12. Online-Streitbeilegung">
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

      <p className="text-xs text-slate-500">Stand: 12. Maerz 2026</p>
    </LegalPageShell>
  );
}
