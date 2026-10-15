import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Calendar, Church, Fingerprint, Mail, MapPin, Phone, Send, User, Wallet } from "lucide-react";
import { formatMoney, type Org } from "@/lib/domain";
import { ApiError, apiFetch, pending } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { Tabs } from "@/components/app/AppShell";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminDetailSkeleton } from "@/components/admin/AdminSkeletons";
import { StatusBadge } from "@/components/admin/AdminBadge";
import { Field, FieldGroup } from "@/components/admin/AdminParts";
import { OrgActions } from "@/components/admin/OrgReview";
import { orgCategoryLabel } from "@/components/admin/labels";
import { ReviewActivity, ReviewChecklist, ReviewDocuments, ReviewNotes, useReviewRecords } from "@/components/admin/LiveReviewRecords";

export const Route = createFileRoute("/admin/orgs/$id")({
  pendingComponent: () => <AdminDetailSkeleton label="Loading organization" />,
  ...pending,
  component: AdminOrgDetail,
});

type Tab = "verification" | "campaigns" | "activity" | "notes";
type OrganizationCampaign = { id: string; title: string; cover: string; raised: number; donors: number; verificationStatus: Org["verificationStatus"] };
type OrganizationDetail = {
  id: string; createdAt: string; submittedAt: string | null; ownerId: string; name: string; tagline: string;
  category: Org["category"]; otherCategoryLabel: string; location: string; denomination: string; founded: string;
  bio: string; photos: string[]; links: string[]; registrationDocuments: string[];
  verificationStatus: Org["verificationStatus"]; owner: { id: string; fullName: string; email: string; phone: string };
  totalReceived: number; supporters: number; campaigns: OrganizationCampaign[];
};

const date = (value: string) => new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

