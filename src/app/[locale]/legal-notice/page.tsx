import type { Metadata } from 'next';

import {
  LegalPageShell,
  LegalSection,
} from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Legal Notice | AI Register',
  description:
    'Provider information, contact details and mandatory legal disclosures for the AI Register.',
};

export default function LegalNoticePage() {
  return (
    <LegalPageShell
      title="Legal Notice"
      description="Provider information and mandatory disclosures for the AI Register pursuant to E-Commerce Directive Art. 5, Section 5 DDG and Section 25 MedienG (Austrian Media Act). The details below are based on the existing live disclosures and have been consolidated for the current register solution."
    >
      <LegalSection title="Information pursuant to Section 5 DDG and Section 25 MedienG">
        <p>
          The AI Register is jointly operated by two equal partners:
        </p>
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
            <p>Deutschland</p>
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
            <p>Address: Auerfeldstr. 24 Rgb, 81541 Muenchen, Deutschland</p>
          </div>
        </div>
        <p>Website: https://airegist.com</p>
      </LegalSection>

      <LegalSection title="Business Purpose">
        <p>
          The AI Register serves as an internal tool for organisations to
          document, manage and evidence AI use cases, and to provide training,
          export and governance features for businesses and organisations.
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
          resolution:
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
          No legal advice: The AI Register and accompanying content are
          intended for documentation, structuring and knowledge sharing. They
          do not constitute and are no substitute for individual legal advice
          from a qualified legal professional.
        </p>
      </LegalSection>

      <p className="text-xs text-slate-500">Last updated: 12 March 2026</p>
    </LegalPageShell>
  );
}
