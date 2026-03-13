'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { clearActiveProjectId } from '@/lib/data-service';
import {
    getActiveWorkspaceId,
    setActiveWorkspaceId,
} from '@/lib/workspace-session';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WorkspaceSwitcher() {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const router = useRouter();

    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        setActiveId(getActiveWorkspaceId());
    }, []);

    if (!user || !profile) return null;

    const workspaces = profile.workspaces || [];

    // If the user has no external workspaces, don't show the switcher
    if (workspaces.length === 0) {
        return null;
    }

    const activeWorkspace = activeId
        ? workspaces.find(w => w.orgId === activeId)
        : null;

    const handleSwitch = (orgId: string | null) => {
        setActiveWorkspaceId(orgId);
        setActiveId(orgId);
        clearActiveProjectId();
        const workspaceScope = orgId ?? 'personal';
        router.replace(`/my-register?workspace=${encodeURIComponent(workspaceScope)}`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 w-[200px] justify-between">
                    <div className="flex items-center gap-2 truncate">
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                            {activeWorkspace ? activeWorkspace.orgName : 'Mein Register'}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]" align="start">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Mein Bereich</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => handleSwitch(null)}
                    className="flex items-center justify-between"
                >
                    <span>Mein Register</span>
                    {!activeId && <Check className="h-4 w-4" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
                {workspaces.map((ws) => (
                    <DropdownMenuItem
                        key={ws.orgId}
                        onClick={() => handleSwitch(ws.orgId)}
                        className="flex items-center justify-between"
                    >
                        <span className="truncate">{ws.orgName}</span>
                        {activeId === ws.orgId && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
