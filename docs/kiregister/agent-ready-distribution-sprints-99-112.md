# KIRegister Agent-Ready Distribution - Sprints 99-112

Stand: 2026-06-18
Status: v0 lokal implementiert, Validierung läuft
Owner: KIRegister Produkt und Studio Engineering

## Quellenlage

Ausgangspunkt ist das YouTube-Video:

- `https://www.youtube.com/watch?v=GyijriMIKPA`
- öffentlich sichtbarer Titel am 18.06.2026: `Sell Your SaaS to AI Agents & Make SERIOUS Money in 2026 (new economy / beginner friendly)`
- öffentlich sichtbare Beschreibung: Verweis auf SaaS-Aufbau, Skalierung und Exit über `rosewell.dev`

Wichtig: In dieser Arbeitsumgebung war kein vollständiges Transkript verfügbar.
Der lokale Abruf über `yt-dlp` und `curl` scheiterte an DNS-Auflösung. Der
In-App-Browser und Chrome-Connector waren in dieser Session nicht verfügbar.
Diese Spec behauptet deshalb nicht, ein wortgetreues Video-Protokoll zu sein.
Sie extrahiert die belegbare Kernthese aus Titel/Beschreibung und prüft sie
gegen aktuelle Primärquellen und die bestehende KIRegister-Strategie.

Genutzte Primärquellen:

- MCP Specification: `https://modelcontextprotocol.io/specification/latest`
- OpenAI Apps SDK Reference: `https://developers.openai.com/apps-sdk/reference`
- Stripe Agentic Commerce Suite für Seller:
  `https://docs.stripe.com/agentic-commerce/for-sellers`
- Stripe Agentic Commerce für SaaS-Plattformen:
  `https://docs.stripe.com/connect/saas/tasks/enable-in-context-selling-on-ai-agents`
- Agentic Commerce Protocol:
  `https://www.agenticcommerce.dev/`
- Google Agent2Agent Ankündigung:
  `https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/`
- Bestehende KIRegister-Spec:
  [`autopilot-technical-spec.md`](./autopilot-technical-spec.md)
- UI-Regelwerk:
  [`../GOVERNANCE_UI_CHARTA.md`](../GOVERNANCE_UI_CHARTA.md)

## Kurzurteil

Die gute Idee aus dem Video-Impuls ist nicht: "verkaufe wild an Bots".

Die wirklich gute Idee ist:

> SaaS-Produkte müssen für Agenten auffindbar, prüfbar, ausführbar und
> kaufvorbereitend werden, weil ein wachsender Teil der Produktrecherche,
> Evaluation und Beschaffung nicht mehr über klassische Website-Funnels läuft.

Für KIRegister wird daraus eine bessere, governance-fähige These:

> KIRegister wird für Agenten lesbar und integrierbar, aber für Menschen
> verantwortbar. Agenten dürfen prüfen, vorbereiten und Entwürfe erzeugen.
> Menschen bleiben für Organisation, Freigabe, Kauf und Compliance-Entscheidung
> zuständig.

Das passt sehr gut zur bestehenden Autopilot-Richtung. Es erweitert sie aber
um Distribution: KIRegister soll nicht nur eigene Agenten steuern, sondern
auch von fremden Unternehmens-, Einkaufs-, Rechts- und IT-Agenten verstanden
und genutzt werden können.

## Was daran für KIRegister stark ist

### 1. Agenten werden Produktnutzer im Discovery-Teil

Ein Rechts-, IT- oder Einkaufsagent wird künftig nicht erst eine Landingpage
lesen. Er fragt:

- Was kann dieses Produkt?
- Welche Daten verarbeitet es?
- Welche Nachweise kann es exportieren?
- Gibt es eine API oder MCP-Schnittstelle?
- Kann ich einen sicheren Testlauf starten?
- Welche menschliche Freigabe ist nötig?

KIRegister muss diese Fragen strukturiert beantworten können.

### 2. KIRegister verkauft keinen "AI-Feature-Hype", sondern Nachweisfähigkeit

Für KIRegister ist agentische Distribution besonders passend, weil das Produkt
selbst ein Nachweissystem ist. Ein Agent kann ein Produktversprechen nicht
nur lesen, sondern direkt ein Evidenzpaket erzeugen:

