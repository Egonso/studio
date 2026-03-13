import { CertificationExamClient } from '@/components/certification/exam-client';
import { SignedInAreaFrame } from '@/components/product-shells';

export default function ExamPage() {
  return (
    <SignedInAreaFrame
      area="paid_governance_control"
      title="Zertifizierungsprüfung"
      description="Die Kompetenzprüfung findet direkt im KI-Register statt. Prüfungsversuche, Zertifikate, Badge und öffentliche Verifikation bleiben damit in einem konsistenten Produktfluss."
      nextStep="Schließen Sie die Prüfung ab, um Ihr Personenzertifikat und den verifizierbaren Badge zu erhalten."
      width="5xl"
    >
      <CertificationExamClient />
    </SignedInAreaFrame>
  );
}
