const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:1000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});

  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const data = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    const message = data?.message ?? "Request failed";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export async function adminApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, init);
}
