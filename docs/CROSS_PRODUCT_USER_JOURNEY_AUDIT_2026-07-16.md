# KI Register + EUKIGesetz Cross-Product User Journey Audit

Date: 2026-07-16

Scope: `kiregister.com`, `eukigesetz.com`, all public KI Register entry routes, and the authenticated KI Register product
Evidence owner: Product/engineering audit, not user research

## Executive diagnosis

The strongest observed demand signal is interest in the EU AI Act training, not recurring KI Register use. There is currently no verified active-user cohort. The product must therefore solve an activation problem before it optimizes retention or expands governance functionality:

> Training interest -> concrete first use case -> visible documentation value -> a credible reason to return.

Both products are visually distinctive and contain substantial substance. The main weakness is not lack of content or features. It is the absence of a short, explicit bridge between what a visitor wants now and the first valuable product action.

- EUKIGesetz sells a course through a long editorial story, but the learner and the organizational buyer share one path for too long.
- KI Register explains the governance system beautifully, but the map of the product arrives late and the first low-risk action is easy to miss.
- The authenticated product contains a capable register, review, governance, supplier, export, trust, and academy surface. It presents that breadth before an unactivated user has experienced one successful loop.
- The public capture route previously opened an AI-assisted drafting step by default. That contradicted the promise of a fast, direct capture and introduced English product language, informal address, and an avoidable decision before the first field.

The near-term product strategy should not be “sell more platform.” It should be “turn training interest into one real, reviewable record.”

## Evidence and limits

### Observed directly

- Live desktop scroll captures of the complete KI Register landing page: 19 viewport frames.
- Live mobile scroll capture of the complete KI Register landing page: 17 viewport frames.
- Live desktop scroll capture of the complete EUKIGesetz landing page: 19 meaningful content frames plus pricing, testimonial, FAQ, and footer frames. Frames 20–38 were repeated because a YouTube iframe retained scroll focus and are excluded from findings.
- Public KI Register flows: register creation, join, login, direct register access, platform, downloads, verify, public capture, manual capture, and validation state.
- Authenticated KI Register route inventory and local route captures using temporary test-only Firebase data, deleted after capture.
- Current source code, route map, data model, UI charter, manual deployment notes, and release flow.

### Not observed

- No verified production analytics funnel.
- No verified active or retained users.
- No support-log or session-replay sample.
- No customer interview or usability-test transcript.
- No completed checkout was triggered during this audit.
- No production write, migration, deployment, or governance decision was made.

All four profiles below are therefore evidence-informed hypotheses, not validated personas. The first validation task is four to six interviews split between course viewers/buyers and people who inspected KI Register but did not create a real use case.

## Four hypothesized user profiles

### A1 — Anna, managing director / HR buyer

- Context: 50–500 employees, no dedicated AI governance team.
- Trigger: a customer, auditor, board member, or internal manager asks what the organization is doing about AI literacy and usage.
- Job: choose a credible training and leave with a practical organizational next step.
- Anxiety: buying an impressive certificate that produces no operational change.
- First success: she can name who should be trained and sees one real company use case documented.
- Return reason: a team member completes training, a new use case appears, or a review becomes due.
- Failure mode: legal fear overwhelms the concrete offer; the product appears to require a governance program before she can start.

### A2 — Karim, AI / compliance coordinator

- Context: responsible for an emerging portfolio across several departments.
- Trigger: scattered spreadsheets, policy questions, procurement, or an audit request.
- Job: establish ownership, review state, evidence, and a repeatable control loop.
- Anxiety: the tool hides assumptions behind automated “compliance” conclusions.
- First success: three real use cases are captured and one has an explicit next action.
- Return reason: review queue, supplier submission, policy change, export, or trust request.
- Failure mode: a broad dashboard with many modules but no ranked action queue.

### A3 — Lea, learner / departmental contributor

