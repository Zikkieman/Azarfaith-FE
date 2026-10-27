import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Calendar, FileText, Fingerprint, Flame, HandCoins, Heart, MapPin, Megaphone, Phone, Repeat2, Target, User, Video } from "lucide-react";
import { formatMoney, type Campaign } from "@/lib/domain";
import { ApiError, apiFetch, pending } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { Tabs } from "@/components/app/AppShell";
import { Segments } from "@/components/app/Segments";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminDetailSkeleton } from "@/components/admin/AdminSkeletons";
import { StatusBadge, UrgencyBadge } from "@/components/admin/AdminBadge";
import { Field, FieldGroup } from "@/components/admin/AdminParts";
import { CampaignActions } from "@/components/admin/CampaignReview";
import { campaignTypeLabel } from "@/components/admin/labels";
import { ReviewActivity, ReviewChecklist, ReviewNotes, useReviewRecords } from "@/components/admin/LiveReviewRecords";

export const Route = createFileRoute("/admin/campaigns/$id")({
  pendingComponent: () => <AdminDetailSkeleton label="Loading campaign" />,
  ...pending,
  component: AdminCampaignDetail,
});

type Tab = "review" | "gifts" | "updates" | "activity" | "notes";
type CampaignDetail = Omit<Campaign, "raiser"> & {
  raiser: Omit<Campaign["raiser"], "trustScore">;
  contactPhone: string;
  organization: { id: string; name: string; verificationStatus: Campaign["verificationStatus"] } | null;
};