- Beispielregister
- Beispiel-Use-Case-Pass
- Exportauszug
- Datenschutz- und Sicherheitskurzprofil
- Implementierungsplan
- offene Freigabepunkte

Das ist stärker als Marketingcopy.

### 3. Die bestehende Autopilot-Architektur ist bereits nah dran

KIRegister hat schon:

- Agent Kit
- Kandidaten-Inbox
- Operator API
- Review-first Autopilot-Spec
- Audit-Export-Denke
- klare UI-Charta gegen SaaS-Lärm

Der nächste Schritt ist nicht "mehr Magie". Der nächste Schritt ist eine
agentenlesbare Außenkante.

### 4. Compliance-Agent statt Formularsoftware

Die bessere Positionierung lautet:

> KIRegister ist der Compliance-Agent für KI-Einsatzregister, Nachweise und
> Review-Vorbereitung.

Das bedeutet nicht, dass KIRegister automatisch rechtlich entscheidet. Es
bedeutet, dass andere Agenten KIRegister anfragen können, um governance-fähige
Artefakte zu erzeugen.

## Was ich aus dem Video-Frame verwerfe

- "Make serious money" ist kein Produktprinzip.
- Agenten sind keine rechtlichen Kunden. Kunden bleiben Organisationen und
  verantwortliche Menschen.
- Agenten dürfen keine unbestätigten Käufe oder Governance-Freigaben auslösen.
- Agentic Commerce ist für KIRegister erst dann sinnvoll, wenn Discovery,
  Dossier, Consent und Audit sauber stehen.
- Eine neue Protokollfläche ohne klaren Use Case wäre Ablenkung.

## Produktprinzip

KIRegister muss in drei Ebenen funktionieren:

1. Menschenoberfläche: Register, Review, Export, Settings, Control.
2. Agentenoberfläche: Discovery, Nachweise, Demos, Entwürfe, Integrationen.
3. Freigabeoberfläche: menschliche Zustimmung für Schreiben, Zahlung und
   formale Entscheidungen.

Die Agentenoberfläche darf nie die Freigabeoberfläche überspringen.

## Implementierter v0-Stand

Dieser Block ist in v0 bewusst read-first umgesetzt.

Öffentliche Agentenflächen:

| Route | Zweck | Datenklasse | Aktion |
| --- | --- | --- | --- |
| `/llms.txt` | agentenlesbare Produktreferenz | öffentlich | read-only |
| `/.well-known/kiregister-agent.json` | statisches Agentenprofil | öffentlich | read-only |
| `/api/agent/discovery` | Discovery, Capabilities, Policy | öffentlich | read-only |
| `/api/agent/openapi.json` | OpenAPI für öffentliche Agentenflächen | öffentlich | read-only |
| `/api/agent/demo/session` | kuratierte Demo-Session | Demo-Daten | read-only |
| `/api/agent/procurement-dossier` | Entscheidungsdossier als JSON/Markdown | öffentlich/Demo | read-only |
| `/api/mcp` | read-only MCP-Descriptor und JSON-RPC Tool Calls | öffentlich/Demo | read-only |
| `/api/agent/a2a-card` | A2A-orientierte Agent Card | öffentlich | read-only |
| `/api/agent/audit-export` | bounded Audit-Auszug für Agent-Distribution | öffentlich/Demo | read-only |
| `/api/agent/commerce/prepare-checkout-intent` | Agentic-Commerce-Sandbox | keine Zahlung | approval-required |

Authentifizierte Agentenflächen bleiben getrennt:

- `/api/agent/operator/*`
- `/api/agent-kit/submit`
- `/api/workspaces/{orgId}/agent-kit/*`

Diese bestehenden Flächen nutzen weiter Agent-Kit-Keys und Scopes. Die neuen
öffentlichen Routen lesen keine Workspace-Daten.

UI:

- `/settings/agent-access` zeigt Discovery, Demo-Artefakte, Policy-Klassen und
  Audit-Auszug als Organisationseinstellung.
- `/settings` verlinkt den neuen Bereich neben Agent Kit.

Tests:

