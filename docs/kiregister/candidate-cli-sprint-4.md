# KIRegister Candidate CLI Sprint 4

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 4 bindet die Candidate-Inbox aus Sprint 3 an das lokale Agent-Kit-CLI an.
Damit kann ein lokaler Agent nicht nur Registerzustand lesen, sondern ein
validiertes Manifest als Review-Kandidat an KIRegister übergeben.

## Neue CLI-Kommandos

```bash
studio-agent operator candidates --register-id reg_123 --json
studio-agent operator candidate cand_123 --register-id reg_123 --json
studio-agent operator candidate submit ./docs/agent-workflows/<slug>/manifest.json --register-id reg_123 --json
```

## Candidate Submit

Der Submit-Befehl akzeptiert ein Agent-Kit-Manifest oder einen Workflow-Ordner:

```bash
studio-agent operator candidate submit ./docs/agent-workflows/support-assistant \
  --register-id reg_123 \
  --confidence 0.74 \
  --blocked-by personal-or-sensitive-data,unknown-owner \
  --json
```

Vor dem Netzwerkcall validiert die CLI das Manifest lokal. Ungültige Manifeste
werden nicht an KIRegister gesendet.

## Sicherheitsgrenze

Der CLI-Submit ruft ausschließlich auf:

```http
POST /api/agent/operator/candidates
```

Er ruft nicht auf:

```http
POST /api/agent-kit/submit
```

Damit bleibt `candidate submit` ein Review-Vorschlag und kein echter
Registereintrag.

## Konfiguration

Erforderlich:

```bash
export KI_REGISTER_API_KEY="akv1.<scopeId>.<keyId>.<secret>"
export KI_REGISTER_REGISTER_ID="reg_123"
```

Für lokale oder Preview-Ziele:

```bash
export KI_REGISTER_OPERATOR_ENDPOINT="https://preview.example.com/api/agent/operator"
```

## Validierung

Der Agent-Kit-Smoke-Test prüft mit lokalem Mock-Server:

- Candidate-Liste
- Candidate-Detail
- Candidate-Submit mit Manifest, Confidence und Blockern

## Nächster sinnvoller Schritt

Sprint 5 sollte die Produktoberfläche anschließen:

1. API-Key UI mit Scope-Auswahl (`Submit-only`, `Read-only`, `Candidate`)
2. ruhige Candidate Review Inbox im KIRegister
3. Detailansicht für Kandidat, Evidenz und offene Review-Fragen
4. noch keine Übernahme in echte Use Cases, bevor die Review-Aktion separat
   modelliert und getestet ist