- Context: uses ChatGPT, Copilot, or an embedded AI feature but does not speak governance language.
- Trigger: course completion, invitation link, or a request to report what she uses.
- Job: describe one use case quickly without having to classify the law.
- Anxiety: giving a “wrong” legal answer or exposing herself as non-compliant.
- First success: her real use case is saved in under two minutes and the responsible reviewer is clear.
- Return reason: a follow-up question or status notification, not the dashboard itself.
- Failure mode: unfamiliar English feature names, too many classification fields, or no confirmation of what happens next.

### A4 — David, supplier / procurement / quality contact

- Context: external vendor or internal procurement/quality role responding to a structured request.
- Trigger: a customer asks for system and use-case information or wants a shareable record.
- Job: submit the minimum credible facts and later verify what was accepted.
- Anxiety: disclosing too much, entering data into the wrong organization, or confusing a private document with an official certificate.
- First success: a scoped request, receipt, owner, and status are visible.
- Return reason: clarification request, acceptance, or updated proof link.
- Failure mode: supplier submission is visually buried inside the register’s document filters.

## Live KI Register landing: frame-by-frame audit

The live page is calm, serious, and visually memorable. The narrative sequence is coherent, but the activation path is too distant from the opening promise.

| Frame | Visible content | Avatar reaction | Finding | Priority |
| --- | --- | --- | --- | --- |
| 01 | Hero: “KI ist in Ihrem Unternehmen längst im Einsatz.” with falling documents and three header actions | A1 understands the problem; A3 does not yet know what she can do | Strong problem framing. Primary action is visually small relative to the hero and the three header options compete | P1 |
| 02 | Hero animation continues | All | High visual atmosphere but no additional decision support | P2 |
| 03 | “Verstreut in Tools, Teams und Tabellen.” | A2 recognizes current pain | Clear diagnosis; could arrive immediately after a compact product map | P1 |
| 04 | “Das Register ordnet. Der Pass beweist.” | A1 may infer official/legal proof | “Beweist” overstates what a product-generated document can establish | P0 |
| 05 | Launch-film installation | A1/A2 may watch; A3 scrolls | Film adds trust, but it delays the direct start path and consumes a full scene | P2 |
| 06 | Three entry cards: create, join, open | All finally see the operating model | Excellent routing, but it appears too late. This belongs directly after the opening problem or in a persistent start control | P1 |
| 07 | Scientific statement | A1 gains confidence | Strong credibility. Methodological fit must remain distinct from a guarantee of legal compliance | P0 copy |
| 08 | Fine / legal urgency scene | A1 feels urgency; A3 feels threatened | A large fine figure without precise scope can falsely imply automatic Article 4 exposure | P0 |
| 09 | Status path begins: unreviewed | A2 understands workflow | This is the first concrete view of how the product works, but it arrives after a long scroll | P1 |
| 10 | Review recommended | A2 sees human control | Good “assistive, not automatic” pattern | Keep |
| 11 | Reviewed | A2 sees progression | Status semantics need dot + text consistently in the app, not only in marketing | P1 |
| 12 | Proof ready | A1/A4 see an output | “Proof” must be framed as a bundled documentation state with defined scope | P0 copy |
| 13 | Horizontal feature acts: Capture, Risk Assist, Dashboard, Pass | A2 sees breadth; A3 sees jargon | Useful map, but English feature names and late placement increase cognitive load | P1 |
| 14 | More acts: Proof Pack, Trust Portal, supplier infrastructure | A4 becomes relevant | Valuable advanced scope; should be progressively disclosed after first activation | P2 |
| 15 | Use Case Pass visual | A1/A4 understand output | Strong concrete artifact. Show earlier as “what your first entry becomes” | P1 |
| 16 | Three-step path: organization, use case, pass | All understand the basic journey | This is the clearest conversion frame and should be near the top | P1 |
| 17 | Free core promise | A1 understands risk-free entry | Good principle. Clarify which actions remain free and which governance modules require a plan | P1 |
| 18 | Final conversion section with three entry paths | All | Clear but repeated very late; direct capture should be an equal first-class path | P1 |
| 19 | Footer | All | Dense but conventional; no problem beyond link discoverability on small screens | P2 |

