# EUKI Governance UI Charta

Version 2.1  
Stand: 06.03.2026  
Gueltig fuer alle Register-, Detail-, Export-, Settings- und Workflow-Seiten

## 1. Grundhaltung

AI Compliance OS ist ein Governance-Instrument.
Kein SaaS-Produkt.
Kein Marketing-Interface.
Kein Conversion-Tool.

**Ziel jeder Oberflaeche:**

- dokumentieren
- strukturieren
- nachweisbar machen

*Nicht: verkaufen, dramatisieren, verlocken oder kuenstlich verknappen.*

## 2. Design-Philosophie

**Bezeichnung des Stils:**
Dokumentenzentrierter Institutional Minimalism mit einem Hauch japanischer Tuschezeichnung (ZEN)

**Leitprinzipien:**

- Objekt vor Kampagne
- Zustand vor Interaktion
- Export vor Analyse
- Hierarchie vor Dekoration
- Klarheit vor Vollstaendigkeit
- Konsistenz vor Kreativitaet
- Ruhe vor Aufmerksamkeit

Die Oberflaeche soll nicht "reich an Features" wirken, sondern praezise, belastbar und intern anschlussfaehig.

## 3. Farbregeln

Farben dienen ausschliesslich der formalen Statuskennzeichnung.

**Zulaessig:**

- Blau fuer `REVIEWED`
- Gruen fuer `PROOF_READY`
- Grau fuer `UNREVIEWED` und `REVIEW_RECOMMENDED`

**Nicht zulaessig:**

- Amber als Standard-Signal
- Rot als dominante Steuerfarbe
- Verlaufseffekte
- farbige KPI-Balken
- visuelle Alarmaesthetik
- emotionale Dringlichkeitsfarben fuer normale Arbeitszustaende

**Statusdarstellung erfolgt primaer als:**

- Punkt + Text
- sachliche Beschriftung
- gegebenenfalls feine Typografie-Differenzierung

Keine Badge-Orgie. Keine grossen Pill-Container. Keine SaaS-RAG-Optik.

## 4. Typografie und Informationshierarchie

**Primaere Information:**

- normal oder fett
- niemals marketinghaft hervorgehoben
- zuerst der Sachverhalt, dann das Interface

**Sekundaere Information:**

- kleiner
- grau
- typografisch zurueckgenommen

**Regel:**

Der Gegenstand ist immer wichtiger als das Werkzeug.  
Zweck ist primaer. Tool, Meta-Info und technische Herkunft sind sekundaer.

## 5. Objektprinzip pro Seite

Jede Seite hat genau **ein primaeres Objekt**.

Beispiele:

- Register-Overview: das Register
- Use-Case-Detail: der einzelne Einsatzfall
- Pass-Seite: der Use-Case-Pass
- Settings: die Organisationseinstellungen
- Control: die organisationsweite Steuerung

**Konsequenz:**

- Aktionen des primaeren Objekts stehen im Vordergrund.
- Aktionen anderer Ebenen duerfen sichtbar sein, aber niemals dieselbe visuelle Prioritaet erhalten.
- Organisationsweite Utilities gehoeren nicht standardmaessig auf Detailseiten einzelner Use Cases.

## 6. Aktionstaxonomie

Aktionen muessen in drei Klassen getrennt werden:

### A. Objektaktionen

Aktionen, die direkt das aktuelle Objekt betreffen.

Beispiele:

- Stammdaten bearbeiten
- Use-Case-Pass exportieren
- Einsatzfall loeschen

### B. Formale Workflow-Aktionen

Aktionen, die einen dokumentierten Zustand veraendern, aber nicht dieselbe Sache sind wie Stammdatenbearbeitung.

Beispiele:

- Status dokumentieren
- Review erfassen
- formale Pruefung abschliessen

### C. Organisations-Utilities

Aktionen, die den Zugang, die Distribution oder die Organisation als Ganzes betreffen.

Beispiele:

- KI-Einsatzfall erfassen
- Erfassungslink teilen
- Einladungscode verwalten
- Lieferant anfragen

**Verboten:**

