import { createFileRoute } from "@tanstack/react-router";
import { JosEssay } from "@/components/essay/JosEssay";

export const Route = createFileRoute("/jos")({
  head: () => ({
    meta: [
      { title: "One month in Jos — AzarFaith" },
      {
        name: "description",
        content:
          "Forty-seven children, twenty-seven beds. A month with Grace Harvest Orphanage, followed week by week from the first appeal to the first night.",
      },
      { property: "og:title", content: "One month in Jos" },
      {
        property: "og:description",
        content: "How 47 children got their own beds, followed week by week on AzarFaith.",
      },
    ],
  }),
  component: JosEssay,
});
