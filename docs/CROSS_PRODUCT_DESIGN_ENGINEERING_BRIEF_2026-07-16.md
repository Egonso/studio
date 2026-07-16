# KI Register + EUKIGesetz Design and Engineering Brief

Date: 2026-07-16

Status: implementation brief plus first activation slice
Audience: product design, UX writing, frontend, backend, QA, analytics, and release owners

## 1. Product outcome

Create one coherent journey across the training and the product:

> A person interested in EU AI Act training can understand the appropriate offer, complete or evaluate the training, document one real AI use case without legal expertise, see a meaningful result, and know exactly who acts next.

The first real use case is the activation object. A course view, landing-page session, account, register workspace, or dashboard visit is not activation.

## 2. Product principles

1. **Training is the acquisition wedge.** Current evidence suggests more interest in the course than in the register.
2. **The first use case is the bridge.** Every course and landing path should converge on one concrete record.
3. **Value before setup.** Let a learner/contributor capture first; ask for organization and governance configuration after the record exists.
4. **Human judgment stays visible.** Assistance may draft, suggest, or rank; it does not decide governance or legal compliance.
5. **Verification has a scope.** Certificate/pass/trust surfaces state exactly what is verified and never imply governmental approval.
6. **Progressive disclosure.** Capture -> review -> share -> govern. Do not present policy, trust, exports, suppliers, and organization administration as one first-use decision.
7. **Existing design systems remain authoritative.** EUKIGesetz keeps its editorial black/ivory course identity. KI Register keeps its calm institutional register identity. Cross-product coherence comes from task and language, not visual homogenization.

## 3. Target information architecture

### EUKIGesetz

1. Hero: course outcome, duration, private certificate scope, primary price.
2. Immediate role split:
   - “I am learning myself.”
   - “I organize training for a team.”
3. Article 4 context in plain language with official source links.
4. Curriculum and instructors.
5. Implementation promise: course -> first real use case -> register.
6. Certificate/verification scope.
7. Role-specific pricing.
8. Evidence: learner outcomes, not only testimonials.
9. FAQ and legal/source notes.

### KI Register public

1. Problem statement.
2. Three-step operating model: capture -> review -> share.
3. Direct first-use-case action.
4. Concrete pass example with scope.
5. Create / join / open organizational routes.
6. Scientific/method evidence.
7. Advanced governance capability map.
8. Free/paid boundary.
9. Final role-aware CTA.

### KI Register authenticated

1. `My register`: one primary object plus one ranked next action.
2. Capture: direct minimum form; description assist is optional.
3. Use-case detail: current state, next missing decision, evidence.
4. Reviews: due/blocked/ready queue.
5. External inbox: scoped supplier actions.
6. Pass/export: output only after scope/freshness is clear.
7. Control/governance modules: progressive, role-gated, and activation-aware.
8. Academy: competence record plus explicit first-use-case handoff.

## 4. Ideal end-to-end flows

### Flow A — Individual learner

1. Opens EUKIGesetz.
2. Selects “I am learning myself.”
3. Reviews outcome, four-hour curriculum, instructors, private certificate, price, and refund terms.
4. Starts checkout.
5. Completes course and test.
6. Receives certificate verification link with precise scope.
7. Primary completion CTA: “Document your first AI use case.”
8. KI Register opens the direct capture form with course source context.
9. Learner saves locally or signs in to attach the record to an organization.
10. Confirmation shows saved location and next responsible person.

### Flow B — Organizational buyer / coordinator

1. Opens EUKIGesetz.
2. Selects “I organize training for a team.”
3. Sees team outcome, seats, administration, completion visibility, and what KI Register adds.
4. Starts team contact/purchase path.
5. Invites learners.
6. Course completion opens a team activation checklist:
   - document first three real use cases;
   - assign owners;
   - review one case;
   - share one scoped pass.
7. Register overview ranks the next incomplete action.
8. Coordinator returns through review, supplier, export, or policy triggers.

### Flow C — Departmental contributor

1. Opens a course-completion or team invitation link.
2. Sees organization, requester, purpose, and privacy scope.
3. Direct form asks for system, purpose, context, and responsible role.
4. Optional “Start with a description” generates a draft only after explicit choice.
5. Validation summary appears before fields and focuses the first invalid field.
6. Confirmation explains reviewer and whether the record is local, submitted, or saved.

### Flow D — Supplier / procurement contact

1. Opens a scoped request token.
2. Confirms requester, organization, deadline, and data-use notice.
3. Completes minimum supplier/system facts.
4. Receives a stable receipt and status.
5. Clarification link preserves prior answers.
6. Internal external-inbox item exposes owner and next action.
7. Shared pass/trust page defines issuer, version, integrity, freshness, and review state.