### KI Register mobile observations

- The long editorial pacing becomes more expensive on mobile: 17 viewport-height frames before the footer.
- Header actions and the hero CTA have limited visual dominance.
- The three-path entry model remains understandable, but the user must survive several narrative scenes before reaching it.
- Horizontal/rail-based product storytelling is harder to scan than a short, task-based map.
- The strongest mobile conversion should be one sticky, descriptive action: “Ersten KI-Einsatzfall erfassen.”

## Live EUKIGesetz landing: frame-by-frame audit

EUKIGesetz is more sales-capable and should remain so. The problem is not its drama; it is that the drama delays role clarity and sometimes crosses from urgency into legal overstatement.

| Frame | Visible content | Avatar reaction | Finding | Priority |
| --- | --- | --- | --- | --- |
| 01 | Black editorial hero, course promise, price CTA | A1 and A3 see a serious premium course | Strong identity. “Certified EU AI Act officer” can look like a legally defined title | P0 copy |
| 02 | Timer and authority lines | A1 sees urgency | Timer and discount should not dominate trust; course outcome needs to be explicit before scarcity | P1 |
| 03 | Article 1: fictional company and scattered usage | A1/A2 recognize themselves | Effective story opening | Keep |
| 04 | Policy and tool list appear reassuring | A2 understands false security | Good narrative tension | Keep |
| 05 | Audit/customer question about trained staff | A1 sees buyer problem | Strongest organizational buyer frame; could be summarized earlier | P1 |
| 06 | More unanswered questions | A2 sees operational gap | Useful, but the sequence is lengthy before the offer mechanics | P2 |
| 07 | “Stille.” | All | Full-screen pause is visually bold but excessively long and suppresses proof/offer content | P1 |
| 08 | “7 tools / 0 training records” | A1 sees contrast | Clear. Avoid implying a certificate is the only valid Article 4 measure | P0 copy |
| 09 | Article 3, four-hour course promise | A3 sees manageable scope | Strong learning proposition; should include concrete curriculum/outcome earlier | P1 |
| 10 | Module table | A3 can evaluate content | Useful detail; tiny text and low contrast need accessibility review | P1 |
| 11 | Instructor cards | A1 gains trust | Appropriate authority evidence | Keep |
| 12 | Video + certificate/guarantee cards | A3 sees outcome | Explain “private course certificate,” verification scope, and refund terms plainly | P0 copy |
| 13 | “After training, implementation begins.” | A1 sees differentiation | This is the cross-product strategic core and should be the main product promise | P0 strategy |
| 14 | Register/dashboard illustration | A2 sees transfer | Great bridge, but it appears too late and the first actual action is not explicit | P0 journey |
| 15 | Book, toolbox, statement | A1 sees bonus/value stack | Useful support, but value stack risks becoming feature accumulation | P2 |
| 16 | Scientific statement | A1 gains credibility | Must remain method fit, not legal guarantee | P0 copy |
| 17 | Pricing cards | A1 must choose between individual and team | Buyer and learner paths finally split. This split should happen near the hero | P0 journey |
| 18 | Deadline/fine statement + testimonial | A1 feels pressure | Fine language is legally imprecise for Article 4 and can undermine trust | P0 |
| 19 | Testimonial video | A3 gains social proof | Useful, but real outcome evidence would be stronger than testimonial alone | P1 research |
| 39 | FAQ closed | All have late objections | FAQ is useful but far below the main decision | P2 |
| 40 | Footer statement “many trained, few can prove” | A1/A2 see differentiation | Strong brand line; “prove” must have defined scope | P0 copy |
| 41 | Footer end | All | Course login, certificate check, and KI Register relationship are present but not a guided next step | P1 |
| 42 | FAQ opened | A1/A3 inspect detail | Interaction works; Article 4 wording must distinguish contextual measures from a blanket certificate duty | P0 |

