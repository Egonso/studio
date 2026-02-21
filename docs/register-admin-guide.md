# AI Register-First Administration Guide

Welcome to the Register-First AI Compliance OS. This guide outlines the core workflows for administrators managing AI Use Cases within their organization to maintain compliance with the EU AI Act and GDPR.

## 1. Access Code Management

Access codes allow your employees to submit new AI use cases quickly without needing an account.

- **Where to find it:** Navigate to `Einstellungen` (Settings).
- **Creating a code:**
  - Click "Neuen Code erstellen".
  - Specify a **Label** (e.g., "Marketing Team" or "Company All-Hands").
  - Define an **Expiry Date** (30 days, 90 days, or 1 Year). Avoid Unlimited for security.
- **Sharing:** Copy the secure link and share it securely.
- **Revoking access:** You can toggle the active status of any code or delete it altogether if compromised.

## 2. Review Workflow

When an employee captures a Use Case using an Access Code, it lands in your Register with the status `UNREVIEWED`.

1. **Open the Register:** Navigate to `Mein Register`.
2. **Access Detail View:** Click on any Use Case row to open the full Detail View.
3. **Verify Information:** Ensure the metadata (Purpose, Tool, Owner) is complete and accurate. You can edit the Use Case in the Detail View.
4. **Conduct Compliance Check:** Click "Compliance prüfen" to leverage our Perplexity-integrated intelligence to check if the tool is GDPR & EU AI Act compliant.
5. **Add Review Notes:** You can add specific internal review notes or link external evidences (privacy policies, DPIAs).
6. **Update Status:** Change the status sequentially: `UNREVIEWED` → `REVIEW_RECOMMENDED` → `REVIEWED` → `PROOF_READY`.

## 3. Advanced Sorting and Filtering

The `Mein Register` dashboard provides advanced sorting:

- Sort ascending or descending by `Erstellt am`, `Zuletzt geändert`, `Name`, `Verantwortlich`, `Status`, or `Tool`.
- Use the views dropdown to group use cases cleanly.
- You can toggle deleted use cases to temporarily see what was removed.

## 4. Audit Trail and Soft Deletes

We strictly enforce compliance tracking and non-repudiation:

- **Soft Deletes:** Deleting a Use Case moves it to a "Deleted" state instead of permanently removing it from the database immediately. It can be restored within 90 days.
- **Status History:** Every status change is automatically logged along with the user who made the change and the exact timestamp.
- **Capture Metadata:** The original IP and Access Code label used during capture are recorded indefinitely to prove the origin of the submission.
