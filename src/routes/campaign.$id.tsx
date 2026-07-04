import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Flame,
  MapPin,
  MessageSquare,
  Repeat2,
  ShieldCheck,
  Target,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { PageSpinner } from "@/components/PageSpinner";
import { getCampaign } from "@/features/catalog/api";
import { formatMoney } from "@/lib/catalog";

export const Route = createFileRoute("/campaign/$id")({
  component: CampaignRoute,
});

function CampaignRoute() {
  const { id } = Route.useParams();
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [selectedFreq, setSelectedFreq] = useState<string | null>(null);
  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
  });

  if (!isLoading && !campaign) throw notFound();
  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageSpinner label="Loading campaign..." />
      </div>
    );
  }

  const pct = campaign.goal ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100)) : null;
  const isOngoing = campaign.mode === "ongoing";
  const visibleUpdates = showAllUpdates ? campaign.updates : campaign.updates.slice(0, 1);
  const donateFreq = selectedFreq ?? (isOngoing ? "monthly" : "once");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl space-y-8 px-5 py-8 md:px-8">
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
          <img src={campaign.cover} alt="" className="h-full w-full object-cover" />
          <div className="absolute left-4 top-4 flex gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${isOngoing ? "bg-amber-100 text-amber-800" : "border border-border/60 bg-card/90 text-foreground"}`}>
              {isOngoing ? <><Repeat2 className="h-3.5 w-3.5" /> Ongoing</> : <><Target className="h-3.5 w-3.5" /> One-time</>}
            </span>
            {campaign.verificationStatus === "verified" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-trust px-3 py-1.5 text-xs font-medium text-trust-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            {campaign.urgency === "critical" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-urgent px-3 py-1.5 text-xs font-medium text-urgent-foreground">
                <Flame className="h-3.5 w-3.5" /> Urgent
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-amber-600">{campaign.faithCategory}</p>
          <h1 className="font-display text-2xl leading-tight md:text-3xl">{campaign.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div>{campaign.raiser.name}</div>
            <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {campaign.location}</div>
          </div>
          {campaign.orgId && (
            <Link to="/org/$id" params={{ id: campaign.orgId }} className="mt-3 inline-flex items-center gap-2 text-sm text-amber-600 transition hover:text-amber-700">
              View organization <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          {isOngoing ? (
            <div>
              <h2 className="mb-1 font-display text-lg">Support this ministry</h2>
              <p className="mb-4 text-sm text-muted-foreground">Choose how you'd like to give. You can change or cancel anytime.</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {(campaign.frequencies ?? ["monthly"]).map((freq) => (
                  <button key={freq} onClick={() => setSelectedFreq(freq)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedFreq === freq ? "bg-amber-500 text-white" : "border border-border hover:border-amber-300"}`}>
                    Give {freq}
                  </button>
                ))}
                <button onClick={() => setSelectedFreq("once")} className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedFreq === "once" ? "bg-amber-500 text-white" : "border border-border hover:border-amber-300"}`}>
                  Give once
                </button>
              </div>
              <Link to="/donate/$id" params={{ id: campaign.id }} search={{ freq: donateFreq }} className="block w-full rounded-2xl bg-amber-500 py-3.5 text-center font-semibold text-white transition hover:bg-amber-600">
                Continue to give
              </Link>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{campaign.donors.toLocaleString()} supporters</span>
                <span>·</span>
                <span>{formatMoney(campaign.raised)} raised total</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-display text-2xl">{formatMoney(campaign.raised)}</span>
                <span className="text-sm text-muted-foreground">of {formatMoney(campaign.goal ?? 0)}</span>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct ?? 0}%` }} />
              </div>
              <div className="mb-5 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{pct}% funded</span>
                <span>·</span>
                <span>{campaign.donors.toLocaleString()} donors</span>
              </div>
              <Link to="/donate/$id" params={{ id: campaign.id }} search={{ freq: "once" }} className="block w-full rounded-2xl bg-amber-500 py-3.5 text-center font-semibold text-white transition hover:bg-amber-600">
                Donate now
              </Link>
            </div>
          )}
        </div>

        <section>
          <h2 className="mb-3 font-display text-xl">The story</h2>
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{campaign.story}</p>
        </section>

        {campaign.gallery.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-xl">Photos</h2>
            <div className="grid grid-cols-3 gap-3">
              {campaign.gallery.map((image) => (
                <div key={image} className="aspect-square overflow-hidden rounded-2xl">
                  <img src={image} alt="" className="h-full w-full object-cover transition duration-300 hover:scale-105" />
                </div>
              ))}
            </div>
          </section>
        )}

        {campaign.updates.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-xl">Updates <span className="text-base font-normal text-muted-foreground">({campaign.updates.length})</span></h2>
            <div className="space-y-4">
              {visibleUpdates.map((update) => (
                <div key={update.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="mb-1 text-xs text-muted-foreground">{update.date}</div>
                  <h3 className="text-sm font-semibold">{update.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{update.body}</p>
                </div>
              ))}
            </div>
            {campaign.updates.length > 1 && (
              <button onClick={() => setShowAllUpdates((value) => !value)} className="mt-3 flex items-center gap-1.5 text-sm text-amber-600 transition hover:text-amber-700">
                {showAllUpdates ? <><ChevronUp className="h-4 w-4" /> Show less</> : <><ChevronDown className="h-4 w-4" /> Show all {campaign.updates.length} updates</>}
              </button>
            )}
          </section>
        )}

        {campaign.comments.length > 0 && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl">
              <MessageSquare className="h-5 w-5 text-amber-500" /> Comments <span className="text-base font-normal text-muted-foreground">({campaign.comments.length})</span>
            </h2>
            <div className="space-y-4">
              {campaign.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                    {(comment.author || "A").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{comment.author}</span>
                      <span className="text-muted-foreground">{comment.date}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{comment.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {campaign.donations.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-xl">Recent giving</h2>
            <div className="space-y-3">
              {campaign.donations.slice(0, 5).map((donation) => (
                <div key={donation.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{donation.donor}</span>
                    {donation.note && <span className="text-muted-foreground"> · &quot;{donation.note}&quot;</span>}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{formatMoney(donation.amount)}</span>
                    <span className="text-xs">{donation.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
