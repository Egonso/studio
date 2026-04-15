import {
  registerService,
  resolveDataCategories,
  resolveDecisionInfluence,
  resolveUseCaseSystemEntries,
  type Register,
  type RegisterScopeContext,
  type RegisterService,
  type UseCaseCard,
} from '@/lib/register-first';

import {
  DraftAssistContextSchema,
  trimToLength,
  type DraftAssistContext,
} from './types';

export const DEFAULT_DRAFT_ASSIST_USE_CASE_LIMIT = 6;

export type DraftAssistContextService = Pick<
  RegisterService,
  'listRegisters' | 'getActiveRegister' | 'getFirstRegister' | 'listUseCases'
>;

export interface ResolveDraftAssistContextOptions {
  registerId?: string | null;
  scopeContext?: RegisterScopeContext | null;
  service?: DraftAssistContextService;
  useCaseLimit?: number;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeUseCaseLimit(limit?: number): number {
  if (
    typeof limit !== 'number' ||
    !Number.isFinite(limit) ||
    limit < 1
  ) {
    return DEFAULT_DRAFT_ASSIST_USE_CASE_LIMIT;
  }

  return Math.max(1, Math.min(8, Math.floor(limit)));
}

function buildPolicyTitles(register: Register): string[] {
  const titles: string[] = [];
  const orgSettings = register.orgSettings;

  if (orgSettings?.aiPolicy?.url) {
    titles.push('AI Policy');
  }

  if (orgSettings?.incidentProcess?.url) {
    titles.push('Incident Process');
  }

  if (
    orgSettings?.rolesFramework?.docUrl ||
    orgSettings?.rolesFramework?.booleanDefined
  ) {
    titles.push('Roles Framework');
  }

  if (orgSettings?.reviewStandard) {
    titles.push('Review Standard');
  }

  if (orgSettings?.reviewCycle?.type) {
    titles.push('Review Cycle');
  }

  return titles.slice(0, 8);
}

function toDraftAssistUsageContext(
  value: UseCaseCard['usageContexts'][number],
): DraftAssistContext['existingUseCases'][number]['usageContexts'][number] | null {
  switch (value) {
    case 'INTERNAL_ONLY':
    case 'EMPLOYEES':
    case 'CUSTOMERS':
    case 'APPLICANTS':
    case 'PUBLIC':
      return value;
    case 'EMPLOYEE_FACING':
      return 'EMPLOYEES';
    case 'CUSTOMER_FACING':
      return 'CUSTOMERS';
    case 'EXTERNAL_PUBLIC':
      return 'PUBLIC';
    default:
      return null;
  }
}

function toDraftAssistDataCategory(
  value: ReturnType<typeof resolveDataCategories>[number],
): DraftAssistContext['existingUseCases'][number]['dataCategories'][number] | null {
  switch (value) {
    case 'NO_PERSONAL_DATA':
    case 'PERSONAL_DATA':
    case 'SPECIAL_PERSONAL':
    case 'INTERNAL_CONFIDENTIAL':
    case 'PUBLIC_DATA':
    case 'HEALTH_DATA':
    case 'BIOMETRIC_DATA':
    case 'POLITICAL_RELIGIOUS':
    case 'OTHER_SENSITIVE':
      return value;
    case 'NONE':
      return 'NO_PERSONAL_DATA';
    case 'INTERNAL':
      return 'INTERNAL_CONFIDENTIAL';
    case 'PERSONAL':
      return 'PERSONAL_DATA';
    case 'SENSITIVE':
      return 'SPECIAL_PERSONAL';
    default:
      return null;
  }
}

function summarizeUseCase(
  card: UseCaseCard,
): DraftAssistContext['existingUseCases'][number] {
  const primarySystem =
    resolveUseCaseSystemEntries(card)[0]?.displayName ?? null;

  return {
    useCaseId: card.useCaseId,
    purpose: trimToLength(card.purpose, 300) ?? card.purpose,
    status: card.status,
    primarySystem: trimToLength(primarySystem, 160) ?? null,
    usageContexts: card.usageContexts
      .map(toDraftAssistUsageContext)
      .filter(
        (
          value,
        ): value is DraftAssistContext['existingUseCases'][number]['usageContexts'][number] =>
          value !== null,
      )
      .slice(0, 8),
    decisionInfluence: resolveDecisionInfluence(card) ?? null,
    dataCategories: resolveDataCategories(card)
      .map(toDraftAssistDataCategory)
      .filter(
        (
          value,
        ): value is DraftAssistContext['existingUseCases'][number]['dataCategories'][number] =>
          value !== null,
      )
      .slice(0, 8),
  };
}

async function resolveRegister(
  service: DraftAssistContextService,
  options: ResolveDraftAssistContextOptions,
): Promise<Register | null> {
  const explicitRegisterId = normalizeOptionalText(options.registerId);

  if (explicitRegisterId) {
    const registers = await service.listRegisters(options.scopeContext);
    const register =
      registers.find((entry) => entry.registerId === explicitRegisterId) ?? null;

    if (!register) {
      throw new Error(
        `Register '${explicitRegisterId}' was not found for Draft Assist context resolution.`,
      );
    }

    return register;
  }

  return (
    (await service.getActiveRegister(options.scopeContext)) ??
    (await service.getFirstRegister(options.scopeContext))
  );
}

export async function resolveDraftAssistContext(
  options: ResolveDraftAssistContextOptions = {},
): Promise<DraftAssistContext | null> {
  const service = options.service ?? registerService;
  const register = await resolveRegister(service, options);

  if (!register) {
    return null;
  }

  const useCases = await service.listUseCases(
    register.registerId,
    {
      includeDeleted: false,
      limit: normalizeUseCaseLimit(options.useCaseLimit),
    },
    options.scopeContext,
  );

  return DraftAssistContextSchema.parse({
    registerId: register.registerId,
    registerName: normalizeOptionalText(register.name),
    organisationName: normalizeOptionalText(
      register.organisationName ?? register.orgSettings?.organisationName,
    ),
    organisationUnit: normalizeOptionalText(register.organisationUnit),
    policyTitles: buildPolicyTitles(register),
    existingUseCaseCount: useCases.length,
    existingUseCases: useCases.map(summarizeUseCase),
  });
}

export function formatDraftAssistContext(
  input: DraftAssistContext | null | undefined,
): string | null {
  if (!input) {
    return null;
  }

  const context = DraftAssistContextSchema.parse(input);
  const lines: string[] = ['Register-Kontext (read-only, gekuerzt):'];

  if (context.registerName) {
    lines.push(`- Register: ${context.registerName}`);
  }

  if (context.organisationName) {
    lines.push(`- Organisation: ${context.organisationName}`);
  }

  if (context.organisationUnit) {
    lines.push(`- Einheit: ${context.organisationUnit}`);
  }

  if (context.policyTitles.length > 0) {
    lines.push(`- Policies: ${context.policyTitles.join(', ')}`);
  }

  if (context.existingUseCases.length > 0) {
    lines.push(
      `- Bestehende Use Cases (${context.existingUseCaseCount} geladen):`,
    );

    for (const useCase of context.existingUseCases) {
      const parts = [
        useCase.purpose,
        `Status=${useCase.status}`,
      ];

      if (useCase.primarySystem) {
        parts.push(`System=${useCase.primarySystem}`);
      }

      if (useCase.usageContexts.length > 0) {
        parts.push(`Kontext=${useCase.usageContexts.join(',')}`);
      }

      if (useCase.decisionInfluence) {
        parts.push(`Einfluss=${useCase.decisionInfluence}`);
      }

      lines.push(`  - ${parts.join(' | ')}`);
    }
  }

  return lines.join('\n');
}
