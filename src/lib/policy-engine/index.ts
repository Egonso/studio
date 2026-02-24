export * from "./types";
export * from "./policy-repository";
export { createPolicyService, policyService } from "./policy-service";
export type { PolicyService } from "./policy-service";

// ── PE-2a: Section Registry + Assembler ──────────────────────────────────────
export { assemblePolicy, assemblePolicyMarkdown } from "./assembler";
export { ALL_SECTIONS, getLevelSections } from "./sections";
export type { SectionDefinition } from "./sections";
