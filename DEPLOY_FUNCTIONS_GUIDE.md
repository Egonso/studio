
# Anleitung: Firebase Function & Regeln bereitstellen

Herzlichen Glückwunsch! Die Code-Implementierung ist abgeschlossen. Damit Ihr neuer Stripe-Webhook und die Sicherheitsregeln live funktionieren, müssen wir drei Dinge tun:

1.  **Die Cloud Function bereitstellen (deployen):** Wir laden den neuen Code in Ihr Firebase-Projekt hoch.
2.  **Geheime Schlüssel (Secrets) sicher hinterlegen:** Wir teilen Firebase Ihre geheimen Stripe-Schlüssel mit.
3.  **Firestore-Regeln bereitstellen:** Wir laden die neuen Sicherheitsregeln hoch, die den Datenzugriff steuern.

Folgen Sie einfach diesen Schritten.

---

### Voraussetzungen

1.  **Firebase CLI:** Sie müssen die Firebase-Befehlszeilentools (CLI) installiert haben. Falls nicht, finden Sie [hier eine Anleitung](https://firebase.google.com/docs/cli#install).
2.  **Angemeldet sein:** Sie müssen in Ihrem Terminal bei Firebase angemeldet sein. Führen Sie `firebase login` aus, falls Sie sich nicht sicher sind.

---

### Schritt 1: Das Terminal öffnen

Öffnen Sie das eingebaute Terminal oder die Befehlszeile in Ihrer Entwicklungsumgebung. In den meisten Programmen finden Sie es im Menü unter `Terminal` > `New Terminal`.

### Schritt 2: In das `functions`-Verzeichnis wechseln

Unsere Cloud Function hat ihr eigenes, separates Verzeichnis. Wir müssen dorthin navigieren, bevor wir Befehle ausführen.

```bash
cd functions
```

### Schritt 3: Die Abhängigkeiten der Function installieren

Genau wie Ihr Hauptprojekt benötigt auch die Function ihre eigenen Pakete (`stripe`, `firebase-admin`, etc.).

```bash
npm install
```

### Schritt 4: Zurück ins Hauptverzeichnis wechseln

Wechseln Sie wieder eine Ebene nach oben, um die restlichen Befehle auszuführen.

```bash
cd ..
```

### Schritt 5: Die Firestore-Regeln bereitstellen

Dieser Befehl lädt die neue `firestore.rules`-Datei in Ihr Projekt hoch.

```bash
firebase deploy --only firestore:rules
```

### Schritt 6: Die Function bereitstellen (deployen)

Jetzt laden wir den Code der Funktion in die Cloud hoch.

```bash
firebase deploy --only functions
```

Wenn alles geklappt hat, sehen Sie eine Erfolgsmeldung mit den URLs Ihrer Funktionen. Suchen Sie nach der URL für **`backfillCustomers`**. Sie sieht in etwa so aus: `https://backfillcustomers-xxxxxxxx-xx.a.run.app`.

---

### Schritt 7 (NEU): Kundendaten für bestehende Käufe nachtragen

Wir müssen eine einmalige Funktion ausführen, um alle bisherigen Käufer in die neue `customers`-Collection einzutragen.

1.  **Funktions-URL aufrufen:** Kopieren Sie die URL der `backfillCustomers`-Funktion aus der Erfolgsmeldung im Terminal.
2.  **Im Browser öffnen:** Fügen Sie diese URL in Ihren Webbrowser ein und drücken Sie Enter.
3.  **Erfolg abwarten:** Warten Sie, bis die Seite geladen ist. Sie sollte eine Erfolgsmeldung anzeigen, z.B. "Backfill complete. Added or updated X unique customers."

Damit können sich nun auch alle bisherigen Käufer registrieren.

**Optional, aber empfohlen:** Nachdem dies erfolgreich war, können Sie den Code für die `backfillCustomers`-Funktion aus der `functions/src/index.ts`-Datei entfernen und die Funktionen erneut bereitstellen, um aufzuräumen.

---

### Schritt 8: Geheime Schlüssel (Environment Variables) hinzufügen

Dies ist der wichtigste Schritt, um die Verbindung zu Stripe sicher zu machen. **Sie müssen dies nur einmal tun.**

1.  **Öffnen Sie die Google Cloud Console:**
    *   Gehen Sie zu [https://console.cloud.google.com/](https://console.cloud.google.com/).
    *   Stellen Sie sicher, dass oben das richtige Projekt ausgewählt ist (es sollte den Namen Ihres Firebase-Projekts haben, z. B. `ai-act-compass-m6o05`).

2.  **Finden Sie Ihre Cloud Function:**
    *   Nutzen Sie die Suchleiste ganz oben und suchen Sie nach **"Cloud Functions"**. Klicken Sie auf das Ergebnis.
    *   Sie sehen nun eine Liste Ihrer Funktionen. Klicken Sie auf den Namen `stripeWebhook`.

3.  **Umgebungsvariablen bearbeiten:**
    *   Klicken Sie oben auf **"BEARBEITEN"**.
    *   Scrollen Sie nach unten zum Abschnitt **"Laufzeit-, Build- und Verbindungseinstellungen"** und öffnen Sie ihn.
    *   Klicken Sie auf den Tab **"LAUFZEIT"**.

4.  **Variablen hinzufügen:**
    *   Sie sehen den Abschnitt **"Laufzeitumgebungsvariablen"**. Klicken Sie auf **"VARIABLE HINZUFÜGEN"**.
    *   **Erste Variable:**
        *   **Name:** `STRIPE_API_KEY`
        *   **Wert:** Fügen Sie hier Ihren **geheimen Stripe-Schlüssel** ein. Er beginnt mit `sk_live_...` oder `sk_test_...`.
    *   **Zweite Variable:** Klicken Sie erneut auf **"VARIABLE HINZUFÜGEN"**.
        *   **Name:** `STRIPE_WEBHOOK_SECRET`
        *   **Wert:** Fügen Sie hier Ihr **Webhook-Signaturgeheimnis** ein. Es beginnt mit `whsec_...`. Sie finden es in Ihrem Stripe-Dashboard unter Entwickler > Webhooks > Ihr Webhook-Endpunkt.

5.  **Speichern:**
    *   Scrollen Sie ganz nach unten und klicken Sie auf **"WEITER"** und dann auf **"BEREITSTELLEN"**.
    *   Die Funktion wird nun mit den neuen, sicheren Schlüsseln aktualisiert. Dies kann wieder ein paar Minuten dauern.

---

### Fertig!

Das war's! Ihr Stripe-Webhook und Ihre Firestore-Datenbank sind jetzt voll funktionsfähig und sicher konfiguriert. Neue Kunden werden automatisch in Firestore gespeichert, und die Registrierung ist auf diese Kunden beschränkt.
