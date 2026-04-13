# Manual Deployment Steps

To finalize the architecture refactoring, please perform the following steps manually in your Firebase Console or local environment.

## 1. Update Firestore Security Rules
Copy the contents of `firestore.rules` (located in your project root) to your Firebase Console > Firestore > Rules.

Or deploy using CLI:
```bash
firebase deploy --only firestore:rules
```

**Key Changes:**
- Enabled access to `workspaceProjects`, `aiSystems`, and `isoAIMS` collections.
- Maintained legacy `projects` access.
- Added basic `canAccessOrg` placeholder (currently allows all authenticated users, refine for production).

## 2. Create Firestore Indexes
You need to create composite indexes to support the new queries (Portfolio View, Deduplication).

Create/Update `firestore.indexes.json` or add these via Console:

### Collection: `aiSystems`
| Fields | Mode | Purpose |
| :--- | :--- | :--- |
| `orgId` (ASC) | `dedupeKey` (ASC) | **Deduplication Check** (Find existing systems) |
| `primaryWorkspaceId` (ASC) | `updatedAt` (DESC) | **Workspace View** (Show systems in project) |
| `orgId` (ASC) | `updatedAt` (DESC) | **Portfolio View** (Show all systems in Org) |

## 3. Supplier Invite V2 Setup (when enabling `supplierInviteV2`)

### Firestore Collections
- `registerSupplierInvites` — admin SDK only (rules: `allow read, write: if false`)
- `registerSupplierInviteCampaigns` — admin SDK only (rules: `allow read, write: if false`)
- `supplierInviteChallenges` — admin SDK only (rules: `allow read, write: if false`)
- `supplierConversionSignals` — admin SDK only (rules: `allow read, write: if false`)

### Composite Indexes
| Collection | Fields | Purpose |
| :--- | :--- | :--- |
| `registerSupplierInviteCampaigns` | `registerId` (ASC), `createdAt` (DESC) | Anfragegruppen pro Register |
| `registerSupplierInvites` | `registerId` (ASC), `status` (ASC) | Filter active invites per register |
| `supplierInviteChallenges` | `inviteId` (ASC), `createdAt` (DESC) | OTP daily limit check |

### Firestore TTL Policy
Activate TTL policy for `supplierInviteChallenges` on field `ttlDeleteAt` via Firebase Console.

### Secrets
- `SUPPLIER_SESSION_SECRET` — 32 byte random base64: `openssl rand -base64 32`
- `SUPPLIER_SESSION_SECRET_PREVIOUS` — optional, for key rotation (set to old value when rotating)
- Set `SUPPLIER_SESSION_SECRET` in both the Studio app environment and the Functions environment
- If your public origin is not `https://kiregister.com`, set `NEXT_PUBLIC_APP_ORIGIN` in the Functions environment as well so reminder opt-out links point to the correct host

### Emailit (for supplier invite, OTP, reminders, confirmation, welcome email)
- Create an Emailit workspace and an API key with sending access
- Add your sending domain in Emailit and complete DNS verification
- Required records for verification are checked by Emailit via `MX`, `SPF` and `DKIM`; `DMARC` is recommended but optional
- Create templates in Emailit for:
  - supplier invites
  - OTP codes
  - supplier reminders
  - supplier submission confirmations
  - optional: checkout / welcome mail
- Set these variables in the Studio app environment:
  - `EMAILIT_API_KEY`
  - `EMAILIT_FROM_EMAIL`
  - `EMAILIT_SUPPLIER_INVITE_TEMPLATE`
  - `EMAILIT_SUPPLIER_OTP_TEMPLATE`
  - `EMAILIT_SUPPLIER_CONFIRMATION_TEMPLATE`
  - `SUPPLIER_SESSION_SECRET`
- Set these variables in the Functions environment:
  - `EMAILIT_API_KEY` or `functions.config().emailit.api_key`
  - `EMAILIT_FROM_EMAIL` or `functions.config().emailit.from_email`
  - `EMAILIT_SUPPLIER_REMINDER_TEMPLATE` or `functions.config().emailit.supplier_reminder_template`
  - optional: `EMAILIT_WELCOME_TEMPLATE` or `functions.config().emailit.welcome_template`
  - `SUPPLIER_SESSION_SECRET` or `functions.config().supplier.session_secret`
  - optional: `SUPPLIER_SESSION_SECRET_PREVIOUS` or `functions.config().supplier.session_secret_previous`
  - if needed: `NEXT_PUBLIC_APP_ORIGIN` or `functions.config().app.public_origin`
