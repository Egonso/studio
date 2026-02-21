"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolkitPaywallDialog } from "./toolkit-paywall-dialog";

interface ToolkitUpsellButtonProps {
    label?: string;
    variant?: "default" | "outline" | "ghost" | "link" | "secondary";
    className?: string;
}

export function ToolkitUpsellButton({
    label = "Toolkit aktivieren",
    variant = "outline",
    className,
}: ToolkitUpsellButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant={variant}
                size="sm"
                className={className}
                onClick={() => setIsOpen(true)}
            >
                {label}
            </Button>

            <ToolkitPaywallDialog open={isOpen} onOpenChange={setIsOpen} />
        </>
    );
}