## 5. First implementation slice

### 5.1 EUKIGesetz role split and legal clarity

Implement in the current editorial system:

- Preserve typography, black/ivory palette, border system, and existing content assets.
- Add two role-entry cards immediately after the hero:
  - learner -> training/curriculum anchor;
  - team organizer -> team price/contact anchor.
- Replace “certified EU AI Act officer” with a private-course outcome that cannot be mistaken for a statutory title.
- State that Article 4 requires context-appropriate AI literacy measures; it does not prescribe a specific certificate or AI officer.
- Describe the course certificate as a private course certificate documenting participation and assessment.
- Describe KI Register outputs as structured documentation, not a legal compliance decision.
- Reduce the “Silence” section from 160 viewport heights to 70 on desktop and 48 on mobile.
- Replace generic/phone-only team CTA with a trackable written team enquiry path.
- Add a direct “Document your first AI use case” link to KI Register capture.
- Link official EUR-Lex and European Commission Article 4 information.

Acceptance criteria:

- Learner and team paths are visible without scrolling past the first narrative article.
- No visible copy claims that Article 4 requires a certificate or AI officer.
- No visible copy applies the Article 5 maximum fine automatically to Article 4.
- Certificate and register proof scope is understandable without opening terms.
- Existing video, instructor, pricing, FAQ, and checkout links still work.
- The page retains its editorial identity at 1440 px and 390 px widths.

### 5.2 KI Register direct capture activation

Implement within existing register components:

- `/capture` opens the direct minimum form by default.
- The drafting assistant opens only when `assist=draft` is explicit or the user selects “Start with a description.”
- Preserve Coverage Assist deep-link behavior for supported source contexts.
- Use formal German throughout the first-use path.
- Replace visible “Quick Capture,” “Draft Assist,” and “Next step” language with descriptive German task language where it does not break external integrations.
- Use a fixed modal header and footer with a scrollable form body.
- Fit the modal inside `100dvh`; do not hide primary actions below the viewport.
- Do not render duplicate fallback dialog titles/descriptions when the component supplies real accessible labels.
- Place validation summary before the fields, announce it assertively, and focus the first invalid field.
- Keep description assist secondary and non-blocking.
- Describe the Use Case Pass as a shareable documentation state, not conclusive legal proof.

Acceptance criteria:

- A new visitor reaches the first field with one click from `/capture`.
- Direct form is the default with and without the drafting feature flag.
- `?assist=draft` opens the drafting path.
- Coverage-assist query entry still opens its existing source-specific selection.
- All required actions remain visible at 390 x 844 and 1440 x 900.
- Dialog has one accessible title, one description, and a localized close label.
- Empty submit announces the error and focuses the first invalid field.
- A successful capture routes to the created use-case detail or preserves the documented guest behavior.

## 6. Detailed interaction specification

### Role-entry cards

- Position: immediately after the EUKIGesetz hero metadata/authority line.
- Desktop: two equal columns; mobile: one column.
- Entire card is a link with visible text link affordance.
- Learner card label: “I am learning myself.” Outcome: course content, assessment, certificate.
- Team card label: “I organize for a team.” Outcome: seats, administration, transfer into KI Register.
- No icon-only distinction and no new visual language.

### Capture modal

- Maximum width: 560 px.
- Maximum height: `calc(100dvh - 2rem)`.
- Structure:
  - fixed header with title and concise scope;
  - optional description-assist row;
  - scrollable form body;
  - fixed footer with keyboard hint and actions.
- Footer stacks on narrow screens and aligns actions right from `sm` upward.
- Secondary description-assist control uses the existing outline button style.
- Error summary uses existing destructive color semantics and `role="alert"`.
- Close button receives “Schließen” as its accessible label.

### First-success confirmation (next slice)

After save, show one of three explicit receipts:

- Guest: “In this browser saved” + create/join register action.
- Contributor: “Submitted to [organization]” + reviewer/owner.
- Coordinator: “Saved to [register]” + next missing review action.

Do not send users to a generic dashboard without a receipt.

### Register overview activation state (next slice)

When the register has zero real use cases:

- Hide portfolio metrics that all read zero behind one compact summary.
- Primary object: “Document your first real AI use case.”
- Show one direct action and one example.
- Do not show advanced governance upsell.

When the register has one to three use cases:

- Primary object: ranked next action.
- Ranking order:
  1. external clarification/request requiring response;
  2. use case with missing responsible role;
  3. due/overdue review;
  4. review-recommended use case;
  5. proof-ready sharing/export opportunity.