- `src/lib/agent-ready-distribution.test.ts` prüft öffentliche Datenbegrenzung,
  Policy-Klassen, Demo-Daten, Dossier, OpenAPI-Grenzen, Commerce-Sandbox und
  Audit-Auszug.

## Zielbild

Ein Unternehmensagent soll später sagen können:

> Prüfe, ob KIRegister für unsere EU-AI-Act-Dokumentation geeignet ist.
> Erstelle ein Entscheidungsdossier, starte einen sicheren Demo-Lauf und
> markiere, welche Freigaben unsere Rechtsabteilung geben muss.

KIRegister antwortet nicht mit Werbetext, sondern mit strukturierten
Artefakten:

- `AgentDistributionProfile`
- `ProcurementDossier`
- Demo-Register-Session
- Use-Case-Pass-Beispiel
- Scope- und Datenverarbeitungsgrenzen
- offene menschliche Entscheidungen

## Datenverträge

### AgentDistributionProfile

```json
{
  "schemaVersion": "1.0.0",
  "kind": "kiregister.agent_distribution_profile",
  "product": {
    "name": "KIRegister",
    "category": "AI governance register",
    "primaryUse": "Document AI use cases, reviews, evidence and exports"
  },
  "capabilities": [
    "create_register_draft",
    "prepare_use_case_pass",
    "export_audit_bundle",
    "review_agent_candidates"
  ],
  "humanApprovalRequiredFor": [
    "paid_activation",
    "submitting_register_entries",
    "formal_risk_classification",
    "external_data_connection"
  ],
  "publicArtifacts": [
    "/llms.txt",
    "/.well-known/kiregister-agent.json",
    "/api/agent/discovery"
  ]
}
```

### ProcurementDossier

```json
{
  "schemaVersion": "1.0.0",
  "kind": "kiregister.procurement_dossier",
  "status": "draft",
  "fitSummary": "KIRegister prepares AI-use documentation and review evidence.",
  "requiredApprovals": ["legal", "it-security", "budget-owner"],
  "dataProcessingSummary": {
    "personalDataPossible": true,
    "specialCategoriesBlockedByDefault": true,
    "sourceAllowlistRequired": true
  },
  "evidenceArtifacts": [
    "sample-use-case-pass.pdf",
    "sample-register-export.json",
    "security-summary.md"
  ],
  "blockedActions": [
    "No purchase without human approval",
    "No external source connection without explicit opt-in"
  ]
}
```

### AgentDemoSession

```json
{
  "sessionId": "demo_20260618_001",
  "expiresAt": "2026-06-18T12:00:00.000Z",
  "mode": "read_only_demo",
  "availableActions": [
    "list_sample_use_cases",
    "read_sample_use_case",
    "export_sample_pass",
    "generate_procurement_dossier"
  ],
  "blockedActions": [
    "submit_real_register_entry",
    "connect_external_source",
    "start_paid_subscription"
  ]
}
```

### AgentActionPolicy

```json
{
  "schemaVersion": "1.0.0",
  "kind": "kiregister.agent_action_policy",
  "defaultMode": "read_only",
  "allowedWithoutHumanApproval": [
    "read_public_product_profile",
    "start_read_only_demo",
    "generate_draft_procurement_dossier"
  ],
  "requiresHumanApproval": [
    "create_workspace",
    "connect_source",
    "submit_candidate",
    "start_checkout",
    "accept_terms"
  ],
  "neverAllowedForAgentOnly": [
    "final_legal_assessment",
    "silent_subscription_purchase",
    "risk_classification_as_final"
  ]
}
```

## Geplante Oberflächen

### Öffentlich und agentenlesbar

- `/llms.txt`
- `/.well-known/kiregister-agent.json`
- `/api/agent/discovery`
- `/api/agent/procurement-dossier`
- `/api/agent/demo/session`
- `/api/agent/openapi.json`

### Authentifiziert

- bestehende Agent-Kit- und Operator-Endpunkte
- später: `/api/mcp` oder dedizierter MCP-Server
- später: A2A Agent Card für Enterprise-Agenten

### UI

Die UI bleibt ruhig und dokumentenzentriert:

