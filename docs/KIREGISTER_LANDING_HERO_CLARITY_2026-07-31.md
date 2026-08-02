# KIRegister Landing Hero: Klarheit und Vertrauensanker

Stand: 2. August 2026

## Problem

Auf kleinen Viewports konkurrierten die abstrakte Hero-Erzählung, der wissenschaftliche Vertrauensanker und acht Direktlinks um die erste Aufmerksamkeit. Testpersonen erkannten dadurch nicht schnell genug, was KIRegister tut.

## Ziel

Der erste View beantwortet vier Fragen in dieser Reihenfolge:

1. Was ist das Produkt? Ein Register für die KI-Dokumentation in Unternehmen.
2. Welches Problem löst es? KI-Einsatz wird nachvollziehbar und prüfbar.
3. Wie beginne ich? In rund 30 Sekunden per Kurzformular oder mit einem vom KI-Agenten vorbereiteten Entwurf.
4. Warum ist das glaubwürdig? Wissenschaftliche Einordnung von Prof. Dr. Janine Wendt.

## Umsetzung

- klare Hero-Aussage: „KI-Dokumentation, die einfach mitläuft.“
- konkrete 30-Sekunden-Erfassung als primärer Einstieg und agentische Vorbereitung als zweite Erfassungslogik
- typografisch eigenständiger, verlinkter Wendt-Vertrauensanker
- bestehende Chaos-zu-Ordnung-Scroll-Erzählung unverändert beibehalten
- acht sekundäre Direktlinks aus dem Hero in einen eingeklappten Bereich nach den drei Haupteinstiegen verschoben
- deutsche und englische Variante angepasst
- Mobile-Hierarchie, Abstände und Schriftgrößen neu austariert

## Produkt- und Claim-Grenzen

- keine Zertifizierungs- oder Compliance-Garantie
- Zitat bleibt ein freigegebener Auszug der wissenschaftlichen Stellungnahme
- „rund 30 Sekunden“ beschreibt die bestehende Schnellerfassung, nicht die vollständige Registerführung
- ein KI-Agent bereitet den Entwurf während der Arbeit vor; die Einreichung bleibt an eine ausdrückliche Bestätigung gebunden

## Prüfung

- TypeScript-Transpilation ohne Diagnose
- CSS-Parsing erfolgreich
- Public-Copy-Audit ohne Befund
- Netlify-Preview und visuelle Mobile-/Desktop-Abnahme werden am Pull Request dokumentiert

## Rückbau

Die Änderung betrifft ausschließlich den Landing-Client und dessen CSS-Modul. Ein Revert der Branch-Commits stellt den vorherigen Hero wieder her.
