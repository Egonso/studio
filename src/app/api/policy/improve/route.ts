import { NextRequest, NextResponse } from "next/server";
import { generateSectionImprovement } from "@/lib/policy-engine/ai-assistant";
import { registerService } from "@/lib/register-first/register-service";
import type { PolicySection } from "@/lib/policy-engine/types";

// Simple in-memory rate limiting map for AI improvements
// In production, use Redis to persist across serverless restarts
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const PRO_LIMIT = 5;

export async function POST(req: NextRequest) {
    try {
        const { section, orgName, industry, registerId } = await req.json();

        if (!section || !section.title || !section.content) {
            return NextResponse.json({ error: "Invalid section data" }, { status: 400 });
        }

        // 1. Resolve Register & Plan
        // In API routes, we might not have sessionStorage/AuthContext
        // We try to list registers to find the one matching registerId or the first one
        const registers = await registerService.listRegisters();
        const activeRegister = registerId
            ? registers.find(r => r.registerId === registerId)
            : (registers.length > 0 ? registers[0] : null);

        if (!activeRegister) {
            return NextResponse.json({ error: "Register context not found" }, { status: 404 });
        }

        const plan = activeRegister.plan || "free";

        // 2. Gating: Free plan has no AI access
        if (plan === "free") {
            return NextResponse.json(
                { error: "AI Schreibhilfe ist im Pro-Plan verfügbar." },
                { status: 403 }
            );
        }

        // 3. Rate Limiting (for Pro plan)
        if (plan === "pro") {
            const key = `${activeRegister.registerId}:improve`;
            const now = Date.now();
            const usage = rateLimitMap.get(key) || { count: 0, lastReset: now };

            if (now - usage.lastReset > RESET_INTERVAL) {
                usage.count = 0;
                usage.lastReset = now;
            }

            if (usage.count >= PRO_LIMIT) {
                return NextResponse.json(
                    { error: "Tageslimit für KI-Verbesserungen erreicht (5/Tag)." },
                    { status: 429 }
                );
            }

            rateLimitMap.set(key, { ...usage, count: usage.count + 1 });
        }

        // 4. Generate Improvement
        const improvedText = await generateSectionImprovement(section, { orgName, industry });

        return NextResponse.json({
            success: true,
            improvedContent: improvedText
        });

    } catch (error: any) {
        console.error("Policy Improve API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
