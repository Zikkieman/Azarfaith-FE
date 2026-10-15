import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Pathless visual route group. Individual workspace routes opt into RequireUser. */
export const Route = createFileRoute("/_app")({
  component: Outlet,
});
