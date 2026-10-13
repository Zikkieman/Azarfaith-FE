import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";
import { fruitFontsHref } from "@/components/landing/fruit-words";
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
    links: [
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: fruitFontsHref },
    ],
  }),
  component: LandingPage,
});
