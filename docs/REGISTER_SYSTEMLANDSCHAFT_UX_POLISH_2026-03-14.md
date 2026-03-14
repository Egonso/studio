# Register Systemlandschaft UX Polish

## Warum

Die erste Mehrsystem-Iteration war fachlich richtig, aber in der Detailseite noch
nicht ruhig genug:

- Single-System-Faelle sahen zu schnell wie Workflow-Faelle aus.
- `Beteiligte Systeme & Compliance` war noch an die Stammdaten gekoppelt.
- Im langen Stammdaten-Edit-Mode fehlte ein klarer, immer sichtbarer Kontext.

## Entscheidung

Die Detailseite unterscheidet jetzt klar zwischen zwei Zustaenden:

1. `single`
   - kompakter Block `System`
   - CTA `Zu mehrstufigem Ablauf erweitern`
   - separater Block `System & Compliance`

2. `multi`
   - gemeinsamer Oberbereich `Systemlandschaft`
   - darin direkt untereinander:
     - `Ablauf & Systeme`
     - `Beteiligte Systeme & Compliance`

`Primärsystem` bleibt nur noch eine technische Altlast im Hintergrund, aber kein
prominenter UX-Begriff mehr.

## Edit-Kontext

Die Stammdaten-Bearbeitung nutzt jetzt eine leichte sticky Kontextleiste auf
Seitenebene:

- Use-Case-Name
- Status
- Systemsummary
- `Speichern`
- `Abbrechen`

Die eigentliche Stammdaten-Maske bleibt darunter ruhig und ohne zweite schwere
Sticky-Karte.

## Risiken

- Die Save-Aktion wird jetzt ueber ein seitenweites Formular-Target ausgeloest;
  das ist bewusst schlank, aber enger an die aktuelle Seitenstruktur gekoppelt.
- Die neue Kontextleiste hat keine eigene Loading-Anzeige; Mehrfachklicks werden
  im Formular-Handler abgefangen.
- UI-Verhalten ist ueber `lint`, `typecheck`, System-Helper-Tests und Build
  abgesichert, aber nicht ueber einen echten Browser-E2E-Test.

## Rollback

Rollback ist rein UI-seitig:

- neue Systemlandschaft-Wrapper in der Detailseite entfernen
- Compliance wieder in die Stammdaten-Sektion setzen
- Sticky Kontextleiste entfernen
- Workflow-Single-State auf vorherige `Ablauf & Systeme`-Darstellung zuruecksetzen

Kein Datenmodell-Rollback noetig.
