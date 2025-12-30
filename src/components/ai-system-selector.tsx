'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { getAiSystemsForWorkspace } from '@/lib/ai-system-service';
import { AiSystem } from '@/lib/types/db-types';
import { Loader2, Box } from 'lucide-react';

interface AiSystemSelectorProps {
    workspaceId: string;
    onSystemChange?: (system: AiSystem) => void;
}

export function AiSystemSelector({ workspaceId, onSystemChange }: AiSystemSelectorProps) {
    const [systems, setSystems] = useState<AiSystem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSystemId, setSelectedSystemId] = useState<string>('');

    useEffect(() => {
        if (!workspaceId) return;
        
        const loadSystems = async () => {
            setLoading(true);
            try {
                const list = await getAiSystemsForWorkspace(workspaceId);
                setSystems(list);
                
                // Auto-select first if available
                if (list.length > 0) {
                    const first = list[0];
                    setSelectedSystemId(first.id);
                    if (onSystemChange) onSystemChange(first);
                }
            } catch (e) {
                console.error("Failed to load AI Systems", e);
            } finally {
                setLoading(false);
            }
        };

        loadSystems();
    }, [workspaceId]);

    if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;

    // If 0 or 1 systems, we might not need a selector, or we show a static badge
    if (systems.length <= 1) {
        if (systems.length === 1) {
            return (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-md">
                    <Box className="h-4 w-4" />
                    <span className="font-medium">{systems[0].title}</span>
                </div>
            );
        }
        return null; // No systems yet
    }

    return (
        <Select 
            value={selectedSystemId} 
            onValueChange={(val) => {
                setSelectedSystemId(val);
                const sys = systems.find(s => s.id === val);
                if (sys && onSystemChange) onSystemChange(sys);
            }}
        >
            <SelectTrigger className="w-[250px] bg-secondary/50 border-none">
                <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="AI System wählen..." />
                </div>
            </SelectTrigger>
            <SelectContent>
                {systems.map((sys) => (
                    <SelectItem key={sys.id} value={sys.id}>
                        {sys.title} <span className="text-xs text-muted-foreground ml-2">({sys.department})</span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