- diese drei Klassen optisch zu vermischen
- Organisations-Utilities als Standardmoebel auf jeder Seite zu wiederholen
- eine Objektseite durch fremde Utilities zu ueberfrachten

## 7. Utility-Prinzip: kontextabhaengig, nicht global

Die bisherige Regel "dieselben drei Utility-Aktionen auf jeder Seite" wird aufgehoben.

**Neu gilt:**

Utilities erscheinen nur dort, wo sie im aktuellen Kontext unmittelbar sinnvoll sind.

**Register-Overview:**

- `KI-Einsatzfall erfassen` ist sinnvoll und sichtbar

**Settings / Organisationsverwaltung:**

- `Erfassungslink teilen`
- `Einladungscode verwalten`
- `Lieferant anfragen`

**Use-Case-Detailseite:**

- standardmaessig keine persistente Organisations-Utility-Leiste
- Fokus auf Einsatzfall, Status, Nachweis, Export

**Begruendung:**

Wiederholte Utilities erzeugen kein Vertrauen, sondern visuelles Rauschen und semantische Unordnung.

## 8. Edit-Mode-Prinzip

Ein Moduswechsel ist nur dann zulaessig, wenn er einen klar umrissenen Bearbeitungsbereich hat.

**Wenn ein Edit-Mode existiert, dann gilt:**

- der Scope muss explizit benannt werden  
  Beispiel: `Stammdaten bearbeiten`, nicht nur `Bearbeiten`
- der Read-only-Zustand muss sichtbar sein
- der Modus betrifft nur die aenderbaren Felder dieses Objekts
- Save/Cancel muessen klar und lokal verortet sein

**Nicht zulaessig:**

- manche Stammdaten ohne Edit-Mode bearbeitbar, andere nur mit Edit-Mode
- ein global wirkender Button mit lokalem Effekt
- formale Workflow-Aktionen hinter denselben Modus zu legen

**Regel:**

Stammdatenbearbeitung und formale Statusdokumentation sind zwei verschiedene Dinge und muessen auch so erscheinen.

## 9. Progressive Disclosure und Governance-Weiterleitung

Erweiterte Governance-Funktionen duerfen sichtbar sein, aber niemals dominant oder werblich.

**Zulaessig:**

- ruhige Sekundaerlinks
- sachliche Weiterleitungen wie  
  `Im AI Governance Control anzeigen`
- knappe Kontextsaetze, warum eine Funktion dort verortet ist

**Nicht zulaessig:**

- aggressive Overlay-Upsells
- Upgrade-Sprech in Kernoberflaechen
- blockierende Vermarktung von Basisaktionen

Bearbeiten eines Einsatzfalls ist Kernfunktion.  
Governance-Steuerung ist eine andere Ebene.  
Diese Trennung muss sprachlich und visuell erhalten bleiben.

## 10. Detailseiten-Prinzip

Use-Case-Detailseiten sind dokumentenzentrierte Objektseiten.

**Sie zeigen vorrangig:**

- Titel und Identitaet des Einsatzfalls
- formalen Status
- Kernstammdaten
- Use-Case-Pass / Export
- Audit- und Review-Bezug

**Sie zeigen nicht standardmaessig:**

- organisationsweite Share-Utilities
- wiederholte Einladungsmechaniken
- irrelevante Globalaktionen

**Spezialregel:**

Wenn eine Aktion nicht den aktuellen Einsatzfall, sondern die Organisation betrifft, gehoert sie auf Settings, Register-Overview oder eine dedizierte Admin-Flaeche.

## 11. Tabellenprinzip (Registeransicht)

Maximal 5 Kernspalten:

1. System
2. Status
3. Owner
4. Risikoklasse
5. Aktivitaet

Optional: Aktionen als Icon oder kleine Textaktion.

**Regeln:**

- keine Metadaten-Dopplung
- kein Farbsystem ausser Status
- `Erstellt am` nur in Detailansicht
- Tool in der System-Spalte sekundaer darstellen
- Register muss scanbar und audit-lesbar bleiben

## 12. Status-Workflow-Prinzip

Status ist ein dokumentierter Zustandsautomat.

**Darstellung:**