## Public KI Register functional entry audit

| Route/state | Primary user | What works | Friction / risk | Target change |
| --- | --- | --- | --- | --- |
| Create register | A1/A2 | Clear organizational start | Asks for organizational commitment before demonstrating first value | Offer guest first capture and preserve it for later register creation |
| Join register | A3 | Correct team path | Invitation context and “what happens next” need stronger confirmation | Show organization, requester, expected fields, and privacy scope before starting |
| Login | A2 | Conventional | Competes with three other landing actions | Keep as utility, not primary conversion |
| Public capture | A3 | Low-risk trial and local-save model | Previously defaulted to drafting assistant; mixed English/German; modal actions could fall below viewport | Open direct form by default; offer description assist secondarily; fixed footer; formal German |
| Capture validation | A3 | Required fields can be focused | Error summary appeared below the fields and could be invisible | Put assertive summary before fields and focus first invalid field |
| Platform | A1/A2 | Shows breadth | Feature-first rather than task-first | Organize by first capture, review, share, govern |
| Downloads | A2/A4 | Concrete artifacts | Can look like documents are the product rather than outputs of a workflow | Connect each artifact to the action/state that creates it |
| Verify | A4 | Clear trust surface | Verification scope can be mistaken for official/legal validation | State exactly what was verified: issuer, version, integrity, and status |

## Authenticated product: route-level journey audit

The authenticated product was audited as an end-to-end operating system, not only as a set of screens. Temporary data represented three use cases (proof-ready, review recommended, and unreviewed) plus one external supplier submission.

| Route | Core job | Main observation | Priority |
| --- | --- | --- | --- |
| `/my-register` | See portfolio and start/continue work | Dense controls and summary cards appear before the unactivated user receives one ranked next action | P0 activation |
| `/my-register?filter=supplier_requests` | Process external submissions | External work is embedded as a document/filter mode and is easy to miss | P1 |
| `/my-register/[useCaseId]` | Understand and improve one use case | Object-first design is strong; completion model is rich but can feel like a multi-stage compliance project | P1 |
| `/pass/[useCaseId]` | Share a scoped record | Concrete output is valuable; scope and freshness need persistent wording | P0 copy |
| `/capture` | Create first/next record | Most important activation route; direct entry must be the default | P0 |
| `/control` | See governance posture | Valuable for activated coordinators; too broad as an early landing area | P2 until activation |
| `/control/reviews` | Work the review queue | Closest thing to a return loop; should surface due/blocked action, not only counts | P1 |
| `/settings/governance` | Define roles/cadence | Correct advanced configuration; do not require it before first use case | Keep gated/progressive |
| `/control/policies` | Maintain policies | Valuable after portfolio exists | P2 |
| `/control/exports` | Produce audit/procurement outputs | High-value outcome, but only after data quality is visible | P1 |
| `/control/trust` | Share organizational trust view | Useful for A4; verification semantics must be explicit | P1 |
| `/control/organisation` | Manage organizational structure | Necessary admin utility, not a primary journey | P2 |
| `/academy` | Train and maintain competence | Strategically important bridge, but course completion and first use case are not yet one guided flow | P0 cross-product |
| `/settings` | Account/workspace utility | Conventional | Keep secondary |

## Journey walkthrough by profile

### A1 — Managing director / HR buyer

Current journey:

1. Arrives at EUKIGesetz through training interest.
2. Reads a long urgency story before knowing whether the product is for her personally or for a team.
3. Reaches pricing near the bottom.
4. Sees KI Register as a bonus/implementation layer.
5. Has no guided post-course action that produces visible organizational value.

Ideal journey:

