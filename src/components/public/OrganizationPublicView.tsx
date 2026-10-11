import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Calendar, MapPin } from "lucide-react";
import { formatMoney, type Org, type Campaign } from "@/lib/catalog";
import { isPublished } from "@/lib/discovery";
import { PublicShell } from "./PublicShell";
import { PhotoGallery } from "./PhotoGallery";
import { CampaignCard, VerifiedBadge } from "./CatalogCards";
import { GiveBox } from "./GiveBox";
import { ShareCause } from "./ShareCause";

export function OrganizationPublicView({
  organization,
  authenticated,
  isOwner,
  onManage,
}: {
  organization: Org & { campaigns: Campaign[] };
  authenticated: boolean;
  isOwner: boolean;
  onManage: () => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const published = isPublished(organization);
  const campaigns = organization.campaigns.filter(isPublished);
  const selected = campaigns.find((campaign) => campaign.id === selectedId) ?? campaigns[0];
  return (
    <PublicShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link to="/discover" className="text-sm text-muted-foreground">
          ← Back to discover
        </Link>
        {isOwner && (
          <button className="public-button-outline" onClick={onManage}>
            Manage organization
          </button>
        )}
      </div>
      <PhotoGallery photos={organization.photos} title={organization.name} panoramic />
      <header className="py-8 md:py-10">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
            {organization.category === "other"
              ? organization.otherCategoryLabel || "Other ministry"
              : organization.category}
          </span>
          {published ? (
            <VerifiedBadge />
          ) : (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              {organization.isDraft
                ? "Draft"
                : organization.reviewAction === "rejected"
                  ? "Not approved"
                  : "Awaiting review"}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{organization.name}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {organization.tagline}
        </p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {organization.location}
          </span>
          {organization.founded && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Est. {organization.founded}
            </span>
          )}
          {organization.denomination && <span>{organization.denomination}</span>}
        </div>
      </header>
      {published && selected && (
        <a
          href={`#give-${selected.id}`}
          className="public-button mb-6 w-full justify-center lg:hidden"
        >
          Support this organization
        </a>
      )}
      {!published && (
        <div role="status" className="mb-8 rounded-xl bg-amber-50 p-5 text-sm text-amber-900">
          This organization isn't public yet.{" "}
          {organization.reviewReason ||
            "Once approved, donors will be able to discover and support its campaigns."}
        </div>
      )}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-12">
        <div className="min-w-0">
          <div className="grid grid-cols-3 gap-3 border-y border-stone-100 py-6">
            <div>
              <strong className="block text-lg md:text-2xl">
                {formatMoney(organization.totalReceived)}
              </strong>
              <span className="mt-1 block text-xs text-muted-foreground">Total received</span>
            </div>
            <div>
              <strong className="block text-lg md:text-2xl">{campaigns.length}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">Published campaigns</span>
            </div>
            <div>
              <strong className="block text-lg md:text-2xl">{organization.supporters}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">Campaign supporters</span>
            </div>
          </div>
          <section className="mt-8">
            <h2 className="text-xl font-semibold">About our mission</h2>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
              {organization.bio}
            </p>
          </section>
          {organization.links.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Find us online</h2>
              <ul className="mt-3 space-y-3">
                {organization.links
                  .filter((url) => /^https?:\/\//i.test(url))
                  .map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-orange-600 underline underline-offset-4"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
              </ul>
            </section>
          )}
          <section className="mt-10">
            <h2 className="text-xl font-semibold">Support our campaigns</h2>
            {campaigns.length ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {campaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="public-panel mt-5 p-6 text-sm text-muted-foreground">
                No campaigns are open for donations yet.
                {isOwner && (
                  <>
                    {" "}
                    <Link to="/create" className="text-orange-600 underline">
                      Create a campaign
                    </Link>{" "}
                    or use Manage organization to review your submissions.
                  </>
                )}
              </div>
            )}
          </section>
        </div>
        <aside className="space-y-6 lg:sticky lg:top-24">
          {selected && published ? (
            <>
              {campaigns.length > 1 && (
                <div>
                  <label htmlFor="organization-campaign" className="mb-2 block text-sm font-medium">
                    Choose a campaign to support
                  </label>
                  <select
                    id="organization-campaign"
                    className="public-input"
                    value={selected.id}
                    onChange={(event) => setSelectedId(event.target.value)}
                  >
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <GiveBox key={selected.id} campaign={selected} authenticated={authenticated} />
            </>
          ) : (
            <div className="public-panel p-6">
              <h2 className="text-lg font-semibold">Support this organization</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Giving will be available when an approved campaign is published here.
              </p>
            </div>
          )}
          <section className="public-panel p-6">
            <h2 className="mb-4 font-semibold">Share our mission</h2>
            <ShareCause path={`/org/${organization.id}`} title={organization.name} />
          </section>
        </aside>
      </div>
    </PublicShell>
  );
}