- aktueller Status
- zulaessige naechste Statusaenderungen
- sachliches Eingabeelement fuer Begruendung
- Aktion `Statusaenderung dokumentieren`
- darunter die Historie

**Nicht zulaessig:**

- Pill-Wettruesten
- dramatische Animationen
- Warninszenierung fuer normale Statuswechsel

Der Workflow soll formal, revisionssicher und ruhig wirken.

## 13. Export ist Kernfunktion

Jeder Use Case fuehrt zu einem Use-Case-Pass.
Export ist Produktkern.

**Darstellung:**

- `Use-Case-Pass exportieren`
- PDF
- JSON

Export ist kein Drucken.
Export ist keine Nebenfunktion.
Export darf nicht versteckt werden.

## 14. Sprachregeln

**Verwenden:**

- dokumentieren
- Status
- Nachweis
- Pruefung
- Governance
- Review
- Lifecycle
- Audit
- Organisationssteuerung

**Vermeiden:**

- Freischalten
- Upgrade
- Premium
- Pro
- Enterprise
- Toolkit enthaelt
- jetzt aktivieren
- exklusiv

**Praezisierungsregel:**

Lieber den Zweck benennen als die Vermarktungslogik.  
Lieber `in der Organisationssteuerung verfuegbar` als `nur im Pro-Plan`.

Plan- oder Preissprache gehoert in Settings, Billing oder dedizierte Vergleichsseiten, nicht in Kern-Workflows.

## 15. KPI- und Analyseprinzip

Nur Kennzahlen anzeigen, die:

- entscheidungsrelevant sind
- direkt aus der Registerstruktur ableitbar sind
- in einen Governance-Kontext eingebettet sind

**Keine:**

- Marketing-KPIs
- dramatische Fortschrittsvisualisierung
- kuenstliche Dringlichkeits-Widgets
- Show-Dashboards ohne Arbeitskonsequenz

Kennzahlen sind sachlich. Analyse folgt dem Dokument, nicht umgekehrt.

## 16. Fehler- und Systemmeldungen

Fehlercopy muss vertrauensbildend und klar sein.

**Regeln:**

- keine internen Diagnosecodes in der Endnutzeroberflaeche
- keine technischen Stack-Begriffe ohne Nutzwert
- operativer Fehlerzustand sachlich benennen
- naechsten sinnvollen Schritt nennen

**Beispiel richtig:**

- `Dienst voruebergehend nicht verfuegbar. Bitte versuchen Sie es in wenigen Minuten erneut.`

**Beispiel falsch:**

- `[API-2-default-credentials]`
- `permission-denied`
- `resource-exhausted`

Technische Details gehoeren in Logs, Monitoring und Admin-Views, nicht in die Kernoberflaeche.

## 17. Zielbild

Das System soll wirken wie:

- internes Kontrollinstrument
- ISO-faehige Dokumentationsstruktur
- revisionssicheres Register
- organisationsinterne Governance-Infrastruktur

Nicht wie:

- AI-Startup
- Tool-Plattform
- Feature-Showcase
- Growth-SaaS

## 18. Konsistenzregel

Alle Seiten pruefen vor Veroeffentlichung:

- Ist das primaere Objekt der Seite eindeutig?
- Gehoeren die sichtbaren Aktionen wirklich zu diesem Objekt?
- Ist die Utility-Platzierung kontextgerecht statt dogmatisch?
- Ist die Farbregel eingehalten?
- Gibt es Marketing-Sprache?
- Ist Export klar sichtbar, wenn Export zum Objekt gehoert?
- Ist ein Edit-Mode semantisch sauber begrenzt?
- Wirkt die Seite auditfaehig?
- Gibt es visuelles oder semantisches Rauschen?

Wenn eine dieser Fragen mit `Nein` beantwortet wird, ist die Seite nicht fertig.

## 19. Strategisches Ziel

Die UI soll Vertrauen erzeugen.
Nicht Begeisterung. Nicht Dynamik. Nicht Spannung.

**Vertrauen entsteht durch:**

- Klarheit
- Reduktion
- Konsistenz
- saubere Scope-Grenzen
- vorhersagbares Verhalten
- belastbare Dokumentation
