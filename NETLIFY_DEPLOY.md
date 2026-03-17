# Netlify Deployment Anleitung

## Schritt 1: Projekt auf Netlify verbinden

1. Gehen Sie zu [https://app.netlify.com](https://app.netlify.com)
2. Klicken Sie auf **"Add new site"** → **"Import an existing project"**
3. Wählen Sie **GitHub** als Git-Provider
4. Wählen Sie das Repository **Egonso/studio** aus
5. Netlify erkennt automatisch die Next.js-Konfiguration

## Schritt 2: Build-Einstellungen

Die Build-Einstellungen sollten automatisch erkannt werden:
- **Build command:** `npm run build`
- **Publish directory:** `.next` (wird automatisch vom Next.js Plugin behandelt)

## Schritt 3: Umgebungsvariablen hinzufügen

1. Gehen Sie zu **Site settings** → **Environment variables**
2. Klicken Sie auf **"Add a variable"**
3. Fügen Sie folgende Variable hinzu:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Wert aus Ihrem Secret Manager / Passwortsafe
4. Klicken Sie auf **"Save"**

## Schritt 4: Deployment starten

1. Gehen Sie zurück zum **Deploys** Tab
2. Klicken Sie auf **"Trigger deploy"** → **"Deploy site"**
3. Warten Sie, bis das Deployment abgeschlossen ist

## Alternative: Über Netlify CLI (wenn authentifiziert)

Falls Sie bereits bei Netlify eingeloggt sind, können Sie auch folgende Befehle verwenden:

```bash
# Umgebungsvariable setzen (nachdem die Site erstellt wurde)
netlify env:set GEMINI_API_KEY "<secret-from-password-manager>"

# Deployen
netlify deploy --prod
```

## Wichtige Hinweise

- Die `.env.local` Datei wird nicht ins Repository committed (siehe `.gitignore`)
- Die Umgebungsvariable muss in Netlify gesetzt werden, damit sie während des Builds verfügbar ist
- Genkit verwendet standardmäßig die `GEMINI_API_KEY` Umgebungsvariable für die Google AI Authentifizierung



