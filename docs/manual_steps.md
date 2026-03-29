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
- `supplierInviteChallenges` — admin SDK only (rules: `allow read, write: if false`)

### Composite Indexes
| Collection | Fields | Purpose |
| :--- | :--- | :--- |
| `registerSupplierInvites` | `registerId` (ASC), `status` (ASC) | Filter active invites per register |
| `supplierInviteChallenges` | `inviteId` (ASC), `createdAt` (DESC) | OTP daily limit check |

### Firestore TTL Policy
Activate TTL policy for `supplierInviteChallenges` on field `ttlDeleteAt` via Firebase Console.

### Secrets
- `SUPPLIER_SESSION_SECRET` — 32 byte random base64: `openssl rand -base64 32`
- `SUPPLIER_SESSION_SECRET_PREVIOUS` — optional, for key rotation (set to old value when rotating)

### SendGrid (for OTP delivery)
- Create a transactional template for OTP codes
- Set `SENDGRID_SUPPLIER_OTP_TEMPLATE_ID` in Functions Config
- Verify SPF/DKIM for the sender domain
- Sender: `noreply@[product-domain]`

### Migration Strategy
V1 tokens (`srt_` prefix) and V2 invites (`sinv_` prefix) coexist. V1 tokens expire naturally (max 7 days after Sprint 1a). No data migration required.

### Feature Flag
Set `NEXT_PUBLIC_SUPPLIER_INVITE_V2_ENABLED=true` to enable V2 invite creation.

## 4. Deploy Firestore Indexes

Deploy the updated composite indexes for V2 collections:

```bash
firebase deploy --only firestore:indexes
```

**New Indexes (V2):**

| Collection | Fields | Purpose |
| :--- | :--- | :--- |
| `registerSupplierInvites` | `registerId` (ASC), `createdAt` (DESC) | Admin invite list per register |
| `registerSupplierInvites` | `registerId` (ASC), `status` (ASC) | Filter active invites per register |
| `supplierInviteChallenges` | `inviteId` (ASC), `createdAt` (DESC) | OTP daily limit check |

## 5. V2 Rollout Strategy

### Rollout Phases

1. **Internal** — Set `SUPPLIER_INVITE_V2_ENABLED=true` for internal test accounts only.
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

All KPI-relevant events are emitted via structured logging (`logInfo`/`logWarn`):

| Event | Fields | KPI |
| :--- | :--- | :--- |
| `supplier_invite_v2_issued` | inviteId, registerId, intendedDomain | Invite creation baseline |
| `supplier_invite_otp_sent` | inviteId, challengeId, ipHash | OTP start count |
| `supplier_invite_otp_failed` | inviteId, challengeId, reason, ipHash | OTP failure analysis |
| `supplier_invite_verified` | inviteId, challengeId, ipHash | Verification success |
| `supplier_invite_v2_submitted` | inviteId, registerId, timeToSubmitMs, riskFlags | Submission + timing |
| `supplier_invite_revoked` | inviteId, registerId, revokedBy | Admin action |
| `supplier_invite_resend` | inviteId, registerId, resendBy | Resend rate |
| `supplier_invite_recreated` | oldInviteId, newInviteId, registerId | Reissue rate |
| `supplier_invite_otp_daily_limit` | inviteId, todayCount | Abuse signal |

### Rollback

- Per-customer: set `SUPPLIER_INVITE_V2_ENABLED=false` for that environment.
- Global: revert env var. V1 tokens continue to work. No data migration needed.

## 6. Deployment

Push the changes and deploy your Next.js application.

```bash
git push
```
