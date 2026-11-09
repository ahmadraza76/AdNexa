export const backendBaseUrl = (process.env.ADNEXA_API_URL || "http://localhost:8000").replace(/\/$/, "");

export async function backendFetch(path: string, init?: RequestInit) {
  return fetch(`${backendBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}
