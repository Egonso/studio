# Agent Prompt & Workflow Guidelines

This document serves as the **primary instruction set** for any Agent or Developer working on the **Studio** project. It defines the "Soul" of the project: scalable, clean, and built on stable objects.

## 1. The Core Philosophy: "Stable Objects"

We build **Stable Objects**. A Stable Object is a self-contained, atomic unit of functionality that does one thing well and rarely needs to change once built.

- **Atomic**: It has no unnecessary dependencies.
- **Predictable**: Input -> Output. No hidden side effects.
- **Typed**: TypeScript is not optional. Types are the contract.
- **Localized**: Everything it needs (styles, hooks, sub-components) should be as close to it as possible (colocation).

### 1.1 The Folder Structure ("Fractal Architecture")

We prefer a **Feature-based** architecture over a technical one.

```text
src/
  features/           # Business logic & distinct domains
    auth/
      components/     # Components specific to Auth (LoginForm, etc.)
      hooks/          # Hooks specific to Auth (useCurrentUser, etc.)
      lib/            # Utilities specific to Auth
      index.ts        # The PUBLIC API of this feature.
    projects/
    ...
  components/         # Generic, reusable UI components (Buttons, Inputs)
                      # These are "Dumb" components. They know nothing of business logic.
  lib/                # Shared utilities (firebase, date formatting)
  app/                # Next.js App Router (glue code only!)
```

**Rule**: The `app/` directory should contain minimal logic. It stitches `features` together.

## 2. The Workflow ("The Protocol")

Every task must follow this 4-step protocol. Do not skip steps.

### Step 1: PLAN (The "Why" & "What")

- **Understand**: Read the user request. Ask clarifying questions if ambiguous.
- **Scope**: Identify which "Stable Objects" (features or components) need to be created or modified.
- **Checklist**: specific tasks in `task.md`.

### Step 2: DESIGN (The "How")

- **Structure First**: Before writing logic, define the folder structure and file names.
- **Interface Design**: Define the TypeScript interfaces/props *before* implementation.
- **Agent Note**: Propose the file structure to the user if complex.

### Step 3: IMPLEMENT (The "Code")

- **Strict Mode**: No `any`. No `@ts-ignore` unless absolutely critical (and commented).
- **Styles**: Use Tailwind CSS.
- **Colocation**: If a component needs a helper function used *only* there, put it in the same file or a sibling file. Don't pollute `src/lib`.

### Step 4: VERIFY (The "Proof")

- **Self-Correction**: Read your own code. Does it match the plan?
- **Build Check**: Does it compile?
- **User Verification**: Ask the user to check a specific flow.

## 3. Firebase & Data Architecture

- **Typed Firestore**: All Firestore access MUST use typed converters. Never access raw `DocumentData`.
- **Client-Side**: Use efficient hooks (e.g., `react-firebase-hooks` or custom wrappers).
- **Server-Side**: Use `firebase-admin` meant for the backend/API routes.
- **Security Rules**: Every collection MUST have security rules defined in `firestore.rules`.
- **Indexes**: Update `firestore.indexes.json` immediately when adding complex queries.

## 4. Coding Standards

- **Naming**:
  - Components: `PascalCase` (e.g., `ProjectCard.tsx`)
  - Hooks: `camelCase` (e.g., `useProject.ts`)
  - Utilities: `camelCase` (e.g., `formatDate.ts`)
  - Folders: `kebab-case` (e.g., `user-profile`)
- **Exports**: Prefer Named Exports over Default Exports.
  - `export function Component() {}` (Good)
  - `export default function Component() {}` (Avoid - makes refactoring harder)

## 5. "Pocket" Context

When starting a task, ask yourself:

1. "Am I creating a new stable object?" -> Create a new folder.
2. "Am I modifying an existing one?" -> Ensure I don't break its contract.
3. "Is this global or local?" -> Push down as low as possible.
