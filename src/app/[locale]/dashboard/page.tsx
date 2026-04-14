import { redirect } from "next/navigation";

function buildRedirectTarget(
  basePath: string,
  params: Record<string, string | string[] | undefined>
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      query.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry.length > 0) {
          query.append(key, entry);
        }
      }
    }
  }

  const suffix = query.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const targetBase = projectId ? "/control" : "/my-register";

  redirect(buildRedirectTarget(targetBase, params));
}
