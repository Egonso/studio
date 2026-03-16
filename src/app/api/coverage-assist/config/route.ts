import { NextResponse } from "next/server";
import { getPublicCoverageAssistConfig } from "@/lib/coverage-assist/feature-gate";

export async function GET() {
  return NextResponse.json(getPublicCoverageAssistConfig(), {
    headers: {
      "Cache-Control": "public, max-age=60",
    },
  });
}