function AdminCampaignDetail() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<Tab>("review");
  const campaignQuery = useQuery({
    queryKey: ["admin", "campaign", id],
    queryFn: () => apiFetch<CampaignDetail>(`/admin/review/campaigns/${id}`),
  });
  const reviewRecords = useReviewRecords("campaign", id);

  if (campaignQuery.isLoading) return <AdminDetailSkeleton label="Loading campaign" />;
  if (campaignQuery.error) {
    const missing = campaignQuery.error instanceof ApiError && campaignQuery.error.status === 404;
    return (
      <AdminPage title={missing ? "Campaign not found" : "Could not load campaign"} crumbs={[{ label: "Campaigns", to: "/admin/campaigns", search: { view: "all" } }]}>
        <AdminEmptyState icon={<Megaphone className="h-5 w-5" strokeWidth={1.75} />} title={missing ? "This campaign doesn't exist" : "The campaign record is unavailable"} description={missing ? "It may have been removed, or the link is wrong." : "Try refreshing the record or return to the campaign list."} action={<Link to="/admin/campaigns" search={{ view: "all" }} className={btn("secondary", "sm")}>Back to campaigns</Link>} />
      </AdminPage>
    );
  }

  const detail = campaignQuery.data!;
  const campaign: Campaign = { ...detail, raiser: { ...detail.raiser, trustScore: 0 } };
  const pct = campaign.goal ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100)) : null;

  return (
    <AdminPage
      crumbs={[{ label: "Campaigns", to: "/admin/campaigns", search: { view: "all" } }, { label: campaign.title }]}
      title={campaign.title}
      lead={<span className="flex flex-wrap items-center gap-x-3 gap-y-1.5"><StatusBadge status={campaign.verificationStatus} /><UrgencyBadge urgency={campaign.urgency} /><span>{campaign.raiser.name}</span><span aria-hidden className="hidden sm:inline">·</span><span>{campaign.location}</span></span>}
      dock
      actions={<div className="flex flex-col gap-1.5 sm:items-end"><CampaignActions campaign={campaign} /></div>}
    >
      <div className="grid overflow-hidden rounded-card border border-line-soft lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-line-soft bg-panel/40 px-3 py-2 sm:px-4 lg:border-b-0 lg:border-r">
          <section className="flex flex-col gap-2 px-1 py-3">
            <p className="text-[12px] font-medium text-subtle">Progress</p>
            <p className="font-display text-[22px] leading-none text-ink">{formatMoney(campaign.raised)}</p>
            <p className="text-[13px] text-muted-ink">{campaign.goal ? `of ${formatMoney(campaign.goal)}, ` : ""}{campaign.donors.toLocaleString()} givers</p>
            {pct !== null ? <Segments pct={pct} className="pt-1" /> : null}
          </section>
          <FieldGroup title="Organizer">
            <Field icon={User} label="Name">{campaign.raiser.name}</Field>
            <Field icon={Phone} label="Contact phone" copy={detail.contactPhone || undefined}>{detail.contactPhone || "—"}</Field>
            <Field icon={Building2} label="Organization">{detail.organization ? <Link to="/admin/orgs/$id" params={{ id: detail.organization.id }} className="underline decoration-line-input underline-offset-2 hover:decoration-ink">{detail.organization.name}</Link> : <span className="text-muted-ink">Personal campaign</span>}</Field>
            <Field icon={MapPin} label="Location">{campaign.location}</Field>
          </FieldGroup>
          <FieldGroup title="Campaign">
            <Field icon={HandCoins} label="Asking for">{campaignTypeLabel[campaign.type]}</Field>
            <Field icon={Repeat2} label="Kind">{campaign.mode === "ongoing" ? "Ongoing" : "One-time"}</Field>
            <Field icon={Heart} label="Cause">{campaign.customFaithCategory || campaign.faithCategory}</Field>
            <Field icon={Flame} label="Urgency"><UrgencyBadge urgency={campaign.urgency} /></Field>
            {campaign.goal ? <Field icon={Target} label="Goal">{formatMoney(campaign.goal)}</Field> : null}
          </FieldGroup>
          <FieldGroup title="Record">
            <Field icon={Calendar} label="Submitted">{campaign.createdAt}</Field>
            <Field icon={Fingerprint} label="ID" copy={campaign.id}>{campaign.id}</Field>
          </FieldGroup>
        </aside>
        <div className="min-w-0 px-4 pb-6 pt-4 sm:px-6">
          <Tabs className="-mx-4 px-4" value={tab} onChange={setTab} items={[{ value: "review", label: "Review" }, { value: "gifts", label: "Gifts", count: campaign.donations.length }, { value: "updates", label: "Updates", count: campaign.updates.length }, { value: "activity", label: "Activity" }, { value: "notes", label: "Notes", count: reviewRecords.data?.total ?? 0 }]} />
          <div key={tab} className="admin-rise pt-5">
            {tab === "review" ? <div className="flex flex-col gap-6"><section className="flex flex-col gap-2.5"><h2 className="text-[13px] font-medium text-subtle">Checks</h2><ReviewChecklist entityType="campaign" id={id} /></section><section className="flex flex-col gap-2.5"><h2 className="text-[13px] font-medium text-subtle">What givers will see</h2><img src={campaign.cover} alt="" className="aspect-[16/7] w-full rounded-field object-cover" /><p className="whitespace-pre-wrap text-sm leading-[1.7] text-ink-soft">{campaign.story}</p>{campaign.gallery.length ? <div className="grid grid-cols-3 gap-2 pt-1">{campaign.gallery.map((photo) => <img key={photo} src={photo} alt="" className="aspect-[4/3] w-full rounded-[10px] object-cover" />)}</div> : null}</section></div> : null}
            {tab === "gifts" ? (campaign.donations.length === 0 ? <p className="py-10 text-center text-sm text-muted-ink">No gifts yet.</p> : <table className="w-full text-left text-sm"><thead><tr className="border-b border-line-soft text-[13px] text-muted-ink"><th className="pb-2 font-medium">Giver</th><th className="pb-2 font-medium">Message</th><th className="pb-2 font-medium">When</th><th className="pb-2 text-right font-medium">Amount</th></tr></thead><tbody>{campaign.donations.map((donation) => <tr key={donation.id} className="border-b border-line-soft last:border-0"><td className="py-3 font-medium text-ink">{donation.donor}</td><td className="max-w-[260px] truncate py-3 text-ink-soft">{donation.note ?? "—"}</td><td className="py-3 text-muted-ink">{donation.date}</td><td className="py-3 text-right tabular-nums text-ink">{formatMoney(donation.amount)}</td></tr>)}</tbody></table>) : null}
            {tab === "updates" ? (campaign.updates.length === 0 ? <p className="py-10 text-center text-sm text-muted-ink">No updates yet. Givers hear from the organizer here.</p> : <ol className="flex flex-col divide-y divide-line-soft">{campaign.updates.map((update) => <li key={update.id} className="py-4 first:pt-0"><p className="text-[12px] capitalize text-subtle">{update.date}{update.kind ? ` · ${update.kind}` : ""}</p><p className="mt-1 text-sm font-medium text-ink">{update.title}</p><p className="mt-1 text-sm leading-[1.6] text-ink-soft">{update.body}</p>{update.amountSpent !== undefined ? <p className="mt-2 text-[13px] font-medium text-ink">Amount spent: {formatMoney(update.amountSpent)}</p> : null}{update.imageUrls?.length ? <div className="mt-3 grid grid-cols-3 gap-2">{update.imageUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="Campaign update evidence" className="aspect-[4/3] w-full rounded-[8px] object-cover" /></a>)}</div> : null}{update.videoUrls?.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-[13px] font-medium text-ink underline"><Video className="h-4 w-4" /> Video {index + 1}</a>)}{update.receiptUrls?.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-[13px] font-medium text-ink underline"><FileText className="h-4 w-4" /> Receipt {index + 1}</a>)}</li>)}</ol>) : null}
            {tab === "activity" ? <ReviewActivity entityType="campaign" id={id} /> : null}
            {tab === "notes" ? <ReviewNotes entityType="campaign" id={id} /> : null}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
