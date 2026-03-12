# Route Map

This repository now uses one canonical product route model:

- Public auth entry: `/`
- Public external intake: `/erfassen`, `/request/[requestToken]`
- Signed-in free register: `/my-register`, `/my-register?section=use-cases`, `/my-register?filter=supplier_requests`, `/capture`, `/settings`
- Paid governance control center: `/control`, `/control/reviews`, `/settings/governance`, `/control/policies`, `/control/exports`, `/control/trust`, `/control/organisation`, `/academy`

## Canonical Routes

| Segment | Route | Purpose |
| --- | --- | --- |
| Public auth entry | `/` | Single public auth entry for new register, login, join, import and checkout-return context |
| Public external intake | `/erfassen` | Access-code based external capture |
| Public external intake | `/request/[requestToken]` | Supplier request intake via signed, expiring request token |
| Signed-in free register | `/my-register` | Canonical register workspace |
| Signed-in free register | `/my-register?section=use-cases` | Use-case lens inside the same register workspace |
| Signed-in free register | `/my-register?filter=supplier_requests` | External inbox lens inside the same register workspace |
| Signed-in free register | `/capture` | Signed-in quick capture |
| Signed-in free register | `/settings` | Account and governance settings |
| Paid governance control | `/control` | Governance control center overview |
| Paid governance control | `/control/reviews` | Reviews and action queue |
| Paid governance control | `/settings/governance` | Governance settings |
| Paid governance control | `/control/policies` | Policy engine |
| Paid governance control | `/control/exports` | Export and audit bundle center |
| Paid governance control | `/control/trust` | Trust portal and disclosure management |
| Paid governance control | `/control/organisation` | Rollen, Freigaben, Identity, Beschaffung und Audit-Export |
| Paid governance control | `/academy` | Governance learning and certification |

## Retained Public / Utility Routes

These are still valid and intentionally not redirected:

- `/gesetz`
- `/downloads`
- `/verify/[code]`
- `/verify/pass/[hashId]`
- `/trust/[projectId]`
- `/exam`

## Deprecated Aliases

Configured in [route-manifest.ts](/Users/momofeichtinger/.codex/worktrees/3d18/studio/src/lib/navigation/route-manifest.ts) and applied through [next.config.ts](/Users/momofeichtinger/.codex/worktrees/3d18/studio/next.config.ts).

| Deprecated route | Redirects to | Reason |
| --- | --- | --- |
| `/login` | `/` | Login now lives inside the canonical root auth entry |
| `/einrichten` | `/` | Register setup now lives inside the canonical root auth entry |
| `/einladen` | `/` | Invite join now lives inside the canonical root auth entry |
| `/projects` | `/my-register` | Legacy project list replaced by register-first workspace |
| `/ai-management` | `/control` | Old AI-management shell collapsed into Control |
| `/aims` | `/control` | AIMS wizard is no longer a primary flow |
| `/assessment` | `/my-register` | Old assessment flow replaced by register-first capture/review |
| `/assessment/*` | `/my-register` | Nested assessment flow retired |
| `/portfolio` | `/control/portfolio` | Legacy portfolio shell now resolves to the control portfolio module |
| `/audit-report` | `/control/exports` | Audit dossier now belongs in org exports |
| `/cbs` | `/control/policies` | Policy engine moved under Control |
| `/cbd` | `/control` | Compliance-by-design no longer a primary route |
| `/kurs` | `/academy` | Academy is the canonical course path |
| `/dashboard/cbs` | `/control/policies` | Broken old dashboard deep link normalized |
| `/landingpage` | `/` | Landing variant retired |
| `/landingpage2` | `/` | Landing variant retired |
| `/landingpage3` | `/` | Landing variant retired |
| `/landingsimple` | `/` | Landing variant retired |
| `/landingsimple1` | `/` | Landing variant retired |
| `/landingsimple2` | `/` | Landing variant retired |
| `/landingsimple4` | `/` | Landing variant retired |
| `/simplelanding` | `/` | Landing alias retired |

## Special Cases

- `/dashboard` is still a legacy compatibility route, but it is no longer a primary screen. It immediately redirects to `/control` when `projectId` is present, otherwise to `/my-register`.
- Additional control modules still exist under `/control/audit`, `/control/portfolio`, and `/control/batch-sealing`, but they are subordinate to the canonical `/control` shell.
- Free user navigation should always expose Register, Use Cases, External Inbox, and Settings.
- Paid navigation should always expose Control, Reviews, Governance Settings, Policies, Exports, Trust Portal, Organisation, and Academy.
- Legacy project-era pages may still exist in the tree for compatibility or code reuse, but they must not remain the primary path for a workflow.
