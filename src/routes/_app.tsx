import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { hasSession } from "@/lib/session";

/** Everything under _app is the signed-in web app. Signed-out visitors are sent to log in. */
export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    if (!hasSession()) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: Outlet,
});