- Always show why the action is ranked and who owns it.

## 7. UX writing rules

- Use `Sie` consistently in public and authenticated first-use journeys.
- Use concrete task labels: “KI-Einsatzfall erfassen,” “Prüfung fortsetzen,” “Dokumentationsstand teilen.”
- Keep internal feature names out of primary instructions.
- Prefer “vorgeschlagen,” “vorläufig,” “zu prüfen,” and “menschlich bestätigt” over automated certainty.
- A certificate documents course participation/assessment; it is not a statutory license.
- A pass bundles declared facts, status, evidence, and integrity metadata; it does not conclusively establish legal compliance.
- A verification page says which issuer, version, integrity, status, and date were verified.
- Never present the Article 5 prohibited-practice maximum fine as the automatic Article 4 sanction.

## 8. Analytics specification

No adoption claim should be made until these events can be separated by anonymous/session, authenticated user, workspace, source, and timestamp.

### Acquisition and training

- `training_landing_viewed`
- `training_role_selected` with `role = learner | team_organizer`
- `training_curriculum_viewed`
- `training_pricing_viewed` with `plan`
- `training_checkout_started` with `plan`
- `training_purchase_completed` with `plan` (server-side source of truth)
- `training_completed`
- `training_certificate_opened`

### Activation

- `first_use_case_cta_clicked` with `source = training_completion | training_landing | register_landing | invite`
- `capture_started` with `mode = direct | description_assist | coverage_assist`
- `capture_validation_failed` with field identifiers only, never free text
- `capture_completed` with `storage = local | submitted | register`
- `first_real_use_case_completed` once per user/workspace; exclude demo/seed data
- `register_created_after_capture`
- `register_joined_after_capture`

### Return and operational value

- `review_queue_opened`
- `review_completed`
- `supplier_submission_received`
- `supplier_submission_processed`
- `pass_generated`
- `pass_shared`
- `pass_verified`
- `export_completed`
- `returned_d7_for_action` and `returned_d30_for_action`, requiring an action event rather than a page view

### Funnel definitions

- Interest: landing view or course view.
- Purchase intent: checkout start or written team enquiry.
- Training success: course completion, not certificate page view alone.
- Product activation: first real use case completed.
- Organizational activation: at least three real use cases, one explicit owner, and one completed review.
- Retention: return for a review, supplier action, update, invite, share, or export.

## 9. Engineering specification

### Existing data model

The first implementation slice changes no Firestore schema and requires no migration.

- Capture behavior remains within the current use-case creation service.
- Drafting remains a preview/handoff; it persists nothing before explicit acceptance.
- Coverage-assist source context remains backwards compatible.
- EUKIGesetz changes are static content, layout, and links only.

### Feature flags

- Preserve the existing `draftAssistCapture` and Coverage Assist flags.
- Direct form behavior is the default even when drafting is enabled.
- Future course-to-capture handoff should use a dedicated disabled-by-default flag until analytics and receipt states are verified.
- Future overview action ranking should be behind a disabled-by-default activation flag and must not automate governance decisions.

### Error handling

- Capture validation errors are local and field-specific.
- Network/persistence errors preserve entered form data and expose a retry action.
- Guest/local state must never be described as saved to an organization.
- Supplier token errors distinguish expired, invalid, already submitted, and unavailable.
- Certificate/pass verification errors distinguish not found, invalid integrity, revoked/outdated, and temporary service error.

### Privacy and security

- Analytics must not capture purpose descriptions, names, emails, document text, or special-category data.
- Course source context may be a bounded enum, not raw referrer text.
- Request tokens remain scoped and revocable.
- Verification pages expose only the documented public scope.
- Temporary audit fixtures must be deleted after test runs.

### Accessibility

- WCAG AA contrast for body text and interactive controls.
- One semantic `h1` per page.
- Visible focus on every link, button, form control, and disclosure.
- Minimum 44 x 44 px touch target for mobile primary actions.
- Dialogs have one accessible title/description and restore focus on close.
- Error summary uses live announcement and links/focuses invalid fields.
- Motion-heavy/scroll scenes respect `prefers-reduced-motion` and preserve readable static content.
- Video has a descriptive title and does not trap page scroll.

### Responsive behavior

- Required QA widths: 390, 768, 1024, and 1440 px.
- EUKIGesetz role cards stack below 768 px.
- No section should require more than one empty mobile viewport to reveal its next meaningful content.
- KI Register capture footer remains visible without covering the focused field when the virtual keyboard is present.
- Horizontal feature rails require keyboard controls and a non-rail fallback on narrow screens.

