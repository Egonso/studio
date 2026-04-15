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
      title: 'AGB | KI Register',
      description:
        'Allgemeine Geschäftsbedingungen für die Nutzung des KI Registers.',
    };
  }

  return {
    title: 'Terms of Service | AI Registry',
    description:
      'General terms and conditions for the use of AI Registry.',
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;

  if (locale === 'de') {
    return (
      <LegalPageShell
        title="AGB"
        description="Bedingungen für Nutzung, Buchung und Bereitstellung des KI Registers. Diese AGB basieren auf den ursprünglichen deutschsprachigen Bedingungen und wurden auf die aktuelle Register-, Governance- und Download-Lösung angepasst."
      >
        <LegalSection title="1. Geltungsbereich">
          <p>
            Diese Allgemeinen Geschäftsbedingungen gelten für sämtliche
            Vertragsbeziehungen zwischen den Anbietern ZukunftBilden GmbH und
            BewusstseinBilden UG (haftungsbeschränkt), nachfolgend gemeinsam
            Anbieter genannt, und den Kundinnen, Kunden und Nutzenden des KI
            Registers.
          </p>
          <p>
            Sie gelten für die Nutzung des KI Registers, für kostenpflichtige
            Governance-, Export- oder Academy-Leistungen, für Downloads sowie
            für damit zusammenhängende Nebenleistungen.
          </p>
        </LegalSection>

        <LegalSection title="2. Vertragsschluss und Zugang">
          <p>
            Die Darstellung der Leistungen auf der Website stellt kein
            verbindliches Angebot dar, sondern eine Aufforderung zur Bestellung
            oder Registrierung.
          </p>
          <p>
            Ein Vertragsverhältnis kommt mit Registrierung, Aktivierung eines
            Kontos, Bestätigung einer Bestellung oder Bereitstellung des
            gebuchten Leistungsumfangs zustande.
          </p>
          <p>
            Soweit der Zugang über Teambeitritt, Einladungscode oder externe
            Einreichung erfolgt, gelten ergänzend die jeweils angezeigten
            Zugangsvoraussetzungen und Bedingungen.
          </p>
        </LegalSection>

        <LegalSection title="3. Preise und Zahlung">
          <p>
            Soweit kostenpflichtige Leistungen gebucht werden, gelten die zum
            Zeitpunkt der Bestellung ausgewiesenen Preise.
          </p>
          <p>
            Die Zahlung kann unter anderem über Stripe abgewickelt werden. Der
            Zugang zu kostenpflichtigen Funktionen wird nach bestätigtem
            Zahlungseingang oder bestätigter Berechtigungszuweisung
            freigeschaltet.
          </p>
        </LegalSection>

        <LegalSection title="4. Leistungsumfang">
          <p>
            Der konkrete Leistungsumfang richtet sich nach der gebuchten oder
            aktivierten Produktstufe. Dazu können insbesondere gehören:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Registerführung für KI-Einsatzfälle</li>
            <li>Erfassung interner und externer Einreichungen</li>
            <li>Review-, Audit- und Exportfunktionen</li>
            <li>Governance-Einstellungen und Organisationssteuerung</li>
            <li>Academy-, Kurs- und Lerninhalte</li>
            <li>Downloads und Quick-Capture-Werkzeuge</li>
          </ul>
          <p>
            Inhalte, Vorlagen und Funktionen können weiterentwickelt,
            aktualisiert oder ersetzt werden, soweit der Vertragszweck dadurch
            nicht unzumutbar beeinträchtigt wird.
          </p>
        </LegalSection>

        <LegalSection title="5. Nutzungsrechte und Nutzerkonten">
          <p>
            Sämtliche Inhalte, Vorlagen, Texte, Grafiken, Exporte, Kursmaterialien
            und Softwarebestandteile des KI Registers sind urheberrechtlich
            geschützt.
          </p>
          <p>
            Mit der Nutzung wird ein einfaches, nicht übertragbares Recht
            eingeräumt, den Dienst vertragsgemäß zu nutzen. Die Weitergabe von
            Zugangsdaten oder unbefugte Vervielfältigung von Inhalten ist
            unzulässig.
          </p>
        </LegalSection>

        <LegalSection title="6. Pflichten der Nutzenden">
          <ul className="list-disc space-y-1 pl-5">
            <li>Zugangsdaten sind vertraulich aufzubewahren.</li>
            <li>
              Angaben bei Registrierung und Nutzung müssen zutreffend sein.
            </li>
            <li>
              Das System darf nicht missbräuchlich genutzt oder technisch
              kompromittiert werden.
            </li>
            <li>
              Für Inhalte von Registereinträgen und Einreichungen bleibt die
              einreichende Organisation verantwortlich.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="7. Widerrufsrecht für Verbraucher:innen">
          <p>
            Verbraucherinnen und Verbraucher haben ein gesetzliches
            Widerrufsrecht von 14 Tagen gemäß den Art. 9 bis 16 der
            Verbraucherrechte-Richtlinie (Richtlinie 2011/83/EU). Zur Ausübung
            genügt eine eindeutige Erklärung per E-Mail oder Post an einen der
            Anbieter.
          </p>
          <p>
            Bei digitalen Inhalten kann das Widerrufsrecht vorzeitig erlöschen,
            wenn mit der Ausführung erst begonnen wird, nachdem die
            Verbraucherin oder der Verbraucher ausdrücklich zugestimmt und die
            Kenntnis vom Verlust des Widerrufsrechts bestätigt hat.
          </p>
        </LegalSection>

        <LegalSection title="8. Haftung und Gewährleistung">
          <p>
            Die Anbieter haften unbeschränkt bei Vorsatz, grober Fahrlässigkeit
            sowie für Schäden aus der Verletzung des Lebens, des Körpers oder
            der Gesundheit.
          </p>
          <p>
            Im Übrigen ist die Haftung auf den vorhersehbaren, typischerweise
            eintretenden Schaden begrenzt, soweit eine wesentliche
            Vertragspflicht verletzt wurde.
          </p>
          <p>
            Das KI Register dient der Dokumentation, Governance und
            Nachweisführung. Es ersetzt keine individuelle Rechtsberatung. Es
            wird keine Gewähr dafür übernommen, dass die Nutzung des Dienstes in
            jedem Einzelfall sämtliche rechtlichen Anforderungen erfüllt.
          </p>
        </LegalSection>

        <LegalSection title="9. Datenschutz">
          <p>
            Personenbezogene Daten werden ausschließlich nach Maßgabe der
            geltenden gesetzlichen Bestimmungen und der gesonderten
            Datenschutzerklärung verarbeitet.
          </p>
        </LegalSection>

        <LegalSection title="10. Beendigung">
          <p>
            Verträge über Einzelleistungen enden mit vollständiger Erbringung
            der gebuchten Leistung, sofern nichts Abweichendes vereinbart ist.
          </p>
          <p>
            Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt
            unberührt, insbesondere bei Missbrauch, Weitergabe von Zugangsdaten
            oder erheblichen Verstößen gegen diese Bedingungen.
          </p>
        </LegalSection>

        <LegalSection title="11. Schlussbestimmungen">
          <p>
            Es gilt das Recht der Republik Österreich unter Ausschluss des
            UN-Kaufrechts, soweit dem keine zwingenden verbraucherschützenden
            Vorschriften entgegenstehen.
          </p>
          <p>
            Wenn Sie Verbraucher:in mit gewöhnlichem Aufenthalt in der EU sind,
            genießen Sie zusätzlich den Schutz zwingender Bestimmungen des
            Rechts Ihres Aufenthaltsstaats (Art. 6 Abs. 2 Rom-I-Verordnung).
          </p>
          <p>
            Gerichtsstand für Kaufleute, juristische Personen des öffentlichen
            Rechts oder öffentlich-rechtliche Sondervermögen ist Salzburg,
            Österreich.
          </p>
          <p>
            Sollten einzelne Bestimmungen unwirksam sein oder werden, bleibt die
            Wirksamkeit der übrigen Bestimmungen unberührt.
          </p>
        </LegalSection>

        <LegalSection title="12. Online-Streitbeilegung">
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

        <p className="text-xs text-slate-500">Stand: 12. März 2026</p>
      </LegalPageShell>
    );
  }

  return (
    <LegalPageShell
      title="Terms of Service"
      description="Terms governing the use, booking and provision of AI Registry. These terms are based on the original German-language conditions, adapted for the current register, governance and download solution."
    >
      <LegalSection title="1. Scope">
        <p>
          These Terms of Service apply to all contractual relationships between
          the Providers ZukunftBilden GmbH and BewusstseinBilden UG
          (haftungsbeschraenkt), hereinafter jointly referred to as the
          Providers, and the customers and users of AI Registry.
        </p>
        <p>
          They apply to the use of AI Registry, to paid governance, export or
          academy services, to downloads and to any related ancillary services.
        </p>
      </LegalSection>

      <LegalSection title="2. Conclusion of Contract and Access">
        <p>
          The presentation of services on the website does not constitute a
          binding offer but an invitation to place an order or register.
        </p>
        <p>
          A contractual relationship is established upon registration,
          activation of an account, confirmation of an order or provision of the
          booked scope of services.
        </p>
        <p>
          Where access is gained by joining a team, using an invitation code or
          through an external submission, the access requirements and conditions
          displayed at the time shall additionally apply.
        </p>
      </LegalSection>

      <LegalSection title="3. Prices and Payment">
        <p>
          Where paid services are booked, the prices displayed at the time of
          the order shall apply.
        </p>
        <p>
          Payment may be processed via Stripe, among other methods. Access to
          paid features is granted upon confirmed receipt of payment or confirmed
          entitlement allocation.
        </p>
      </LegalSection>

      <LegalSection title="4. Scope of Services">
        <p>
          The specific scope of services depends on the product tier booked or
          activated. This may include, in particular:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Registry management for AI use cases</li>
          <li>Recording of internal and external submissions</li>
          <li>Review, audit and export functions</li>
          <li>Governance settings and organisational controls</li>
          <li>Academy, course and learning content</li>
          <li>Downloads and quick-capture tools</li>
        </ul>
        <p>
          Content, templates and features may be further developed, updated or
          replaced, provided that the purpose of the contract is not
          unreasonably impaired as a result.
        </p>
      </LegalSection>

      <LegalSection title="5. Usage Rights and User Accounts">
        <p>
          All content, templates, texts, graphics, exports, course materials
          and software components of AI Registry are protected by copyright.
        </p>
        <p>
          Upon use, a simple, non-transferable right to use the service in
          accordance with the contract is granted. Sharing access credentials or
          unauthorised duplication of content is prohibited.
        </p>
      </LegalSection>

      <LegalSection title="6. User Obligations">
        <ul className="list-disc space-y-1 pl-5">
          <li>Access credentials must be kept confidential.</li>
          <li>
            Information provided during registration and use must be accurate.
          </li>
          <li>
            The system must not be used in an abusive manner or technically
            compromised.
          </li>
          <li>
            The submitting organisation remains responsible for the content of
            register entries and submissions.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Right of Withdrawal for Consumers">
        <p>
          Consumers have a statutory right of withdrawal of 14 days in
          accordance with Articles 9–16 of the Consumer Rights Directive
          (Directive 2011/83/EU). To exercise this right, it is sufficient to
          send a clear statement by e-mail or post to one of the Providers.
        </p>
        <p>
          For digital content, the right of withdrawal may expire prematurely if
          performance has commenced only after the consumer has given express
          consent and has acknowledged the loss of the right of withdrawal.
        </p>
      </LegalSection>

      <LegalSection title="8. Liability and Warranty">
        <p>
          The Providers shall have unlimited liability in cases of intent, gross
          negligence and for damage arising from injury to life, body or health.
        </p>
        <p>
          Otherwise, liability is limited to the foreseeable, typically
          occurring damage, insofar as a material contractual obligation has been
          breached.
        </p>
        <p>
          AI Registry serves the purpose of documentation, governance and
          record-keeping. It does not replace individual legal advice. No
          guarantee is given that use of the service will satisfy all legal
          requirements of a specific individual case.
        </p>
      </LegalSection>

      <LegalSection title="9. Data Protection">
        <p>
          Personal data is processed exclusively in accordance with the
          applicable statutory provisions and the separate privacy policy.
        </p>
      </LegalSection>

      <LegalSection title="10. Termination">
        <p>
          Contracts for one-off services end upon full delivery of the booked
          service, unless otherwise agreed.
        </p>
        <p>
          The right to extraordinary termination for good cause remains
          unaffected, in particular in cases of misuse, sharing of access
          credentials or serious breaches of these terms.
        </p>
      </LegalSection>

      <LegalSection title="11. Final Provisions">
        <p>
          The law of the Republic of Austria shall apply, excluding the UN
          Convention on Contracts for the International Sale of Goods (CISG),
          insofar as this does not conflict with mandatory consumer protection
          provisions.
        </p>
        <p>
          If you are a consumer habitually resident in the EU, you additionally
          enjoy the protection afforded by mandatory provisions of the law of
          your country of habitual residence (Art. 6(2) Rome I Regulation).
        </p>
        <p>
          The place of jurisdiction for merchants, legal entities under public
          law or special funds under public law is Salzburg, Austria.
        </p>
        <p>
          Should individual provisions be or become invalid, the validity of the
          remaining provisions shall remain unaffected.
        </p>
      </LegalSection>

      <LegalSection title="12. Online Dispute Resolution">
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
          resolution proceedings before a consumer arbitration board.
        </p>
      </LegalSection>

      <p className="text-xs text-slate-500">Last updated: 12 March 2026</p>
    </LegalPageShell>
  );
}
