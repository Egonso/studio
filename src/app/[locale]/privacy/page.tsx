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
      title: 'Datenschutz | KI Register',
      description:
        'Informationen zur Verarbeitung personenbezogener Daten im KI Register.',
    };
  }

  return {
    title: 'Privacy Policy | AI Registry',
    description:
      'Information on the processing of personal data in AI Registry.',
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;

  if (locale === 'de') {
    return (
      <LegalPageShell
        title="Datenschutz"
        description="Informationen zur Verarbeitung personenbezogener Daten im KI Register. Die Inhalte basieren auf der bestehenden Datenschutzerklärung und wurden auf die aktuelle Register-, Intake-, Export- und Governance-Lösung angepasst."
      >
        <LegalSection title="1. Gemeinsam Verantwortliche">
          <p>
            Für die Datenverarbeitung im Zusammenhang mit dem KI Register sind
            folgende Parteien im Sinne des Art. 26 DSGVO gemeinsam
            verantwortlich:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
              <p>Magazinstrasse 4/Top 5, 5020 Salzburg, Österreich</p>
              <p>E-Mail: office@momofeichtinger.com</p>
              <p>Telefon: +43 681 816 55313</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">
                BewusstseinBilden UG (haftungsbeschränkt)
              </p>
              <p>Auerfeldstr. 24 Rgb, 81541 München, Deutschland</p>
              <p>E-Mail: zoltangal@web.de</p>
              <p>Telefon: +49 (0) 179 204 4465</p>
            </div>
          </div>
        </LegalSection>

        <LegalSection title="2. Kategorien der verarbeiteten Daten">
          <p>
            Wir verarbeiten insbesondere folgende Kategorien personenbezogener
            Daten:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Konto- und Profildaten wie Name, E-Mail-Adresse und Login-Daten
            </li>
            <li>
              Register-, Organisations- und Einsatzfalldaten, die von
              Nutzerinnen und Nutzern dokumentiert werden
            </li>
            <li>
              Daten aus externen Einreichungen, etwa über Zugangscode oder
              Lieferantenlink
            </li>
            <li>
              Technische Nutzungsdaten, Server-Logs und sicherheitsrelevante
              Ereignisse
            </li>
            <li>
              Zahlungs- und Abrechnungsdaten, soweit kostenpflichtige Leistungen
              gebucht werden
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Zwecke und Rechtsgrundlagen">
          <p>
            Die Verarbeitung erfolgt insbesondere zu folgenden Zwecken:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Bereitstellung und Betrieb des KI Registers</li>
            <li>Dokumentation, Bearbeitung und Export von KI-Einsatzfällen</li>
            <li>Abwicklung von Registrierung, Login und Teamzugängen</li>
            <li>Entgegennahme und Nachverfolgung externer Einreichungen</li>
            <li>Abrechnung kostenpflichtiger Leistungen</li>
            <li>Stabilität, Sicherheit, Missbrauchsprävention und Support</li>
          </ul>
          <p>
            Rechtsgrundlagen sind insbesondere Art. 6 Abs. 1 lit. b DSGVO
            (Vertragserfüllung und vorvertragliche Maßnahmen), Art. 6 Abs. 1
            lit. c DSGVO (rechtliche Verpflichtung) sowie Art. 6 Abs. 1 lit. f
            DSGVO (berechtigtes Interesse am sicheren und verlässlichen Betrieb
            des Angebots).
          </p>
        </LegalSection>

        <LegalSection title="4. Hosting, Infrastruktur und Datenstandort">
          <p>
            Das KI Register ist auf Datenverarbeitung innerhalb der EU
            ausgerichtet. Registerdaten, Organisationsdaten, Dokumentationen von
            Einsatzfällen und externe Einreichungen werden innerhalb der
            Europäischen Union verarbeitet und gespeichert.
          </p>
          <p>
            Für Authentifizierung, Datenbank, Speicher, Serverfunktionen und
            Plattformbetrieb nutzen wir technische Dienstleister aus dem Google
            Firebase- und Google Cloud-Umfeld. Soweit Zahlungsabwicklung
            stattfindet, nutzen wir Stripe.
          </p>
          <p>
            Dienstleister erhalten Zugriff nur in dem Umfang, der für die
            Erbringung ihrer Leistungen erforderlich ist, und auf Grundlage
            entsprechender vertraglicher Vereinbarungen. Sofern Daten
            grenzüberschreitend innerhalb der EU verarbeitet werden, verbleiben
            sie im Europäischen Wirtschaftsraum und unterliegen fortlaufend der
            DSGVO.
          </p>
        </LegalSection>

        <LegalSection title="5. Externe Einreichungen und Datenerfassung ohne Login">
          <p>
            Wenn Informationen über einen Zugangscode oder einen signierten
            Lieferantenlink eingereicht werden, speichern wir die übermittelten
            Inhalte, Absenderangaben, Zeitstempel, Einreichungsquelle und
            zugehörige Referenzen, um die Einreichung intern zu prüfen und
            revisionssicher nachzuhalten.
          </p>
          <p>
            Diese Verarbeitung erfolgt zur Durchführung des jeweiligen
            Einreichungsprozesses sowie zur Wahrung berechtigter Interessen an
            Dokumentation, Sicherheit und Governance.
          </p>
        </LegalSection>

        <LegalSection title="6. Zahlungsabwicklung">
          <p>
            Für kostenpflichtige Leistungen kann die Zahlungsabwicklung über
            Stripe erfolgen. Zahlungsdaten werden dabei unmittelbar vom
            jeweiligen Zahlungsdienstleister verarbeitet. Im KI Register selbst
            speichern wir nur die Vertrags- und Referenzdaten, die für
            Berechtigung, Abrechnung, Dokumentation und Support erforderlich
            sind.
          </p>
        </LegalSection>

        <LegalSection title="7. Speicherdauer">
          <p>
            Wir speichern personenbezogene Daten nur so lange, wie dies für den
            jeweiligen Zweck erforderlich ist oder gesetzliche
            Aufbewahrungspflichten bestehen.
          </p>
          <p>
            Register- und Auditdaten können darüber hinaus länger aufbewahrt
            werden, soweit dies für Dokumentation, Export, Governance oder
            rechtliche Verpflichtungen notwendig ist.
          </p>
        </LegalSection>

        <LegalSection title="8. Ihre Rechte">
          <p>Ihnen stehen insbesondere folgende Rechte nach der DSGVO zu:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Auskunft nach Art. 15 DSGVO</li>
            <li>Berichtigung nach Art. 16 DSGVO</li>
            <li>Löschung nach Art. 17 DSGVO</li>
            <li>Einschränkung der Verarbeitung nach Art. 18 DSGVO</li>
            <li>Datenübertragbarkeit nach Art. 20 DSGVO</li>
            <li>Widerspruch nach Art. 21 DSGVO</li>
          </ul>
          <p>
            Sie haben außerdem das Recht, sich bei einer zuständigen
            Aufsichtsbehörde zu beschweren. Federführende Aufsichtsbehörde für
            die ZukunftBilden GmbH ist die Österreichische Datenschutzbehörde,
            Barichgasse 40-42, 1030 Wien, Österreich;{' '}
            <a
              href="https://www.dsb.gv.at"
              className="underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              www.dsb.gv.at
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="9. Kontakt für Datenschutzanfragen">
          <p>
            Datenschutzanfragen können an{' '}
            <a
              href="mailto:office@momofeichtinger.com"
              className="underline underline-offset-4"
            >
              office@momofeichtinger.com
            </a>{' '}
            gerichtet werden.
          </p>
        </LegalSection>

        <LegalSection title="10. Änderungen dieser Datenschutzerklärung">
          <p>
            Wir können diese Datenschutzerklärung anpassen, wenn dies aufgrund
            von Produktweiterentwicklungen, Änderungen unserer Prozesse oder
            neuer rechtlicher Anforderungen erforderlich wird.
          </p>
        </LegalSection>

        <p className="text-xs text-slate-500">Stand: 12. März 2026</p>
      </LegalPageShell>
    );
  }

  return (
    <LegalPageShell
      title="Privacy Policy"
      description="Information on the processing of personal data in AI Registry. The contents are based on the existing privacy policy and have been adapted to the current register, intake, export and governance solution."
    >
      <LegalSection title="1. Joint Controllers">
        <p>
          The following parties are jointly responsible for data processing in
          connection with AI Registry pursuant to Art. 26 GDPR:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">ZukunftBilden GmbH</p>
            <p>Magazinstrasse 4/Top 5, 5020 Salzburg, Austria</p>
            <p>E-mail: office@momofeichtinger.com</p>
            <p>Phone: +43 681 816 55313</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">
              BewusstseinBilden UG (haftungsbeschraenkt)
            </p>
            <p>Auerfeldstr. 24 Rgb, 81541 Muenchen, Germany</p>
            <p>E-mail: zoltangal@web.de</p>
            <p>Phone: +49 (0) 179 204 4465</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="2. Categories of Data We Process">
        <p>We process the following categories of personal data in particular:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Account and profile data such as name, e-mail address and login
            credentials
          </li>
          <li>
            Register, organisation and use-case data documented by users
          </li>
          <li>
            Data from external submissions, for example via access code or
            supplier link
          </li>
          <li>
            Technical usage data, server logs and security-relevant events
          </li>
          <li>
            Payment and billing data, insofar as paid services are purchased
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Purposes and Legal Bases">
        <p>Processing is carried out for the following purposes in particular:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Provision and operation of AI Registry</li>
          <li>Documentation, processing and export of AI use cases</li>
          <li>Handling of registration, login and team access</li>
          <li>Receipt and tracking of external submissions</li>
          <li>Billing of paid services</li>
          <li>Stability, security, abuse prevention and support</li>
        </ul>
        <p>
          The legal bases are in particular Art. 6(1)(b) GDPR (performance of a
          contract and pre-contractual measures), Art. 6(1)(c) GDPR (compliance
          with a legal obligation) and Art. 6(1)(f) GDPR (legitimate interests
          in the secure and reliable operation of the service).
        </p>
      </LegalSection>

      <LegalSection title="4. Hosting, Infrastructure and Data Location">
        <p>
          AI Registry is designed for EU data residency. Register data,
          organisation data, use-case documentation and external submissions are
          processed and stored within the European Union.
        </p>
        <p>
          For authentication, database, storage, server functions and platform
          operations we use technical service providers in the Google Firebase
          and Google Cloud ecosystem. Where payment processing takes place, we
          use Stripe.
        </p>
        <p>
          Service providers are granted access only to the extent necessary for
          the provision of their services and on the basis of appropriate
          contractual arrangements. Where data is processed across EU Member
          State borders, it remains within the European Economic Area and is
          subject to the GDPR at all times.
        </p>
      </LegalSection>

      <LegalSection title="5. External Submissions and No-Login Data Collection">
        <p>
          When information is submitted via an access code or signed supplier
          link, we store the submitted content, sender details, timestamp,
          submission source and associated references in order to review the
          submission internally and maintain an auditable record.
        </p>
        <p>
          This processing is carried out for the performance of the respective
          submission process and to safeguard legitimate interests in
          documentation, security and governance.
        </p>
      </LegalSection>

      <LegalSection title="6. Payment Processing">
        <p>
          For paid services, payment processing may be handled by Stripe.
          Payment data is processed directly by the respective payment service
          provider. Within AI Registry we only store the contract and reference
          data required for entitlement, billing, documentation and support.
        </p>
      </LegalSection>

      <LegalSection title="7. Retention Period">
        <p>
          We retain personal data only for as long as is necessary for the
          respective purpose or as required by statutory retention obligations.
        </p>
        <p>
          Register and audit data may additionally be retained for longer
          periods insofar as this is necessary for documentation, export,
          governance or legal obligations.
        </p>
      </LegalSection>

      <LegalSection title="8. Your Rights">
        <p>You have the following rights under the GDPR in particular:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Right of access pursuant to Art. 15 GDPR</li>
          <li>Right to rectification pursuant to Art. 16 GDPR</li>
          <li>Right to erasure pursuant to Art. 17 GDPR</li>
          <li>Right to restriction of processing pursuant to Art. 18 GDPR</li>
          <li>Right to data portability pursuant to Art. 20 GDPR</li>
          <li>Right to object pursuant to Art. 21 GDPR</li>
        </ul>
        <p>
          You also have the right to lodge a complaint with a competent
          supervisory authority. The lead supervisory authority for
          ZukunftBilden GmbH is the Austrian Data Protection Authority
          (Oesterreichische Datenschutzbehoerde), Barichgasse 40-42, 1030 Wien,
          Austria;{' '}
          <a
            href="https://www.dsb.gv.at"
            className="underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            www.dsb.gv.at
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. Contact for Data Protection Matters">
        <p>
          Data protection enquiries can be directed to{' '}
          <a
            href="mailto:office@momofeichtinger.com"
            className="underline underline-offset-4"
          >
            office@momofeichtinger.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to This Privacy Policy">
        <p>
          We may update this privacy policy where necessary due to product
          developments, changes to our processes or new legal requirements.
        </p>
      </LegalSection>

      <p className="text-xs text-slate-500">Last updated: 12 March 2026</p>
    </LegalPageShell>
  );
}
