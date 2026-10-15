import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/jos")({
  head: () => ({
    meta: [
      { title: "How giving works — AzarFaith" },
      {
        name: "description",
        content:
          "Learn how AzarFaith helps givers find verified causes and follow campaign updates.",
      },
      { property: "og:title", content: "How giving works" },
      {
        property: "og:description",
        content: "Find verified causes, give with confidence, and follow campaign updates.",
      },
    ],
  }),
  component: () => <Navigate to="/story" />,
});
