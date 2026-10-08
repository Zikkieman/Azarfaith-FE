import { createFileRoute } from "@tanstack/react-router";
import { OpenGiving } from "@/components/map/OpenGiving";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Open giving: watch gifts land across Nigeria — AzarFaith" },
      {
        name: "description",
        content:
          "A live map of where verified churches, missions, orphanages and schools are receiving gifts on AzarFaith.",
      },
    ],
  }),
  component: OpenGiving,
});
