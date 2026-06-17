# KIRegister Operator API Sprint 1

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 1 baut die Brücke vom lokalen Agenten zum echten KIRegister, ohne stille
Mutationen zu erlauben.

Der Agent darf mit einem explizit scoped Key lesen:

- welche Register im Scope erreichbar sind
- welche Use Cases in einem Register existieren
- wie ein einzelner Use Case aktuell dokumentiert ist

Der Agent darf in diesem Sprint nicht schreiben, aktualisieren, reviewen oder
Status verändern.

## Scopes

Agent-Kit-Keys haben jetzt explizite Scopes.

Aktive Scopes:

- `submit:usecase`
- `read:register`
- `read:usecase`
- `read:audit`
- `write:candidate`
- `write:review-note`
- `write:status-proposal`

Wichtig:

- Bestehende Keys ohne Scope-Feld werden als `submit:usecase` behandelt.
- Read-only Operator-Keys bekommen bewusst `read:register` und
  `read:usecase`, aber nicht automatisch `submit:usecase`.
- Normale Mitglieder können weiterhin Submit-only-Keys erstellen.
- Operator- oder spätere Schreib-Scopes können nur Owner und Admins erstellen.

## Read-only Operator Endpunkte

Alle Endpunkte akzeptieren den Agent-Kit-Key als Bearer Token oder
`x-api-key`.

### Register listen

```http
GET /api/agent/operator/registers
Authorization: Bearer akv1.<scopeId>.<keyId>.<secret>
```

Erforderlicher Scope:

```text
read:register
```

Antwort:

```json
{
  "mode": "read_only",
  "scopes": ["read:register", "read:usecase"],
  "registers": [
    {
      "registerId": "reg_123",
      "name": "KI Register",
      "organisationName": "Acme GmbH",
      "workspaceId": "ws_123",
      "createdAt": "2026-06-17T10:00:00.000Z",
      "ownerId": "user_123",
      "scopeType": "workspace"
    }
  ]
}
```

### Use Cases listen

```http
GET /api/agent/operator/use-cases?registerId=reg_123&limit=50
Authorization: Bearer akv1.<scopeId>.<keyId>.<secret>
```

Erforderlicher Scope:

```text
read:usecase
```

Optionale Query-Parameter:

- `status`
- `searchText`
- `limit` bis maximal 200

### Use Case lesen

```http
GET /api/agent/operator/use-cases/uc_123?registerId=reg_123
Authorization: Bearer akv1.<scopeId>.<keyId>.<secret>
```

Erforderlicher Scope:

```text
read:usecase
```

Die Detailantwort enthält eine bounded Summary und die kanonische Use-Case-Karte
unter `card`, damit ein lokaler Agent Änderungen vergleichen kann, ohne selbst
Registereinträge zu verändern.

## Sicherheitsentscheidung

Der Submit-Endpunkt prüft jetzt ebenfalls Scopes:

- `POST /api/agent-kit/submit` braucht `submit:usecase`
- read-only Operator-Keys können dort nicht einreichen
- alte Keys bleiben kompatibel, werden aber als Submit-only behandelt

Damit ist die Produktlinie klar:

> Der Operator liest zur Vorbereitung. Einreichen bleibt ein separater,
> bestätigter Schritt.

## Nächste Sprints

Sprint 2 sollte keine stillen Mutationen hinzufügen. Sinnvoll wäre:

1. UI für Key-Typen: `Einreichen`, `Read-only Operator`, `Custom`.
2. Lokale CLI-Befehle `operator registers` und `operator use-cases`.
3. Candidate-Inbox als eigener Schreibpfad mit `write:candidate`.
4. Audit-Log für Operator-Lesezugriffe, ohne Nutzungsdaten aufzublähen.
