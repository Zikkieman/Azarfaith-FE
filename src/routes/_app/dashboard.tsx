import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Camera,
  Check,
  ChevronDown,
  FileText,
  HandHeart,
  Landmark,
  Lock,
  Megaphone,
  MessageSquareHeart,
  Plus,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/app/Skeletons";
import { pending, simulateNetwork } from "@/lib/api";
import { AppShell, Container, Tag } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { Segments } from "@/components/app/Segments";
import { useApp } from "@/lib/store";
import { formatCompactMoney, formatMoney, me, type Campaign, type Org } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  loader: () => simulateNetwork(),
  pendingComponent: DashboardSkeleton,
  ...pending,
  head: () => ({ meta: [{ title: "Manage — AzarFaith" }] }),
  component: Manage,
});

const SAMPLE_ORG = "o1";

/**
 * Manage. Before there's an organization it's a quick-start guide (after Optimal Workshop);
 * afterwards it's the organization's desk: review status, money, campaigns and givers.
 */
function Manage() {
  const myOrgId = useApp((s) => s.myOrgId);
  const setMyOrgId = useApp((s) => s.setMyOrgId);
  const org = useApp((s) => (myOrgId ? s.orgs.find((o) => o.id === myOrgId) : undefined));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell>
      <Container className="flex flex-col gap-8 py-8 md:py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-[clamp(28px,2.8vw,40px)] leading-[1.1] tracking-[-0.03em] text-ink">
              {greeting}, {me.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-[15px] text-ink-soft">
              {org
                ? `Here's how ${org.name} is doing.`
                : "Get your church or ministry ready to receive gifts on AzarFaith."}
            </p>
          </div>
          {org ? (
            <div className="flex gap-2">
              <Link to="/org/$id" params={{ id: org.id }} className={btn("secondary")}>
                Public page <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
              <Link to="/create" className={btn("primary")}>
                <Plus className="h-4 w-4" strokeWidth={2} /> New campaign
              </Link>
            </div>
          ) : null}
        </div>

        {org ? <OrgDesk org={org} /> : <QuickStart />}

        <p className="rounded-field border border-dashed border-line-input px-4 py-3 text-[13px] text-muted-ink">
          Prototype:{" "}
          <button
            type="button"
            className="font-medium text-ink underline underline-offset-2"
            onClick={() => setMyOrgId(org ? null : SAMPLE_ORG)}
          >
            {org
              ? "see this page as someone without an organization"
              : "see this page as ECWA Mission Board, a verified organization"}
          </button>
        </p>
      </Container>
    </AppShell>
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
        body: "We check it matches your name before anyone can give. It usually takes 5 working days.",
        cta: "Upload documents",
        to: "/register-org",
      },
      {
        title: "Add your payout account",
        body: "Gifts land here. It must be in your organization's name, not a person's.",
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

function QuickStart() {
  const [open, setOpen] = useState<string | null>(groups[0].steps[0].title);
  const total = groups.reduce((n, g) => n + g.steps.length, 0);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-[22px] leading-tight text-ink">Quick start guide</h2>
          <p className="text-sm text-muted-ink">0 of {total} done</p>
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
                    {g.steps.length} step{g.steps.length > 1 ? "s" : ""} to do
                  </span>
                </p>
              </div>
              <ul className="divide-y divide-line-soft border-t border-line-soft">
                {g.steps.map((s) => {
                  const isOpen = open === s.title;
                  return (
                    <li key={s.title}>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : s.title)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-panel/50 sm:px-5"
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-dashed border-line-input" />
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

const monthsSince = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
};

function OrgDesk({ org }: { org: Org }) {
  const allCampaigns = useApp((s) => s.campaigns);
  const campaigns = allCampaigns.filter((c) => c.orgId === org.id);
  const verified = org.verificationStatus === "verified";
  const gifts = campaigns
    .flatMap((c) => c.donations.map((d) => ({ ...d, campaign: c })))
    .slice(0, 6);
  const regular = Math.round(org.supporters * 0.18);
  const available = verified ? Math.round(org.totalReceived * 0.031) : 0;
  const stale = campaigns.filter((c) => !c.updates[0] || monthsSince(c.updates[0].date) >= 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-line-soft p-4">
        <img src={org.photos[0]} alt="" className="h-11 w-11 rounded-field object-cover" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            {org.name}
            {verified ? <BadgeCheck className="h-4 w-4 text-verified" strokeWidth={2} /> : null}
          </p>
          <p className="text-[13px] text-muted-ink">{org.location}</p>
        </div>
        {verified ? (
          <Tag tone="verified">Verified</Tag>
        ) : (
          <Tag tone="attention">
            {org.verificationStatus === "pending" ? "In review" : "Not verified"}
          </Tag>
        )}
      </div>

      {!verified ? <ReviewProgress /> : null}

      <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-line-soft lg:grid-cols-4">
        {[
          {
            label: "Given this month",
            value: formatCompactMoney(Math.round(org.totalReceived * 0.09)),
          },
          { label: "Givers", value: org.supporters.toLocaleString() },
          { label: "Regular givers", value: regular.toLocaleString() },
          {
            label: "Live campaigns",
            value: campaigns.filter((c) => c.verificationStatus === "verified").length.toString(),
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
                  <CampaignRow key={c.id} c={c} />
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
                      {g.donor.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-soft">
                        <span className="font-medium text-ink">{g.donor}</span> gave{" "}
                        <span className="font-medium text-ink">{formatMoney(g.amount)}</span>
                        <span className="text-subtle">, {g.date} ago</span>
                      </p>
                      <p className="truncate text-[12px] text-muted-ink">{g.campaign.title}</p>
                      {g.note ? (
                        <p className="mt-1.5 rounded-[12px] rounded-tl-[4px] bg-panel px-3 py-2 text-sm text-ink">
                          {g.note}
                        </p>
                      ) : null}
                    </div>
                    {g.donor !== "Anonymous" ? (
                      <button
                        type="button"
                        onClick={() => toast(`Thank-you note sent to ${g.donor}`)}
                        className={btn("secondary", "sm")}
                      >
                        Say thanks
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-card border border-line-soft p-5">
            <p className="text-[13px] font-medium text-subtle">Available to pay out</p>
            <p className="font-display text-[30px] leading-none tracking-[-0.02em] text-ink">
              {formatMoney(available)}
            </p>
            {verified ? (
              <>
                <p className="text-sm text-ink-soft">
                  Paid automatically every Friday to your account ending 4821.
                </p>
                <button
                  type="button"
                  disabled={available < 5000}
                  title={available < 5000 ? "Payouts start at ₦5,000." : undefined}
                  onClick={() => toast("Payout requested. It lands within 1 working day")}
                  className={cn(btn("secondary", "sm"), "self-start")}
                >
                  Pay out now
                </button>
              </>
            ) : (
              <p className="flex gap-2 rounded-field bg-panel px-3 py-2.5 text-[13px] text-ink-soft">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                Payouts open as soon as you're verified. Gifts are held safely until then.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1 rounded-card border border-line-soft p-5">
            <p className="pb-2 text-[13px] font-medium text-subtle">To do</p>
            {stale.map((c) => (
              <Todo
                key={c.id}
                icon={MessageSquareHeart}
                text={`Post an update on "${c.title}"`}
                note="Givers haven't heard from you in a while"
              />
            ))}
            {campaigns.some((c) => c.gallery.length < 3) ? (
              <Todo
                icon={Camera}
                text="Add more photos to your campaigns"
                note="Aim for at least 3 per campaign"
              />
            ) : null}
            {!stale.length && !campaigns.some((c) => c.gallery.length < 3) ? (
              <p className="text-sm text-muted-ink">You're up to date.</p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReviewProgress() {
  const steps = [
    { label: "Application received", done: true },
    { label: "Documents checked", done: false },
    { label: "Payout account matched", done: false },
    { label: "Leadership call", done: false },
  ];
  return (
    <div className="flex flex-col gap-4 rounded-card border border-line-soft bg-panel/50 p-5">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <ShieldCheck className="h-4 w-4 text-ink-soft" strokeWidth={2} /> We're reviewing your
        organization
      </p>
      <p className="text-sm text-ink-soft">
        It usually takes up to 5 working days. You can start campaigns now; they go live once you're
        verified.
      </p>
      <ol className="grid gap-2 sm:grid-cols-4">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[13px]">
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                s.done ? "bg-verified text-white" : "border border-dashed border-line-input",
              )}
            >
              {s.done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </span>
            <span className={s.done ? "text-ink" : "text-muted-ink"}>{s.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CampaignRow({ c }: { c: Campaign }) {
  const pct = c.goal ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : null;
  const last = c.updates[0]?.date;
  const months = last ? monthsSince(last) : null;
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <img
        src={c.cover}
        alt=""
        className="hidden h-11 w-11 shrink-0 rounded-[10px] object-cover sm:block"
      />
      <div className="min-w-0 flex-1">
        <Link
          to="/campaign/$id"
          params={{ id: c.id }}
          className="line-clamp-1 text-sm font-medium text-ink hover:underline"
        >
          {c.title}
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted-ink">
          {c.verificationStatus === "verified" ? (
            <Tag tone="verified">Live</Tag>
          ) : (
            <Tag tone="attention">In review</Tag>
          )}
          <span>{c.donors.toLocaleString()} givers</span>
          {months !== null && months >= 1 ? (
            <span className="text-brand-ink">
              Last update {months} month{months > 1 ? "s" : ""} ago
            </span>
          ) : null}
        </p>
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
      </div>
    </li>
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

function Todo({ icon: Icon, text, note }: { icon: LucideIcon; text: string; note: string }) {
  return (
    <div className="-mx-2 flex items-start gap-3 rounded-[8px] px-2 py-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-ink">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ink">{text}</span>
        <span className="block text-[12px] text-muted-ink">{note}</span>
      </span>
    </div>
  );
}
