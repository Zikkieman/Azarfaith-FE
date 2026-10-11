import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/public/LandingPage";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AzarFaith | Give to faith-based causes in Nigeria" },
      {
        name: "description",
        content:
          "Support verified churches, missions, orphanages and faith-based schools in Nigeria. Give once or manage ongoing support.",
      },
    ],
  }),
  component: LandingPage,
});
