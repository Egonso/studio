/**
 * Comprehensive chatbot context: site tree, feature descriptions, and FAQ.
 * Used by site-chatbot.ts to give the assistant full knowledge of the platform.
 */

export const SITE_TREE = `
SITEMAP — AI Register (airegist.com)

🏠 MAIN NAVIGATION (signed-in users):
├── /my-register ............ AI Governance Register
│   Canonical free register workspace:
│   - Register overview
│   - Use Cases
│   - External Inbox
│   - Quick Capture and Use-Case Passes
│
├── /control ................ AI Governance Control
│   Canonical paid governance control surface:
│   - KPI Header
│   - Governance Maturity Model
│   - Action Queue (prioritised actions)
│   - Policies, Exports, Trust Portal, Academy
│
├── /control/policies ....... Policy Engine
│   Organisation-wide policies and policy management
│
├── /control/exports ........ Export Center
│   Organisation-wide audit and evidence exports
│
├── /control/trust .......... Trust Portal Management
│   Public trust signals and verify outputs
│
├── /academy ................. AI Governance Academy
│   Structured online course on the EU AI Act:
│   - Modules 1-5 with videos and materials
│   - Progress indicator per module
│   - Downloadable work materials (PDF)
│   - Video-based learning with practical cases
│
├── /law .................... EU AI Act Full-Text Viewer
│   Full text of the EU AI Act for reference:
│   - All 113 articles searchable
│   - 180 recitals
│   - Deep linking to individual articles (#art_5)
│   - Jump marks and chapter navigation
│
├── /exam ................... Certification Exam
│   Final test for AI Act competency:
│   - Multiple-choice exam
│   - Pass threshold and results display
│   - Certificate upon passing
│
├── /capture ................. Standalone Quick Capture
│   Quick capture of an AI use case (without register context)
│
└── /login .................. Sign-in page
    Login / registration for the platform

🌐 PUBLIC PAGES (no login required):
├── / ....................... Landing page
├── /intake ................. Public intake via access code
├── /request/[requestToken] ... Public supplier request
├── /verify/[code] ......... Verification page (code-based)
├── /verify/pass/[hashId] .. Verification pass (public use-case review)
├── /trust/[projectId] ..... Public Trust Portal
└── /cbs/share/[policyId] .. Shared compliance policy
`;

export const FEATURE_OVERVIEW = `
FEATURES & FUNCTIONS — AI Register

═══════════════════════════════════════════════════════════

📋 AI GOVERNANCE REGISTER (/my-register)
What it does: Formal documentation of all AI use cases
For whom: Free-register users, compliance officers, data protection officers
Core functions:
- Quick Capture: rapidly record use cases (name, tool, context, data)
- 4-stage status workflow:
  • Formal review pending
  • Review recommended
  • Review completed
  • Evidence-ready
- Public verification of individual entries
- Configure organisation scope (name, unit)
- Audit trail with status changes
- External Inbox for traceable external submissions

═══════════════════════════════════════════════════════════

🧭 AI GOVERNANCE CONTROL (/control)
What it does: Organisation-wide governance control and maturity level
For whom: Governance leads, compliance leadership, audit owners
Core functions:
- KPI Header (10-second overview)
- Maturity Level (Level 1-5)
- Prioritised actions with deep links into the register
- Organisation-wide policy, export, and trust functions

═══════════════════════════════════════════════════════════

⚙️ POLICY ENGINE (/control/policies)
What it does: Automated creation of compliance policies
For whom: Compliance owners, legal department
Core functions:
- AI-assisted policy generation
- Mapping to EU AI Act articles
- Edit and customise policies
- Share via public link (/cbs/share/...)
- Export as document

═══════════════════════════════════════════════════════════

📦 EXPORT CENTER (/control/exports)
What it does: Bundle organisation-wide audit and evidence exports
For whom: Audit, compliance leadership, procurement, external reviewers
Core functions:
- Governance Report
- ISO / Audit Dossier
- Policy Bundle
- Trust Portal Bundle

═══════════════════════════════════════════════════════════

🎓 AI GOVERNANCE ACADEMY (/academy)
What it does: Structured learning course on the EU AI Act
For whom: All employees who work with AI
Core functions:
- 5 modules with videos and work materials
- Progress indicator per module/video
- PDF downloads for each topic
- Practice-oriented case studies
Modules:
1. Fundamentals of the EU AI Act
2. Risk classes and obligations
3. Technical compliance
4. Practical simulations
5. Implementation & Governance

═══════════════════════════════════════════════════════════

📜 EU AI ACT FULL TEXT (/law)
What it does: Complete legal text for searching and reference
For whom: Anyone who wants to look up the original text
Core functions:
- 113 articles + 180 recitals
- Full-text search
- Deep linking (e.g. /law#art_5)
- Chapter navigation

═══════════════════════════════════════════════════════════

📝 CERTIFICATION EXAM (/exam)
What it does: Competency proof through a final test
For whom: Course participants after completing all modules
Core functions:
- Multiple-choice exam
- Instant results display
- Certificate upon passing

═══════════════════════════════════════════════════════════

🌐 TRUST & VERIFY
What it does: Publicly viewable compliance evidence
For whom: External stakeholders, customers, regulators
Core functions:
- Public verify passes for individual use cases
- Trust Portal output for shared evidence
- No login required

═══════════════════════════════════════════════════════════

✅ VERIFICATION (/verify/pass/[hashId])
What it does: Public proof for individual use cases
For whom: External parties who received a verify link
Core functions:
- View use-case details
- Check status and database reference
- No login required
`;

export const COMMON_QUESTIONS = `
COMMON USER SCENARIOS (chatbot knowledge)

Q: "How do I get started with compliance?"
A: Start in the Register at /my-register. Record your first AI use case there.
   For governance setup and policies, continue to /control and /control/policies.

Q: "Where can I find the EU AI Act text?"
A: At /law you will find the full text. You can jump directly to articles, e.g. /law#art_5.

Q: "How do I document our AI usage?"
A: Use the AI Governance Register at /my-register. Click "+ Capture" for Quick Capture.
   There you enter the use-case name, the tool used, and the data context.

Q: "What is the difference between Register and Control?"
A: Register (/my-register) = quick, formal documentation of all AI use cases.
   Control (/control) = organisation-wide governance with Policies, Exports, Trust, and Academy.

Q: "How do I create a policy?"
A: Go to the Policy Engine at /control/policies. There you can create AI-assisted compliance policies
   that are automatically mapped to relevant EU AI Act articles.

Q: "How can I show compliance status publicly?"
A: Use /control/trust for internal management and activate public evidence directly on the use cases in the register.
   Public verify links run via /verify/pass/[hashId].

Q: "What happens after the certification exam?"
A: After passing the exam (/exam) you receive a certificate. This can also be
   verified by third parties through the verification system (/verify).

Q: "How do I make a use case publicly verifiable?"
A: In the Register (/my-register): open the 3-dot menu on the entry → "Make public".
   Then you can copy and share the verify link.
`;
