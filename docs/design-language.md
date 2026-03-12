# Design Language

This repository now uses four explicit page-shell patterns:

## 1. Public Auth Entry

- Primary route: `/`
- Purpose: give users one clean place to register, join via invitation code, or
  log in
- Traits:
  - public-only framing
  - no signed-in app chrome
  - a single auth card with `Neu` and `Anmelden`
  - obvious next step: create a register, join via code, or continue login

## 2. Public External Intake

- Primary routes: `/erfassen`, `/request/[requestToken]`
- Purpose: accept structured external input without exposing the signed-in app
- Traits:
  - separate public shell with intake-specific copy
  - no command palette, no app footer, no app widgets
  - success/error/loading states always explain the next public step
  - terminology stays on intake, submission, and review handoff

## 3. Signed-In Free Register

- Primary routes: `/my-register`, `/capture`, `/settings`,
  `/my-register/[useCaseId]`
- Purpose: document use cases, process external inbox items, and manage register
  settings
- Traits:
  - canonical app header and central nav
  - register-focused wording: register, use cases, external inbox, settings
  - obvious next step on each screen: document, review, or continue a use case

## 4. Paid Governance Control Center

- Primary routes: `/control`, `/control/policies`, `/control/exports`,
  `/control/trust`, `/academy`
- Purpose: review, govern, export, publish trust signals, and train teams
- Traits:
  - canonical app header and control framing
  - paid-governance wording: control, policies, exports, trust portal, academy
  - obvious next step on each screen: govern, review, export, or publish

## UI Conventions

- Every important screen must expose one primary next step in the hero or state
  block.
- Loading, empty, error, and success states use the shared state panel language
  instead of ad-hoc messages.
- Public forms must not show signed-in product widgets or ambiguous
  “dashboard/project” shortcuts.
- Legacy terms such as `dashboard`, `project`, and `assessment` should stay in
  redirects or explicitly internal/legacy modules, not in canonical
  register-first surfaces.

## Primary User Flows

- Public auth entry: `/` -> `Neu` or `Anmelden`
- Public external intake: `/erfassen` or `/request/[requestToken]` -> success
  handoff back to the submitting party
- Signed-in free register: `/` -> `/my-register` ->
  document use cases, process external inbox, manage settings
- Paid governance control: signed-in user with entitlement -> `/control` ->
  policies, exports, trust portal, academy
