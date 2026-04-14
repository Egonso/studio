import type { Metadata } from 'next';

import {
  LegalPageShell,
  LegalSection,
} from '@/components/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Terms of Service | AI Register',
  description:
    'General terms and conditions for the use of AI Register.',
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      description="Terms governing the use, booking and provision of AI Register. These terms are based on the original German-language conditions, adapted for the current register, governance and download solution."
    >
      <LegalSection title="1. Scope">
        <p>
          These Terms of Service apply to all contractual relationships between
          the Providers ZukunftBilden GmbH and BewusstseinBilden UG
          (haftungsbeschraenkt), hereinafter jointly referred to as the
          Providers (or &ldquo;we&rdquo;), and the customers and users of
          AI Register.
        </p>
        <p>
          They apply to the use of AI Register, to paid governance, export or
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
          All content, templates, texts, graphics, exports, course materials and
          software components of AI Register are protected by copyright.
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
          accordance with Articles 9&ndash;16 of the Consumer Rights Directive
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
          AI Register serves the purpose of documentation, governance and
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
          your country of habitual residence (Art.&nbsp;6(2) Rome&nbsp;I
          Regulation).
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
          We are neither obliged nor willing to participate in dispute resolution
          proceedings before a consumer arbitration board.
        </p>
      </LegalSection>

      <p className="text-xs text-slate-500">Last updated: 12 March 2026</p>
    </LegalPageShell>
  );
}
