// Preserve checkout only; never accept an arbitrary redirect from a query string.
export function checkoutReturn(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2000) return undefined;
  if (!/^\/donate\/[A-Za-z0-9_-]+(?:\?[^#]*)?$/.test(value)) return undefined;
  const url = new URL(value, "https://internal.invalid");
  const search = new URLSearchParams();
  for (const key of ["amount", "freq", "recurringGiftId"]) {
    const entry = url.searchParams.get(key);
    if (entry) search.set(key, entry);
  }
  return url.pathname + (search.size ? `?${search}` : "");
}
