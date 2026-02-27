"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { registerService } from "@/lib/register-first/register-service";
import type { Register } from "@/lib/register-first/types";
import { AccessCodeManager } from "./access-code-manager";

interface GovernanceSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    register: Register;
    onSaved?: (updated: Partial<Register>) => void;
}

export function GovernanceSettingsDialog({
    open,
    onOpenChange,
    register,
    onSaved,
}: GovernanceSettingsDialogProps) {
    const [orgName, setOrgName] = useState(register.organisationName ?? "");
    const [orgUnit, setOrgUnit] = useState(register.organisationUnit ?? "");
    const [publicDisclosure, setPublicDisclosure] = useState(
        register.publicOrganisationDisclosure ?? false
    );
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const profile = {
                organisationName: orgName.trim() || null,
                organisationUnit: orgUnit.trim() || null,
                publicOrganisationDisclosure: publicDisclosure,
            };
            await registerService.updateRegisterProfile(register.registerId, profile);

            toast({
                title: "Einstellungen gespeichert",
                description: orgName.trim()
                    ? `Organisation: ${orgName.trim()}`
                    : "Scope: Private Registerinstanz",
            });

            onSaved?.(profile);
            onOpenChange(false);
        } catch {
            toast({
                variant: "destructive",
                title: "Fehler",
                description: "Einstellungen konnten nicht gespeichert werden.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Governance-Einstellungen</DialogTitle>
                    <DialogDescription>
                        Organisationsdaten sind optional. Ohne Organisation gilt das Register als private Instanz.
                    </DialogDescription>
                </DialogHeader>

                <Accordion type="single" collapsible className="w-full mt-2" defaultValue="item-1">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-sm font-semibold">Organisationsdaten</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2 pb-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="gs-org">Organisation</Label>
                                    <Input
                                        id="gs-org"
                                        placeholder="z. B. Müller GmbH"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="gs-unit">Organisationseinheit</Label>
                                    <Input
                                        id="gs-unit"
                                        placeholder="z. B. Marketing"
                                        value={orgUnit}
                                        onChange={(e) => setOrgUnit(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-start gap-3 rounded-md border p-3">
                                    <Checkbox
                                        id="gs-disclosure"
                                        checked={publicDisclosure}
                                        onCheckedChange={(checked) =>
                                            setPublicDisclosure(checked === true)
                                        }
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="gs-disclosure" className="text-sm font-medium leading-none">
                                            Organisation öffentlich anzeigen
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Wenn aktiviert, erscheint der Organisationsname auf öffentlichen Verify-Seiten.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button onClick={() => void handleSave()} disabled={isSaving} size="sm">
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Organisationsdaten speichern
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                        <AccordionTrigger className="text-sm font-semibold">Zugangscodes</AccordionTrigger>
                        <AccordionContent>
                            <div className="pt-2 pb-4">
                                <AccessCodeManager registerId={register.registerId} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Schließen
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
