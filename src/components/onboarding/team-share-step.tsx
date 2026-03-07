"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy, KeyRound, Link2, PlayCircle } from "lucide-react";

interface TeamShareStepProps {
  inviteCode: string;
  captureLink: string;
  copiedTarget: "code" | "link" | null;
  onCopyValue: (value: string, target: "code" | "link") => void | Promise<void>;
  onContinue: () => void;
}

export function TeamShareStep({
  inviteCode,
  captureLink,
  copiedTarget,
  onCopyValue,
  onContinue,
}: TeamShareStepProps) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white p-2 text-slate-700">
            <PlayCircle className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">
              Jetzt zuerst selbst starten
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Erfassen Sie selbst den ersten KI-Einsatzfall. So sehen Sie direkt,
              wie das Register funktioniert. Einladungscode und Erfassungslink
              brauchen Sie erst, wenn weitere Kolleg:innen mitarbeiten sollen.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Jetzt ersten Einsatzfall selbst erfassen
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline py-1"
        >
          Später fortfahren
        </button>
      </div>

      <div className="rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setShareOpen((current) => !current)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div>
            <p className="text-sm font-medium text-slate-900">
              Mit Team teilen
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                optional
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Für Kolleg:innen, die später selbst Einsatzfälle eintragen sollen.
            </p>
          </div>
          {shareOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {shareOpen && (
          <div className="space-y-5 border-t border-slate-200 px-4 py-4">
            <div className="rounded-md border border-emerald-200 bg-emerald-50/70 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Empfohlen
              </p>
              <div className="mt-2 flex items-start gap-2">
                <Link2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">Erfassungslink teilen</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Für E-Mail, Slack oder Notion. Der Link öffnet die Erfassungsmaske
                    direkt mit vorausgefülltem Code.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-md border bg-white px-4 py-2.5 font-mono text-xs break-all">
                      {captureLink}
                    </div>
                    <button
                      type="button"
                      onClick={() => void onCopyValue(captureLink, "link")}
                      className="rounded-md border bg-white p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Link kopieren"
                    >
                      {copiedTarget === "link" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-start gap-2">
                <KeyRound className="mt-0.5 h-4 w-4 text-slate-700" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">Einladungscode</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Nur als Fallback, wenn jemand den Link nicht direkt öffnen kann
                    und den Zugangscode manuell eingeben soll.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-md border bg-white px-4 py-2.5 font-mono text-sm tracking-wider">
                      {inviteCode}
                    </div>
                    <button
                      type="button"
                      onClick={() => void onCopyValue(inviteCode, "code")}
                      className="rounded-md border bg-white p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Code kopieren"
                    >
                      {copiedTarget === "code" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
