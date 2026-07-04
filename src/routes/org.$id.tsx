import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, Heart, MapPin, Repeat2, ShieldCheck, Target } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { PageSpinner } from "@/components/PageSpinner";
import { getOrganization } from "@/features/catalog/api";
import { formatMoney } from "@/lib/catalog";

export const Route = createFileRoute("/org/$id")({
  component: OrgProfile,
});

function OrgProfile() {
  const { id } = Route.useParams();
  const { data: org, isLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: () => getOrganization(id),
  });

  if (!isLoading && !org) throw notFound();
  if (!org) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageSpinner label="Loading organization..." />
      </div>
    );
  }

  const ongoing = org.campaigns.filter((campaign) => campaign.mode === "ongoing");
  const oneTime = org.campaigns.filter((campaign) => campaign.mode === "one-time");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative">
        {org.photos[0] && (
          <div className="h-56 overflow-hidden md:h-72">
            <img src={org.photos[0]} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}
        <div className="relative mx-auto max-w-3xl px-5 pb-8 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">{org.category}</span>
                {org.verificationStatus === "verified" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-trust">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : org.verificationStatus === "pending" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                    Pending review
                  </span>
                ) : null}
              </div>
              <h1 className="font-display text-3xl md:text-4xl">{org.name}</h1>
              <p className="mt-1 text-muted-foreground">{org.tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {org.location}</span>
                {org.founded && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Est. {org.founded}</span>}
                <span>{org.denomination}</span>
              </div>
            </div>
            <div className="flex gap-3">
              {ongoing[0] && (
                <Link to="/campaign/$id" params={{ id: ongoing[0].id }} className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600">
                  <Repeat2 className="h-4 w-4" /> Give monthly
                </Link>
              )}
              {oneTime[0] && (
                <Link to="/campaign/$id" params={{ id: oneTime[0].id }} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted">
                  Give once
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Total received", value: formatMoney(org.totalReceived) },
              { label: "Supporters", value: org.supporters.toLocaleString() },
              { label: "Active campaigns", value: org.campaignCount.toString() },
              { label: "Founded", value: org.founded || "-" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-card p-4 text-center">
                <div className="font-display text-xl">{item.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-12 px-5 pb-16 md:px-8">
        {org.verificationStatus === "pending" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            This organization is pending admin review. The review provision now exists on the backend, and an admin must approve it before it is treated as verified.
          </div>
        )}
        <section>
          <h2 className="mb-3 font-display text-xl">About</h2>
          <p className="leading-relaxed text-muted-foreground">{org.bio}</p>
        </section>

        {org.photos.length > 1 && (
          <section>
            <h2 className="mb-4 font-display text-xl">Gallery</h2>
            <div className="grid grid-cols-3 gap-3">
              {org.photos.map((photo) => (
                <div key={photo} className="aspect-square overflow-hidden rounded-2xl">
                  <img src={photo} alt="" className="h-full w-full object-cover transition duration-300 hover:scale-105" />
                </div>
              ))}
            </div>
          </section>
        )}

        {ongoing.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Repeat2 className="h-5 w-5 text-amber-500" />
              <h2 className="font-display text-xl">Ongoing support</h2>
            </div>
            <div className="space-y-4">
              {ongoing.map((campaign) => (
                <Link key={campaign.id} to="/campaign/$id" params={{ id: campaign.id }} className="group block">
                  <article className="flex gap-4 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-amber-300">
                    <div className="w-28 shrink-0 overflow-hidden">
                      <img src={campaign.cover} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    </div>
                    <div className="flex min-h-[100px] flex-col justify-between py-4 pr-4">
                      <div>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Ongoing</span>
                          {campaign.frequencies && <span className="text-xs text-muted-foreground">{campaign.frequencies.join(" · ")}</span>}
                        </div>
                        <h3 className="font-display text-base leading-snug line-clamp-2">{campaign.title}</h3>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{campaign.donors} supporters</span>
                        <span className="flex items-center gap-1 font-medium text-amber-600">Give monthly <ArrowRight className="h-3 w-3" /></span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {oneTime.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              <h2 className="font-display text-xl">Specific campaigns</h2>
            </div>
            <div className="space-y-4">
              {oneTime.map((campaign) => {
                const pct = campaign.goal ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100)) : 0;
                return (
                  <Link key={campaign.id} to="/campaign/$id" params={{ id: campaign.id }} className="group block">
                    <article className="flex gap-4 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-amber-300">
                      <div className="w-28 shrink-0 overflow-hidden">
                        <img src={campaign.cover} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                      <div className="flex min-h-[100px] flex-col justify-between py-4 pr-4">
                        <h3 className="font-display text-base leading-snug line-clamp-2">{campaign.title}</h3>
                        <div>
                          <div className="mb-1.5 h-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{formatMoney(campaign.raised)}</span>
                            <span className="text-muted-foreground">of {formatMoney(campaign.goal ?? 0)} · {pct}%</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {org.campaigns.length === 0 && (
          <div className="rounded-2xl bg-muted/30 py-12 text-center">
            <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No campaigns yet</p>
            <p className="mt-1 text-sm text-muted-foreground">This org hasn't created any campaigns yet.</p>
            <Link to="/create" className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600">
              Start a campaign
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