function AdminOrgDetail() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<Tab>("verification");
  const organization = useQuery({
    queryKey: ["admin", "organization", id],
    queryFn: () => apiFetch<OrganizationDetail>(`/admin/review/organizations/${id}`),
  });
  const reviewRecords = useReviewRecords("organization", id);

  if (organization.isLoading) return <AdminDetailSkeleton label="Loading organization" />;
  if (organization.error) {
    const missing = organization.error instanceof ApiError && organization.error.status === 404;
    return (
      <AdminPage title={missing ? "Organization not found" : "Could not load organization"} crumbs={[{ label: "Organizations", to: "/admin/orgs", search: { view: "all" } }]}>
        <AdminEmptyState
          icon={<Building2 className="h-5 w-5" strokeWidth={1.75} />}
          title={missing ? "This organization doesn't exist" : "The organization record is unavailable"}
          description={missing ? "It may have been removed, or the link is wrong." : "Try refreshing the record or return to the organization list."}
          action={<Link to="/admin/orgs" search={{ view: "all" }} className={btn("secondary", "sm")}>Back to organizations</Link>}
        />
      </AdminPage>
    );
  }

  const detail = organization.data!;
  const org: Org = {
    id: detail.id, name: detail.name, tagline: detail.tagline, category: detail.category, location: detail.location,
    denomination: detail.denomination, founded: detail.founded, bio: detail.bio, photos: detail.photos, videos: [],
    campaignIds: detail.campaigns.map((campaign) => campaign.id), verificationStatus: detail.verificationStatus,
    totalReceived: detail.totalReceived, supporters: detail.supporters,
  };
  const appliedAt = detail.submittedAt ?? detail.createdAt;
  const category = detail.category === "other" && detail.otherCategoryLabel ? detail.otherCategoryLabel : orgCategoryLabel[detail.category];

  return (
    <AdminPage
      crumbs={[{ label: "Organizations", to: "/admin/orgs", search: { view: "all" } }, { label: detail.name }]}
      title={<span className="flex items-center gap-3"><img src={detail.photos[0] || "https://placehold.co/80x80/f6efe2/1f2937?text=A"} alt="" className="h-10 w-10 shrink-0 rounded-[10px] object-cover" /><span className="min-w-0">{detail.name}</span></span>}
      lead={<span className="flex flex-wrap items-center gap-x-3 gap-y-1.5"><StatusBadge status={detail.verificationStatus} /><span>{category}</span><span aria-hidden className="hidden sm:inline">·</span><span>{detail.location}</span><span aria-hidden className="hidden sm:inline">·</span><span>Applied {date(appliedAt)}</span></span>}
      dock
      actions={<div className="flex flex-col gap-1.5 sm:items-end"><OrgActions org={org} /></div>}
    >
      <div className="grid overflow-hidden rounded-card border border-line-soft lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-line-soft bg-panel/40 px-3 py-2 sm:px-4 lg:border-b-0 lg:border-r">
          <FieldGroup title="Organization">
            <Field icon={Building2} label="Category">{category}</Field>
            <Field icon={Church} label="Denomination">{detail.denomination || "—"}</Field>
            <Field icon={Calendar} label="Founded">{detail.founded || "—"}</Field>
            <Field icon={MapPin} label="Location">{detail.location}</Field>
          </FieldGroup>
          <FieldGroup title="Contact">
            <Field icon={User} label="Name">{detail.owner.fullName}</Field>
            <Field icon={Mail} label="Email" copy={detail.owner.email}>{detail.owner.email}</Field>
            <Field icon={Phone} label="Phone" copy={detail.owner.phone || undefined}>{detail.owner.phone || "—"}</Field>
          </FieldGroup>
          <FieldGroup title="Record">
            <Field icon={Fingerprint} label="ID" copy={detail.id}>{detail.id}</Field>
            <Field icon={Send} label="Applied">{date(appliedAt)}</Field>
            <Field icon={Wallet} label="Received">{formatMoney(detail.totalReceived)}</Field>
          </FieldGroup>
        </aside>
        <div className="min-w-0 px-4 pb-6 pt-4 sm:px-6">
          <Tabs className="-mx-4 px-4" value={tab} onChange={setTab} items={[{ value: "verification", label: "Verification" }, { value: "campaigns", label: "Campaigns", count: detail.campaigns.length }, { value: "activity", label: "Activity" }, { value: "notes", label: "Notes", count: reviewRecords.data?.total ?? 0 }]} />
          <div key={tab} className="admin-rise pt-5">
            {tab === "verification" ? <div className="flex flex-col gap-6">
              <section className="flex flex-col gap-2.5"><h2 className="text-[13px] font-medium text-subtle">Checks</h2><ReviewChecklist entityType="organization" id={id} /></section>
              <section className="flex flex-col gap-2.5"><h2 className="text-[13px] font-medium text-subtle">Documents</h2><ReviewDocuments documents={detail.registrationDocuments} /></section>
              <section className="flex flex-col gap-2.5"><h2 className="text-[13px] font-medium text-subtle">About</h2><p className="text-sm font-medium text-ink">{detail.tagline}</p><p className="text-sm leading-[1.65] text-ink-soft">{detail.bio}</p>{detail.links.length ? <ul className="flex flex-wrap gap-2">{detail.links.map((link) => <li key={link}><a href={link} target="_blank" rel="noreferrer" className="text-sm text-brand-ink underline underline-offset-2">{link}</a></li>)}</ul> : null}<div className="grid grid-cols-3 gap-2 pt-1">{detail.photos.slice(0, 3).map((photo) => <img key={photo} src={photo} alt="" className="aspect-[4/3] w-full rounded-[10px] object-cover" />)}</div></section>
            </div> : null}
            {tab === "campaigns" ? (detail.campaigns.length === 0 ? <p className="py-10 text-center text-sm text-muted-ink">No campaigns yet.</p> : <ul className="flex flex-col divide-y divide-line-soft">{detail.campaigns.map((campaign) => <li key={campaign.id}><Link to="/admin/campaigns/$id" params={{ id: campaign.id }} className="-mx-2 flex items-center gap-3 rounded-[10px] px-2 py-3 transition-colors hover:bg-panel/60"><img src={campaign.cover} alt="" className="h-9 w-9 shrink-0 rounded-[8px] object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-ink">{campaign.title}</span><span className="block text-[12px] text-muted-ink">{formatMoney(campaign.raised)} from {campaign.donors.toLocaleString()} givers</span></span><StatusBadge status={campaign.verificationStatus} /></Link></li>)}</ul>) : null}
            {tab === "activity" ? <ReviewActivity entityType="organization" id={id} /> : null}
            {tab === "notes" ? <ReviewNotes entityType="organization" id={id} /> : null}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
