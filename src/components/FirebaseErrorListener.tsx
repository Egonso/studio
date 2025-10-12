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
            console.error(
                "Firestore Permission Error Caught:",
                "Operation:", error.context.operation,
                "Path:", error.context.path,
                "Data:", error.context.requestResourceData,
                "Auth:", auth.currentUser
            );
            
            // Construct a developer-friendly error message
            const errorMessage = `
                Firestore Security Rules Denied Request:
                - Operation: ${error.context.operation}
                - Path: ${error.context.path}
                - User UID: ${auth.currentUser?.uid || 'Not authenticated'}
            `;

            // Display the error in a toast for immediate feedback in the UI
            toast({
                variant: 'destructive',
                title: 'Fehler bei der Berechtigung',
                description: "Der Zugriff wurde von den Firestore-Sicherheitsregeln verweigert. Prüfen Sie die Entwicklerkonsole für Details.",
                duration: 9000,
            });

            // Throwing the error here will display it in the Next.js error overlay for developers
            throw new Error(errorMessage + `\n\nRaw Data: ${JSON.stringify(error.context.requestResourceData, null, 2)}`);
        };

        errorEmitter.on('permission-error', handler);

        return () => {
            errorEmitter.off('permission-error', handler);
        };
    }, [toast]);

    return null; // This component does not render anything
}