- Keep the sender in RFC format, e.g. `KI-Register <noreply@your-domain.com>`
- New Emailit workspaces start with rate limits of `2 messages / second` and `5000 / day`; request more in Emailit before larger beta rollouts if needed

### Concrete Firebase Commands

#### App Hosting secrets (`apphosting.yaml`)

The repo now wires the required runtime variables in `apphosting.yaml`. You still need to store the secret values in Firebase App Hosting / Secret Manager:

```bash
firebase apphosting:secrets:set EMAILIT_API_KEY --project ai-act-compass-m6o05 --location europe-west1
firebase apphosting:secrets:set EMAILIT_FROM_EMAIL --project ai-act-compass-m6o05 --location europe-west1
firebase apphosting:secrets:set EMAILIT_SUPPLIER_INVITE_TEMPLATE --project ai-act-compass-m6o05 --location europe-west1
firebase apphosting:secrets:set EMAILIT_SUPPLIER_OTP_TEMPLATE --project ai-act-compass-m6o05 --location europe-west1
firebase apphosting:secrets:set EMAILIT_SUPPLIER_CONFIRMATION_TEMPLATE --project ai-act-compass-m6o05 --location europe-west1
firebase apphosting:secrets:set SUPPLIER_SESSION_SECRET --project ai-act-compass-m6o05 --location europe-west1
```

If you later rotate the session key and want overlap support:

```bash
firebase apphosting:secrets:set SUPPLIER_SESSION_SECRET_PREVIOUS --project ai-act-compass-m6o05 --location europe-west1
```

`NEXT_PUBLIC_SUPPLIER_INVITE_V2_ENABLED=true` is now already checked into `apphosting.yaml`.

#### Functions config

The reminder and welcome-email Functions now work with legacy runtime config as a fallback. Set it once with:

```bash
firebase functions:config:set \
  emailit.api_key="REPLACE_ME" \
  emailit.from_email="KI-Register <noreply@your-domain.com>" \
  emailit.supplier_reminder_template="REPLACE_ME" \
  emailit.welcome_template="REPLACE_ME_OPTIONAL" \
  supplier.session_secret="REPLACE_ME" \
  app.public_origin="https://kiregister.com"
```

Optional during key rotation:

```bash
firebase functions:config:set supplier.session_secret_previous="REPLACE_ME_OLD"
```

Then deploy Functions so the new config is picked up:

```bash
npm --prefix functions run build
firebase deploy --only functions --project ai-act-compass-m6o05
```

### Migration Strategy
V1 tokens (`srt_` prefix) and V2 invites (`sinv_` prefix) coexist. V1 tokens expire naturally (max 7 days after Sprint 1a). No data migration required.

### Feature Flag
Set `NEXT_PUBLIC_SUPPLIER_INVITE_V2_ENABLED=true` to enable V2 invite creation in the UI and API.

### Reminder Scheduler
- Deploy Functions after adding `scheduledSupplierReminders`
- The scheduler runs daily at `09:00` Europe/Berlin
- Reminder mails are only sent for invites with a stored encrypted access link
- Legacy invites from before Sprint 3 receive reminders only after recreate/resend

## 4. Deploy Firestore Indexes

Deploy the updated composite indexes for V2 collections:

```bash
firebase deploy --only firestore:indexes --project ai-act-compass-m6o05
```

**New Indexes (V2):**

| Collection | Fields | Purpose |
| :--- | :--- | :--- |
| `registerSupplierInviteCampaigns` | `registerId` (ASC), `createdAt` (DESC) | Anfragegruppen pro Register |
| `registerSupplierInvites` | `registerId` (ASC), `createdAt` (DESC) | Admin invite list per register |
| `registerSupplierInvites` | `registerId` (ASC), `status` (ASC) | Filter active invites per register |
| `supplierInviteChallenges` | `inviteId` (ASC), `createdAt` (DESC) | OTP daily limit check |

## 5. V2 Rollout Strategy

### Rollout Phases