## 10. Test plan

### Automated

- Unit tests for query-controlled capture mode and drafting handoff.
- Component test for one dialog title/description and formal German copy.
- Validation test for summary announcement and first-field focus.
- Playwright desktop/mobile test for public direct capture.
- Playwright authenticated test with temporary data for overview, detail, pass, reviews, external inbox, governance, exports, trust, academy, and settings.
- Link checks for course anchors, KI Register handoff, login, certificate verification, legal sources, and pricing CTAs.
- Existing lint, typecheck, build, and tracked/ignored hygiene checks.

### Manual visual

- Compare live/reference and branch screenshots at identical 1440 x 900 and 390 x 844 viewports.
- Check hero, role split, “Silence” pacing, curriculum, certificate, register bridge, pricing, FAQ, and footer.
- Check capture modal default state, description-assist state, validation, long content, keyboard focus, and mobile footer.
- Check for cropped images, low-contrast text, broken anchors, iframe scroll trapping, and hidden CTAs.

## 11. Release plan

### Current slice

- Repository branches only; no production deployment is implied by a push.
- No data migration.
- No Firestore rules, indexes, or Functions deployment.
- Preview must be validated by the product owner before merge/release.

### Rollback

- EUKIGesetz: revert static page commit; no persistent state to migrate.
- KI Register: revert capture UX commit; existing flags and persistence remain intact.
- If capture conversion degrades, restore prior route behavior without changing stored use cases.

### Definition of done

- Lint and typecheck pass.
- Targeted unit/integration tests pass.
- Production build passes for both repositories.
- Visual desktop/mobile comparison reviewed.
- Links and primary actions verified.
- No audit fixture remains in Firebase.
- Documentation updated.
- Branches pushed and local/committed/pushed/preview/live status reported separately.

## 12. Follow-on backlog

### P1

1. Course completion receipt and first-use-case handoff.
2. Activation-aware register empty/first-record states.
3. Ranked action queue on register overview.
4. Explicit supplier inbox with owner/status.
5. Pass/certificate/trust verification-scope component.
6. Server-side training/product funnel instrumentation.

### P2

1. Role-aware navigation after behavioral evidence exists.
2. Team onboarding checklist tied to real records.
3. Import/templates based on repeated interview evidence.
4. Policy/trust/export refinements based on activated coordinator behavior.
5. D7/D30 action-retention reporting.

## 13. Current implementation status

Implemented in the first branch slice:

- Direct capture is the default KI Register `/capture` experience.
- Description-based drafting remains available as an explicit secondary path.
- Capture UI uses formal German and descriptive task language.
- Modal header/footer remain visible while the form scrolls.
- Duplicate dialog fallback labels can be suppressed and the close label is localizable.
- Capture validation summary appears before fields and is assertive.
- Firebase Admin lazy clients preserve the SDK method receiver, restoring entitlement and external-submission backend calls that previously degraded at runtime.
- The external-submission table follows the five-column UI limit and keeps actions visible at desktop widths.
- EUKIGesetz has an early learner/team role split.
- EUKIGesetz legal/certificate/proof language is narrower and source-linked.
- EUKIGesetz narrative pacing is shorter and contains a direct first-use-case bridge.

Not yet implemented:

- Checkout/course backend changes.
- Course-completion event integration.
- Register overview action ranking.
- New analytics schema/events.
- New supplier inbox information architecture.
- Production preview, merge, or deployment.

### Verification evidence for this branch slice

- KI Register lint passed.
- KI Register unit and smoke suite passed: 321 tests, 0 failures, followed by all configured smoke scripts.
- KI Register typecheck and production build passed from an isolated copy of the same working tree. The canonical checkout sits below a separate ancestor `node_modules`; the OpenAI SDK type bundle probes hoisted parent paths and can block on that unrelated filesystem tree. No product configuration was changed to conceal that environmental issue.
- Authenticated desktop/mobile journey checks covered register overview, external inbox, use-case detail, pass, capture, control, reviews, governance settings, policies, exports, trust, organization, academy, and settings with temporary data that was removed afterward.
- EUKIGesetz production build and internal-anchor/local-resource checks passed.
- EUKIGesetz repository-wide lint still reports the pre-existing baseline of 152 errors and 6 warnings outside `public/erlebnis/index.html`; the edited static page does not add a lintable application module.
- The documented `hygiene:tracked-ignored` npm script is absent in the current KI Register package. A manual `git ls-files -ci --exclude-standard` audit confirms pre-existing tracked ignored artifacts, including generated Functions output and `node_modules.partial`; none are part of this branch scope.
