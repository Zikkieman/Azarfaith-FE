import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

/**
 * Prototype session: a first-party cookie set on log in and cleared on log out, readable on the
 * server (route guards during SSR) and in the browser. Replace with real auth (httpOnly session
 * from the API) when the backend exists.
 */
export const SESSION_COOKIE = "af_session";

export const hasSession = createIsomorphicFn()
  .server(() => getCookie(SESSION_COOKIE) === "1")
  .client(() => document.cookie.split("; ").includes(`${SESSION_COOKIE}=1`));

export function writeSession(signedIn: boolean) {
  document.cookie = signedIn
    ? `${SESSION_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
    : `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Only same-site paths are allowed back after log in (no open redirects). */
export function safeRedirect(target: unknown, fallback = "/dashboard") {
  return typeof target === "string" && target.startsWith("/") && !target.startsWith("//")
    ? target
    : fallback;
}