- Settings: `Agentenzugriff` als administrativer Bereich
- Control: `Agenten-Laufprotokolle` und `Agenten-Dossiers`
- keine globale Utility-Leiste
- keine "Agenten kaufen jetzt"-Sprache
- keine Marketing-KPIs

## Implementierungssprints

### Sprint 99: Distribution Inventory und Grenzen

Ziel:

- vorhandene Agent-Kit-, Operator-, Autopilot- und Exportflächen inventarisieren
- klare Grenzen für öffentliche, demo- und authentifizierte Agentenzugriffe
  festlegen

Lieferumfang:

- `docs/kiregister/agent-ready-distribution-sprints-99-112.md`
- Mapping bestehender Endpunkte auf Agentenrollen
- Risiko- und Consent-Matrix
- keine Codeänderung außer Dokumentation

Agent-Prompt:

```text
Lies docs/GOVERNANCE_UI_CHARTA.md und
docs/kiregister/agent-ready-distribution-sprints-99-112.md. Ergänze nur die
Inventory- und Grenzmatrix. Implementiere keine Endpunkte. Prüfe bestehende
Agent-Kit-, Operator-, Autopilot- und Exportflächen und dokumentiere, welche
öffentlich, demo-fähig oder authentifiziert bleiben müssen.
```

Akzeptanz:

- öffentliche Agentenflächen sind von authentifizierten Operatorflächen getrennt
- jede schreibende oder zahlungsnahe Aktion hat einen Human-Approval-Vermerk
- keine neue Produktbehauptung ohne Artefakt oder Quelle

### Sprint 100: Public Agent Discovery Manifest

Ziel:

- KIRegister für Agenten strukturiert auffindbar machen

Lieferumfang:

- `/llms.txt`
- `/.well-known/kiregister-agent.json`
- `/api/agent/discovery`
- Tests für JSON-Shape, Cache-Header und öffentlich erlaubte Felder

Agent-Prompt:

```text
Implementiere die öffentliche KIRegister Agent Discovery. Baue /llms.txt,
/.well-known/kiregister-agent.json und /api/agent/discovery. Diese Flächen
dürfen nur öffentliche Produkt-, Capability- und Policy-Informationen ausgeben.
Keine Workspace-Daten, keine Nutzerinformationen, keine Preise mit
Vertragswirkung. Tests für JSON-Shape und Cache-Verhalten sind Pflicht.
```

Akzeptanz:

- keine personenbezogenen oder workspace-spezifischen Daten
- `humanApprovalRequiredFor` ist sichtbar
- Discovery verweist auf Demo- und Dossier-Endpunkte, nicht auf direkte
  Kaufmutation

### Sprint 101: Agent-Readable OpenAPI

Ziel:

- eine kleine, stabile OpenAPI-Spec für öffentliche Agentenflächen bereitstellen

Lieferumfang:

- `/api/agent/openapi.json`
- dokumentierte Schemas für Discovery, DemoSession und ProcurementDossier
- Contract-Test gegen Beispielantworten

Agent-Prompt:

```text
Baue eine minimale OpenAPI-Spec für die öffentlichen Agentenflächen. Die Spec
muss nur Discovery, Demo-Session und Procurement-Dossier abdecken. Keine
internen Operator-Endpunkte veröffentlichen. Contract-Tests müssen die
Beispielantworten gegen die OpenAPI-Schemas validieren.
```

Akzeptanz:

- OpenAPI enthält keine internen Admin-, Workspace- oder Billing-Endpunkte
- Schemas sind versioniert
- Beispielantworten validieren

### Sprint 102: Agent-Readable Produkt- und Policy-Profil

Ziel:

- Agenten können KIRegister fachlich einordnen, ohne Marketingcopy zu raten

Lieferumfang:

- `AgentDistributionProfile`
- Datenverarbeitungszusammenfassung
- Security-/Trust-Verweise
- Liste von Aktionen mit `read_only`, `approval_required` oder `blocked`

Agent-Prompt:

```text
Erweitere die Agent Discovery um ein versioniertes AgentDistributionProfile.
Fokus: Produktzweck, Governance-Artefakte, Datenverarbeitungsgrenzen,
Human-Approval-Regeln. Verwende sachliche Governance-Sprache nach UI-Charta.
Keine Conversion-Copy, keine künstliche Dringlichkeit.
```

