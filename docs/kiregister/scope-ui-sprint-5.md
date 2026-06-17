# KIRegister Agent-Kit Scope UI Sprint 5

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 5 macht die neue Agentenstrategie in der Produktoberfläche sichtbar.
API-Keys werden nicht mehr implizit als reine Submit-Keys verstanden, sondern
beim Erstellen bewusst einem Modus zugeordnet.

## Neue Key-Modi

```text
Submit-only        -> submit:usecase
Read-only Operator -> read:register, read:usecase
Candidate Operator -> read:register, read:usecase, write:candidate
```

Die Auswahl liegt in `Settings > Agent Kit API Keys`. Das UI sendet die Scopes
an die bestehende Key-API:

```http
POST /api/workspaces/{orgId}/agent-kit/keys
```

## Produktgrenze

Operator-Keys sind keine stillen Admin-Keys.

- `Submit-only` darf bestätigte Manifeste direkt einreichen.
- `Read-only Operator` darf Registerzustand lesen, aber nichts schreiben.
- `Candidate Operator` darf Review-Kandidaten ablegen, aber keine echten Use
  Cases erzeugen.

Owner und Admins können Operator-Scopes erstellen. Andere Rollen bleiben bei
Submit-only.

## CLI-Anschluss

Die Oberfläche zeigt je nach Modus ein passendes Snippet:

```bash
studio-agent submit ./docs/agent-workflows/<slug>/manifest.json
studio-agent operator use-cases --register-id reg_123 --json
studio-agent operator candidate submit ./docs/agent-workflows/<slug>/manifest.json --register-id reg_123 --json
```

Damit wird der lokale Autopilot-Pfad ohne Produkt-Mehrdeutigkeit erreichbar:

1. Read-only-Key zum Prüfen und Abgleichen
2. Candidate-Key zum Ablegen von Review-Kandidaten
3. Submit-only-Key nur für explizit bestätigte Einreichungen

## UI-Charta-Abgleich

Die Umsetzung bleibt charta-konform:

- Objekt der Seite bleibt die Organisationseinstellung für Agent-Kit-Keys.
- Berechtigungen werden sachlich als dokumentierte Zuständigkeit gezeigt.
- Keine Upgrade-, Premium- oder Aktivierungs-Sprache.
- Keine farbliche Alarmästhetik für normale Scope-Unterschiede.
- Bestehende Keys zeigen ihren Modus sekundär unter der Key-Vorschau.

## Nächster Sprint

Sprint 6 bindet die menschliche Review-Inbox an:

1. user-authentifizierte Candidate-Liste für persönliche Register und Workspace-Reviewer
2. ruhige Detailansicht mit Manifest, Evidenz, Blockern und Review-Fragen
3. noch keine Übernahme in echte Use Cases
4. erst danach eine separat geprüfte Aktion `Als Einsatzfall übernehmen`

Details:
[`docs/kiregister/candidate-review-ui-sprint-6.md`](./candidate-review-ui-sprint-6.md).
