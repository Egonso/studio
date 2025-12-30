import { useState } from 'react';
import { createProject, setActiveProjectId } from '@/lib/data-service';
import { useToast } from "@/hooks/use-toast";

export interface ProjectWizardState {
    projectName: string;
    sector: string;
    systemType: string;
    selectedRisks: string[];
    isSubmitting: boolean;
}

export interface ProjectWizardActions {
    setProjectName: (value: string) => void;
    setSector: (value: string) => void;
    setSystemType: (value: string) => void;
    toggleRisk: (riskId: string) => void;
    submit: () => Promise<string | null>;
}

export const useProjectWizard = () => {
    const { toast } = useToast();
    const [state, setState] = useState<ProjectWizardState>({
        projectName: '',
        sector: '',
        systemType: '',
        selectedRisks: [],
        isSubmitting: false,
    });

    const setProjectName = (value: string) => setState(prev => ({ ...prev, projectName: value }));
    const setSector = (value: string) => setState(prev => ({ ...prev, sector: value }));
    const setSystemType = (value: string) => setState(prev => ({ ...prev, systemType: value }));

    const toggleRisk = (riskId: string) => {
        setState(prev => {
            const current = prev.selectedRisks;
            const updated = current.includes(riskId)
                ? current.filter(id => id !== riskId)
                : [...current, riskId];
            return { ...prev, selectedRisks: updated };
        });
    };

    const submit = async (): Promise<string | null> => {
        if (!state.projectName.trim()) return null;

        setState(prev => ({ ...prev, isSubmitting: true }));

        try {
            const metadata = {
                sector: state.sector,
                systemType: state.systemType,
                riskIndicators: state.selectedRisks,
            };

            // This service function already handles Project + AI System creation mapping
            const newProjectId = await createProject(state.projectName, metadata);

            setActiveProjectId(newProjectId);

            toast({
                title: "Projekt erstellt",
                description: `Das Projekt "${state.projectName}" wurde erfolgreich angelegt.`,
            });

            return newProjectId;
        } catch (error) {
            console.error("Failed to create project:", error);
            toast({
                title: "Fehler",
                description: "Das Projekt konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
                variant: "destructive",
            });
            return null;
        } finally {
            setState(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    return {
        state,
        actions: {
            setProjectName,
            setSector,
            setSystemType,
            toggleRisk,
            submit
        }
    };
};
