'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { doc, onSnapshot } from 'firebase/firestore';

export interface WorkspaceMembership {
    orgId: string;
    orgName: string;
    role: 'EXTERNAL_OFFICER' | 'ADMIN' | 'MEMBER';
}

export interface UserProfile {
    isOfficer?: boolean;
    licenseKey?: string;
    verifiedAt?: string;
    certifiedBy?: string;
    workspaces?: WorkspaceMembership[];
    [key: string]: any;
}

export function useUserProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        let unsubscribe: (() => void) | undefined;

        async function initProfileListener() {
            try {
                const { getFirebaseDb } = await import('@/lib/firebase');
                const db = await getFirebaseDb();
                const userRef = doc(db, 'users', user!.uid);

                unsubscribe = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setProfile(docSnap.data() as UserProfile);
                    } else {
                        setProfile({});
                    }
                    setLoading(false);
                }, (error) => {
                    console.error('Error listening to user profile:', error);
                    setLoading(false);
                });
            } catch (error) {
                console.error('Failed to init profile listener:', error);
                setLoading(false);
            }
        }

        initProfileListener();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    return { profile, loading };
}
