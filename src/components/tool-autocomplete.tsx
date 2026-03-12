"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toolCatalog from "../data/tool-catalog.json";

interface ToolAutocompleteProps {
    value: string;
    onChange: (value: string, toolData?: any) => void;
    disabled?: boolean;
    inputClassName?: string;
    inputId?: string;
}

export function ToolAutocomplete({
    value,
    onChange,
    disabled,
    inputClassName,
    inputId,
}: ToolAutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    // Sync internal state with external value
    React.useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Close when clicking outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const safelyFilteredTools = React.useMemo(() => {
        const catalog = Array.isArray(toolCatalog) ? toolCatalog : [];
        if (inputValue === "") return catalog;
        return catalog.filter((tool) =>
            tool.name && tool.name.toLowerCase().includes(inputValue.toLowerCase())
        );
    }, [inputValue]);

    // Alias to keep existing render logic working
    const filteredTools = safelyFilteredTools;

    const handleSelect = (tool: any) => {
        setInputValue(tool.name);
        onChange(tool.name, tool);
        setOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        onChange(val, undefined); // Clear updated data if typing manually
        setOpen(true);
    };

    const customToolValue = inputValue.trim();

    const handleUseCustomTool = () => {
        if (!customToolValue) return;
        setInputValue(customToolValue);
        onChange(customToolValue, undefined);
        setOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <Input
                    id={inputId}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setOpen(true)}
                    disabled={disabled}
                    placeholder="z.B. ChatGPT, Midjourney..."
                    className={cn("pr-10", inputClassName)}
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

            {open && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                    {filteredTools.length === 0 ? (
                        customToolValue ? (
                            <div className="p-2">
                                <button
                                    type="button"
                                    onClick={handleUseCustomTool}
                                    className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                    <Plus className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div className="space-y-0.5">
                                        <p>{`„${customToolValue}“ als Custom Tool anlegen`}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Der Name wird direkt als eigenes Tool gespeichert.
                                        </p>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Der Tool-Katalog ist aktuell leer.
                            </div>
                        )
                    ) : (
                        <div className="p-1">
                            {filteredTools.map((tool) => (
                                <div
                                    key={tool.name}
                                    className={cn(
                                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                        inputValue === tool.name && "bg-accent text-accent-foreground"
                                    )}
                                    onClick={() => handleSelect(tool)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            inputValue === tool.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span>{tool.name}</span>
                                    {tool.vendor && (
                                        <span className="ml-2 text-xs text-muted-foreground">({tool.vendor})</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
