# KIRegister Candidate API Status Filter Sprint 11

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 11 macht den Statusfilter aus der Review-Inbox auch serverseitig
verfügbar. Dadurch können lokale Operator-Clients und spätere größere
Review-Inboxen gezielt nur Kandidaten eines Status laden.

## Betroffene Endpunkte

```http
GET /api/agent/operator/candidates?registerId=reg_123&status=needs_review
GET /api/workspaces/{orgId}/agent-kit/candidates?registerId=reg_123&status=accepted
```

Zulässige Statuswerte:

```text
needs_review
accepted
rejected
merged
```

Ungültige Statuswerte werden nicht ignoriert, sondern mit `400` beantwortet.

## CLI

Das lokale Agent Kit kann Candidate-Listen jetzt ebenfalls filtern:

```bash
studio-agent operator candidates --register-id reg_123 --status needs_review --json
```

Der Smoke-Test prüft, dass `status` und `limit` an den Operator-Endpunkt
weitergegeben werden.

## Produktgrenze

Sprint 11 ändert keine Review-Entscheidung, keinen Merge und keine
Use-Case-Erzeugung. Es ist ausschließlich ein Lese- und Orientierungsfilter.

## Nächster Sprint

Sprint 12 sollte die Review-Inbox nach Entscheidung oder Merge besser
orientieren: klare Folgehinweise, bessere leere Zustände und weniger
Verwirrung, wenn ein Filter keine Kandidaten enthält.
