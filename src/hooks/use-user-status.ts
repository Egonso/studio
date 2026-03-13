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
        status: 'active' | 'expired' | 'revoked';
        latestDocumentUrl: string | null;
        verifyUrl: string;
        company: string | null;
        modules: string[];
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
                const { getFirebaseAuth } = await import('@/lib/firebase');
                const auth = await getFirebaseAuth();
                const idToken = await auth.currentUser?.getIdToken();

                let internalStatus: Partial<UserStatus> | null = null;
                if (idToken) {
                    const internalResponse = await fetch('/api/certification/status', {
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    });

                    if (internalResponse.ok) {
                        internalStatus = await internalResponse.json();
                    }
                }

                let legacyStatus: Partial<UserStatus> | null = null;
                try {
                    const legacyResponse = await fetch(`https://europe-west1-ai-act-compass-m6o05.cloudfunctions.net/api/user-status/${encodeURIComponent(email)}`);
                    if (legacyResponse.ok) {
                        legacyStatus = await legacyResponse.json();
                    }
                } catch (legacyError) {
                    console.warn('Legacy user status fallback failed:', legacyError);
                }

                // Fetch course progress from Firestore (via data-service)
                const courseProgress = await getCourseProgress();

                const mergedCertificate =
                    internalStatus?.certificate ??
                    legacyStatus?.certificate ??
                    null;

                const normalizedCertificate = mergedCertificate
                    ? {
                        ...mergedCertificate,
                        status: mergedCertificate.status ?? 'active',
                        latestDocumentUrl: mergedCertificate.latestDocumentUrl ?? null,
                        verifyUrl:
                            mergedCertificate.verifyUrl ??
                            (mergedCertificate.code
                                ? `https://kiregister.com/verify/${mergedCertificate.code}`
                                : ''),
                        company: mergedCertificate.company ?? null,
                        modules: mergedCertificate.modules ?? [],
                    }
                    : null;

                const mergedStatus: UserStatus = {
                    hasPurchased:
                        legacyStatus?.hasPurchased ??
                        internalStatus?.hasPurchased ??
                        false,
                    purchase:
                        legacyStatus?.purchase ??
                        internalStatus?.purchase ??
                        null,
                    examPassed:
                        internalStatus?.examPassed ??
                        legacyStatus?.examPassed ??
                        null,
                    examDate:
                        internalStatus?.examDate ??
                        legacyStatus?.examDate ??
                        null,
                    examAttempts: Math.max(
                        internalStatus?.examAttempts ?? 0,
                        legacyStatus?.examAttempts ?? 0,
                    ),
                    hasCertificate:
                        internalStatus?.hasCertificate ??
                        legacyStatus?.hasCertificate ??
                        Boolean(mergedCertificate),
                    certificate: normalizedCertificate,
                    courseProgress,
                };

                setData(mergedStatus);
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
