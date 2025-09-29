
# Anleitung: Firebase Function & Regeln bereitstellen (Finaler, korrigierter Prozess)

Herzlichen Glückwunsch! Die Code-Implementierung ist abgeschlossen. Damit Ihr neuer Stripe-Webhook und die Sicherheitsregeln live funktionieren, müssen wir drei Dinge tun:

1.  **Den Funktionscode kompilieren:** Wir übersetzen den TypeScript-Code in JavaScript, damit Firebase ihn versteht.
2.  **Die Cloud Function bereitstellen (deployen):** Wir laden den neuen JavaScript-Code in Ihr Firebase-Projekt hoch.
3.  **Die `backfillCustomers`-Funktion ausführen:** Wir starten die einmalige Funktion, um Ihre bestehenden Kundendaten zu synchronisieren.

Folgen Sie einfach diesen Schritten.

---

### Schritt 1: Das Terminal im **Hauptprojektordner** öffnen

Stellen Sie sicher, dass Ihr Terminal im Hauptverzeichnis Ihres Projekts geöffnet ist. Dies ist der Ordner, der `src`, `functions` und `package.json` enthält.

**Alle folgenden Befehle müssen von diesem Hauptordner aus ausgeführt werden.**

---

### Schritt 2: In das `functions`-Verzeichnis wechseln

```bash
cd functions
```

---

### Schritt 3: Die Abhängigkeiten der Funktion installieren

Falls noch nicht geschehen, installieren Sie die Pakete, die Ihre Funktion benötigt.

```bash
npm install
```

---

### Schritt 4: Den Funktions-Code kompilieren (Der entscheidende Schritt)

Dieser Befehl nimmt Ihren TypeScript-Code aus `functions/src` und erstellt die lauffähigen JavaScript-Dateien im `functions/lib` Ordner.

```bash
npm run build
```

Nachdem dieser Befehl erfolgreich war, sollte ein `lib`-Ordner innerhalb Ihres `functions`-Ordners existieren (oder aktualisiert worden sein).

---

### Schritt 5: Zurück ins Hauptverzeichnis wechseln (SEHR WICHTIG)

Wechseln Sie wieder eine Ebene nach oben in den Hauptordner Ihres Projekts, um den finalen Befehl auszuführen.

```bash
cd ..
```

---

### Schritt 6: Die Funktionen bereitstellen

Jetzt, da der Code kompiliert ist, laden wir ihn in die Cloud hoch. Führen Sie diesen Befehl vom **Hauptverzeichnis** aus.

```bash
firebase deploy --only functions
```

Wenn alles geklappt hat, sehen Sie eine Erfolgsmeldung mit den URLs Ihrer Funktionen. Suchen Sie nach der URL für **`backfillCustomers`**. Sie sieht in etwa so aus: `https://backfillcustomers-xxxxxxxx-xx.a.run.app`.

---

### Schritt 7: Kundendaten für bestehende Käufe nachtragen

1.  **Funktions-URL aufrufen:** Kopieren Sie die URL der `backfillCustomers`-Funktion aus der Erfolgsmeldung im Terminal (aus Schritt 6).
2.  **Im Browser öffnen:** Fügen Sie diese URL in Ihren Webbrowser ein und drücken Sie Enter.
3.  **Erfolg abwarten:** Warten Sie, bis die Seite geladen ist. Sie sollte eine Erfolgsmeldung anzeigen, z.B. "Backfill complete. Added or updated X unique customers."

Damit können sich nun auch alle bisherigen Käufer registrieren.

---

### Schritt 8: Geheime Schlüssel (Environment Variables) hinzufügen

Falls noch nicht geschehen, folgen Sie den Schritten aus der vorherigen Anleitung, um Ihre Stripe-Schlüssel (`STRIPE_API_KEY` und `STRIPE_WEBHOOK_SECRET`) sicher in der Google Cloud Console zu hinterlegen.

---

### Fertig!

Das war's! Ihr System ist jetzt korrekt konfiguriert.
