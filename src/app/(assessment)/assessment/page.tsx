import { AssessmentWizard } from "@/components/assessment-wizard";
import { AppHeader } from "@/components/app-header";

export default function AssessmentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background dark">
      <AppHeader />
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <AssessmentWizard />
      </div>
    </div>
  );
}