1. Chooses “I am learning myself” or “I organize training for a team” in the first viewport.
2. Sees course outcome, private certificate scope, curriculum, instructors, and price without a legal-threat detour.
3. After purchase/completion, receives one task: document one real use case.
4. Guest capture can be completed before organization setup.
5. The saved case becomes the seed of a register; team invitation is offered only after value is visible.

### A2 — AI / compliance coordinator

Current journey:

1. May enter through either landing page.
2. Sees many modules and artifacts.
3. Opens the register and must infer the next task from portfolio controls, status cards, reviews, and governance modules.

Ideal journey:

1. Enters through “organize for a team.”
2. Imports or creates the first three use cases.
3. Receives a ranked queue: complete missing owner, review risk suggestion, request supplier data.
4. Produces one scoped pass/export.
5. Returns because a concrete review, request, or change is due.

### A3 — Learner / contributor

Current journey:

1. Training is understandable, but the operational handoff is late.
2. Public capture previously presented a drafting assistant before the promised quick form.
3. Product language mixes German and English and can imply classification responsibility.

Ideal journey:

1. Completes training.
2. Clicks “Document your first use case.”
3. Enters system, purpose, context, and responsible role in a direct form.
4. Optional description assist is available but does not block the form.
5. Receives a plain confirmation: saved locally/in organization, reviewer, and next step.

### A4 — Supplier / procurement / quality contact

Current journey:

1. Receives an invitation/request.
2. Can submit structured data, but internal processing is not prominent.
3. Proof/trust wording can blur document integrity with legal approval.

Ideal journey:

1. Request shows requesting organization, scope, data use, deadline, and save state.
2. Submission asks only for the defined minimum.
3. Receipt shows what was sent and who reviews it.
4. Clarification requests preserve prior answers.
5. Verification page states issuer, version, integrity, freshness, and status—never “official compliance.”

## Prioritized issue register

### P0 — Fix before stronger acquisition

1. Replace legal/certification overclaims on EUKIGesetz and proof overclaims on KI Register.
2. Split learner and organizational buyer paths in the first EUKIGesetz viewport.
3. Make training-to-first-use-case the explicit cross-product conversion.
4. Make direct capture the default public and authenticated capture experience.
5. Give an unactivated register user one ranked next action instead of exposing product breadth as the main value.
6. Instrument the activation funnel before claiming adoption.

### P1 — Next product cycle

1. Move the three-step KI Register operating model and concrete pass example earlier on the landing page.
2. Add a post-course handoff state in Academy and course completion communication.
3. Add activation-aware empty and first-record states to `/my-register`.
4. Elevate supplier submissions to an explicit inbox/action queue.
5. Define verification scope on all pass, certificate, trust, and export surfaces.
6. Normalize formal German and remove unnecessary English feature labels from the first-use path.
7. Improve mobile sticky action and reduce full-viewport narrative pauses.

### P2 — After activation evidence exists

1. Refine policy, trust, organization, and export modules based on real coordinator behavior.
2. Personalize dashboards by role and portfolio maturity.
3. Add advanced templates/imports only where interviews show repeated manual work.
4. Revisit feature naming and navigation taxonomy after task-level analytics are available.

## Validation plan

Recruit at least six people:

- Two people who viewed or bought the training.
- Two organizational buyers/coordinators who inspected KI Register but did not activate it.
- One departmental AI user.
- One supplier/procurement/quality participant.

Ask each person to complete the same evidence-based task: “Document one real AI use case and show what happens next.” Measure:

- Time to first field and time to saved record.
- Whether the person can explain what the pass/certificate proves and does not prove.
- Whether they can identify the next responsible person.
- Whether they choose direct capture or description assist.
- Whether they understand learner versus team pricing and ownership.
- Whether they can find an external submission or due review without guidance.

Do not use page views as evidence of adoption. The activation event is a saved real use case with an identified responsibility context; retention begins only when a person returns for a review, clarification, invite, or updated output.
