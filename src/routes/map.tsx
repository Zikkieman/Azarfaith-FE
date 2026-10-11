import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public/PublicShell";
import { OpenGiving } from "@/components/public/OpenGiving";
export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Open giving across Nigeria | AzarFaith" }] }),
  component: () => (
    <PublicShell>
      <OpenGiving />
    </PublicShell>
  ),
});
