import { AssessmentWizard } from "@/components/assessment-wizard";

export default function AssessmentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background dark p-4 md:p-8">
      <div className="flex-1 flex flex-col items-center justify-center">
        <AssessmentWizard />
      </div>
    </div>
  );
}
