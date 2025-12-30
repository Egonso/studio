# Dashboard Onboarding & Routing

## Rationale

The **Dashboard is the Single Source of Truth** for user context. To reduce churn, new users are immediately presented with the onboarding wizard instead of an empty project list.

## Routing Rules

* **`/dashboard`** (Entry Point)
  * **0 Projects:** Shows `<DashboardStartArea />`. This contains the **Project Creation Wizard** to onboard the user immediately.
  * **>0 Projects:** Shows the standard Dashboard Overview (Project status, Next actions).

* **`/projects`** (Management)
  * **0 Projects:** Automatically redirects to `/dashboard`.
  * **>0 Projects:** Displays the table of existing projects and allows creating new ones.

## Key Components & Architecture

* **`useProjectWizard` Hook** (`src/hooks/use-project-wizard.ts`):
  * **Sole owner** of form state, validation, and submission logic.
  * Decouples logic from UI to preventing duplication.

* **`ProjectCreationWizard` Component** (`src/components/wizard/project-creation-wizard.tsx`):
  * **Sole owner** of the Wizard UI.
  * Accepts `variant` prop (`'embedded' | 'card'`) to adapt layout without forking logic.
  * Accepts `onComplete` callback to handle routing contexts (Dashboard vs Projects List).

* **`DashboardStartArea` Component**:
  * "Hero" wrapper for the empty state.
  * Embeds the wizard via `<ProjectCreationWizard variant="embedded" />`.

## Architecture Constraints (Strict)

1. **Single Source of Truth:** Never duplicate the project creation form logic. Always import `ProjectCreationWizard`.
2. **No Logic Forks:** Use props for visual variations.
3. **Redirects:**
    * Login -> `/dashboard`
    * `/projects` (empty) -> `/dashboard`

## Firestore Queries

### Check for Projects

Currently uses `getUserProjects()` which checks for existing projects for the user.

### Create Project Flow

Uses `createProject()` in `data-service.ts`.

* Creates the Project entity (Container).
* Sets up initial metadata (Sector, System Type, Risks).

## Notes for Contributors

* **Do not** create separate "Wizard Modals" that trigger on page load. Use the inline `<DashboardStartArea />` component.
* Always redirect legacy empty states to the Dashboard.
