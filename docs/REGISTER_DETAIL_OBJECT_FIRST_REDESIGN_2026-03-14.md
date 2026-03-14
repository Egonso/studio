# Register Detail Object-First Redesign

## Warum

Die Use-Case-Detailseite hatte im oberen Drittel zu viel generische Register-Shell und zu wenig direkte Objektfuehrung:

- erst generische Register-Ueberschrift
- dann generische Beschreibung
- dann generischer Next-Step
- erst danach der eigentliche Einsatzfall

Das stand im Kontrast zur Register-Uebersicht, die sehr ruhig, knapp und object-first ist.

Zusätzlich war die Sticky-Bearbeitungsleiste UX-seitig schwach:

- sie klebte im Contentfluss
- sie war im Scrollzustand visuell abgeschnitten
- sie konkurrierte mit den normalen Header-Aktionen

## Was geaendert wurde

### 1. Detailroute bekommt object-first Header-Modus

`SignedInAreaFrame` unterstuetzt jetzt optional `headerMode="hidden"`.

Fuer die Use-Case-Detailseite wird die generische Shell-Hero-Zone ausgeblendet, damit der eigentliche Einsatzfall sofort sichtbar ist.

Andere Seiten mit `SignedInAreaFrame` bleiben unveraendert.

### 2. Use-Case-Header wurde neu geschnitten

Der Header zeigt jetzt frueh:

- Ruecknavigation
- Use-Case-Name als einzige H1
- Status
- Systemzusammenfassung
- kurzer fallbezogener naechster Schritt
- wenige fachliche Signale
- technische Metadaten als ruhige Tertiaerzeile

Die Aktionshierarchie ist jetzt klarer:

- primaer: `Stammdaten bearbeiten`
- sekundaer: `Use-Case-Pass oeffnen`
- tertiaer: `Mehr` fuer Export und Randaktionen

### 3. Sticky Edit-Bar wurde auf Seitenebene verlagert

Die Bearbeitungssteuerung ist jetzt keine kleine Sticky-Karte im Dokumentfluss mehr, sondern:

- Desktop: fixe Aktionsleiste unter dem globalen App-Header
- Mobile: kompakte Bottom-Action-Bar

Desktop zeigt die Leiste erst, wenn der Headerbereich aus dem Viewport zu laufen beginnt.

## Datenfluss

Keine Datenmodell-Aenderung.

Der Slice betrifft nur:

- Shell-Darstellung
- Header-Hierarchie
- Action-Hierarchie
- Sichtbarkeit der Edit-Aktionen beim Scrollen

## Risiken

- Der neue `headerMode` ist additiv, aber ein Shell-Prop. Kuenftige Detailrouten koennten versucht sein, ihn ebenfalls zu verwenden. Das sollte bewusst bleiben und nicht unreflektiert zum Standard werden.
- Die Desktop-Edit-Bar verwendet Scroll-/Intersection-Logik. Wenn kuenftig der globale Header deutlich hoeher wird, muss der Trigger-Offset nachgezogen werden.
- Mobile und Desktop verwenden bewusst unterschiedliche Sticky-Muster. Das ist fachlich sinnvoll, erzeugt aber zwei leicht unterschiedliche Interaktionsmodelle.

## Rollback

Rollback ist rein UI-seitig moeglich:

- `headerMode="hidden"` auf der Detailseite entfernen
- alten Header-/Action-Aufbau wiederherstellen
- neue Edit-Bar zurueckbauen

Es gibt keine Migration und keinen Datenrueckbau.
