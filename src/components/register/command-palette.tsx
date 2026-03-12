"use client";

import { useCallback, useEffect, useState } from "react";
import { Command, Search, Plus, ClipboardList } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { QuickCaptureModal } from "./quick-capture-modal";

// ── Types ────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
    onCaptured?: () => void;
}

interface CommandAction {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    shortcut?: string;
    onSelect: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function CommandPalette({ onCaptured }: CommandPaletteProps) {
    const { user } = useAuth();
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [captureOpen, setCaptureOpen] = useState(false);
    const [search, setSearch] = useState("");

    // ── Keyboard shortcuts ──────────────────────────────────────────────────

    const handleGlobalKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!user) return;

            // Cmd+K / Ctrl+K → Command Palette
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setPaletteOpen((prev) => !prev);
                return;
            }

            // Cmd+Shift+U / Ctrl+Shift+U → Direct Quick Capture
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "u") {
                e.preventDefault();
                setPaletteOpen(false);
                setCaptureOpen(true);
            }
        },
        [user]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [handleGlobalKeyDown]);

    // ── Actions ─────────────────────────────────────────────────────────────

    const actions: CommandAction[] = [
        {
            id: "capture",
            label: "Quick Capture",
            description: "Use Case in 30 Sekunden erfassen",
            icon: <Plus className="h-4 w-4" />,
            shortcut: "⇧U",
            onSelect: () => {
                setPaletteOpen(false);
                setCaptureOpen(true);
            },
        },
        {
            id: "register",
            label: "AI Governance Register",
            description: "Alle Use Cases anzeigen",
            icon: <ClipboardList className="h-4 w-4" />,
            onSelect: () => {
                setPaletteOpen(false);
                window.location.href = "/my-register";
            },
        },
    ];

    const filteredActions = search.trim()
        ? actions.filter(
            (a) =>
                a.label.toLowerCase().includes(search.toLowerCase()) ||
                a.description.toLowerCase().includes(search.toLowerCase())
        )
        : actions;

    const handleCaptured = () => {
        onCaptured?.();
    };

    if (!user) return null;

    return (
        <>
            {/* Command Palette Dialog */}
            <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
                {paletteOpen ? (
                    <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[420px]">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Command Palette</DialogTitle>
                            <DialogDescription>
                                Öffnet schnelle Aktionen wie Quick Capture oder den
                                direkten Sprung ins Register.
                            </DialogDescription>
                        </DialogHeader>
                        {/* Search Bar */}
                        <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Aktion suchen…"
                                className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                autoFocus
                            />
                            <kbd className="ml-2 inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-mono text-muted-foreground">
                                esc
                            </kbd>
                        </div>

                        {/* Action List */}
                        <div className="max-h-[300px] overflow-y-auto p-1">
                            {filteredActions.length === 0 ? (
                                <p className="p-4 text-center text-sm text-muted-foreground">
                                    Keine Aktion gefunden.
                                </p>
                            ) : (
                                filteredActions.map((action) => (
                                    <button
                                        key={action.id}
                                        onClick={action.onSelect}
                                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                                            {action.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium">{action.label}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {action.description}
                                            </p>
                                        </div>
                                        {action.shortcut && (
                                            <div className="flex items-center gap-0.5">
                                                <kbd className="inline-flex h-5 items-center rounded border px-1 text-[10px] font-mono text-muted-foreground">
                                                    <Command className="mr-0.5 h-2.5 w-2.5" />
                                                    {action.shortcut}
                                                </kbd>
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </DialogContent>
                ) : null}
            </Dialog>

            {/* Quick Capture Modal */}
            <QuickCaptureModal
                open={captureOpen}
                onOpenChange={setCaptureOpen}
                onCaptured={handleCaptured}
            />
        </>
    );
}
