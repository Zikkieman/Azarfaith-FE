import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Camera,
  Check,
  ChevronDown,
  HandHeart,
  Lock,
  Megaphone,
  MessageSquareHeart,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/app/Skeletons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteCampaignDraft, deleteOrganizationDraft, getDashboard } from "@/features/catalog/api";
import { apiFetch, ApiError } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchSession } from "@/features/auth/authSlice";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { PageSpinner } from "@/components/PageSpinner";
import { PayoutRequests } from "@/components/profile/PayoutRequests";
import {
  dashboardStatus,
  dashboardMonthsSince,
  type UserDashboard,
  type DashboardReview,
  dashboardGiftAge,
  dashboardCompactMoney,
} from "@/lib/dashboard";
import { AppShell, Container, Tag } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { Segments } from "@/components/app/Segments";
import { formatMoney } from "@/lib/catalog";
const formatCompactMoney = dashboardCompactMoney;
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Manage — AzarFaith" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: Manage,
});

function Manage() {
  const authed = useRequireAuth();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [mounted, setMounted] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>();
  const query = useQuery({
    queryKey: ["dashboard", userId, organizationId],
    queryFn: () => getDashboard(organizationId),
    enabled: authed && mounted,
    retry: (attempt, error) =>
      !(error instanceof ApiError && [401, 403, 404].includes(error.status)) && attempt < 1,
    staleTime: 0,
  });
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (query.error instanceof ApiError && [401, 403].includes(query.error.status))
      void dispatch(fetchSession());
  }, [query.error, dispatch]);
  if (!authed || !mounted) return <PageSpinner label="Checking your session..." />;
  if (query.isPending) return <DashboardSkeleton />;
  if (query.isError || !query.data)
    return (
      <AppShell>
        <Container className="py-8 md:py-12">
          <section
            role="alert"
            className="flex flex-col items-start gap-4 rounded-card border border-line-soft p-5"
          >
            <h1 className="font-display text-[22px] text-ink">We couldn't load your dashboard</h1>
            <p className="text-sm text-ink-soft">{query.error?.message ?? "Please try again."}</p>
            <button
              type="button"
              className={btn("primary")}
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Try again
            </button>
            {organizationId ? (
              <button
                type="button"
                className={btn("secondary")}
                onClick={() => setOrganizationId(undefined)}
              >
                Reset selection
              </button>
            ) : null}
          </section>
        </Container>
      </AppShell>
    );
  const data = query.data;
  const org = data.selectedOrganization;
  const campaigns = data.campaigns;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <AppShell>
      <Container className="flex flex-col gap-8 py-8 md:py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-[clamp(28px,2.8vw,40px)] leading-[1.1] tracking-[-0.03em] text-ink">
              {greeting}, {data.fullName.split(" ")[0]}
            </h1>
            <p className="mt-1 text-[15px] text-ink-soft">
              {org
                ? "Here's how " + org.name + " is doing."
                : campaigns.length
                  ? "Here's how your fundraising is doing."
                  : "Get your church or ministry ready to receive gifts on AzarFaith."}
            </p>
          </div>
          {org || campaigns.length ? (
            <div className="flex gap-2">
              {!org && data.organizations.length ? (
                <OrganizationSwitcher data={data} onSelect={setOrganizationId} />
              ) : null}
              {org ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={org.isDraft ? "/register-org" : "/org/$id"}
                    params={{ id: org.id }}
                    search={org.isDraft ? { draftId: org.id } : {}}
                    className={btn("secondary")}
                  >
                    {org.isDraft
                      ? "Continue draft"
                      : org.verificationStatus === "verified"
                        ? "Public page"
                        : "Preview"}
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                  </Link>
                  {org.isDraft ? (
                    <DraftDeleteButton
                      id={org.id}
                      kind="organization"
                      onDeleted={() => {
                        setOrganizationId(undefined);
                        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
              <Link to="/create" className={btn("primary")}>
                <Plus className="h-4 w-4" strokeWidth={2} /> New campaign
              </Link>
            </div>
          ) : null}
        </div>
        {!org && !campaigns.length && data.organizations.length ? (
          <OrganizationSwitcher data={data} onSelect={setOrganizationId} />
        ) : null}
        {org || campaigns.length ? (
          <OrgDesk data={data} onSelect={setOrganizationId} />
        ) : (
          <QuickStart data={data} />
        )}
      </Container>
    </AppShell>
  );
}

function OrganizationSwitcher({
  data,
  onSelect,
  inline = false,
}: {
  data: UserDashboard;
  onSelect: (id: string) => void;
  inline?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="View organization or personal campaigns"
          className={
            inline ? "inline-flex min-w-0 items-center gap-2 text-left" : btn("secondary", "sm")
          }
        >
          <span>{data.selectedOrganization?.name ?? "Personal campaigns"}</span>
          {!inline ? <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2} /> : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="designer-app w-60 max-w-[calc(100vw-32px)] rounded-field border border-line-soft bg-paper p-1.5 shadow-none"
      >
        {[
          { id: "personal", name: "Personal campaigns", isDraft: false },
          ...data.organizations,
        ].map((org) => (
          <DropdownMenuItem
            key={org.id}
            onSelect={() => onSelect(org.id)}
            className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2.5 font-gsf text-sm text-ink focus:bg-panel"
          >
            <span className="min-w-0 flex-1 break-words">
              {org.name}
              {org.isDraft ? " (draft)" : ""}
            </span>
            {org.id === (data.selectedOrganization?.id ?? "personal") ? (
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
        {data.selectedOrganization ? (
          <DropdownMenuItem
            asChild
            className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2.5 font-gsf text-sm text-ink focus:bg-panel"
          >
            <Link
              to={data.selectedOrganization.isDraft ? "/register-org" : "/manage/org/$id"}
              params={{ id: data.selectedOrganization.id }}
              search={
                data.selectedOrganization.isDraft ? { draftId: data.selectedOrganization.id } : {}
              }
            >
              {data.selectedOrganization.isDraft ? "Continue draft" : "Manage organization"}
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Before an organization exists: quick-start guide ─── */

type Step = { title: string; body: string; cta: string; to: string };
type Group = { title: string; icon: LucideIcon; steps: Step[] };

const groups: Group[] = [
  {
    title: "Set up your organization",
    icon: Building2,
    steps: [
      {
        title: "Register your organization",
        body: "Your name, what you do and where. This becomes your public page.",
        cta: "Register",
        to: "/register-org",
      },
      {
        title: "Upload your CAC certificate",
        body: "We check it matches your name before anyone can give. Submit your registration evidence for admin review.",
        cta: "Upload documents",
        to: "/register-org",
      },
      {
        title: "Add your payout account",
        body: "Gifts land here. Save your account in your profile to use it for your campaigns.",
        cta: "Add account",
        to: "/profile",
      },
    ],
  },
  {
    title: "Launch your first campaign",
    icon: Megaphone,
    steps: [
      {
        title: "Start a campaign",
        body: "Pick a template, say what you need and what it costs.",
        cta: "Start a campaign",
        to: "/create",
      },
      {
        title: "Add at least 3 real photos",
        body: "Campaigns with photos of the actual work raise far more than ones without.",
        cta: "Add photos",
        to: "/create",
      },
      {
        title: "Share it with your congregation",
        body: "Your own people give first. Their gifts give strangers the confidence to follow.",
        cta: "Get your link",
        to: "/create",
      },
    ],
  },
  {
    title: "Keep givers close",
    icon: HandHeart,
    steps: [
      {
        title: "Post your first update",
        body: "A photo and two lines on what the money did. Givers who hear back give again.",
        cta: "Write an update",
        to: "/create",
      },
      {
        title: "Thank your first givers",
        body: "A short note from you means more than any receipt.",
        cta: "See givers",
        to: "/create",
      },
    ],
  },
];

function QuickStart({ data }: { data: UserDashboard }) {
  const [open, setOpen] = useState<string | null>(groups[0].steps[0].title);
  const completed = [
    data.organizations.some((org) => !org.isDraft),
    data.organizations.some((org) => org.hasRegistrationDocuments),
    Boolean(data.payout.account),
    data.campaigns.length > 0,
    data.campaigns.some((c) => (c.galleryCount ?? 0) >= 3),
    false,
    data.campaigns.some((c) => Boolean(c.lastUpdateAt)),
    false,
  ];
  const total = groups.reduce((n, g) => n + g.steps.length, 0);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-[22px] leading-tight text-ink">Quick start guide</h2>
          <p className="text-sm text-muted-ink">
            {completed.filter(Boolean).length} of {total} done
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <div key={g.title} className="overflow-hidden rounded-card border border-line-soft">
              <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-panel text-ink-soft">
                  <g.icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <p className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <span className="text-[15px] font-semibold text-ink">{g.title}</span>
                  <span className="shrink-0 text-[13px] text-muted-ink">
                    {
                      g.steps.filter(
                        (step) =>
                          !completed[
                            groups
                              .flatMap((group) => group.steps)
                              .findIndex((candidate) => candidate.title === step.title)
                          ],
                      ).length
                    }{" "}
                    steps to do
                  </span>
                </p>
              </div>
              <ul className="divide-y divide-line-soft border-t border-line-soft">
                {g.steps.map((s) => {
                  const index = groups
                    .flatMap((group) => group.steps)
                    .findIndex((step) => step.title === s.title);
                  const done = completed[index];
                  const isOpen = open === s.title;
                  return (
                    <li key={s.title}>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : s.title)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-panel/50 sm:px-5"
                      >
                        <span
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                            done
                              ? "bg-verified text-white"
                              : "border border-dashed border-line-input",
                          )}
                        >
                          {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                        </span>
                        <span className="flex-1 text-sm text-ink">{s.title}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-ink transition-transform duration-200",
                            isOpen && "rotate-180",
                          )}
                          strokeWidth={2}
                        />
                      </button>
                      <div className="expand" data-open={isOpen ? "" : undefined}>
                        <div>
                          <div className="flex flex-col items-start gap-3 pb-4 pl-[48px] pr-4 sm:pl-[52px] sm:pr-5">
                            <p className="text-sm leading-[1.6] text-ink-soft">{s.body}</p>
                            <Link to={s.to as "/create"} className={btn("primary", "sm")}>
                              {s.cta}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-card border border-line-soft p-5">
          <p className="text-[13px] font-medium text-subtle">Your organization</p>
          <p className="text-[15px] font-semibold text-ink">Not registered yet</p>
          <p className="text-sm text-ink-soft">
            Register first. Verified organizations get the green tick and reach more givers.
          </p>
          <Link to="/register-org" className={cn(btn("primary", "sm"), "self-start")}>
            Register your organization
          </Link>
        </div>
        <div className="flex flex-col gap-1 rounded-card border border-line-soft p-5">
          <p className="pb-2 text-[13px] font-medium text-subtle">Learn the basics</p>
          {[
            { label: "How verification works", page: "verification" },
            { label: "Fees and pricing", page: "fees-pricing" },
            { label: "How payouts work", page: "payouts" },
            { label: "Writing updates givers read", page: "guidelines" },
          ].map((l) => (
            <Link
              key={l.page}
              to="/$page"
              params={{ page: l.page }}
              className="-mx-2 flex items-center justify-between rounded-[8px] px-2 py-2 text-sm text-ink transition-colors hover:bg-panel"
            >
              {l.label}
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-ink" strokeWidth={2} />
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}

/* ─── With an organization: the desk ─── */

const monthsSince = dashboardMonthsSince;

function OrgDesk({ data, onSelect }: { data: UserDashboard; onSelect: (id: string) => void }) {
  const org = data.selectedOrganization;
  const campaigns = data.campaigns;
  const verified = Boolean(org && !org.isDraft && org.verificationStatus === "verified");
  const gifts = data.recentGifts.slice(0, 6);
  const regular = data.overview.recurringSupporters;
  const available = data.payout.availableBalance;
  const photoTodo = campaigns.find((c) => typeof c.galleryCount === "number" && c.galleryCount < 3);
  const stale = campaigns.filter(
    (c) => !c.isDraft && (!c.lastUpdateAt || monthsSince(c.lastUpdateAt) >= 1),
  );

  return (
    <div className="flex flex-col gap-6">
      {org ? (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-line-soft p-4">
          <DeskPhoto src={org.cover} className="h-11 w-11 rounded-field object-cover" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <OrganizationSwitcher data={data} onSelect={onSelect} inline />
              {verified ? <BadgeCheck className="h-4 w-4 text-verified" strokeWidth={2} /> : null}
            </p>
            <p className="text-[13px] text-muted-ink">{org.location}</p>
          </div>
          {verified ? (
            <Tag tone="verified">Verified</Tag>
          ) : (
            <Tag tone="attention">{dashboardStatus(org).label}</Tag>
          )}
        </div>
      ) : null}

      {org && !verified ? <ReviewProgress data={data} /> : null}

      <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-line-soft lg:grid-cols-4">
        {[
          {
            label: "Given this month",
            value: formatCompactMoney(data.overview.thisMonthReceived),
          },
          {
            label: data.overview.givers === undefined ? "Gifts" : "Givers",
            value: (data.overview.givers ?? data.overview.giftsReceived).toLocaleString(),
          },
          { label: "Regular givers", value: regular.toLocaleString() },
          {
            label: "Live campaigns",
            value: data.overview.liveCampaigns.toString(),
          },
        ].map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "flex flex-col gap-1.5 p-5",
              i % 2 === 1 && "border-l border-line-soft",
              i >= 2 && "border-t border-line-soft lg:border-t-0",
              i === 2 && "lg:border-l",
            )}
          >
            <dt className="text-[13px] text-muted-ink">{s.label}</dt>
            <dd className="font-display text-[24px] leading-none tracking-[-0.02em] text-ink">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Campaigns"
            action={
              <Link
                to="/create"
                className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} /> New
              </Link>
            }
          >
            {campaigns.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-ink">
                No campaigns yet. Start one and share it with your congregation first.
              </p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {campaigns.map((c) => (
                  <CampaignRow key={c.id} c={c} organizationPublished={!org || verified} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent gifts">
            {gifts.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-ink">
                Gifts show up here as they arrive.
              </p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {gifts.map((g) => (
                  <li key={g.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-panel text-sm font-semibold text-ink-soft">
                      {g.donorName.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-soft">
                        <span className="font-medium text-ink">{g.donorName}</span> gave{" "}
                        <span className="font-medium text-ink">{formatMoney(g.amount)}</span>
                        <span className="text-subtle">
                          ,{" "}
                          <time
                            dateTime={g.date}
                            title={new Date(g.date).toLocaleDateString("en-NG", {
                              dateStyle: "medium",
                              timeZone: "UTC",
                            })}
                          >
                            {dashboardGiftAge(g.date)}
                          </time>
                        </span>
                      </p>
                      <Link
                        to="/campaign/$id"
                        params={{ id: g.campaignId }}
                        className="block truncate text-[12px] text-muted-ink hover:underline"
                      >
                        {g.campaignTitle}
                      </Link>
                      {g.note ? (
                        <p className="mt-1.5 rounded-[12px] rounded-tl-[4px] bg-panel px-3 py-2 text-sm text-ink">
                          {g.note}
                        </p>
                      ) : null}
                    </div>
                    {g.canThank ? <ThankDonor donationId={g.id} donorName={g.donorName} /> : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="relative flex flex-col gap-3 rounded-card border border-line-soft p-5">
            <p className="text-[13px] font-medium text-subtle">Available to pay out</p>
            <p className="font-display text-[30px] leading-none tracking-[-0.02em] text-ink">
              {formatMoney(available)}
            </p>
            {data.payout.account?.status === "verified" && (!org || verified) ? (
              <p className="text-sm text-ink-soft">
                Released after admin approval to your account ending{" "}
                {data.payout.account.accountNumberLast4}.
              </p>
            ) : (
              <p className="flex gap-2 rounded-field bg-panel px-3 py-2.5 text-[13px] text-ink-soft">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                {org && !verified
                  ? "Payouts open once your organization and payout account are verified."
                  : data.payout.account
                    ? "Your payout account is awaiting verification."
                    : "Save a payout account before requesting a transfer."}
              </p>
            )}
            <PayoutRequests
              appearance="designer"
              className={cn(btn("secondary", "sm"), "self-start")}
              key={org?.id ?? "personal"}
              organizationId={org?.id}
              balance={available}
              verified={data.payout.account?.status === "verified" && (!org || verified)}
              detailsLink={
                <Link
                  to={org && !org.isDraft ? "/manage/org/$id" : "/profile"}
                  params={{ id: org?.id ?? "" }}
                  hash="payouts"
                >
                  View payout details
                </Link>
              }
            />
          </div>

          <div className="flex flex-col gap-1 rounded-card border border-line-soft p-5">
            <p className="pb-2 text-[13px] font-medium text-subtle">To do</p>
            {stale.map((c) => (
              <Todo
                key={c.id}
                icon={MessageSquareHeart}
                text={`Post an update on "${c.title}"`}
                note="Givers haven't heard from you in a while"
                campaignId={c.id}
              />
            ))}
            {campaigns.some((c) => typeof c.galleryCount === "number" && c.galleryCount < 3) ? (
              <Todo
                icon={Camera}
                text="Add more photos to your campaigns"
                note="Aim for at least 3 per campaign"
                campaignId={photoTodo?.id}
                draftId={photoTodo?.isDraft ? photoTodo.id : undefined}
              />
            ) : null}
            {!stale.length &&
            !campaigns.some((c) => typeof c.galleryCount === "number" && c.galleryCount < 3) ? (
              <p className="text-sm text-muted-ink">You're up to date.</p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReviewProgress({ data }: { data: UserDashboard }) {
  const org = data.selectedOrganization!;
  const status = dashboardStatus(org);
  const steps = [
    { label: "Application received", done: !org.isDraft && Boolean(org.submittedAt) },
    { label: "Documents checked", done: data.reviewProgress?.documentsChecked === true },
    { label: "Payout account verified", done: data.payout.account?.status === "verified" },
    { label: "Leadership checked", done: data.reviewProgress?.leadershipChecked === true },
  ];
  return (
    <div className="flex flex-col gap-4 rounded-card border border-line-soft bg-panel/50 p-5">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <ShieldCheck className="h-4 w-4 text-ink-soft" strokeWidth={2} />
        {status.label === "In review" ? "We're reviewing your organization" : status.label}
      </p>
      <p className="text-sm text-ink-soft">
        {org.isDraft
          ? "Your organization is saved as a draft. Complete and submit it when you're ready."
          : org.reviewAction === "rejected"
            ? "Open your organization to review the decision and reapplication options."
            : org.reviewAction === "more_info_requested"
              ? "The review team needs more information. Open your organization to respond."
              : "Our team is reviewing your details. You can prepare campaigns now; they go live once approved."}
      </p>
      {org.reviewReason ? (
        <p className="text-sm text-ink-soft">Review note: {org.reviewReason}</p>
      ) : null}
      <ol className="grid gap-2 sm:grid-cols-4">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-[13px]">
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                step.done ? "bg-verified text-white" : "border border-dashed border-line-input",
              )}
            >
              {step.done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </span>
            <span className={step.done ? "text-ink" : "text-muted-ink"}>{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CampaignRow({
  c,
  organizationPublished,
}: {
  c: UserDashboard["campaigns"][number];
  organizationPublished: boolean;
}) {
  const pct = c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : null;
  const last = c.lastUpdateAt;
  const months = last ? monthsSince(last) : null;
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <DeskPhoto
        src={c.cover}
        className="hidden h-11 w-11 shrink-0 rounded-[10px] object-cover sm:block"
      />
      <div className="min-w-0 flex-1">
        <Link
          to={c.isDraft ? "/create" : "/campaign/$id"}
          params={{ id: c.id }}
          search={c.isDraft ? { draftId: c.id } : {}}
          className="line-clamp-1 text-sm font-medium text-ink hover:underline"
        >
          {c.title}
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted-ink">
          <Status record={c} organizationPublished={organizationPublished} />
          <span>
            {(c.givers ?? c.giftCount).toLocaleString()}{" "}
            {c.givers === undefined ? "gifts" : "givers"}
          </span>
          {months !== null && months >= 1 ? (
            <span className="text-brand-ink">
              Last update {months} month{months > 1 ? "s" : ""} ago
            </span>
          ) : null}
        </p>
        {c.reviewReason ? (
          <p className="mt-1 text-[12px] text-muted-ink">Review note: {c.reviewReason}</p>
        ) : null}
      </div>
      <div className="w-full shrink-0 sm:w-44">
        <p className="mb-1.5 text-right text-[13px] text-ink">
          {formatCompactMoney(c.raised)}
          <span className="text-muted-ink">
            {c.goal ? ` of ${formatCompactMoney(c.goal)}` : " so far"}
          </span>
        </p>
        {pct !== null ? (
          <Segments pct={pct} count={14} />
        ) : (
          <p className="text-right text-[12px] text-muted-ink">Regular giving</p>
        )}
        {c.isDraft ? (
          <div className="mt-3 flex justify-end gap-2">
            <Link to="/create" search={{ draftId: c.id }} className={btn("secondary", "sm")}>
              Continue
            </Link>
            <DraftDeleteButton id={c.id} kind="campaign" />
          </div>
        ) : null}
      </div>
    </li>
  );
}

function DraftDeleteButton({
  id,
  kind,
  onDeleted,
}: {
  id: string;
  kind: "organization" | "campaign";
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const label = kind === "organization" ? "organization" : "campaign";
  const remove = useMutation({
    mutationFn: () => (kind === "organization" ? deleteOrganizationDraft(id) : deleteCampaignDraft(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`${label[0].toUpperCase()}${label.slice(1)} draft deleted.`);
      onDeleted?.();
    },
    onError: (error: Error) => toast.error(error.message || `Could not delete this ${label} draft.`),
  });
  const confirmDelete = () => {
    if (window.confirm(`Delete this ${label} draft? This cannot be undone.`)) remove.mutate();
  };
  return (
    <button
      type="button"
      className={btn("secondary", "sm")}
      onClick={confirmDelete}
      disabled={remove.isPending}
      aria-label={`Delete ${label} draft`}
      title={`Delete ${label} draft`}
    >
      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
    </button>
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
    <section className="overflow-hidden rounded-card border border-line-soft">
      <div className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Todo({
  icon: Icon,
  text,
  note,
  campaignId,
  draftId,
}: {
  icon: LucideIcon;
  text: string;
  note: string;
  campaignId?: string;
  draftId?: string;
}) {
  return (
    <Link
      to={draftId ? "/create" : campaignId ? "/campaign/$id" : "/create"}
      params={{ id: campaignId ?? "" }}
      search={draftId ? { draftId } : {}}
      className="-mx-2 flex items-start gap-3 rounded-[8px] px-2 py-2"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-ink">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ink">{text}</span>
        <span className="block text-[12px] text-muted-ink">{note}</span>
      </span>
    </Link>
  );
}

function Status({
  record,
  organizationPublished,
}: {
  record: DashboardReview;
  organizationPublished: boolean;
}) {
  const { label, tone } = dashboardStatus(record);
  return (
    <Tag tone={tone === "success" ? "verified" : tone === "attention" ? "attention" : "neutral"}>
      {label === "Verified" ? (organizationPublished ? "Live" : "Approved") : label}
    </Tag>
  );
}

function DeskPhoto({ src, className }: { src: string | null; className: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return src && failedSrc !== src ? (
    <img src={src} alt="" className={className} onError={() => setFailedSrc(src)} />
  ) : (
    <span
      aria-hidden="true"
      className={cn(className, "grid shrink-0 place-items-center bg-panel text-ink-soft")}
    >
      <Building2 className="h-5 w-5" strokeWidth={1.5} />
    </span>
  );
}

function ThankDonor({ donationId, donorName }: { donationId: string; donorName: string }) {
  const thanks = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>(
        "/me/received-donations/" + encodeURIComponent(donationId) + "/thank-you",
        { method: "POST" },
      ),
    onSuccess: (result) => toast.success(result.message),
  });
  return (
    <div className="shrink-0">
      <button
        type="button"
        disabled={thanks.isPending || thanks.isSuccess}
        aria-label={"Thank " + donorName}
        onClick={() => thanks.mutate()}
        className={btn("secondary", "sm")}
      >
        {thanks.isPending ? "Queuing..." : thanks.isSuccess ? "Thank-you queued" : "Say thanks"}
      </button>
      {thanks.isError ? (
        <p role="alert" className="mt-2 max-w-40 text-[12px] text-danger">
          {thanks.error.message}
        </p>
      ) : null}
    </div>
  );
}
