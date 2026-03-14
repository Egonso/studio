# Firebase Studio

This is a NextJS starter in Firebase Studio.

### Architecture & Data Model

**The Data Model and Architecture documentation is the Single Source of Truth for this project.**

*   [**Data Model & Queries**](/docs/DATA_MODEL_AND_QUERIES.md) - Detailed Firestore schema, indexing rules, and query patterns.
*   [**Manual Deployment Steps**](/docs/manual_steps.md) - Required manual actions for Firebase rules and indexes.

Please refer to these documents before making changes to the database structure.

To get started, take a look at src/app/page.tsx.

### Local Development

- `npm run dev` starts the default Turbopack dev server on port `9002`.
- `npm run dev:compat` starts the classic Next.js dev server on port `9002` as a fallback when Turbopack hangs locally.
