import { z } from 'zod';

import { buildPublicAppUrl } from '@/lib/app-url';
import { createUseCaseOrigin } from '@/lib/register-first/migration';
import { buildScopedUseCaseDetailHref } from '@/lib/navigation/workspace-scope';
import {
  createUseCaseCardV11Draft,
  parseUseCaseCard,
} from '@/lib/register-first/schema';
import {
  generateGlobalUseCaseId,
  generatePublicHashId,
} from '@/lib/register-first/id-generation';
import type {
  CaptureInput,
  UseCaseCard,
} from '@/lib/register-first/types';

const documentationTypeSchema = z.enum(['application', 'process', 'workflow']);
const usageContextSchema = z.enum([
  'INTERNAL_ONLY',
  'EMPLOYEES',
  'CUSTOMERS',
  'APPLICANTS',
  'PUBLIC',
]);
const decisionInfluenceSchema = z.enum([
  'ASSISTANCE',
  'PREPARATION',
  'AUTOMATED',
]);
const dataCategorySchema = z.enum([
  'NO_PERSONAL_DATA',
  'PERSONAL_DATA',
  'SPECIAL_PERSONAL',
  'INTERNAL_CONFIDENTIAL',
  'PUBLIC_DATA',
  'HEALTH_DATA',
  'BIOMETRIC_DATA',
  'POLITICAL_RELIGIOUS',
  'OTHER_SENSITIVE',
]);
const connectionModeSchema = z.enum([
  'MANUAL_SEQUENCE',
  'SEMI_AUTOMATED',
  'FULLY_AUTOMATED',
]);

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function trimToLength(value: string, maxLength: number): string {
  const normalized = value.trim();
  return normalized.length > maxLength
    ? normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd() + '…'
    : normalized;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
}

const studioUseCaseManifestSchema = z
  .object({
    documentationType: documentationTypeSchema,
    title: z.string().trim().min(3).max(300),
    slug: z.string().trim().min(1).max(120).optional(),
    summary: z.string().trim().min(1).max(500).optional(),
    purpose: z.string().trim().min(3).max(500),
    ownerRole: z.string().trim().min(2).max(120),
    contactPersonName: z.string().trim().min(1).max(120).optional().nullable(),
    isCurrentlyResponsible: z.boolean().optional().default(true),
    responsibleParty: z.string().trim().min(1).max(120).optional().nullable(),
    usageContexts: z.array(usageContextSchema).min(1).max(8),
    decisionInfluence: decisionInfluenceSchema.optional(),
    dataCategories: z.array(dataCategorySchema).max(13).optional().default([]),
    systems: z
      .array(
        z.object({
          position: z.number().int().min(1).max(1000),
          name: z.string().trim().min(1).max(300),
          providerType: z.string().trim().min(1).max(80).optional(),
        }),
      )
      .min(1)
      .max(20),
    workflow: z
      .object({
        connectionMode: connectionModeSchema.optional(),
        summary: z.string().trim().min(1).max(300).optional(),
      })
      .optional(),
    triggers: z.array(z.string().trim().min(1).max(200)).optional().default([]),
    steps: z.array(z.string().trim().min(1).max(300)).optional().default([]),
    humansInLoop: z
      .array(z.string().trim().min(1).max(300))
      .optional()
      .default([]),
    risks: z.array(z.string().trim().min(1).max(300)).optional().default([]),
    controls: z
      .array(z.string().trim().min(1).max(300))
      .optional()
      .default([]),
    artifacts: z
      .array(z.string().trim().min(1).max(200))
      .optional()
      .default([]),
    tags: z.array(z.string().trim().min(1).max(60)).optional().default([]),
    capturedBy: z
      .object({
        name: z.string().trim().min(1).max(120).optional().nullable(),
        role: z.string().trim().min(1).max(120).optional().nullable(),
        team: z.string().trim().min(1).max(120).optional().nullable(),
      })
      .optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (
      value.isCurrentlyResponsible === false &&
      !normalizeOptionalText(value.responsibleParty)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'responsibleParty is required when isCurrentlyResponsible is false.',
        path: ['responsibleParty'],
      });
    }
  });

export type StudioUseCaseManifest = z.infer<typeof studioUseCaseManifestSchema>;

export function parseStudioUseCaseManifest(
  input: unknown,
): StudioUseCaseManifest {
  const parsed = studioUseCaseManifestSchema.parse(input);
  return {
    ...parsed,
    systems: [...parsed.systems].sort((left, right) => left.position - right.position),
  };
}

