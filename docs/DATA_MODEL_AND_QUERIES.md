# FireStore Data Model & Query Cheatsheet

This document serves as the **Single Source of Truth** for the AI Act Compass data architecture. It defines the database schema, required indexes, query patterns, and UX rules for the "Wizard-First" approach.

---

## 1. Data Model (Schema)

We use a **hybrid architecture** distinguishing between "Tool Containers" (`workspaceProjects`) and real-world "AI Systems" (`aiSystems`).

### Root Collections

#### `organizations` (Mandants)
*   `orgId` (Document ID)
*   `name`: string
*   `domain`: string
*   `createdAt`: Timestamp

#### `workspaceProjects` (Tool Container)
*   `projectId` (Document ID, matches URL `?projectId=...`)
*   `orgId`: string
*   `name`: string ("Audit Q4 2024")
*   `createdBy`: userId
*   `createdAt`: Timestamp
*   *Note: Does NOT contain business logic data anymore.*

#### `aiSystems` (The Core Entity)
*   `systemId` (Document ID)
*   `orgId`: string
*   `primaryWorkspaceId`: string (Creation context)
*   `title`: string
*   `department`: string
*   `dedupeKey`: string (Normalized `title_department` for uniqueness checks)
*   `lifecycleStatus`: 'idea' | 'pilot' | 'live' | 'retired'
*   `businessOwner`: string
*   `valueScore`: number (1-100)
*   `riskScore`: number (1-100)
*   `createdAt`: Timestamp
*   `updatedAt`: Timestamp

#### `aiSystems/{systemId}/assessments` (Subcollection)
*   `assessmentId` (Document ID)
*   `type`: 'ai-act-compliance' | 'risk-assessment'
*   `status`: 'in_progress' | 'completed'
*   `answers`: Map<string, any>
*   `projectId`: string (Snapshot of workspace context)
*   `updatedAt`: Timestamp

#### `isoAIMS` (Org Singleton)
*   Document ID: `iso_{orgId}` (Deterministic)
*   `orgId`: string
*   `status`: 'setup' | 'running'
*   `policyContent`: string
*   `riskMethodology`: string
*   `createdAt`: Timestamp
*   `updatedAt`: Timestamp

#### `isoControls` (Org-Wide Controls)
*   `controlId` (Document ID)
*   `aimsId`: string (Ref to `isoAIMS`)
*   `category`: string ('leadership', 'operation', etc.)
*   `status`: 'implemented' | 'planned' | 'not_applicable'
*   `updatedAt`: Timestamp

---

## 2. Query & Index Cheatsheet

### A. AI Project List (Portfolio)
**Goal:** List all AI Systems within a specific Workspace (Tool Project).

*   **Collection:** `aiSystems`
*   **Query:**
    ```javascript
    query(
      collection(db, 'aiSystems'),
      where('primaryWorkspaceId', '==', currentProjectId),
      orderBy('updatedAt', 'desc')
    );
    ```
*   **Composite Index:** `primaryWorkspaceId` (ASC) + `updatedAt` (DESC)
*   **Performance:** Fast queries by specific key. No denormalization needed.

### B. Portfolio Matrix (Value vs. Risk)
**Goal:** Plot all AI Systems of an Organization on a scatter chart.

*   **Collection:** `aiSystems`
*   **Query:**
    ```javascript
    query(
      collection(db, 'aiSystems'),
      where('orgId', '==', currentOrgId)
      // client-side filtering for active status if needed
    );
    ```
*   **Composite Index:** `orgId` (ASC) (Single field often suffices, but `orgId` + `updatedAt` is safe).
*   **Performance:** Requires reading all active systems. If >1000 systems per Org, consider pagination or denormalized aggregation document.

### C. AI Act Duties (Overview)
**Goal:** Show compliance status per system.

*   **Collection:** `aiSystems` (with client-side join on Assessments) or fetch Assessments directly if drilling down.
*   **Query (List View):** Same as Portfolio List.
*   **Query (Drill Down):**
    ```javascript
    getDocs(collection(db, `aiSystems/${systemId}/assessments`));
    ```
*   **Index:** Standard Subcollection index.

### D. ISO AIMS Status & Controls
**Goal:** Show organization-wide implementations.

*   **Collection:** `isoAIMS` (Direct fetch by ID) & `isoControls`
*   **Query (Controls):**
    ```javascript
    query(
      collection(db, 'isoControls'),
      where('aimsId', '==', `iso_${orgId}`),
      orderBy('category')
    );
    ```
*   **Composite Index:** `aimsId` (ASC) + `category` (ASC)

### E. Audit Dossier / Exports
**Goal:** Fetch all relevant evidence for a specific system or the whole org.

*   **Collection:** `auditArtifacts` (New Collection recommended)
*   **Query:**
    ```javascript
    query(
      collection(db, 'auditArtifacts'),
      where('orgId', '==', orgId),
      where('aiSystemId', '==', systemId), // Optional filter
      orderBy('createdAt', 'desc')
    );
    ```
*   **Index:** `orgId` (ASC) + `aiSystemId` (ASC) + `createdAt` (DESC)

---

## 3. Meta-Wizard Rules (UX Logic)

**"Wizard-First" Principle:**
A user should never land on an empty dashboard/detail view when clicking a module in the Meta-Wizard (Project Overview).

1.  **Check Existence:** Before navigating to a module details page (e.g., Audit or Assessment), query the DB.
2.  **Redirect Logic:**
    *   **Data Exists:** -> Redirect to **Dashboard/Overview View** (`/dashboard` or `/aims/dashboard`).
    *   **No Data:** -> Redirect to **Wizard Start Step 1** (`/assessment/start` or `/aims/wizard`).
3.  **Deduplication:**
    *   When starting a Wizard, ask for "System Name/Context".
    *   Check `dedupeKey`. If match found -> Show "Resume / Link" dialog instead of creating duplicate.

---

## 4. Updates & Migration Notes
*   **Backwards Compatibility:** The application code currently dual-writes to legacy paths (`projects/{id}/aimsData`) to enable safe rollback.
*   **Migration Path:** Queries should preferentially read from New Architecture paths. If empty, fall back to Legacy paths and trigger a background migration (lazy migration).
