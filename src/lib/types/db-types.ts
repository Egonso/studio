import { Timestamp } from 'firebase/firestore';

// --- NEW ARCHITECTURE TYPES ---

export interface WorkspaceProject {
    id: string; // projectId (from URL)
    orgId: string;
    name: string;
    createdBy: string;
    createdAt: Timestamp;
    // Legacy support
    isLegacyFormat?: boolean;
}

export interface AiSystem {
    id: string;
    orgId: string;
    primaryWorkspaceId: string; // The workspace where this system was "born" or is mainly managed

    // Core Info
    title: string;
    department: string;
    dedupeKey: string; // "normalized_title_department"

    // Status
    lifecycleStatus: 'idea' | 'pilot' | 'live' | 'retired';

    // Metadata
    description?: string;
    generatedFromPolicyId?: string;

    createdAt: any; // Timestamp or FieldValue (serverTimestamp)
    updatedAt: any;
}

export interface AiActAssessment {
    id: string;
    aiSystemId: string;
    projectId: string; // Snapshot of which project context this was created in
    status: 'in_progress' | 'completed';
    answers: Record<string, any>;
    updatedAt: any;
}

export interface IsoAims {
    id: string; // "orgId_main"
    orgId: string;
    status: 'setup' | 'running';
    policyContent?: string;
    // ... other global ISO fields
    createdAt: any;
    updatedAt: any;
}
