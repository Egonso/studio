
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

### Schritt 6: Stripe-Secrets sicher hinterlegen

Die Function verwendet Firebase Functions v2 Secrets. Hinterlegen Sie die Stripe-Werte deshalb vor dem Deploy im Secret-Store und nicht als lose Klartext-Umgebungsvariablen in der UI.

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

Optional nur für ältere Fallbacks:

```bash
firebase functions:secrets:set STRIPE_API_KEY
```

### Schritt 7: Die Function bereitstellen (deployen)

Jetzt laden wir den Code der Funktion in die Cloud hoch.

```bash
firebase deploy --only functions
```

Wenn alles geklappt hat, sehen Sie eine Erfolgsmeldung, die Ihnen auch die URL Ihrer Webhook-Funktion anzeigt.

### Schritt 8: Secret- und Webhook-Konfiguration prüfen

1.  Verifizieren Sie mit `firebase functions:secrets:access STRIPE_SECRET_KEY`, dass das Secret im richtigen Projekt liegt.
2.  Prüfen Sie im Stripe-Dashboard unter Entwickler > Webhooks, dass Ihr Endpunkt auf die aktuelle Firebase-Function-URL zeigt.
3.  Stellen Sie sicher, dass dort mindestens diese Events aktiviert sind:
    *   `checkout.session.completed`
    *   `invoice.paid`
    *   `customer.subscription.updated`
    *   `customer.subscription.deleted`
    *   `charge.refunded`

---

### Fertig!

Das war's! Ihr Stripe-Webhook und Ihre Firestore-Datenbank sind jetzt voll funktionsfähig und sicher konfiguriert. Neue Kunden werden automatisch in Firestore gespeichert, und die Registrierung ist auf diese Kunden beschränkt.
