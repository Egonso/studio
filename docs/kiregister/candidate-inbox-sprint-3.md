# KIRegister Candidate Inbox Sprint 3

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 3 führt die Candidate-Inbox als eigenen technischen Schreibpfad ein.
Ein Agent kann Vorschläge an KIRegister übergeben, ohne echte Use Cases zu
erzeugen oder bestehende Registereinträge zu verändern.

Das ist die entscheidende Produktgrenze:

> Agenten dürfen vorbereiten. Menschen übernehmen.

## Neuer Datenpfad

Kandidaten werden getrennt von echten Use Cases gespeichert:

```text
users/{ownerId}/registers/{registerId}/agentCandidates/{candidateId}
```

Damit bleiben echte Registereinträge unter:

```text
users/{ownerId}/registers/{registerId}/useCases/{useCaseId}
```

## Neue Operator-Endpunkte

```http
GET /api/agent/operator/candidates?registerId=reg_123
GET /api/agent/operator/candidates/{candidateId}?registerId=reg_123
POST /api/agent/operator/candidates
```

Erforderlicher Scope:

```text
write:candidate
```

Der Scope ist bewusst enger als `read:usecase`, weil Kandidaten Evidenz,
Review-Fragen und lokale Agentenhinweise enthalten können.

## Candidate-Payload

```json
{
  "registerId": "reg_123",
  "manifest": {
    "documentationType": "workflow",
    "title": "Support answer assistant",
    "purpose": "Draft support answers for human review.",
    "ownerRole": "Support Lead",
    "usageContexts": ["CUSTOMERS"],
    "systems": [{ "position": 1, "name": "Zendesk" }]
  },
  "confidence": 0.78,
  "blockedBy": ["personal-or-sensitive-data"],
  "reviewQuestions": [
    {
      "reason": "personal-or-sensitive-data",
      "question": "Which customer data categories are processed?",
      "blocks": "submission"
    }
  ],
  "evidence": [
    {
      "source": "repository",
      "sourceRef": "package.json",
      "claim": "OpenAI dependency detected",
      "confidence": 0.82,
      "sensitive": false
    }
  ],
  "duplicateHints": [
    {
      "useCaseId": "uc_existing",
      "purpose": "Draft support ticket summaries.",
      "score": 0.51,
      "reason": "similar support purpose"
    }
  ]
}
```

## Sicherheitsgrenze

Der Candidate-Endpoint:

- prüft Agent-Kit-Key und Scope serverseitig
- prüft Register-Zugehörigkeit gegen Personal- oder Workspace-Scope
- validiert das eingebettete Agent-Kit-Manifest
- schreibt nur `agentCandidates`
- schreibt niemals `useCases`
- setzt keinen Review- oder Registerstatus

## Nächster Sprint

Sprint 4 soll die lokale CLI anbinden:

```bash
studio-agent operator candidate submit ./docs/agent-workflows/<slug>/manifest.json
studio-agent operator candidates --register-id reg_123 --json
studio-agent operator candidate cand_123 --register-id reg_123 --json
```

Erst danach ist der lokale Autopilot-End-to-End-Pfad wirklich nutzbar:

1. Registerzustand lesen
2. lokalen Kandidaten erzeugen
3. Candidate an KIRegister einreichen
4. Mensch prüft im Produkt

Sprint 4 hat die CLI-Anbindung umgesetzt. Details:
[`docs/kiregister/candidate-cli-sprint-4.md`](./candidate-cli-sprint-4.md).
