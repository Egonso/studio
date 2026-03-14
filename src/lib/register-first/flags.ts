export interface RegisterFirstFeatureFlags {
  enabled: boolean;
  hybridEntry: boolean;
  stickyLauncher: boolean;
  proofGate: boolean;
  standaloneMode: boolean;
  multisystemCapture: boolean;
  supplierMultisystemCapture: boolean;
  registerDeletion: boolean;
  controlShell: boolean;
  controlKpiHeader: boolean;
  controlMaturityModel: boolean;
  controlActionQueue: boolean;
  controlPortfolioIntelligence: boolean;
  controlIsoAudit: boolean;
  controlPolicyEngine: boolean;
  controlOrgExportCenter: boolean;
  controlUpgradeTriggers: boolean;
  controlAnalytics: boolean;
}

export const registerFirstDefaultFlags: RegisterFirstFeatureFlags =
  Object.freeze({
    enabled: false,
    hybridEntry: false,
    stickyLauncher: false,
    proofGate: false,
    standaloneMode: false,
    multisystemCapture: false,
    supplierMultisystemCapture: false,
    registerDeletion: false,
    controlShell: true,
    controlKpiHeader: true,
    controlMaturityModel: true,
    controlActionQueue: true,
    controlPortfolioIntelligence: false,
    controlIsoAudit: false,
    controlPolicyEngine: false,
    controlOrgExportCenter: false,
    controlUpgradeTriggers: false,
    controlAnalytics: false,
  });

export const REGISTER_FIRST_FLAG_KEYS = Object.freeze({
  enabled: ["NEXT_PUBLIC_REGISTER_FIRST_ENABLED", "REGISTER_FIRST_ENABLED"],
  hybridEntry: [
    "NEXT_PUBLIC_REGISTER_FIRST_HYBRID_ENTRY",
    "REGISTER_FIRST_HYBRID_ENTRY",
  ],
  stickyLauncher: [
    "NEXT_PUBLIC_REGISTER_FIRST_STICKY_LAUNCHER",
    "REGISTER_FIRST_STICKY_LAUNCHER",
  ],
  proofGate: ["NEXT_PUBLIC_REGISTER_FIRST_PROOF_GATE", "REGISTER_FIRST_PROOF_GATE"],
  standaloneMode: [
    "NEXT_PUBLIC_REGISTER_FIRST_STANDALONE",
    "REGISTER_FIRST_STANDALONE",
  ],
  multisystemCapture: [
    "NEXT_PUBLIC_REGISTER_FIRST_MULTISYSTEM_CAPTURE",
    "REGISTER_FIRST_MULTISYSTEM_CAPTURE",
  ],
  supplierMultisystemCapture: [
    "NEXT_PUBLIC_REGISTER_FIRST_SUPPLIER_MULTISYSTEM_CAPTURE",
    "REGISTER_FIRST_SUPPLIER_MULTISYSTEM_CAPTURE",
  ],
  registerDeletion: [
    "NEXT_PUBLIC_REGISTER_FIRST_REGISTER_DELETION",
    "REGISTER_FIRST_REGISTER_DELETION",
  ],
  controlShell: [
    "NEXT_PUBLIC_CONTROL_SHELL_ENABLED",
    "CONTROL_SHELL_ENABLED",
  ],
  controlKpiHeader: [
    "NEXT_PUBLIC_CONTROL_KPI_HEADER_ENABLED",
    "CONTROL_KPI_HEADER_ENABLED",
  ],
  controlMaturityModel: [
    "NEXT_PUBLIC_CONTROL_MATURITY_MODEL_ENABLED",
    "CONTROL_MATURITY_MODEL_ENABLED",
  ],
  controlActionQueue: [
    "NEXT_PUBLIC_CONTROL_ACTION_QUEUE_ENABLED",
    "CONTROL_ACTION_QUEUE_ENABLED",
  ],
  controlPortfolioIntelligence: [
    "NEXT_PUBLIC_CONTROL_PORTFOLIO_INTELLIGENCE_ENABLED",
    "CONTROL_PORTFOLIO_INTELLIGENCE_ENABLED",
  ],
  controlIsoAudit: [
    "NEXT_PUBLIC_CONTROL_ISO_AUDIT_ENABLED",
    "CONTROL_ISO_AUDIT_ENABLED",
  ],
  controlPolicyEngine: [
    "NEXT_PUBLIC_CONTROL_POLICY_ENGINE_ENABLED",
    "CONTROL_POLICY_ENGINE_ENABLED",
  ],
  controlOrgExportCenter: [
    "NEXT_PUBLIC_CONTROL_ORG_EXPORT_CENTER_ENABLED",
    "CONTROL_ORG_EXPORT_CENTER_ENABLED",
  ],
  controlUpgradeTriggers: [
    "NEXT_PUBLIC_CONTROL_UPGRADE_TRIGGERS_ENABLED",
    "CONTROL_UPGRADE_TRIGGERS_ENABLED",
  ],
  controlAnalytics: [
    "NEXT_PUBLIC_CONTROL_ANALYTICS_ENABLED",
    "CONTROL_ANALYTICS_ENABLED",
  ],
});

function parseBooleanFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

/**
 * IMPORTANT: Next.js/Turbopack can only inline-replace STATIC references like
 * `process.env.NEXT_PUBLIC_FOO`. Dynamic access via `process.env[variable]`
 * is NOT replaced and returns `undefined` on the client side.
 *
 * Therefore the default path uses literal property access for each flag.
 * An optional `env` override is supported for tests.
 */
export function getRegisterFirstFeatureFlags(
  env?: Record<string, string | undefined>
): RegisterFirstFeatureFlags {
  if (env) {
    // Test path: dynamic lookup against the provided env object
    return {
      enabled: parseBooleanFlag(env["NEXT_PUBLIC_REGISTER_FIRST_ENABLED"] ?? env["REGISTER_FIRST_ENABLED"]) || registerFirstDefaultFlags.enabled,
      hybridEntry: parseBooleanFlag(env["NEXT_PUBLIC_REGISTER_FIRST_HYBRID_ENTRY"] ?? env["REGISTER_FIRST_HYBRID_ENTRY"]) || registerFirstDefaultFlags.hybridEntry,
      stickyLauncher: parseBooleanFlag(env["NEXT_PUBLIC_REGISTER_FIRST_STICKY_LAUNCHER"] ?? env["REGISTER_FIRST_STICKY_LAUNCHER"]) || registerFirstDefaultFlags.stickyLauncher,
      proofGate: parseBooleanFlag(env["NEXT_PUBLIC_REGISTER_FIRST_PROOF_GATE"] ?? env["REGISTER_FIRST_PROOF_GATE"]) || registerFirstDefaultFlags.proofGate,
      standaloneMode: parseBooleanFlag(env["NEXT_PUBLIC_REGISTER_FIRST_STANDALONE"] ?? env["REGISTER_FIRST_STANDALONE"]) || registerFirstDefaultFlags.standaloneMode,
      multisystemCapture: parseBooleanFlag(env["NEXT_PUBLIC_REGISTER_FIRST_MULTISYSTEM_CAPTURE"] ?? env["REGISTER_FIRST_MULTISYSTEM_CAPTURE"]) || registerFirstDefaultFlags.multisystemCapture,
      supplierMultisystemCapture: parseBooleanFlag(env["NEXT_PUBLIC_REGISTER_FIRST_SUPPLIER_MULTISYSTEM_CAPTURE"] ?? env["REGISTER_FIRST_SUPPLIER_MULTISYSTEM_CAPTURE"]) || registerFirstDefaultFlags.supplierMultisystemCapture,
      registerDeletion: parseBooleanFlag(env["NEXT_PUBLIC_REGISTER_FIRST_REGISTER_DELETION"] ?? env["REGISTER_FIRST_REGISTER_DELETION"]) || registerFirstDefaultFlags.registerDeletion,
      controlShell: parseBooleanFlag(env["NEXT_PUBLIC_CONTROL_SHELL_ENABLED"] ?? env["CONTROL_SHELL_ENABLED"]) || registerFirstDefaultFlags.controlShell,
      controlKpiHeader: parseBooleanFlag(env["NEXT_PUBLIC_CONTROL_KPI_HEADER_ENABLED"] ?? env["CONTROL_KPI_HEADER_ENABLED"]) || registerFirstDefaultFlags.controlKpiHeader,
      controlMaturityModel: parseBooleanFlag(env["NEXT_PUBLIC_CONTROL_MATURITY_MODEL_ENABLED"] ?? env["CONTROL_MATURITY_MODEL_ENABLED"]) || registerFirstDefaultFlags.controlMaturityModel,
      controlActionQueue: parseBooleanFlag(env["NEXT_PUBLIC_CONTROL_ACTION_QUEUE_ENABLED"] ?? env["CONTROL_ACTION_QUEUE_ENABLED"]) || registerFirstDefaultFlags.controlActionQueue,
      controlPortfolioIntelligence: parseBooleanFlag(env["NEXT_PUBLIC_CONTROL_PORTFOLIO_INTELLIGENCE_ENABLED"] ?? env["CONTROL_PORTFOLIO_INTELLIGENCE_ENABLED"]) || registerFirstDefaultFlags.controlPortfolioIntelligence,
      controlIsoAudit: parseBooleanFlag(env["NEXT_PUBLIC_CONTROL_ISO_AUDIT_ENABLED"] ?? env["CONTROL_ISO_AUDIT_ENABLED"]) || registerFirstDefaultFlags.controlIsoAudit,
      controlPolicyEngine: parseBooleanFlag(env["NEXT_PUBLIC_CONTROL_POLICY_ENGINE_ENABLED"] ?? env["CONTROL_POLICY_ENGINE_ENABLED"]) || registerFirstDefaultFlags.controlPolicyEngine,
      controlOrgExportCenter: parseBooleanFlag(env["NEXT_PUBLIC_CONTROL_ORG_EXPORT_CENTER_ENABLED"] ?? env["CONTROL_ORG_EXPORT_CENTER_ENABLED"]) || registerFirstDefaultFlags.controlOrgExportCenter,
      controlUpgradeTriggers: parseBooleanFlag(env["NEXT_PUBLIC_CONTROL_UPGRADE_TRIGGERS_ENABLED"] ?? env["CONTROL_UPGRADE_TRIGGERS_ENABLED"]) || registerFirstDefaultFlags.controlUpgradeTriggers,
      controlAnalytics: parseBooleanFlag(env["NEXT_PUBLIC_CONTROL_ANALYTICS_ENABLED"] ?? env["CONTROL_ANALYTICS_ENABLED"]) || registerFirstDefaultFlags.controlAnalytics,
    };
  }

  // Production/dev path: static process.env access so Next.js can inline-replace
  return {
    enabled:
      parseBooleanFlag(process.env.NEXT_PUBLIC_REGISTER_FIRST_ENABLED) ||
      registerFirstDefaultFlags.enabled,
    hybridEntry:
      parseBooleanFlag(process.env.NEXT_PUBLIC_REGISTER_FIRST_HYBRID_ENTRY) ||
      registerFirstDefaultFlags.hybridEntry,
    stickyLauncher:
      parseBooleanFlag(process.env.NEXT_PUBLIC_REGISTER_FIRST_STICKY_LAUNCHER) ||
      registerFirstDefaultFlags.stickyLauncher,
    proofGate:
      parseBooleanFlag(process.env.NEXT_PUBLIC_REGISTER_FIRST_PROOF_GATE) ||
      registerFirstDefaultFlags.proofGate,
    standaloneMode:
      parseBooleanFlag(process.env.NEXT_PUBLIC_REGISTER_FIRST_STANDALONE) ||
      registerFirstDefaultFlags.standaloneMode,
    multisystemCapture:
      parseBooleanFlag(process.env.NEXT_PUBLIC_REGISTER_FIRST_MULTISYSTEM_CAPTURE) ||
      registerFirstDefaultFlags.multisystemCapture,
    supplierMultisystemCapture:
      parseBooleanFlag(process.env.NEXT_PUBLIC_REGISTER_FIRST_SUPPLIER_MULTISYSTEM_CAPTURE) ||
      registerFirstDefaultFlags.supplierMultisystemCapture,
    registerDeletion:
      parseBooleanFlag(process.env.NEXT_PUBLIC_REGISTER_FIRST_REGISTER_DELETION) ||
      registerFirstDefaultFlags.registerDeletion,
    controlShell:
      parseBooleanFlag(process.env.NEXT_PUBLIC_CONTROL_SHELL_ENABLED) ||
      registerFirstDefaultFlags.controlShell,
    controlKpiHeader:
      parseBooleanFlag(process.env.NEXT_PUBLIC_CONTROL_KPI_HEADER_ENABLED) ||
      registerFirstDefaultFlags.controlKpiHeader,
    controlMaturityModel:
      parseBooleanFlag(process.env.NEXT_PUBLIC_CONTROL_MATURITY_MODEL_ENABLED) ||
      registerFirstDefaultFlags.controlMaturityModel,
    controlActionQueue:
      parseBooleanFlag(process.env.NEXT_PUBLIC_CONTROL_ACTION_QUEUE_ENABLED) ||
      registerFirstDefaultFlags.controlActionQueue,
    controlPortfolioIntelligence:
      parseBooleanFlag(process.env.NEXT_PUBLIC_CONTROL_PORTFOLIO_INTELLIGENCE_ENABLED) ||
      registerFirstDefaultFlags.controlPortfolioIntelligence,
    controlIsoAudit:
      parseBooleanFlag(process.env.NEXT_PUBLIC_CONTROL_ISO_AUDIT_ENABLED) ||
      registerFirstDefaultFlags.controlIsoAudit,
    controlPolicyEngine:
      parseBooleanFlag(process.env.NEXT_PUBLIC_CONTROL_POLICY_ENGINE_ENABLED) ||
      registerFirstDefaultFlags.controlPolicyEngine,
    controlOrgExportCenter:
      parseBooleanFlag(process.env.NEXT_PUBLIC_CONTROL_ORG_EXPORT_CENTER_ENABLED) ||
      registerFirstDefaultFlags.controlOrgExportCenter,
    controlUpgradeTriggers:
      parseBooleanFlag(process.env.NEXT_PUBLIC_CONTROL_UPGRADE_TRIGGERS_ENABLED) ||
      registerFirstDefaultFlags.controlUpgradeTriggers,
    controlAnalytics:
      parseBooleanFlag(process.env.NEXT_PUBLIC_CONTROL_ANALYTICS_ENABLED) ||
      registerFirstDefaultFlags.controlAnalytics,
  };
}

export const registerFirstFlags = getRegisterFirstFeatureFlags();
