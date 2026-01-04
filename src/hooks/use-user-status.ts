import { useState, useEffect } from 'react';

export interface UserStatus {
    hasPurchased: boolean;
    purchase: {
        date: string | null;
        amount: number | null;
        productId: string | null;
    } | null;
    examPassed: boolean | null;
    examDate: string | null;
    examAttempts: number;
    hasCertificate: boolean;
    certificate: {
        code: string;
        issuedDate: string;
        validUntil: string;
        holderName: string;
    } | null;
}

export function useUserStatus(email: string | null | undefined) {
    const [data, setData] = useState<UserStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!email) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                // Using the deployed API endpoint
                const response = await fetch(`https://us-central1-ai-act-compass-m6o05.cloudfunctions.net/api/user-status/${encodeURIComponent(email)}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch user status');
                }

                const result = await response.json();
                setData(result);
                setError(null);
            } catch (err) {
                console.error('Error fetching user status:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [email]);

    return { data, loading, error };
}
