import { useState, useEffect } from 'react';

import { getCourseProgress } from '@/lib/data-service';

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
    courseProgress: string[]; // List of completed video IDs
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

                // Fetch user status from API
                const statusResponse = await fetch(`https://europe-west1-ai-act-compass-m6o05.cloudfunctions.net/api/user-status/${encodeURIComponent(email)}`);
                if (!statusResponse.ok) {
                    throw new Error('Failed to fetch user status');
                }
                const statusResult = await statusResponse.json();

                // Fetch course progress from Firestore (via data-service)
                const courseProgress = await getCourseProgress();

                setData({
                    ...statusResult,
                    courseProgress
                });
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
