# KI-Register Onboarding (Standard-Flow)

Status: Implementiert in `src/app/page.tsx`, `src/app/einrichten/page.tsx`, `src/app/einladen/page.tsx`, `src/app/login/page.tsx`.

## Zielbild

- KI-Register als organisationsinterner Standard etablieren, nicht als Tool-Feature.
- Core-Einstieg ohne Paywall: Register einrichten, Einladungscode nutzen, ersten Einsatzfall erfassen.
- Nach Setup direkte Quick-Capture-Führung (ohne Dashboard-Umweg für Members).

## User Journey

### Admin (Register-Verantwortung)

1. Landing `/'`: CTA `KI-Register einrichten`.
2. `'/einrichten'` Schritt 1: Name, E-Mail, Passwort.
3. `'/einrichten'` Schritt 2: Organisationsname, Rolle (optional).
4. System prüft auf bestehendes Register mit gleichem Organisationsnamen.
5. System erzeugt Einladungscode + Erfassungslink als optionale Team-Freigabe.
6. Primäre nächste Aktion ist: Admin öffnet Register mit `?onboarding=true` und landet direkt in Quick-Capture.

### Member (Einladungscode)

1. Landing `/'`: CTA `Einladungscode verwenden`.
2. `'/einladen'` Schritt 1: Code-Eingabe.
3. API-validierte Organisationsbestätigung.
4. Minimal-Signup (Name, E-Mail, Passwort).
5. Direkte Weiterleitung in `'/erfassen?code=...'` (Quick-Capture über Code, kein Dashboard).

## Copy-Leitlinien pro Seite

- `/'` Headline: `Jede Organisation mit KI-Einsatzfällen führt ein KI-Register.`
- `/'` CTA primär: `KI-Register einrichten`
- `/'` CTA sekundär: `Einladungscode verwenden`
- `'/einrichten'` Abschluss: `Jetzt ersten Einsatzfall selbst erfassen`
- `'/einladen'` Bestätigung: `Organisation bestätigen`
- Keine Begriffe: Upgrade, Premium, Enterprise, Freischalten.

## IA / Text-Wireframe

### Landing

1. Header (Marke + Anmelden)
2. Headline + 2-Satz-Definition
3. 3 Gründe (Verantwortung, Status/Prüfstand, Nachweis/Export)
4. CTA-Gruppe (Einrichten / Einladungscode)
5. Vertrauenszeilen (privat, organisationsintern, Output PDF/JSON)

### Einrichten

1. Header
2. Schrittindikator (3 Schritte)
3. Zugang anlegen
4. Organisationsdaten
5. Primäre CTA: ersten Einsatzfall selbst erfassen
6. Sekundär: Team-Freigabe mit Erfassungslink (empfohlen) oder Einladungscode (Fallback)

### Einladen

1. Header
2. Code-Eingabe
3. Organisationsbestätigung
4. Zugang anlegen
5. Direkter Übergang in Erfassung

## UI-Komponentenhinweise

- Sekundäraktionen als kleine Outline/Neutral-Buttons.
- Utility-Aktionen im Register-Header in fester Reihenfolge:
  1. `+ KI-Einsatzfall erfassen`
  2. `Lieferant anfragen`
  3. `Erfassungslink teilen`
- Keine Warnästhetik im Onboarding-Flow.
- Team-Sharing nie als erste Pflichtentscheidung für den Owner darstellen.

## Technische Notiz

### Warum

- Der bisherige Member-Flow nutzte clientseitige Firestore-Reads auf `registerAccessCodes` und kollidierte mit Rules (Owner-only Read).
- Damit konnte Code-Validierung für neue Mitglieder fehlschlagen.

### Datenfluss

- Code-Validierung Member: `GET /api/capture-by-code?code=...` (Server/Admin SDK).
- Member-Erfassung: `POST /api/capture-by-code` schreibt Use-Case in Owner-Register.
- Admin-Setup erzeugt Access-Code über `accessCodeService.generateCode` und teilt `'/erfassen?code=...'`.
- Wenn der bereits angemeldete Code-Owner seinen eigenen Link öffnet und die öffentliche Validierung `503` liefert, kann `'/erfassen'` auf einen clientseitigen Owner-Fallback wechseln.

### Fehlerbehandlung (Capture-by-Code)

- `400/404`: Code formal ungültig oder nicht gefunden.
- `410`: Code deaktiviert oder abgelaufen.
- `429`: Rate-Limit erreicht.
- `503`: Dienst temporär nicht verfügbar (z. B. Runtime-Credentials nicht geladen).
- Legacy-Code-Dokumente werden tolerant gelesen (`ownerId|userId`, `registerId|projectId`), um 500 durch alte Feldnamen zu vermeiden.
- Firebase-Admin akzeptiert mehrere Env-Schemata (u. a. `FIREBASE_ADMIN_*`, `FIREBASE_*`, `GOOGLE_*`) für robustere Netlify-Runtime-Initialisierung.
- UI auf `'/erfassen'` zeigt dafür differenzierte Titel statt pauschal „Code ungültig“.

### Risiken

- Duplicate-Codes sind bei rein zufälliger 6-stelliger Generierung theoretisch möglich (kein Retry-Loop auf Kollision).
- `login`-Signup ist weiterhin legacy-kaufgebunden; Onboarding nutzt dafür eigene Routen (`/einrichten`, `/einladen`).

### Rollback

- Revert dieser Dateien:
  - `src/app/page.tsx`
  - `src/app/einrichten/page.tsx`
  - `src/app/einladen/page.tsx`
  - `src/app/login/page.tsx`
  - `src/components/register/governance-header.tsx`
- Keine Migration nötig (keine Schema- oder API-Breaking-Änderung).
