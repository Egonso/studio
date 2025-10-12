
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

export function FirebaseErrorListener() {
    const { toast } = useToast();

    useEffect(() => {
        const handler = (error: FirestorePermissionError) => {
            const devErrorMessage = `
                Firestore Permission Error:
                - Operation: ${error.context.operation}
                - Path: /${error.context.path}
                - User UID: ${auth.currentUser?.uid || 'Not authenticated'}
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
    }, [toast]);

    return null; // This component does not render anything
}

    