Akzeptanz:

- Agent kann Zweck, Grenzen und nächste sichere Aktionen maschinenlesbar lesen
- sensible Aktionen sind explizit blockiert oder approval-pflichtig
- Snapshot-Test schützt gegen versehentliche Marketing-Sprache

### Sprint 103: Read-only Demo Register Session

Ziel:

- Agenten können den Produktnutzen über Artefakte prüfen

Lieferumfang:

- `/api/agent/demo/session`
- statische oder kurzlebige read-only Demo-Session
- Beispiel-Use-Cases
- Beispiel-Export als JSON
- kein Schreibpfad, kein Login-Zwang für Demo-Artefakte

Agent-Prompt:

```text
Baue eine read-only Demo-Session für Agenten. Sie darf nur kuratierte
Beispieldaten ausgeben und niemals echte Workspace-Daten lesen. Stelle
Beispiel-Use-Cases und einen Beispiel-Export bereit. Schreiboperationen,
Checkout und externe Connectoren bleiben blockiert.
```

Akzeptanz:

- Demo-Daten sind eindeutig als Beispiel markiert
- keine echte User-, Workspace- oder Billing-Abhängigkeit
- Rate-Limit oder statische Begrenzung verhindert Missbrauch

### Sprint 104: Procurement Dossier Generator

Ziel:

- Einkaufs-, Rechts- und IT-Agenten erhalten ein prüfbares Entscheidungsdossier

Lieferumfang:

- `/api/agent/procurement-dossier`
- Dossier mit Fit, Datenverarbeitung, Freigabepunkten, Artefakten und Grenzen
- Markdown- und JSON-Ausgabe
- Verweise auf Sample-Export und Trust-/Policy-Informationen

Agent-Prompt:

```text
Implementiere einen öffentlichen Procurement-Dossier-Generator. Das Ergebnis
ist ein Entwurf für menschliche Prüfung, keine rechtliche Zusage und kein
Angebot mit automatischer Annahme. Liefere JSON und Markdown. Verweise auf
konkrete Beispielartefakte und markiere alle Approval-Punkte.
```

Akzeptanz:

- Dossier ist audit-lesbar
- alle Aussagen sind auf vorhandene Artefakte, Produktfunktionen oder Quellen
  zurückführbar
- keine Vertragsannahme, kein Checkout, keine stillen Mutationen

### Sprint 105: Read-only MCP Server für Distribution

Ziel:

- Agenten können KIRegister über MCP lesen und Dossiers vorbereiten

Lieferumfang:

- MCP-Server oder MCP-kompatible Route mit read-only Tools
- Tools:
  - `kiregister_get_product_profile`
  - `kiregister_start_demo_session`
  - `kiregister_get_sample_export`
  - `kiregister_generate_procurement_dossier`
- keine schreibenden Tools

Agent-Prompt:

```text
Baue einen read-only MCP-Server für KIRegister Distribution. Implementiere nur
Produktprofil, Demo-Session, Sample-Export und Procurement-Dossier. Alle Tools
müssen ihre Grenzen beschreiben. Keine Schreiboperation, kein Login, keine
Zahlung, kein Zugriff auf echte Workspace-Daten.
```

Akzeptanz:

- Tool-Schemas sind streng
- Tool-Beschreibungen nennen Human-Approval-Grenzen
- Tests prüfen, dass kein Workspace-Zugriff stattfindet

### Sprint 106: ChatGPT Apps SDK Spike

Ziel:

- prüfen, ob eine kleine interaktive App für Agenten-Evaluation sinnvoll ist

Lieferumfang:

- Spike-Dokument
- optionaler Prototyp hinter Feature Flag
- keine produktive Veröffentlichung
- Bewertung: Aufwand, Sicherheit, Nutzwert, Einreichungsrisiko

Agent-Prompt:

```text
Prüfe mit den offiziellen OpenAI Apps SDK Docs, ob eine KIRegister
Evaluation-App sinnvoll ist. Wenn du baust, dann nur einen Feature-Flag-Spike:
Produktprofil lesen, Demo-Artefakt anzeigen, Procurement-Dossier erzeugen.
Keine Schreiboperationen. Dokumentiere Aufwand und Risiken.
```

