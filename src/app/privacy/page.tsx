import type { Metadata } from 'next';

import {
  LegalPageShell,
  LegalSection,
} from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Privacy Policy | AI Register',
  description:
    'Information on the processing of personal data in the AI Register.',
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description="Information on the processing of personal data in the AI Register. The contents are based on the existing privacy policy and have been adapted to the current register, intake, export and governance solution."
    >
      <LegalSection title="1. Joint Controllers">
        <p>
          The following parties are jointly responsible for data processing in
          connection with the AI Register pursuant to Art. 26 GDPR (General Data
          Protection Regulation):
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
            <p>Auerfeldstr. 24 Rgb, 81541 Muenchen, Deutschland</p>
            <p>E-mail: zoltangal@web.de</p>
            <p>Phone: +49 (0) 179 204 4465</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="2. Categories of Data We Process">
        <p>We process the following categories of personal data in particular:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account and profile data such as name, e-mail address and login credentials</li>
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
          <li>Provision and operation of the AI Register</li>
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
          The AI Register is designed for EU data residency. Register data,
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
          provider. Within the AI Register we only store the contract and
          reference data required for entitlement, billing, documentation and
          support.
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
        <p>
          You have the following rights under the GDPR in particular:
        </p>
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
          supervisory authority. The lead supervisory authority for ZukunftBilden
          GmbH is the Austrian Data Protection Authority
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
          Data protection enquiries can be directed to
          {' '}
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
