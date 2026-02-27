
'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
    const { toast } = useToast();
    const [authInstance, setAuthInstance] = useState<any>(null);

    useEffect(() => {
        // Lazy load Firebase Auth
        async function loadAuth() {
            try {
                const { getFirebaseAuth } = await import('@/lib/firebase');
                const auth = await getFirebaseAuth();
                setAuthInstance(auth);
            } catch (error) {
                console.error('Failed to load Firebase Auth:', error);
            }
        }
        loadAuth();
    }, []);

    useEffect(() => {
        const handler = (error: any) => {
            const devErrorMessage = `
                Firestore Permission Error:
                - Operation: ${error.context.operation}
                - Path: /${error.context.path}
                - User UID: ${authInstance?.currentUser?.uid || 'Not authenticated'}
                - Sent Data: ${JSON.stringify(error.context.requestResourceData, null, 2)}
            `;

            // Log the detailed error for developers to see in the browser console
            console.error(devErrorMessage);

            // Display a user-friendly toast
            toast({
                variant: 'destructive',
                title: 'Fehler bei der Berechtigung',
                description: "Der Zugriff wurde von den Sicherheitsregeln verweigert. Prüfen Sie die Entwicklerkonsole für Details.",
                duration: 9000,
            });

            // Throwing the error here will display it in the Next.js error overlay for developers
            throw new Error(devErrorMessage);
        };

        errorEmitter.on('permission-error', handler);

        return () => {
            errorEmitter.off('permission-error', handler);
        };
    }, [toast, authInstance]);

    return null; // This component does not render anything
}
