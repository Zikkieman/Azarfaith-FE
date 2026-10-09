import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  Fingerprint,
  Flame,
  HandCoins,
  Heart,
  MapPin,
  Megaphone,
  Repeat2,
  Target,
  User,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/mock";
import { pending, simulateNetwork } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { Tabs } from "@/components/app/AppShell";
import { Segments } from "@/components/app/Segments";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminDetailSkeleton } from "@/components/admin/AdminSkeletons";
import { StatusBadge, UrgencyBadge } from "@/components/admin/AdminBadge";
import { Field, FieldGroup, Notes, Timeline } from "@/components/admin/AdminParts";
import { AutoCheckList, CampaignActions } from "@/components/admin/CampaignReview";
import { campaignChecks } from "@/components/admin/useAdmin";
import { campaignTypeLabel } from "@/components/admin/labels";

export const Route = createFileRoute("/admin/campaigns/$id")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminDetailSkeleton label="Loading campaign" />,
  ...pending,
  component: AdminCampaignDetail,
});

type Tab = "review" | "gifts" | "updates" | "activity" | "notes";

function AdminCampaignDetail() {
  const { id } = Route.useParams();
  const campaigns = useApp((s) => s.campaigns);
  const orgs = useApp((s) => s.orgs);
  const log = useApp((s) => s.auditLog);
  const noteCount = useApp((s) => s.notes[id]?.length ?? 0);
  const [tab, setTab] = useState<Tab>("review");

  const index = campaigns.findIndex((c) => c.id === id);
  const c = campaigns[index];
  if (!c) {
    return (
      <AdminPage
        title="Campaign not found"
        crumbs={[{ label: "Campaigns", to: "/admin/campaigns" }]}
      >
        <AdminEmptyState
          icon={<Megaphone className="h-5 w-5" strokeWidth={1.75} />}
          title="This campaign doesn't exist"
          description="It may have been removed, or the link is wrong."
          action={
            <Link to="/admin/campaigns" search={{ view: "all" }} className={btn("secondary", "sm")}>
              Back to campaigns
            </Link>
          }
        />
      </AdminPage>
    );
  }

  const org = c.orgId ? orgs.find((o) => o.id === c.orgId) : undefined;
  const pct = c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : null;
  const history = log.filter((e) => e.target.id === c.id);
  const step = (i: number) =>
    campaigns[i] ? { to: "/admin/campaigns/$id", params: { id: campaigns[i].id } } : undefined;

  return (
    <AdminPage
      crumbs={[
        { label: "Campaigns", to: "/admin/campaigns", search: { view: "all" } },
        { label: c.title },
      ]}
      pager={{
        index: index + 1,
        total: campaigns.length,
        prev: step(index - 1),
        next: step(index + 1),
      }}
      title={c.title}
      lead={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <StatusBadge status={c.verificationStatus} />
          <UrgencyBadge urgency={c.urgency} />
          <span>{c.raiser.name}</span>
          <span aria-hidden>·</span>
          <span>{c.location}</span>
        </span>
      }
      actions={
        <div className="flex flex-col items-end gap-1.5">
          <CampaignActions campaign={c} />
        </div>
      }
    >
      <div className="grid overflow-hidden rounded-card border border-line-soft lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-line-soft bg-panel/40 px-4 py-2 lg:border-b-0 lg:border-r">
          <section className="flex flex-col gap-2 px-1 py-3">
            <p className="text-[12px] font-medium text-subtle">Progress</p>
            <p className="font-display text-[22px] leading-none text-ink">
              {formatMoney(c.raised)}
            </p>
            <p className="text-[13px] text-muted-ink">
              {c.goal ? `of ${formatMoney(c.goal)}, ` : ""}
              {c.donors.toLocaleString()} givers
            </p>
            {pct !== null ? <Segments pct={pct} className="pt-1" /> : null}
          </section>
          <FieldGroup title="Organizer">
            <Field icon={User} label="Name">
              {c.raiser.name}
            </Field>
            <Field icon={Building2} label="Organization">
              {org ? (
                <Link
                  to="/admin/orgs/$id"
                  params={{ id: org.id }}
                  className="underline decoration-line-input underline-offset-2 hover:decoration-ink"
                >
                  {org.name}
                </Link>
              ) : (
                <span className="text-muted-ink">Personal campaign</span>
              )}
            </Field>
            <Field icon={MapPin} label="Location">
              {c.location}
            </Field>
          </FieldGroup>
          <FieldGroup title="Campaign">
            <Field icon={HandCoins} label="Asking for">
              {campaignTypeLabel[c.type]}
            </Field>
            <Field icon={Repeat2} label="Kind">
              {c.mode === "ongoing" ? "Ongoing" : "One-time"}
            </Field>
            <Field icon={Heart} label="Cause">
              {c.faithCategory}
            </Field>
            <Field icon={Flame} label="Urgency">
              <UrgencyBadge urgency={c.urgency} />
            </Field>
            {c.goal ? (
              <Field icon={Target} label="Goal">
                {formatMoney(c.goal)}
              </Field>
            ) : null}
          </FieldGroup>
          <FieldGroup title="Record">
            <Field icon={Calendar} label="Submitted">
              {c.createdAt}
            </Field>
            <Field icon={Fingerprint} label="ID" copy={c.id}>
              {c.id}
            </Field>
          </FieldGroup>
        </aside>

        <div className="min-w-0 px-5 pb-6 pt-4 sm:px-6">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "review", label: "Review" },
              { value: "gifts", label: "Gifts", count: c.donations.length },
              { value: "updates", label: "Updates", count: c.updates.length },
              { value: "activity", label: "Activity", count: history.length },
              { value: "notes", label: "Notes", count: noteCount },
            ]}
          />
          <div key={tab} className="admin-rise pt-5">
            {tab === "review" ? (
              <div className="flex flex-col gap-6">
                <section className="flex flex-col gap-2.5">
                  <h2 className="text-[13px] font-medium text-subtle">Checks</h2>
                  <AutoCheckList checks={campaignChecks(c, org)} />
                </section>
                <section className="flex flex-col gap-2.5">
                  <h2 className="text-[13px] font-medium text-subtle">What givers will see</h2>
                  <img
                    src={c.cover}
                    alt=""
                    className="aspect-[16/7] w-full rounded-field object-cover"
                  />
                  <p className="whitespace-pre-wrap text-sm leading-[1.7] text-ink-soft">
                    {c.story}
                  </p>
                  {c.gallery.length ? (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {c.gallery.map((p, i) => (
                        <img
                          key={i}
                          src={p}
                          alt=""
                          className="aspect-[4/3] w-full rounded-[10px] object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              </div>
            ) : null}

            {tab === "gifts" ? (
              c.donations.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-ink">No gifts yet.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line-soft text-[13px] text-muted-ink">
                      <th className="pb-2 font-medium">Giver</th>
                      <th className="pb-2 font-medium">Message</th>
                      <th className="pb-2 font-medium">When</th>
                      <th className="pb-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.donations.map((d) => (
                      <tr key={d.id} className="border-b border-line-soft last:border-0">
                        <td className="py-3 font-medium text-ink">{d.donor}</td>
                        <td className="max-w-[260px] truncate py-3 text-ink-soft">
                          {d.note ?? "—"}
                        </td>
                        <td className="py-3 text-muted-ink">{d.date}</td>
                        <td className="py-3 text-right tabular-nums text-ink">
                          {formatMoney(d.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : null}

            {tab === "updates" ? (
              c.updates.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-ink">
                  No updates yet. Givers hear from the organizer here.
                </p>
              ) : (
                <ol className="flex flex-col divide-y divide-line-soft">
                  {c.updates.map((u) => (
                    <li key={u.id} className="py-4 first:pt-0">
                      <p className="text-[12px] text-subtle">{u.date}</p>
                      <p className="mt-1 text-sm font-medium text-ink">{u.title}</p>
                      <p className="mt-1 text-sm leading-[1.6] text-ink-soft">{u.body}</p>
                    </li>
                  ))}
                </ol>
              )
            ) : null}

            {tab === "activity" ? <Timeline entries={history} /> : null}
            {tab === "notes" ? <Notes recordId={c.id} /> : null}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
