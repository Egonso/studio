# KIRegister Operator CLI Sprint 2

Stand: 2026-06-17
Status: Implementiert auf Feature-Branch

## Ziel

Sprint 2 macht die read-only Operator API aus Sprint 1 lokal nutzbar. Der
Agent kann jetzt mit dem vorhandenen Agent-Kit-CLI den echten Registerzustand
lesen, bevor er lokale Kandidaten erzeugt oder eine Einreichung vorschlägt.

## Neue CLI-Kommandos

```bash
studio-agent operator registers
studio-agent operator use-cases --register-id reg_123
studio-agent operator use-case uc_123 --register-id reg_123
```

Alle Kommandos unterstützen `--json`, damit lokale Agenten strukturierte Daten
weiterverarbeiten können.

## Konfiguration

Der Operator-Endpoint kann über drei Wege gesetzt werden:

```bash
studio-agent operator registers \
  --operator-endpoint "https://kiregister.com/api/agent/operator"
```

```bash
export KI_REGISTER_OPERATOR_ENDPOINT="https://kiregister.com/api/agent/operator"
```

Oder dauerhaft im Onboarding:

```bash
studio-agent onboard
```

Der API-Key bleibt wie bisher außerhalb der lokalen Config:

```bash
export KI_REGISTER_API_KEY="akv1.<scopeId>.<keyId>.<secret>"
```

Für Use-Case-Abfragen braucht der Agent zusätzlich ein Register:

```bash
export KI_REGISTER_REGISTER_ID="reg_123"
```

## Sicherheitsgrenze

Diese CLI-Kommandos nutzen ausschließlich GET-Anfragen gegen
`/api/agent/operator/...`.

Sie können:

- Register lesen
- Use-Case-Listen lesen
- einzelne Use Cases lesen

Sie können nicht:

- Use Cases erstellen
- bestehende Use Cases ändern
- Reviews oder Status setzen
- Candidate-Entwürfe in KIRegister schreiben

Damit bleibt die Arbeitslogik:

> Erst echten Registerzustand lesen, dann lokal Entwürfe vorbereiten, dann nur
> nach Bestätigung einreichen.

## Validierung

Der Agent-Kit-Smoke-Test startet einen lokalen Mock-Operator-Server und prüft:

- `operator registers --json`
- `operator use-cases --json`
- `operator use-case <id> --json`

Damit ist der CLI-Pfad testbar, ohne Produktionsdaten oder echte API-Keys zu
verwenden.

## Nächster sinnvoller Schritt

Sprint 3 sollte die Candidate-Inbox bauen:

1. lokaler Agent liest Registerzustand per Operator CLI
2. Agent erzeugt Candidate-Manifest mit Dublettenhinweisen
3. Candidate wird mit `write:candidate` an KIRegister übergeben
4. KIRegister zeigt Candidate als Review-Objekt, nicht als echten Use Case
5. Mensch entscheidet: verwerfen, zusammenführen oder als neuen Use Case
   übernehmen
