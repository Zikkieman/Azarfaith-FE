/** Only same-site paths are allowed back after authentication. */
export function safeRedirect(target: unknown, fallback = "/dashboard") {
  return typeof target === "string" && target.startsWith("/") && !target.startsWith("//")
    ? target
    : fallback;
}

/** Prevent an auth guard from treating the login screen itself as a return destination. */
export function loginRedirect(target: unknown, fallback = "/dashboard") {
  const destination = safeRedirect(target, fallback);
  return destination === "/login" || destination.startsWith("/login?")
    ? fallback
    : destination;
}
