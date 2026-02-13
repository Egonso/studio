export interface RegisterFirstFeatureFlags {
  enabled: boolean;
  hybridEntry: boolean;
  stickyLauncher: boolean;
  proofGate: boolean;
  standaloneMode: boolean;
}

export const registerFirstDefaultFlags: RegisterFirstFeatureFlags =
  Object.freeze({
    enabled: false,
    hybridEntry: false,
    stickyLauncher: false,
    proofGate: false,
    standaloneMode: false,
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
  };
}

export const registerFirstFlags = getRegisterFirstFeatureFlags();
