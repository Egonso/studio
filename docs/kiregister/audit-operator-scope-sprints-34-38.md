# KIRegister Audit Operator Scope Sprints 34-38

Stand: 2026-06-17
Status: Lokal implementiert und validiert

## Ziel

Dieser Block macht den bereits vorgesehenen Scope `read:audit` praktisch
nutzbar.

Bisher konnten Candidate-Review-Auszüge nur über die menschliche Workspace-UI
exportiert werden. Für Automationen und technische Prüfungen braucht es einen
separaten Operator-Zugriff ohne Candidate-Schreibrechte.

## Enthaltene Sprints

### Sprint 34: Operator Review Export API

Neuer Endpunkt:

```http
GET /api/agent/operator/review-export?registerId=reg_123
```

Optionale Filter:

```http
status=needs_review
runId=run_20260617_001
```

Der Endpunkt verlangt `read:audit`.

### Sprint 35: Scope-Trennung

Der Export nutzt nicht `write:candidate`.

Damit kann ein Audit-Operator:

- Register finden
- Candidate-Review-Auszüge lesen

Er kann nicht:

- Kandidaten einreichen
- Läufe dokumentieren
- Review-Entscheidungen schreiben
- Use Cases erzeugen

### Sprint 36: CLI-Anbindung

Neuer CLI-Befehl:

```bash
studio-agent operator review-export --register-id reg_123 --json
studio-agent operator review-export --register-id reg_123 --run-id run_123 --out-file review.json
```

### Sprint 37: Key-Modus in Settings

Die Agent-Kit-Settings ergänzen `Audit Operator`.

Scopes:

```text
read:register
read:audit
```

### Sprint 38: Blockabschluss

Der Block ist gegen ESLint, Typecheck, Auth-Routentest und CLI-Smoke validiert.

## Akzeptanzkriterien

- `read:audit` ist praktisch nutzbar.
- Audit-Exports brauchen keine Candidate-Schreibrechte.
- Settings können Audit-Operator-Keys erstellen.
- Die CLI zeigt und nutzt den Review-Export-Befehl.
- Der Export bleibt bounded und rein lesend.

## Nächste sinnvolle Blöcke

- Run-Detailansicht mit Fehler- und Skipped-Source-Kontext
- visueller Preview-/Browser-Check der Review-Inbox
- signierbarer Audit-Anhang für Candidate-Review-Auszüge
