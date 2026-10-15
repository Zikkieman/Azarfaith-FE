export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "") || "http://localhost:1000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const data = (await response.json().catch(() => null)) as { message?: unknown } | null;

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.filter((item): item is string => typeof item === "string").join(" ")
          : "Request failed";
    throw new ApiError(message || "Request failed", response.status);
  }

  return data as T;
}

/**
 * Temporary compatibility for screens awaiting their endpoint migration. It deliberately does
 * not delay rendering; real screens use apiFetch instead.
 */
export function simulateNetwork() {
  return Promise.resolve();
}

/** Shared pending options for route loaders and live API queries. */
export const pending = { pendingMs: 120, pendingMinMs: 450 } as const;
