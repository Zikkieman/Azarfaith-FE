import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin, Repeat2, ShieldCheck } from "lucide-react";
import { formatMoney, type Campaign, type Org } from "@/lib/catalog";
import { progressPercent } from "@/lib/discovery";

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <ShieldCheck className="h-3.5 w-3.5" /> Verified
    </span>
  );
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const percent = progressPercent(campaign.raised, campaign.goal);
  return (
    <Link
      to="/campaign/$id"
      params={{ id: campaign.id }}
      className="public-panel group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] bg-stone-100">
        {campaign.cover && (
          <img src={campaign.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-medium">
          {campaign.mode === "ongoing" ? "Ongoing support" : campaign.faithCategory}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {campaign.location}
        </p>
        <h3 className="mb-4 line-clamp-2 text-lg font-semibold leading-snug">{campaign.title}</h3>
        <div className="mt-auto">
          {percent !== null && (
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-orange-400" style={{ width: `${percent}%` }} />
            </div>
          )}
          <div className="flex justify-between gap-3 text-sm">
            <strong>{formatMoney(campaign.raised)}</strong>
            <span className="text-muted-foreground">
              {percent === null ? <Repeat2 className="h-4 w-4" /> : `${percent}% funded`}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {campaign.donors} supporters
            {campaign.goal ? ` · ${formatMoney(campaign.goal)} goal` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function OrganizationCard({ organization }: { organization: Org }) {
  return (
    <Link
      to="/org/$id"
      params={{ id: organization.id }}
      className="public-panel group overflow-hidden"
    >
      <div className="aspect-[16/9] bg-stone-100">
        {organization.photos[0] && (
          <img
            src={organization.photos[0]}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="p-5">
        <VerifiedBadge />
        <h3 className="mt-3 text-lg font-semibold">{organization.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{organization.tagline}</p>
        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
          <span>{organization.location}</span>
          <ArrowUpRight className="h-4 w-4 text-orange-500" />
        </div>
      </div>
    </Link>
  );
}