1. **Internal** — Set `NEXT_PUBLIC_SUPPLIER_INVITE_V2_ENABLED=true` in the target environment and test with real inboxes.
2. **Beta** — Enable for 3–5 selected customers. Monitor KPIs for 2 weeks.
3. **KPI Review** — Check gates (see below). Adjust SPF/DKIM or UX if needed.
4. **GA** — Default to `true` for all new registers (if gates met).
5. **V1 Coexistence** — V1 remains available as "Einfacher Einreichungslink (ohne Verifikation)". No hard sunset date.

### KPI Gates for Default Switch (V1 → V2)

These are orientation values, not hard automation. The team decides.

| KPI | Target | Why |
| :--- | :--- | :--- |
| Verification rate (OTP starts → verified) | > 80% | OTP delivery works reliably |
| Completion rate (verified → submitted) | > 60% | No UX drop-off from added friction |
| Bounce rate (deliveryFailed) | < 5% | Email infrastructure is stable |
| Support cases | < 3 per 100 invites | Self-service works |
| Minimum sample size | ≥ 50 V2 invites in beta | Statistical minimum |

### KPI Instrumentation

All KPI-relevant events are emitted via structured logging in the app (`logInfo`/`logWarn`) and named `console` events in Functions:

| Event | Fields | KPI |
| :--- | :--- | :--- |
| `supplier_invite_campaign_created` | campaignId, registerId, recipientCount, inviteEmailSentCount, inviteEmailFailedCount | Batch baseline |
| `supplier_invite_v2_issued` | inviteId, registerId, intendedDomain | Invite creation baseline |
| `supplier_invite_email_sent` | inviteId, registerId | Invite mail sent |
| `supplier_invite_email_failed` | inviteId, registerId, reason | Invite delivery failure |
| `supplier_invite_otp_sent` | inviteId, challengeId, ipHash | OTP start count |
| `supplier_invite_otp_email_sent` | inviteId, challengeId | OTP mail sent |
| `supplier_invite_otp_failed` | inviteId, challengeId, reason, ipHash | OTP failure analysis |
| `supplier_invite_reminder_sent` | inviteId, reminderNumber | Reminder sent |
| `supplier_invite_reminder_failed` | inviteId, reminderNumber, reason | Reminder failure |
| `supplier_invite_confirmation_email_sent` | inviteId, submissionId, registerId | Confirmation mail sent |
| `supplier_invite_confirmation_email_failed` | inviteId, submissionId, registerId, reason | Confirmation mail failed |
| `supplier_invite_verified` | inviteId, challengeId, ipHash | Verification success |
| `supplier_invite_v2_submitted` | inviteId, registerId, timeToSubmitMs, riskFlags | Submission + timing |
| `supplier_conversion_signal_failed` | error | Optional supplier CTA tracking issue |
| `supplier_invite_revoked` | inviteId, registerId, revokedBy | Admin action |
| `supplier_invite_resend` | inviteId, registerId, resendBy | Resend rate |
| `supplier_invite_recreated` | oldInviteId, newInviteId, registerId | Reissue rate |
| `supplier_invite_otp_daily_limit` | inviteId, todayCount | Abuse signal |

### Rollback

- Per-customer: set `NEXT_PUBLIC_SUPPLIER_INVITE_V2_ENABLED=false` for that environment.
- Global: revert env var. V1 tokens continue to work. No data migration needed.

### Batch Safety Defaults

- Maximal `20` Kontakte pro Anfragegruppe
- Maximal `2` Sammelanfragen pro `15` Minuten und Register
- E-Mail-Deduplizierung innerhalb jeder Anfragegruppe
- Bestehende offene Anfrage wird nur fuer dieselbe E-Mail ersetzt, nicht mehr registerweit

### Reminder Safety Defaults

- Maximal `2` automatische Erinnerungen pro Invite
- Schwellwerte: Tag `3` und Tag `7` nach initialem Invite-Versand
- Opt-out-Link in jeder Reminder-Mail

## 6. Deployment

Push the changes and deploy your Next.js application.

```bash
git push
```

For Firebase resources in this repo, the practical rollout sequence is:

```bash
firebase deploy --only firestore:rules --project ai-act-compass-m6o05
firebase deploy --only firestore:indexes --project ai-act-compass-m6o05
npm --prefix functions run build
firebase deploy --only functions --project ai-act-compass-m6o05
```

The web app itself is served through Firebase App Hosting. Once the required App Hosting secrets exist, push to the connected GitHub branch or create a manual rollout for the backend in Firebase App Hosting.