export function buildRegisterCaptureFromManifest(
  manifestInput: StudioUseCaseManifest,
): CaptureInput {
  const manifest = parseStudioUseCaseManifest(manifestInput);
  const [primarySystem, ...additionalSystems] = manifest.systems;

  return {
    purpose: manifest.purpose,
    usageContexts: manifest.usageContexts,
    isCurrentlyResponsible: manifest.isCurrentlyResponsible ?? true,
    responsibleParty:
      manifest.isCurrentlyResponsible === false
        ? normalizeOptionalText(manifest.responsibleParty) ?? manifest.ownerRole
        : null,
    contactPersonName: normalizeOptionalText(manifest.contactPersonName),
    decisionInfluence: manifest.decisionInfluence,
    toolId: primarySystem ? 'other' : undefined,
    toolFreeText: primarySystem?.name,
    workflow:
      additionalSystems.length > 0 || manifest.workflow
        ? {
            additionalSystems: additionalSystems.map((system, index) => ({
              entryId: `workflow_${index + 2}`,
              position: index + 2,
              toolId: 'other',
              toolFreeText: system.name,
            })),
            connectionMode: manifest.workflow?.connectionMode,
            summary:
              normalizeOptionalText(manifest.workflow?.summary) ??
              normalizeOptionalText(manifest.summary) ??
              undefined,
          }
        : undefined,
    dataCategories:
      manifest.dataCategories.length > 0 ? manifest.dataCategories : undefined,
    organisation: normalizeOptionalText(manifest.capturedBy?.team),
  };
}

function buildReviewHints(manifest: StudioUseCaseManifest): string[] {
  const rawHints = [
    manifest.summary ? `Summary: ${manifest.summary}` : null,
    ...manifest.humansInLoop
      .slice(0, 3)
      .map((entry) => `Human oversight: ${entry}`),
    ...manifest.controls.slice(0, 3).map((entry) => `Control: ${entry}`),
    ...manifest.risks.slice(0, 2).map((entry) => `Risk: ${entry}`),
    ...manifest.triggers.slice(0, 2).map((entry) => `Trigger: ${entry}`),
  ]
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => trimToLength(entry, 300));

  return rawHints.slice(0, 20);
}

function buildLabels(manifest: StudioUseCaseManifest) {
  const baseLabels = [
    { key: 'source', value: 'agent_kit_api' },
    { key: 'documentation_type', value: manifest.documentationType },
    {
      key: 'manifest_slug',
      value: manifest.slug?.trim() || slugify(manifest.title),
    },
  ];

  const tagLabels = manifest.tags
    .slice(0, 6)
    .map((tag, index) => ({
      key: `tag_${index + 1}`,
      value: slugify(tag),
    }))
    .filter((entry) => entry.value.length > 0);

  return [...baseLabels, ...tagLabels];
}

function buildEvidences(manifest: StudioUseCaseManifest) {
  return manifest.artifacts.slice(0, 10).map((artifact, index) => ({
    evidenceId: `artifact_${index + 1}`,
    label: trimToLength(artifact, 200),
    type: 'NOTE' as const,
  }));
}

function createAgentKitUseCaseId(now: Date): string {
  return `uc_${now.getTime().toString(36)}_${randomSuffix()}`;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function buildRegisterUseCaseFromManifest(input: {
  manifest: StudioUseCaseManifest;
  createdByUserId: string;
  createdByEmail?: string | null;
  now?: Date;
  useCaseId?: string;
}): UseCaseCard {
  const manifest = parseStudioUseCaseManifest(input.manifest);
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const draft = createUseCaseCardV11Draft(
    buildRegisterCaptureFromManifest(manifest),
    {
      useCaseId: input.useCaseId ?? createAgentKitUseCaseId(now),
      globalUseCaseId: generateGlobalUseCaseId(now),
      publicHashId: generatePublicHashId(),
      now,
      status: 'UNREVIEWED',
      origin: createUseCaseOrigin({
        source: 'import',
        submittedByName:
          normalizeOptionalText(manifest.capturedBy?.name) ??
          normalizeOptionalText(manifest.contactPersonName) ??
          'Agent Kit',
        submittedByEmail: normalizeOptionalText(input.createdByEmail),
        sourceRequestId:
          normalizeOptionalText(manifest.slug) ?? slugify(manifest.title),
        capturedByUserId: input.createdByUserId,
      }),
    },
  );

  return parseUseCaseCard({
    ...draft,
    updatedAt: timestamp,
    reviewHints: buildReviewHints(manifest),
    evidences: buildEvidences(manifest),
    labels: buildLabels(manifest),
    capturedBy: input.createdByUserId,
    capturedByName:
      normalizeOptionalText(manifest.capturedBy?.name) ??
      normalizeOptionalText(input.createdByEmail) ??
      undefined,
    capturedViaCode: true,
  });
}

export function buildSubmittedUseCaseUrls(input: {
  useCaseId: string;
  workspaceId?: string | null;
}) {
  const detailPath = buildScopedUseCaseDetailHref(
    input.useCaseId,
    input.workspaceId,
  );

  return {
    detailPath,
    detailUrl: buildPublicAppUrl(detailPath),
  };
}
