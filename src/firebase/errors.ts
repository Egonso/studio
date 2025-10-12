// Defines a custom error class for Firestore permission errors.
// This allows us to capture and handle permission-related issues
// with more context than a generic FirebaseError.

export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
    public context: SecurityRuleContext;

    constructor(context: SecurityRuleContext) {
        const message = `FirestoreError: Missing or insufficient permissions.`;
        super(message);
        this.name = 'FirestorePermissionError';
        this.context = context;

        // This is to ensure the stack trace is captured correctly
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FirestorePermissionError);
        }
    }
}
