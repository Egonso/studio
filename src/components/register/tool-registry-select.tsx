"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createAiToolsRegistryService,
  type AiToolsRegistryEntry,
  riskLevelLabels,
  riskLevelColors,
  TOOL_ID_OTHER,
} from "@/lib/register-first";

const registry = createAiToolsRegistryService();

interface ToolRegistrySelectProps {
  /** The selected toolId (or "" for none, "other" for free text). */
  value: string;
  /** Called with (toolId, entry | null). entry is null for "other" or cleared. */
  onChange: (toolId: string, entry: AiToolsRegistryEntry | null) => void;
  disabled?: boolean;
}

function RiskBadge({ entry }: { entry: AiToolsRegistryEntry }) {
  const Icon =
    entry.riskLevel === "minimal"
      ? ShieldCheck
      : entry.riskLevel === "high" || entry.riskLevel === "unacceptable"
        ? ShieldAlert
        : Shield;

  return (
    <Badge
      variant="outline"
      className={cn("ml-auto shrink-0 text-[10px] font-normal", riskLevelColors[entry.riskLevel])}
    >
      <Icon className="mr-0.5 h-3 w-3" />
      {riskLevelLabels[entry.riskLevel]}
    </Badge>
  );
}

export function ToolRegistrySelect({ value, onChange, disabled }: ToolRegistrySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const allTools = React.useMemo(() => registry.getAll(), []);

  const filteredTools = React.useMemo(
    () => (searchQuery.trim() ? registry.search(searchQuery) : allTools),
    [searchQuery, allTools]
  );

  const selectedEntry = React.useMemo(
    () => (value && value !== TOOL_ID_OTHER ? registry.getById(value) : null),
    [value]
  );

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (entry: AiToolsRegistryEntry) => {
    onChange(entry.toolId, entry);
    setSearchQuery("");
    setOpen(false);
  };

  const handleSelectOther = () => {
    onChange(TOOL_ID_OTHER, null);
    setSearchQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange("", null);
    setSearchQuery("");
  };

  const displayValue = selectedEntry
    ? `${selectedEntry.productName} (${selectedEntry.vendor})`
    : value === TOOL_ID_OTHER
      ? "Anderes Tool (Freitext)"
      : "";

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Input
          value={open ? searchQuery : displayValue}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setSearchQuery("");
          }}
          disabled={disabled}
          placeholder="KI-Tool suchen oder auswaehlen..."
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setOpen(!open)}
          disabled={disabled}
        >
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </div>

      {/* Selected tool info bar */}
      {selectedEntry && !open && (
        <div className="mt-1.5 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs">
          <RiskBadge entry={selectedEntry} />
          {selectedEntry.gdprCompliant && (
            <Badge variant="outline" className="shrink-0 bg-gray-50 text-[10px] font-normal text-gray-700">
              DSGVO
            </Badge>
          )}
          <span className="truncate text-muted-foreground">{selectedEntry.description}</span>
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
          >
            &times;
          </button>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {filteredTools.length === 0 && !searchQuery.trim() ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Keine Tools im Katalog.
            </div>
          ) : (
            <div className="p-1">
              {filteredTools.map((entry) => (
                <div
                  key={entry.toolId}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === entry.toolId && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(entry)}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === entry.toolId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{entry.productName}</span>
                      <span className="text-xs text-muted-foreground">({entry.vendor})</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
                  </div>
                  <RiskBadge entry={entry} />
                  {entry.gdprCompliant && (
                    <Badge
                      variant="outline"
                      className="shrink-0 bg-gray-50 text-[10px] font-normal text-gray-700"
                    >
                      DSGVO
                    </Badge>
                  )}
                </div>
              ))}

              {/* Free text fallback */}
              <div className="border-t">
                <div
                  className={cn(
                    "relative mt-1 flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === TOOL_ID_OTHER && "bg-accent text-accent-foreground"
                  )}
                  onClick={handleSelectOther}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === TOOL_ID_OTHER ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <span className="font-medium">Anderes Tool</span>
                    <p className="text-xs text-muted-foreground">
                      Tool nicht gefunden? Eigenen Namen eingeben.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
