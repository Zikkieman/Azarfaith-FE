import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Building2,
  Check,
  FileText,
  HandHeart,
  Landmark,
  Megaphone,
  Plus,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { DashboardShell } from "@/components/app/DashboardShell";
import { PageSpinner } from "@/components/PageSpinner";
import { fetchSession } from "@/features/auth/authSlice";
import { getDashboard } from "@/features/catalog/api";
import { ApiError } from "@/lib/api";
import { dashboardStatus, type DashboardReview, type UserDashboard } from "@/lib/dashboard";
import { useRequireAuth } from "@/lib/useRequireAuth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard | AzarFaith" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: Dashboard,
});

const money = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

function Dashboard() {
  const isAuthed = useRequireAuth();
  const [mounted, setMounted] = useState(false);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const dispatch = useAppDispatch();
  const [organizationId, setOrganizationId] = useState<string>();
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ["dashboard", userId, organizationId],
    queryFn: () => getDashboard(organizationId),
    enabled: isAuthed && mounted,
    retry: (attempt, err) =>
      !(err instanceof ApiError && [401, 403, 404].includes(err.status)) && attempt < 1,
    staleTime: 0,
  });

  // The session can resolve before this lazy route hydrates; match the server's first render.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (error instanceof ApiError && [401, 403].includes(error.status)) dispatch(fetchSession());
  }, [error, dispatch]);

  if (!isAuthed || !mounted) return <PageSpinner label="Checking your session..." />;
  return (
    <DashboardShell>
      {error ? (
        <section role="alert" className="dashboard-panel mx-auto max-w-lg p-8 text-center">
          <h1 className="text-xl font-semibold">We couldn't load your dashboard</h1>
          <p className="mt-3 text-sm text-[#777283]">{error.message}</p>
          <button
            type="button"
            className="dashboard-button mt-5"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? "Trying again..." : "Try again"}
          </button>
          {organizationId && (
            <button
              type="button"
              className="dashboard-button secondary mt-5 ml-2"
              onClick={() => setOrganizationId(undefined)}
            >
              Reset selection
            </button>
          )}
        </section>
      ) : isPending || !data ? (
        <PageSpinner label="Loading your dashboard..." />
      ) : (
        <div className="space-y-8">
          <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#777283]">
                Your dashboard
              </p>
              <h1 className="text-[clamp(28px,2.8vw,40px)] font-medium leading-tight tracking-[-0.03em]">
                Welcome back, {data.fullName.split(" ")[0]}
              </h1>
              <p className="mt-2 text-[15px] text-[#777283]">
                Your giving, campaigns, and next steps in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/manage" className="dashboard-button secondary">
                Manage workspace <ArrowUpRight size={16} />
              </Link>
              <Link to="/create" className="dashboard-button">
                <Plus size={16} /> New campaign
              </Link>
            </div>
          </header>

          <section aria-label="Your giving summary">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Your giving</h2>
              <Link to="/my-giving" className="text-sm font-medium underline underline-offset-4">
                Giving history
              </Link>
            </div>
            <div className="grid gap-3 min-[390px]:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Lifetime given"
                value={money(data.giving.lifetime)}
                icon={<HandHeart size={18} />}
              />
              <Metric
                label="Given this month"
                value={money(data.giving.thisMonth)}
                note="Calendar month · UTC"
              />
              <Metric
                label="Campaigns supported"
                value={data.giving.campaignsSupported.toLocaleString()}
              />
              <Metric
                label="Active recurring gifts"
                value={data.giving.activeRecurring.toLocaleString()}
              />
            </div>
          </section>

          <section className="space-y-5" aria-label="Your fundraising">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="text-base font-semibold">Your fundraising</h2>
              <label className="flex min-w-0 flex-col gap-1 text-xs text-[#777283] sm:w-72">
                View organization or personal campaigns
                <select
                  className="w-full rounded-xl border border-[#dcd9e3] bg-white px-3 py-2.5 text-sm text-[#130e30]"
                  value={data.selectedOrganization?.id ?? "personal"}
                  onChange={(event) => setOrganizationId(event.target.value)}
                >
                  <option value="personal">Personal campaigns</option>
                  {data.organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                      {org.isDraft ? " (draft)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {data.selectedOrganization && <OrganizationBanner data={data} />}
            <div className="grid gap-3 min-[390px]:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Received this month"
                value={money(data.overview.thisMonthReceived)}
                note="Successful gifts · UTC"
              />
              <Metric
                label="Gifts received"
                value={data.overview.giftsReceived.toLocaleString()}
                note={`${money(data.overview.totalReceived)} all time`}
              />
              <Metric
                label="Recurring supporters"
                value={data.overview.recurringSupporters.toLocaleString()}
                note="Unique supporters · excludes paused gifts"
              />
              <Metric
                label="Live campaigns"
                value={data.overview.liveCampaigns.toLocaleString()}
                note={`${data.overview.pendingCampaigns} in review`}
              />
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 space-y-6">
                <Panel
                  title="Campaigns"
                  action={
                    <Link to="/create" className="text-sm font-medium">
                      + New
                    </Link>
                  }
                >
                  {!data.campaigns.length ? (
                    <Empty>
                      No campaigns here yet. Create one or switch to another organization.
                    </Empty>
                  ) : (
                    <ul className="divide-y divide-[#efedf3]">
                      {data.campaigns.map((campaign) => (
                        <CampaignRow key={campaign.id} campaign={campaign} />
                      ))}
                    </ul>
                  )}
                </Panel>
                <Panel title="Recent gifts">
                  {!data.recentGifts.length ? (
                    <Empty>Successful gifts will appear here when they arrive.</Empty>
                  ) : (
                    <ul className="divide-y divide-[#efedf3]">
                      {data.recentGifts.map((gift) => (
                        <li key={gift.id} className="flex items-start gap-3 px-5 py-4">
                          <span
                            aria-hidden="true"
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5f4f7] text-sm font-semibold"
                          >
                            {gift.donorName.charAt(0)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-relaxed">
                              <span className="font-medium">{gift.donorName}</span> gave{" "}
                              <span className="font-medium">{money(gift.amount)}</span>
                            </p>
                            <Link
                              to="/campaign/$id"
                              params={{ id: gift.campaignId }}
                              className="mt-1 block text-xs text-[#777283] hover:underline"
                            >
                              {gift.campaignTitle}
                            </Link>
                            <time
                              dateTime={gift.date}
                              className="mt-1 block text-xs text-[#777283]"
                            >
                              {new Date(gift.date).toLocaleDateString("en-NG", {
                                dateStyle: "medium",
                                timeZone: "UTC",
                              })}
                            </time>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
              <aside className="min-w-0 space-y-5">
                <section className="dashboard-panel space-y-3 p-5" aria-label="Payout balance">
                  <p className="text-[13px] font-medium text-[#777283]">Available to pay out</p>
                  <p className="break-words text-3xl font-medium tracking-tight">
                    {money(data.payout.availableBalance)}
                  </p>
                  <p className="text-xs leading-relaxed text-[#777283]">
                    After platform fees and released or reserved transfers. Payouts are reviewed and
                    released by an admin.
                  </p>
                  {data.payout.account ? (
                    <p className="rounded-xl bg-[#f5f4f7] p-3 text-xs leading-relaxed">
                      {data.payout.account.bankName} · ending{" "}
                      {data.payout.account.accountNumberLast4}
                      <br />
                      {data.payout.account.status === "verified"
                        ? "Account verified"
                        : "Account awaiting verification"}
                    </p>
                  ) : (
                    <p className="text-sm text-[#777283]">
                      Add a payout account in your profile to receive funds.
                    </p>
                  )}
                  {data.selectedOrganization && !data.selectedOrganization.isDraft ? (
                    <Link
                      to="/manage/org/$id"
                      params={{ id: data.selectedOrganization.id }}
                      className="dashboard-button secondary"
                    >
                      View payout details <ArrowUpRight size={14} />
                    </Link>
                  ) : (
                    <Link to="/profile" className="dashboard-button secondary">
                      {data.payout.account ? "View payout details" : "Add payout account"}{" "}
                      <ArrowUpRight size={14} />
                    </Link>
                  )}
                </section>
                <QuickStart data={data} />
              </aside>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function OrganizationBanner({ data }: { data: UserDashboard }) {
  const org = data.selectedOrganization!;
  const needsReview = org.verificationStatus !== "verified" || org.isDraft;
  return (
    <section className="dashboard-panel overflow-hidden">
      <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          {org.cover ? (
            <img src={org.cover} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
          ) : (
            <Building2 className="h-10 w-10 shrink-0 rounded-xl bg-[#f5f4f7] p-2" />
          )}
          <div className="min-w-0">
            <h3 className="break-words text-base font-semibold">{org.name}</h3>
            <p className="text-xs text-[#777283]">{org.location}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Status record={org} />
          {org.isDraft ? (
            <Link
              to="/register-org"
              search={{ draftId: org.id }}
              className="text-sm font-medium underline"
            >
              Continue draft
            </Link>
          ) : (
            <Link to="/org/$id" params={{ id: org.id }} className="text-sm font-medium underline">
              {org.verificationStatus === "verified" ? "Public page" : "Preview"}
            </Link>
          )}
        </div>
      </div>
      {needsReview && (
        <div className="border-t border-[#efedf3] bg-[#faf9fc] px-5 py-4 text-sm leading-relaxed text-[#686174]">
          {org.isDraft
            ? "Your organization is saved as a draft. Complete and submit it when you're ready."
            : org.reviewAction === "rejected"
              ? "Your organization was not approved. Open its management page to review the decision and reapplication options."
              : org.reviewAction === "more_info_requested"
                ? "The review team needs more information. Open your organization to review and respond."
                : "Your organization is awaiting review. It will be visible to donors once approved."}
          {org.reviewReason && <p className="mt-2 font-medium">Review note: {org.reviewReason}</p>}
        </div>
      )}
    </section>
  );
}

function CampaignRow({ campaign }: { campaign: UserDashboard["campaigns"][number] }) {
  const progress = campaign.goal
    ? Math.min(100, Math.max(0, (campaign.raised / campaign.goal) * 100))
    : null;
  return (
    <li className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {campaign.cover && (
          <img src={campaign.cover} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
        )}
        <div className="min-w-0 flex-1">
          {campaign.isDraft ? (
            <Link
              to="/create"
              search={{ draftId: campaign.id }}
              className="break-words text-sm font-medium hover:underline"
            >
              {campaign.title || "Untitled draft"}
            </Link>
          ) : (
            <Link
              to="/campaign/$id"
              params={{ id: campaign.id }}
              className="break-words text-sm font-medium hover:underline"
            >
              {campaign.title}
            </Link>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Status record={campaign} />
            <span className="text-xs text-[#777283]">{campaign.giftCount} gifts</span>
          </div>
          {campaign.reviewReason && (
            <p className="mt-2 text-xs text-[#777283]">Review note: {campaign.reviewReason}</p>
          )}
        </div>
      </div>
      <div className="w-full shrink-0 sm:w-44">
        <p className="mb-2 text-sm sm:text-right">
          {money(campaign.raised)}{" "}
          <span className="text-[#777283]">
            {campaign.goal ? `of ${money(campaign.goal)}` : "so far"}
          </span>
        </p>
        {progress !== null ? (
          <div
            role="progressbar"
            aria-label={`${campaign.title} fundraising progress`}
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 overflow-hidden rounded-full bg-[#efedf3]"
          >
            <div className="h-full rounded-full bg-[#ff8a39]" style={{ width: `${progress}%` }} />
          </div>
        ) : (
          <p className="text-xs text-[#777283] sm:text-right">
            {campaign.mode === "ongoing" ? "Ongoing support" : "No financial goal"}
          </p>
        )}
      </div>
    </li>
  );
}

function QuickStart({ data }: { data: UserDashboard }) {
  const steps = [
    {
      title: "Register an organization",
      done: data.organizations.some((org) => !org.isDraft),
      icon: Building2,
      to: "/register-org" as const,
    },
    {
      title: "Add registration evidence",
      done: data.organizations.some((org) => org.hasRegistrationDocuments),
      icon: FileText,
      to: "/manage" as const,
    },
    {
      title: "Set up your payout account",
      done: Boolean(data.payout.account),
      icon: Landmark,
      to: "/profile" as const,
    },
    {
      title: "Create a campaign",
      done: data.campaigns.length > 0,
      icon: Megaphone,
      to: "/create" as const,
    },
  ];
  return (
    <section className="dashboard-panel p-5">
      <h3 className="text-sm font-semibold">Next steps</h3>
      <p className="mt-1 text-xs leading-relaxed text-[#777283]">
        Organization registration is optional for personal fundraising.
      </p>
      <ul className="mt-4 space-y-4">
        {steps.map(({ title, done, icon: Icon, to }) => (
          <li key={title} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${done ? "bg-[#edf6f1] text-[#297a55]" : "bg-[#fff2e8] text-[#b45a1c]"}`}
            >
              {done ? <Check size={16} /> : <Icon size={16} />}
            </span>
            <Link to={to} className="text-sm hover:underline">
              {title}
              <span className="sr-only">{done ? " (completed)" : " (not completed)"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="dashboard-panel min-w-0 p-5">
      <p className="flex items-center justify-between gap-3 text-[13px] text-[#777283]">
        {label}
        {icon}
      </p>
      <p className="mt-3 break-words text-[24px] font-medium leading-tight tracking-tight md:text-[28px]">
        {value}
      </p>
      {note && <p className="mt-2 text-xs leading-relaxed text-[#777283]">{note}</p>}
    </div>
  );
}

function Status({ record }: { record: DashboardReview }) {
  const { label, tone } = dashboardStatus(record);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${tone === "success" ? "bg-[#edf6f1] text-[#297a55]" : tone === "attention" ? "bg-[#fff2e8] text-[#b45a1c]" : "bg-[#f5f4f7] text-[#777283]"}`}
    >
      {label}
    </span>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="dashboard-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#efedf3] px-5 py-4">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="px-5 py-10 text-center text-sm leading-relaxed text-[#777283]">{children}</p>
  );
}
