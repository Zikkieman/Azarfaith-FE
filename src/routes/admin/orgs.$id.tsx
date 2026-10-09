import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  Church,
  Fingerprint,
  Hash,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Send,
  User,
  Wallet,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/mock";
import { orgFiles, timeAgo } from "@/lib/admin";
import { pending, simulateNetwork } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { Tabs } from "@/components/app/AppShell";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminDetailSkeleton } from "@/components/admin/AdminSkeletons";
import { StatusBadge } from "@/components/admin/AdminBadge";
import {
  CheckList,
  DocumentList,
  Field,
  FieldGroup,
  Notes,
  RiskSignals,
  Timeline,
} from "@/components/admin/AdminParts";
import { OrgActions } from "@/components/admin/OrgReview";
import { orgRisks } from "@/components/admin/useAdmin";
import { orgCategoryLabel } from "@/components/admin/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/orgs/$id")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminDetailSkeleton label="Loading organization" />,
  ...pending,
  component: AdminOrgDetail,
});

type Tab = "verification" | "campaigns" | "activity" | "notes";

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

function AdminOrgDetail() {
  const { id } = Route.useParams();
  const orgs = useApp((s) => s.orgs);
  const campaigns = useApp((s) => s.campaigns);
  const checks = useApp((s) => s.checks[id]);
  const log = useApp((s) => s.auditLog);
  const noteCount = useApp((s) => s.notes[id]?.length ?? 0);
  const [tab, setTab] = useState<Tab>("verification");

  const index = orgs.findIndex((o) => o.id === id);
  const org = orgs[index];
  if (!org) {
    return (
      <AdminPage
        title="Organization not found"
        crumbs={[{ label: "Organizations", to: "/admin/orgs" }]}
      >
        <AdminEmptyState
          icon={<Building2 className="h-5 w-5" strokeWidth={1.75} />}
          title="This organization doesn't exist"
          description="It may have been removed, or the link is wrong."
          action={
            <Link to="/admin/orgs" search={{ view: "all" }} className={btn("secondary", "sm")}>
              Back to organizations
            </Link>
          }
        />
      </AdminPage>
    );
  }

  const file = orgFiles[org.id];
  const orgCampaigns = campaigns.filter((c) => c.orgId === org.id);
  const history = log.filter((e) => e.target.id === org.id);
  const step = (i: number) =>
    orgs[i] ? { to: "/admin/orgs/$id", params: { id: orgs[i].id } } : undefined;
  const mismatch = file && file.accountName !== org.name;

  return (
    <AdminPage
      crumbs={[
        { label: "Organizations", to: "/admin/orgs", search: { view: "all" } },
        { label: org.name },
      ]}
      pager={{ index: index + 1, total: orgs.length, prev: step(index - 1), next: step(index + 1) }}
      title={
        <span className="flex items-center gap-3">
          <img
            src={org.photos[0]}
            alt=""
            className="h-10 w-10 shrink-0 rounded-[10px] object-cover"
          />
          <span className="min-w-0">{org.name}</span>
        </span>
      }
      lead={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <StatusBadge status={org.verificationStatus} />
          <span>{orgCategoryLabel[org.category]}</span>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <span>{org.location}</span>
          {file ? (
            <>
              <span aria-hidden className="hidden sm:inline">
                ·
              </span>
              <span>Applied {timeAgo(file.submittedAt)}</span>
            </>
          ) : null}
        </span>
      }
      dock
      actions={
        <div className="flex flex-col gap-1.5 sm:items-end">
          <OrgActions org={org} />
        </div>
      }
    >
      <div className="grid overflow-hidden rounded-card border border-line-soft lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-line-soft bg-panel/40 px-3 py-2 sm:px-4 lg:border-b-0 lg:border-r">
          <FieldGroup title="Organization">
            <Field icon={Building2} label="Category">
              {orgCategoryLabel[org.category]}
            </Field>
            <Field icon={Church} label="Denomination">
              {org.denomination}
            </Field>
            <Field icon={Calendar} label="Founded">
              {org.founded}
            </Field>
            <Field icon={MapPin} label="Location">
              {org.location}
            </Field>
          </FieldGroup>
          {file ? (
            <>
              <FieldGroup title="Contact">
                <Field icon={User} label="Name">
                  {file.contactName}
                </Field>
                <Field icon={Mail} label="Email" copy={file.email}>
                  {file.email}
                </Field>
                <Field icon={Phone} label="Phone" copy={file.phone}>
                  {file.phone}
                </Field>
              </FieldGroup>
              <FieldGroup title="Payout">
                <Field icon={Landmark} label="Bank">
                  {file.bank}
                </Field>
                <Field icon={User} label="Account name">
                  <span className={cn(mismatch && "text-danger")}>{file.accountName}</span>
                </Field>
                <Field icon={Wallet} label="Account">
                  •••• {file.accountEnding}
                </Field>
              </FieldGroup>
              <FieldGroup title="Record">
                <Field icon={Hash} label="CAC number" copy={file.rcNumber}>
                  {file.rcNumber}
                </Field>
                <Field icon={Fingerprint} label="ID" copy={org.id}>
                  {org.id}
                </Field>
                <Field icon={Send} label="Applied">
                  {day(file.submittedAt)}
                </Field>
                <Field icon={Wallet} label="Received">
                  {formatMoney(org.totalReceived)}
                </Field>
              </FieldGroup>
            </>
          ) : null}
        </aside>

        <div className="min-w-0 px-4 pb-6 pt-4 sm:px-6">
          <Tabs
            className="-mx-4 px-4"
            value={tab}
            onChange={setTab}
            items={[
              { value: "verification", label: "Verification" },
              { value: "campaigns", label: "Campaigns", count: orgCampaigns.length },
              { value: "activity", label: "Activity", count: history.length },
              { value: "notes", label: "Notes", count: noteCount },
            ]}
          />
          <div key={tab} className="admin-rise pt-5">
            {tab === "verification" ? (
              <div className="flex flex-col gap-6">
                <RiskSignals items={orgRisks(org, checks)} />
                <section className="flex flex-col gap-2.5">
                  <h2 className="text-[13px] font-medium text-subtle">Checks</h2>
                  <CheckList orgId={org.id} />
                </section>
                <section className="flex flex-col gap-2.5">
                  <h2 className="text-[13px] font-medium text-subtle">Documents</h2>
                  <DocumentList documents={file?.documents ?? []} />
                </section>
                <section className="flex flex-col gap-2.5">
                  <h2 className="text-[13px] font-medium text-subtle">About</h2>
                  <p className="text-sm font-medium text-ink">{org.tagline}</p>
                  <p className="text-sm leading-[1.65] text-ink-soft">{org.bio}</p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {org.photos.slice(0, 3).map((p, i) => (
                      <img
                        key={i}
                        src={p}
                        alt=""
                        className="aspect-[4/3] w-full rounded-[10px] object-cover"
                      />
                    ))}
                  </div>
                </section>
              </div>
            ) : null}

            {tab === "campaigns" ? (
              orgCampaigns.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-ink">
                  No campaigns yet. They can start one once they're verified.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-line-soft">
                  {orgCampaigns.map((c) => (
                    <li key={c.id}>
                      <Link
                        to="/admin/campaigns/$id"
                        params={{ id: c.id }}
                        className="-mx-2 flex items-center gap-3 rounded-[10px] px-2 py-3 transition-colors hover:bg-panel/60"
                      >
                        <img
                          src={c.cover}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-[8px] object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {c.title}
                          </span>
                          <span className="block text-[12px] text-muted-ink">
                            {formatMoney(c.raised)} from {c.donors.toLocaleString()} givers
                          </span>
                        </span>
                        <StatusBadge status={c.verificationStatus} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            ) : null}

            {tab === "activity" ? <Timeline entries={history} /> : null}
            {tab === "notes" ? <Notes recordId={org.id} /> : null}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
