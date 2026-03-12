import { Suspense } from "react";
import {
    AiManagementPageClient,
    AiManagementPageLoading,
} from "@/components/ai-management-page-client";

export default function AiManagementPage() {
    return (
        <Suspense fallback={<AiManagementPageLoading />}>
            <AiManagementPageClient />
        </Suspense>
    );
}