Akzeptanz:

- Entscheidungsvorlage statt automatischer Produktivrollout
- keine ChatGPT-spezifische Abhängigkeit im Kernprodukt
- Spike kann vollständig deaktiviert werden

### Sprint 107: Agent Action Policy und Consent-Gates

Ziel:

- jede agentische Aktion bekommt eine formale Policy-Klasse

Lieferumfang:

- `AgentActionPolicy`
- serverseitige Hilfsfunktion für Action-Klassen
- UI-/API-Konvention für `read_only`, `approval_required`, `blocked`
- Tests gegen kritische Aktionen

Agent-Prompt:

```text
Implementiere eine zentrale AgentActionPolicy. Jede agentische Aktion muss als
read_only, approval_required oder blocked klassifizierbar sein. Nutze diese
Policy in den öffentlichen Agentenendpunkten und bereite sie für spätere MCP-
und Agentic-Commerce-Flows vor. Kritische Aktionen brauchen Tests.
```

Akzeptanz:

- keine agentische Mutation ohne Policy-Klassifizierung
- `start_checkout`, `connect_source`, `submit_candidate` sind
  approval-pflichtig oder blockiert
- Policy ist exportierbar und in Discovery sichtbar

### Sprint 108: Agentic Commerce Sandbox

Ziel:

- Agentic-Commerce-Fähigkeit vorbereiten, ohne echte Zahlungen zu aktivieren

Lieferumfang:

- technische Bewertung von Stripe ACS/ACP für KIRegister
- Sandbox-Flow für `prepare_checkout_intent`
- kein Live-Checkout
- menschliche Bestätigungspflicht

Agent-Prompt:

```text
Baue nur eine Agentic-Commerce-Sandbox. Lies die Stripe ACS/ACP-Dokumentation.
Implementiere keinen Live-Checkout. Erzeuge höchstens einen
prepare_checkout_intent-Entwurf mit Approval-Anforderungen, Planhinweisen und
Audit-Text. Feature Flag ist Pflicht.
```

Akzeptanz:

- keine Zahlung kann ausgelöst werden
- keine Vertragsannahme durch Agenten
- Dossier verlinkt auf menschliche Freigabe statt Checkout-Abschluss

### Sprint 109: A2A Agent Card

Ziel:

- KIRegister als Compliance-Agent für Enterprise-Agenten beschreibbar machen

Lieferumfang:

- A2A-kompatible Agent Card oder vorbereitendes JSON
- Capability-Beschreibung:
  - Registerentwurf vorbereiten
  - Use-Case-Pass-Beispiel erzeugen
  - Procurement-Dossier erstellen
  - Review-Fragen ableiten
- keine produktive A2A-Task-Ausführung ohne spätere Freigabe

Agent-Prompt:

```text
Erstelle eine A2A-orientierte Agent Card für KIRegister. Sie beschreibt
Capabilities, Auth-Anforderungen, Human-Approval-Grenzen und Artefakte. Baue
noch keine produktive A2A-Task-Ausführung. Vermeide Überversprechen.
```

Akzeptanz:

- Agent Card ist rein beschreibend oder read-only
- Capability-Namen decken sich mit Discovery und MCP
- Human-Approval-Grenzen sind identisch zur AgentActionPolicy

### Sprint 110: Settings UI für Agentenzugriff

Ziel:

- Organisationen sehen und steuern agentische Außenkanten

Lieferumfang:

- Settings-Bereich `Agentenzugriff`
- Anzeige:
  - öffentliche Discovery aktiv
  - Demo-Artefakte
  - Operator-/MCP-Keys
  - letzte Agenten-Dossier-Anfragen
- keine globale Utility-Leiste

Agent-Prompt:

```text
Lies zuerst docs/GOVERNANCE_UI_CHARTA.md. Baue einen ruhigen Settings-Bereich
für Agentenzugriff. Primäres Objekt ist die Organisationseinstellung. Zeige
Status, Schlüssel, Discovery und Dossier-Protokolle sachlich. Keine
Marketing-Sprache, keine Alarmfarben, keine globalen Utilities.
```

