export type LoginMode = "login" | "signup";

interface SearchParamsReader {
  get(name: string): string | null;
}

export interface LoginRouteOptions {
  mode?: LoginMode | null;
  email?: string | null;
  code?: string | null;
  workspaceInvite?: string | null;
  importUseCase?: string | null;
  purchase?: boolean;
  sessionId?: string | null;
}

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

export function readLoginRouteOptions(
  searchParams: SearchParamsReader
): LoginRouteOptions {
  return {
    mode: searchParams.get("mode") as LoginMode | null,
    email: searchParams.get("email"),
    code: searchParams.get("code"),
    workspaceInvite: searchParams.get("workspaceInvite"),
    importUseCase: searchParams.get("importUseCase"),
    purchase: searchParams.get("purchase") === "true",
    sessionId: searchParams.get("session_id"),
  };
}

export function buildLoginPath(options: LoginRouteOptions = {}): string {
  const params = new URLSearchParams();

  if (options.mode) {
    params.set("mode", options.mode);
  }

  setQueryParam(params, "email", options.email);
  setQueryParam(params, "code", options.code);
  setQueryParam(params, "workspaceInvite", options.workspaceInvite);
  setQueryParam(params, "importUseCase", options.importUseCase);
  setQueryParam(params, "session_id", options.sessionId);

  if (options.purchase) {
    params.set("purchase", "true");
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

export function getInitialLoginMode(
  options: Pick<
    LoginRouteOptions,
    "mode" | "workspaceInvite" | "importUseCase" | "purchase" | "sessionId"
  >
): LoginMode {
  if (options.mode === "login" || options.mode === "signup") {
    return options.mode;
  }

  if (
    options.workspaceInvite ||
    options.importUseCase ||
    options.purchase ||
    options.sessionId
  ) {
    return "signup";
  }

  return "login";
}
