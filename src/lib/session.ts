/** Only same-site paths are allowed back after authentication. */
export function safeRedirect(target: unknown, fallback = "/dashboard") {
  return typeof target === "string" && target.startsWith("/") && !target.startsWith("//")
    ? target
    : fallback;
}
