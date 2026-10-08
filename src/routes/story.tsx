import { createFileRoute } from "@tanstack/react-router";
import { Story } from "@/components/story/Story";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Stop wondering. Start seeing. — AzarFaith" },
      {
        name: "description",
        content:
          "See how AzarFaith verifies churches, missions and orphanages across Nigeria, and shows you what every gift becomes.",
      },
    ],
  }),
  component: Story,
});
