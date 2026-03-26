"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy } from "lucide-react";

interface BadgeSnippetProps {
    projectId: string;
    level: "Basis" | "Erweitert" | "Audit-Ready" | "Ungeprüft";
}

export function BadgeSnippet({ projectId, level }: BadgeSnippetProps) {
    const [copied, setCopied] = useState(false);

    // The base URL should be determined by the environment, hardcoding for now or using window.location.origin
    // In a real app we'd injectNEXT_PUBLIC_APP_URL.
    const portalUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/trust/${projectId}`
        : `https://kiregister.com/trust/${projectId}`;

    const snippet = `
<!-- EUKI AI Governance Badge -->
<a href="${portalUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
  <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 9999px; border: 1px solid #bfdbfe; background-color: #eff6ff; color: #1e40af; font-family: system-ui, sans-serif; font-size: 12px; font-weight: 500;">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
    <span>EUKI-GOV-1.0</span>
    <span style="opacity: 0.4;">|</span>
    <span>Level ${level === 'Ungeprüft' ? 'ausstehend' : level}</span>
  </div>
</a>
  `.trim();

    const handleCopy = () => {
        navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-3">
            <Label className="text-sm text-slate-500">HTML Snippet (Für Ihre Website)</Label>
            <div className="relative">
                <Input
                    readOnly
                    value={snippet}
                    className="font-mono text-xs pr-12 cursor-text h-10 bg-slate-50"
                    onClick={(e) => e.currentTarget.select()}
                />
                <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1 h-8 w-8 hover:bg-slate-200 text-slate-500"
                    onClick={handleCopy}
                >
                    {copied ? <Check className="h-4 w-4 text-gray-600" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
            <p className="text-xs text-slate-400">
                Fügen Sie diesen Code in den Footer Ihrer Website ein. Er verlinkt automatisch auf Ihr Trust Portal.
            </p>
        </div>
    );
}
