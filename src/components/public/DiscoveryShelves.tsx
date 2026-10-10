import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { discoverCampaigns, discoverOrganizations } from "@/features/catalog/api";
import type { DiscoveryView } from "@/lib/discovery";
import { CampaignCard, OrganizationCard } from "./CatalogCards";

export function DiscoveryShelves({ onView }: { onView: (view: DiscoveryView | "orgs") => void }) {
  const urgent = useQuery({
    queryKey: ["campaigns", "discover", "featured"],
    queryFn: () => discoverCampaigns({ view: "urgent", sort: "urgent", pageSize: 3 }),
  });
  const ongoing = useQuery({
    queryKey: ["campaigns", "discover", "ongoing-shelf"],
    queryFn: () => discoverCampaigns({ view: "regular", sort: "newest", pageSize: 3 }),
  });
  const organizations = useQuery({
    queryKey: ["organizations", "discover", "shelf"],
    queryFn: () => discoverOrganizations({ pageSize: 3 }),
  });
  const featured = urgent.data?.items[0];
  return (
    <div className="mt-8 space-y-9">
      {featured && (
        <Link
          to="/campaign/$id"
          params={{ id: featured.id }}
          className="grid overflow-hidden rounded-2xl bg-[#fff4e9] md:grid-cols-2"
        >
          <div className="flex flex-col items-start justify-center p-7 md:p-9">
            <span className="mb-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-orange-700">
              Featured · Urgent need
            </span>
            <h2 className="text-2xl font-semibold leading-tight md:text-3xl">{featured.title}</h2>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {featured.story}
            </p>
            <span className="public-button mt-6">
              See the campaign <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <div className="min-h-56 bg-orange-100">
            {featured.cover && (
              <img src={featured.cover} alt="" className="h-full max-h-96 w-full object-cover" />
            )}
          </div>
        </Link>
      )}
      {!!ongoing.data?.items.length && (
        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Keep good work going</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Causes that need steady, ongoing support.
              </p>
            </div>
            <button className="text-sm text-orange-600" onClick={() => onView("regular")}>
              View all
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ongoing.data.items.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      )}
      {!!organizations.data?.items.length && (
        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Meet the organizations</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Verified communities behind the work.
              </p>
            </div>
            <button className="text-sm text-orange-600" onClick={() => onView("orgs")}>
              View all
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.data.items.map((organization) => (
              <OrganizationCard key={organization.id} organization={organization} />
            ))}
          </div>
        </section>
      )}
      {[urgent, ongoing, organizations].some((query) => query.isError) && (
        <p role="status" className="text-sm text-muted-foreground">
          Some featured collections couldn't load. You can still browse the results below.
          <button
            className="ml-2 text-orange-600 underline"
            onClick={() => {
              void urgent.refetch();
              void ongoing.refetch();
              void organizations.refetch();
            }}
          >
            Retry collections
          </button>
        </p>
      )}
    </div>
  );
}
