import { Link, createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/pages/PageLayout";
import { pageMap } from "@/content";

function pageTitle(title: string) {
  return title.endsWith("AzarFaith") ? title : `${title} — AzarFaith`;
}

export const Route = createFileRoute("/$page")({
  head: ({ params }) => {
    const page = pageMap[params.page];
    return {
      meta: [
        { title: page ? pageTitle(page.title) : "Page not found — AzarFaith" },
        {
          name: "description",
          content: page
            ? page.lead
            : "AzarFaith connects donors to churches, missionaries, orphanages, and faith-based schools across Nigeria.",
        },
      ],
    };
  },
  component: ContentPage,
});

function ContentPage() {
  const { page: slug } = Route.useParams();
  const page = pageMap[slug];

  if (!page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center">
        <p className="font-display text-[clamp(56px,10vw,120px)] leading-none text-[#130E30]">
          404
        </p>
        <p className="max-w-md font-gsf text-base leading-[25.6px] text-[#4A4660]">
          That page does not exist yet. Head back to the homepage or browse open campaigns.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border-2 border-black bg-[#130E30] px-[22px] py-3 font-gsf text-base text-[#EFF2E5] transition-opacity hover:opacity-90"
          >
            Go home
          </Link>
          <Link
            to="/discover"
            className="inline-flex items-center justify-center rounded-full border border-[#130E30] px-[22px] py-3 font-gsf text-base text-[#130E30] transition-colors hover:bg-[#130E30]/5"
          >
            Browse causes
          </Link>
        </div>
      </div>
    );
  }

  return <PageLayout page={page} />;
}
