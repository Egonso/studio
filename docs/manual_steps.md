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

## 3. Deployment
Push the changes and deploy your Next.js application.

```bash
git push
```
