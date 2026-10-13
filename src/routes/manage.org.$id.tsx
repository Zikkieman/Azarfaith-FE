import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Plus } from "lucide-react";
import { AppShell, BackLink, Container, PageHeader, Tag } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import {
  ManagementEmpty,
  ManagementError,
  ManagementPanel,
} from "@/components/app/ManagementParts";
import { ListPageSkeleton } from "@/components/app/Skeletons";
import { Segments } from "@/components/app/Segments";
import { useCreationSession } from "@/components/creation/useCreationSession";
import { ApiError } from "@/lib/api";
import { PageSpinner } from "@/components/PageSpinner";
import { getOrganizationDashboard } from "@/features/catalog/api";
import { formatMoney } from "@/lib/catalog";
import { givingDate } from "@/lib/giving";
import { cn } from "@/lib/utils";
import { PayoutSettings } from "@/components/profile/PayoutSettings";

export const Route = createFileRoute("/manage/org/$id")({
  component: ManageOrganizationDashboard,
  head: () => ({
    meta: [
      { title: "Organization management - AzarFaith" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ManageOrganizationDashboard() {
  const { ready, userId } = useCreationSession();
  const { id } = Route.useParams();
  const query = useQuery({
    queryKey: ["organization-dashboard", userId, id],
    queryFn: () => getOrganizationDashboard(id),
    enabled: ready,
    retry: (attempt, error) =>
      !(error instanceof ApiError && [401, 403, 404].includes(error.status)) && attempt < 1,
  });
  useCreationSession(query.error);
  const { data } = query;
  if (!ready) return <PageSpinner label="Checking your session..." />;
  if (query.isPending) return <ListPageSkeleton label="Loading organization dashboard" />;
  if (query.error instanceof ApiError && query.error.status === 404) throw notFound();
  if (!data)
    return (
      <AppShell>
        <Container className="flex flex-col gap-6 py-10 md:py-12">
          <BackLink to="/manage">Back to your causes</BackLink>
          <ManagementPanel title="Organization management">
            <ManagementError
              message={query.error?.message || "Could not load your organization dashboard."}
              retry={() => void query.refetch()}
              pending={query.isFetching}
            />
          </ManagementPanel>
        </Container>
      </AppShell>
    );
  const org = data.organization;
  const verified = org.verificationStatus === "verified";
  return (
    <AppShell>
      <Container className="pt-8">
        <BackLink to="/manage">Back to your causes</BackLink>
      </Container>
      <PageHeader
        title={org.name}
        lead={org.tagline}
        actions={
          <>
            <Link to="/org/$id" params={{ id }} className={btn("secondary")}>
              {verified ? "Public profile" : "Preview"}
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
            <Link to="/create" className={btn("primary")}>
              <Plus className="h-4 w-4" strokeWidth={2} /> Create campaign
            </Link>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-ink">
          <Tag tone={verified ? "verified" : "attention"}>
            {org.reviewAction === "rejected"
              ? "Rejected"
              : org.reviewAction === "more_info_requested"
                ? "More information needed"
                : verified
                  ? "Verified"
                  : org.verificationStatus === "pending"
                    ? "In review"
                    : "Not verified"}
          </Tag>
          <span>{org.location}</span>
        </div>
        {org.verificationStatus === "unverified" && (
          <p className="text-sm text-ink-soft">
            {org.reviewReason || "This organization is currently unverified."}
            {org.nextReapplicationAt
              ? ` You can resubmit from ${givingDate(org.nextReapplicationAt)}.`
              : ""}
          </p>
        )}
      </PageHeader>
      <Container className="flex flex-col gap-6 py-10 md:py-12">
        {query.isError && (
          <ManagementError
            message={query.error.message || "Could not refresh this dashboard."}
            retry={() => void query.refetch()}
            pending={query.isFetching}
          />
        )}
        <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-line-soft lg:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Total raised", value: formatMoney(data.overview.totalRaised) },
            { label: "Supporters", value: data.overview.totalSupporters.toLocaleString() },
            { label: "Active campaigns", value: data.overview.activeCampaigns.toString() },
            { label: "Pending campaigns", value: data.overview.pendingCampaigns.toString() },
            { label: "Regular givers", value: data.overview.recurringDonorCount.toLocaleString() },
            {
              label: "Projected monthly",
              value: formatMoney(data.overview.projectedMonthlyIncome),
            },
          ].map((item, i) => (
            <div
              key={item.label}
              className={cn(
                "flex min-w-0 flex-col gap-1.5 p-5",
                i % 2 === 1 && "border-l border-line-soft",
                i >= 2 && "border-t border-line-soft",
                i % 3 === 0 ? "lg:border-l-0" : "lg:border-l lg:border-line-soft",
                i < 3 ? "lg:border-t-0" : "lg:border-t",
                i > 0 && "xl:border-l xl:border-line-soft",
                "xl:border-t-0",
              )}
            >
              <dt className="text-[13px] text-muted-ink">{item.label}</dt>
              <dd className="break-words font-display text-[24px] leading-none tracking-[-0.02em] text-ink">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-6">
            <ManagementPanel title="Campaigns">
              {!data.campaigns.length ? (
                <ManagementEmpty>No campaigns yet for this organization.</ManagementEmpty>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {data.campaigns.map((campaign) => (
                    <li
                      key={campaign.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/campaign/$id"
                          params={{ id: campaign.id }}
                          className="break-words text-sm font-medium text-ink hover:underline [overflow-wrap:anywhere]"
                        >
                          {campaign.title}
                        </Link>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted-ink">
                          <Tag
                            tone={
                              campaign.verificationStatus === "verified" ? "verified" : "attention"
                            }
                          >
                            {campaign.verificationStatus === "verified"
                              ? "Approved"
                              : campaign.verificationStatus === "pending"
                                ? "In review"
                                : "Not verified"}
                          </Tag>
                          <span>{campaign.donorCount.toLocaleString()} donors</span>
                        </p>
                        <p className="mt-2 text-[12px] text-muted-ink">
                          Last gift{" "}
                          {campaign.lastDonationDate
                            ? givingDate(campaign.lastDonationDate)
                            : "Not yet"}
                        </p>
                      </div>
                      <div className="w-full shrink-0 sm:w-44">
                        <p className="mb-1.5 text-right text-[13px] text-ink">
                          {formatMoney(campaign.raised)}
                          <span className="text-muted-ink">
                            {campaign.goalAmount
                              ? ` of ${formatMoney(campaign.goalAmount)}`
                              : " so far"}
                          </span>
                        </p>
                        {campaign.goalAmount ? (
                          <Segments
                            pct={Math.min(
                              100,
                              Math.max(
                                0,
                                Math.round((campaign.raised / campaign.goalAmount) * 100),
                              ),
                            )}
                            count={14}
                          />
                        ) : (
                          <p className="text-right text-[12px] text-muted-ink">No target</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ManagementPanel>
            <ManagementPanel title="Recent gifts">
              {!data.recentDonations.length ? (
                <ManagementEmpty>Gifts show up here as they arrive.</ManagementEmpty>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {data.recentDonations.map((donation) => (
                    <li key={donation.id} className="flex items-start gap-3 px-5 py-3.5">
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-panel text-sm font-semibold text-ink-soft"
                        aria-hidden="true"
                      >
                        {donation.donorName.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm text-ink-soft">
                          <span className="font-medium text-ink">{donation.donorName}</span> gave{" "}
                          <span className="font-medium text-ink">
                            {formatMoney(donation.amount)}
                          </span>
                        </p>
                        <Link
                          to="/campaign/$id"
                          params={{ id: donation.campaignId }}
                          className="block truncate text-[12px] text-muted-ink hover:text-ink"
                        >
                          {donation.campaignTitle}
                        </Link>
                        <time dateTime={donation.date} className="text-[12px] text-subtle">
                          {givingDate(donation.date)}
                        </time>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ManagementPanel>
          </div>
          <aside className="flex min-w-0 flex-col gap-6">
            <ManagementPanel title="Organization notices">
              {!data.notifications.length ? (
                <ManagementEmpty>No new notices.</ManagementEmpty>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {data.notifications.map((notice) => (
                    <li key={notice.id} className="px-5 py-3.5">
                      <p className="text-sm font-medium text-ink">{notice.title}</p>
                      <p className="mt-1 break-words text-[13px] text-ink-soft">{notice.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </ManagementPanel>
            <div className="flex flex-col gap-4 rounded-card border border-line-soft p-5">
              <h2 className="text-[15px] font-semibold text-ink">What to know</h2>
              <div>
                <p className="text-sm font-medium text-ink">Review status</p>
                <p className="mt-1 text-[13px] text-muted-ink">
                  Only approved organizations and campaigns are visible to donors.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Reapplication</p>
                <p className="mt-1 text-[13px] text-muted-ink">
                  After rejection, you can edit your organization and resubmit once the 30-day
                  waiting period ends.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Anonymous gifts</p>
                <p className="mt-1 text-[13px] text-muted-ink">
                  Supporters who choose anonymity appear as Anonymous Donor.
                </p>
              </div>
            </div>
          </aside>
        </div>
        <PayoutSettings userId={userId!} organizationId={id} appearance="app" />
      </Container>
    </AppShell>
  );
}
