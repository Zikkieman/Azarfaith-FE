/**
 * Stand-in for network latency while the app runs on mock data (lib/mock.ts + lib/store.ts).
 * Route loaders await this so the skeletons show on first visit exactly as they will once
 * real API calls replace it. Server renders skip the delay so SSR stays instant.
 */
export function simulateNetwork(ms = 550) {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Shared pending options so every app route shows its skeleton the same way. */
export const pending = { pendingMs: 120, pendingMinMs: 450 } as const;
