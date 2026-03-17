'use server';

import { db, auth } from '@/lib/firebase-admin';
import { requireUser } from '@/lib/server-auth';

export async function verifyOfficerKey(idToken: string, key: string) {
    if (!idToken) {
        return { success: false, message: 'Nicht autorisiert' };
    }

    if (!key) {
        return { success: false, message: 'Bitte einen Zertifikats-Code eingeben' };
    }

    try {
        const actor = await requireUser(idToken);
        const userRecord = await auth.getUser(actor.uid);
        const userEmail = userRecord.email?.toLowerCase();

        if (!userEmail) {
            return { success: false, message: 'Keine E-Mail-Adresse im Account hinterlegt. Verifizierung nicht möglich.' };
        }

        const certsQuery = await db.collection('zertifikatspruefung')
            .where('code', '==', key)
            .get();

        if (certsQuery.empty) {
            return { success: false, message: 'Ungültiger Zertifikats-Code' };
        }

        const certDoc = certsQuery.docs[0];
        const certData = certDoc.data();

        if (certData.status !== 'active') {
            return { success: false, message: 'Das Zertifikat ist nicht mehr aktiv' };
        }

        const holderEmail = certData.holder?.email?.toLowerCase();

        if (holderEmail !== userEmail) {
            return { success: false, message: 'Das Zertifikat ist auf eine andere E-Mail-Adresse ausgestellt' };
        }

        // Successfully verified
        const docRef = db.collection('users').doc(actor.uid);
        await docRef.set({
            isOfficer: true,
            licenseKey: key,
            verifiedAt: new Date().toISOString(),
            certifiedBy: `EUKIgesetz Academy (Zertifikat ${key})`
        }, { merge: true });

        return { success: true, message: 'Erfolgreich als EUKI Certified Officer verifiziert' };
    } catch (error) {
        console.error('Error verifying officer key:', error);
        return { success: false, message: 'Fehler bei der Verifizierung' };
    }
}
