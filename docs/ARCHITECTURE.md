# Project Architecture

## 1. Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend/DB**: Firebase (Firestore, Auth, Functions, Storage)
- **Deployment**: Vercel or Netlify (TBD)

## 2. Application Structure

The application follows a **Modular Feature Architecture**.

### 2.1 Core layers

1. **UI Layer (`src/components`, `src/features/**/components`)**:
   - Pure presentation.
   - composed of "Atoms" (buttons, inputs) and "Molecules" (forms, cards).
2. **Feature Layer (`src/features`)**:
   - Contains the business logic, state management, and domain-specific UI.
   - Example: `features/projects` handles creating, listing, and editing projects.
3. **Data Layer (`src/lib/firebase`)**:
   - Abstraction over Firestore / Auth SDKs.
   - Enforces types.

## 3. Data Model (Firestore)

### `users/{userId}`

- `displayName`: string
- `email`: string
- `createdAt`: timestamp

### `projects/{projectId}`

- `ownerId`: string (ref to users)
- `name`: string
- `createdAt`: timestamp
- `status`: 'active' | 'archived'

*(Note: Schema definitions should be maintained in `src/types/schema.ts`)*

## 4. Key Integrations

- **Auth**: Firebase Auth (Google Provider + Email/Password).
- **AI**: Gemini API (via Cloud Functions or Next.js API routes).