Akzeptanz:

- UI folgt Objektprinzip der UI-Charta
- maximal notwendige Statussignale
- keine wiederholten Organisations-Utilities auf Detailseiten
- Playwright-Screenshots Desktop und Mobile ohne Overflow

### Sprint 111: Agent Distribution Audit Export

Ziel:

- agentische Discovery-, Demo- und Dossier-Nutzung wird nachvollziehbar

Lieferumfang:

- Audit-Ereignisse für Dossier-Erstellung und Demo-Session
- Exportauszug für Agent-Distribution-Aktivität
- redaktionell saubere, nicht personenbezogene Logs wo möglich

Agent-Prompt:

```text
Ergänze Audit-Nachweise für Agent-Distribution-Flows. Logge keine unnötigen
personenbezogenen Daten. Erzeuge einen Exportauszug für Demo- und
Dossier-Aktivität. Discovery-Lesezugriffe dürfen aggregiert bleiben, solange
keine sicherheitsrelevante Mutation stattfindet.
```

Akzeptanz:

- Dossier- und Demo-Aktivität sind exportierbar
- Logs enthalten keine Secrets
- Audit-Auszug ist mit Control-/Export-Logik anschlussfähig

### Sprint 112: Hardening, QA und Push

Ziel:

- Block stabilisieren, dokumentieren und auf GitHub pushen

Lieferumfang:

- Tests
- Typecheck
- Lint
- Playwright für neue UI
- Dokumentationsindex aktualisiert
- PR oder direkter Push nach Projektkonvention

Agent-Prompt:

```text
Schließe den Agent-Ready-Distribution-Block ab. Führe Lint, Typecheck, Tests
und bei UI-Änderungen Playwright-Checks aus. Aktualisiere die Dokumentation,
prüfe git diff kritisch, erstelle einen sauberen Commit und pushe auf GitHub
gemäß bestehendem Repository-Flow.
```

Akzeptanz:

- alle relevanten Prüfungen laufen lokal erfolgreich oder Ausnahmen sind
  dokumentiert
- keine Secret-, Demo- oder Workspace-Daten im Commit
- README und Agent-Workflow verweisen auf den finalen Stand

## Ausführungsreihenfolge bei Go

Wenn der Auftrag zur Umsetzung kommt:

1. `git status --short` prüfen.
2. `docs/GOVERNANCE_UI_CHARTA.md` lesen.
3. diese Spec lesen.
4. bestehende Autopilot- und Agent-Kit-Specs lesen.
5. bei Sprint 99 beginnen und nur dann Sprints bündeln, wenn die Tests klein
   und die Änderung fachlich eng zusammengehören.
6. nach jedem Sprint:
   - Tests/Typecheck passend zur Änderung
   - Dokumentation aktualisieren
   - keine stillen Mutationen
7. am Ende Commit und GitHub-Push.

## Definition of Done

Der Block ist fertig, wenn:

- KIRegister öffentlich agentenlesbar ist
- Agenten Demo- und Dossier-Artefakte erzeugen können
- keine echten Workspace-Daten öffentlich werden
- alle schreibenden, zahlungsnahen oder rechtlich relevanten Aktionen
  menschliche Freigabe brauchen
- MCP oder App-SDK-Flächen read-only oder klar approval-gated sind
- Agentic Commerce höchstens sandboxed ist, bis Freigabe und Rechtstexte
  stehen
- die Settings-/Control-UI der Governance UI Charta folgt
- Audit-Export die agentische Distribution nachvollziehbar macht

## Größtes Risiko

Das größte Risiko ist, aus einer guten Distributionsthese ein unseriöses
"Bots kaufen unser SaaS"-Narrativ zu machen.

KIRegister gewinnt nicht durch Hype. KIRegister gewinnt, wenn fremde Agenten
sofort erkennen:

- was dokumentiert wird
- welche Nachweise entstehen
- wo Menschen Verantwortung übernehmen
- welche Aktionen sicher sind
- welche Aktionen geblockt sind

Das ist die bessere, tiefere Version der Video-Idee.
