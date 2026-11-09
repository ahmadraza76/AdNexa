export const backendBaseUrl = (process.env.ADNEXA_API_URL || "http://localhost:8000").replace(/\/$/, "");

export async function backendFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${backendBaseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
