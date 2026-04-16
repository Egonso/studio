export type AuthMode = "login" | "signup";
export type LoginMode = AuthMode;
export type AuthIntent = "create_register" | "join_register";

interface SearchParamsReader {
  get(name: string): string | null;
}

export interface AuthRouteOptions {
  mode?: AuthMode | null;
  intent?: AuthIntent | null;
  email?: string | null;
  code?: string | null;
  returnTo?: string | null;
  workspaceInvite?: string | null;
  importUseCase?: string | null;
  sessionId?: string | null;
}

export type LoginRouteOptions = AuthRouteOptions;

function setQueryParam(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined
) {
  const normalizedValue = value?.trim();
  if (normalizedValue) {
    params.set(key, normalizedValue);
  }
}

export function normalizeReturnToPath(
  value: string | null | undefined,
): string | null {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return null;
  }

  if (!normalizedValue.startsWith("/") || normalizedValue.startsWith("//")) {
    return null;
  }

  return normalizedValue;
}

export function readLoginRouteOptions(
  searchParams: SearchParamsReader
): AuthRouteOptions {
  const rawIntent = searchParams.get("intent");

  return {
    mode: searchParams.get("mode") as AuthMode | null,
    intent:
      rawIntent === "create_register" || rawIntent === "join_register"
        ? rawIntent
        : null,
    email: searchParams.get("email"),
    code: searchParams.get("code"),
    returnTo: normalizeReturnToPath(searchParams.get("returnTo")),
    workspaceInvite: searchParams.get("workspaceInvite"),
    importUseCase: searchParams.get("importUseCase"),
    sessionId:
      searchParams.get("session_id") ??
      searchParams.get("checkout_session_id"),
  };
}

export function buildAuthPath(options: AuthRouteOptions = {}): string {
  const params = new URLSearchParams();

  if (options.mode) {
    params.set("mode", options.mode);
  }

  if (options.intent) {
    params.set("intent", options.intent);
  }

  setQueryParam(params, "email", options.email);
  setQueryParam(params, "code", options.code);
  setQueryParam(params, "returnTo", normalizeReturnToPath(options.returnTo));
  setQueryParam(params, "workspaceInvite", options.workspaceInvite);
  setQueryParam(params, "importUseCase", options.importUseCase);
  setQueryParam(params, "session_id", options.sessionId);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function buildLoginPath(options: LoginRouteOptions = {}): string {
  return buildAuthPath(options);
}

export function getInitialAuthMode(
  options: Pick<
    AuthRouteOptions,
    "mode" | "workspaceInvite" | "importUseCase" | "sessionId" | "code"
  >
): AuthMode {
  if (options.mode === "login" || options.mode === "signup") {
    return options.mode;
  }

  if (
    options.workspaceInvite ||
    options.importUseCase ||
    options.sessionId ||
    options.code
  ) {
    return "signup";
  }

  return "signup";
}

export function getInitialLoginMode(
  options: Pick<
    LoginRouteOptions,
    "mode" | "workspaceInvite" | "importUseCase" | "sessionId" | "code"
  >
): LoginMode {
  return getInitialAuthMode(options);
}

export function getInitialAuthIntent(
  options: Pick<AuthRouteOptions, "intent" | "code">
): AuthIntent {
  if (
    options.intent === "create_register" ||
    options.intent === "join_register"
  ) {
    return options.intent;
  }

  if (options.code) {
    return "join_register";
  }

  return "create_register";
}
