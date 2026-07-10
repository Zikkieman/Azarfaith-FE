import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, CalendarDays, CircleAlert, HeartHandshake, Repeat2 } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PageSpinner } from "@/components/PageSpinner";
import { getOrganizationDashboard } from "@/features/catalog/api";
import { formatMoney } from "@/lib/catalog";
import { useRequireAuth } from "@/lib/useRequireAuth";

export const Route = createFileRoute("/manage/org/$id")({
  component: ManageOrganizationDashboard,
});

function ManageOrganizationDashboard() {
  const isAuthed = useRequireAuth();
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["organization-dashboard", id],
    queryFn: () => getOrganizationDashboard(id),
    enabled: isAuthed,
  });

  if (!isAuthed) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex-1 w-full max-w-5xl px-5 py-12 md:px-8">
          <PageSpinner label="Redirecting to login..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoading && !data) {
    throw notFound();
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex-1 w-full max-w-5xl px-5 py-12 md:px-8">
          <PageSpinner label="Loading organization dashboard..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-5xl px-5 py-12 md:px-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Organization dashboard
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight">
              {data.organization.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {data.organization.tagline}
            </p>
            {data.organization.verificationStatus === "unverified" ? (
              <p className="mt-2 text-sm text-rose-700">
                This organization is currently unverified.
                {data.organization.nextReapplicationAt
                  ? ` It can be resubmitted from ${new Date(data.organization.nextReapplicationAt).toLocaleDateString()}.`
                  : ""}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/org/$id"
              params={{ id }}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
            >
              Public profile
            </Link>
            <Link
              to="/create"
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Create campaign
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Total raised", value: formatMoney(data.overview.totalRaised) },
            { label: "Supporters", value: data.overview.totalSupporters.toLocaleString() },
            { label: "Active campaigns", value: data.overview.activeCampaigns.toString() },
            { label: "Pending campaigns", value: data.overview.pendingCampaigns.toString() },
            { label: "Recurring donors", value: data.overview.recurringDonorCount.toLocaleString() },
            {
              label: "Projected monthly",
              value: formatMoney(data.overview.projectedMonthlyIncome),
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 font-display text-xl">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Campaigns
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {data.campaigns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No campaigns yet for this organization.
                </div>
              ) : (
                data.campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to="/campaign/$id"
                    params={{ id: campaign.id }}
                    className="block rounded-2xl border border-border px-4 py-4 transition hover:border-amber-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{campaign.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {campaign.verificationStatus.replaceAll("_", " ")} · {campaign.donorCount} donors
                        </p>
                      </div>
                      <span className="text-xs font-medium text-amber-700">Open</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Raised {formatMoney(campaign.raised)}</span>
                      <span>
                        Goal {campaign.goalAmount ? formatMoney(campaign.goalAmount) : "No target"}
                      </span>
                      <span>
                        Last gift{" "}
                        {campaign.lastDonationDate
                          ? new Date(campaign.lastDonationDate).toLocaleDateString()
                          : "Not yet"}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Org notices
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {data.notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No new notices.
                </div>
              ) : (
                data.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-2xl border border-border px-4 py-4"
                  >
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Recent donations
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {data.recentDonations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  Donations will show here after supporters start giving.
                </div>
              ) : (
                data.recentDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-border px-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{donation.donorName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {donation.campaignTitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatMoney(donation.amount)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(donation.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Repeat2 className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                What to watch
              </h2>
            </div>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border px-4 py-4">
                <p className="font-medium text-foreground">Pending review status</p>
                <p className="mt-1">
                  Organizations and campaigns stay labeled pending until admin approval is complete.
                </p>
              </div>
              <div className="rounded-2xl border border-border px-4 py-4">
                <p className="font-medium text-foreground">Reapplication timing</p>
                <p className="mt-1">
                  If a review is rejected, the backend now enforces the reapply waiting window before another submission.
                </p>
              </div>
              <div className="rounded-2xl border border-border px-4 py-4">
                <p className="font-medium text-foreground">Donation visibility</p>
                <p className="mt-1">
                  Anonymous supporters appear as Anonymous Donor here while receipts still preserve the donor’s real name privately.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6">
          <Link
            to="/manage"
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-700"
          >
            Back to workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
