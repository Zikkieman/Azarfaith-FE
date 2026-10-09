import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Download, Pause, Play, Repeat2, SkipForward, Wallet } from "lucide-react";
import { toast } from "sonner";
import { ListPageSkeleton } from "@/components/app/Skeletons";
import { pending, simulateNetwork } from "@/lib/api";
import {
  AppShell,
  Container,
  EmptyState,
  PageHeader,
  Tabs,
  Tag,
  inputClass,
} from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import { formatMoney, type RecurringDonation } from "@/lib/mock";
import { everyLabel, frequencyLabel, myGifts, presets, shortDate, skipDate } from "@/lib/giving";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/my-giving")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <ListPageSkeleton label="Loading your giving" />,
  ...pending,
  head: () => ({ meta: [{ title: "My giving — AzarFaith" }] }),
  component: MyGiving,
});

type Tab = "regular" | "history";

/** My giving (after Twenty's billing page): every regular gift is something you can manage. */
function MyGiving() {
  const gifts = useApp((s) => s.recurringDonations);
  const [tab, setTab] = useState<Tab>("regular");
  const active = gifts.filter((g) => g.active);
  const stopped = gifts.filter((g) => !g.active);
  const upcoming = active
    .filter((g) => !g.paused)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0];
  const thisYear = myGifts
    .filter((g) => g.date.startsWith("2026"))
    .reduce((n, g) => n + g.amount, 0);

  return (
    <AppShell>
      <PageHeader
        title="My giving"
        lead="Your regular gifts, every past gift and its receipt."
        actions={
          <Link to="/discover" className={btn("primary")}>
            Find a cause
          </Link>
        }
      >
        <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-line-soft lg:grid-cols-4">
          {[
            { label: "Given in 2026", value: formatMoney(thisYear) },
            { label: "Regular gifts", value: `${active.length} active` },
            {
              label: "Next gift",
              value: upcoming ? shortDate(upcoming.nextDate) : "None scheduled",
              note: upcoming
                ? `${formatMoney(upcoming.amount)} to ${upcoming.targetName}`
                : undefined,
            },
            { label: "Receipts", value: `${myGifts.length} this year` },
          ].map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "flex min-w-0 flex-col gap-1.5 p-5",
                i % 2 === 1 && "border-l border-line-soft",
                i >= 2 && "border-t border-line-soft lg:border-t-0",
                i === 2 && "lg:border-l",
              )}
            >
              <dt className="text-[13px] text-muted-ink">{s.label}</dt>
              <dd className="font-display text-[22px] leading-tight tracking-[-0.02em] text-ink">
                {s.value}
              </dd>
              {s.note ? <dd className="truncate text-[12px] text-muted-ink">{s.note}</dd> : null}
            </div>
          ))}
        </dl>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "regular", label: "Regular gifts", count: active.length },
            { value: "history", label: "History", count: myGifts.length },
          ]}
        />
      </PageHeader>

      <Container className="py-8 md:py-10">
        <div key={tab} className="admin-rise">
          {tab === "regular" ? (
            <div className="flex flex-col gap-4">
              {active.length === 0 ? (
                <EmptyState
                  icon={<Repeat2 className="h-5 w-5" strokeWidth={1.5} />}
                  title="No regular gifts yet"
                  body="Regular gifts give churches and missionaries something they can plan around. Start one from any ongoing campaign."
                  action={
                    <Link to="/discover" search={{ view: "regular" }} className={btn("secondary")}>
                      Find ongoing work
                    </Link>
                  }
                />
              ) : (
                active.map((g) => <RegularGift key={g.id} gift={g} />)
              )}
              {stopped.length ? <Stopped gifts={stopped} /> : null}
            </div>
          ) : (
            <History />
          )}
        </div>
      </Container>
    </AppShell>
  );
}

/** One regular gift, managed like a subscription: the facts, then what you can do with it. */
function RegularGift({ gift: g }: { gift: RecurringDonation }) {
  const update = useApp((s) => s.updateRecurringDonation);
  const cancel = useApp((s) => s.cancelRecurringDonation);
  const [editing, setEditing] = useState(false);
  const [stopping, setStopping] = useState(false);

  const skip = () => {
    const before = g.nextDate;
    update(g.id, { nextDate: skipDate(g.nextDate, g.frequency) });
    toast(`Skipped. Next gift on ${shortDate(skipDate(before, g.frequency))}`, {
      action: { label: "Undo", onClick: () => update(g.id, { nextDate: before }) },
    });
  };
  const togglePause = () => {
    update(g.id, { paused: !g.paused });
    toast(g.paused ? "Gift resumed" : "Gift paused. Nothing will be charged until you resume", {
      action: { label: "Undo", onClick: () => update(g.id, { paused: g.paused }) },
    });
  };

  const facts = [
    { label: "Amount", value: formatMoney(g.amount) },
    { label: "How often", value: frequencyLabel[g.frequency] },
    { label: "Next gift", value: g.paused ? "Paused" : shortDate(g.nextDate) },
    { label: "Paid with", value: g.mode === "pledge" ? "Reminder, you pay" : (g.method ?? "Card") },
    { label: "Since", value: g.startedAt ? shortDate(g.startedAt) : "This month" },
  ];

  return (
    <article className="overflow-hidden rounded-card border border-line-soft">
      <div className="flex items-center gap-4 p-5">
        <img src={g.targetCover} alt="" className="h-12 w-12 shrink-0 rounded-field object-cover" />
        <div className="min-w-0 flex-1">
          <Link
            to="/campaign/$id"
            params={{ id: g.targetId }}
            className="line-clamp-2 text-[16px] font-semibold leading-snug text-ink hover:underline"
          >
            {g.targetName}
          </Link>
          <p className="text-[13px] text-muted-ink">
            {formatMoney(g.amount)} {everyLabel[g.frequency]}
          </p>
        </div>
        {g.paused ? (
          <Tag>Paused</Tag>
        ) : g.mode === "pledge" ? (
          <Tag tone="attention">Reminder</Tag>
        ) : (
          <Tag tone="verified">Automatic</Tag>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line-soft px-5 py-4 sm:grid-cols-3 lg:grid-cols-5">
        {facts.map((f) => (
          <div key={f.label} className="min-w-0">
            <dt className="text-[12px] text-muted-ink">{f.label}</dt>
            <dd
              className={cn("truncate text-sm text-ink", f.value === "Paused" && "text-muted-ink")}
            >
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-2 border-t border-line-soft bg-panel/50 px-5 py-3">
        <button type="button" className={btn("secondary", "sm")} onClick={() => setEditing(true)}>
          <Wallet className="h-3.5 w-3.5" strokeWidth={1.75} /> Change amount
        </button>
        <button type="button" className={btn("secondary", "sm")} onClick={skip} disabled={g.paused}>
          <SkipForward className="h-3.5 w-3.5" strokeWidth={1.75} /> Skip next
        </button>
        <button type="button" className={btn("secondary", "sm")} onClick={togglePause}>
          {g.paused ? (
            <>
              <Play className="h-3.5 w-3.5" strokeWidth={1.75} /> Resume
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5" strokeWidth={1.75} /> Pause
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setStopping(true)}
          className="ml-auto text-sm font-medium text-danger hover:underline"
        >
          Stop giving
        </button>
      </div>

      <ChangeAmount
        open={editing}
        onOpenChange={setEditing}
        gift={g}
        onSave={(amount, frequency) => {
          update(g.id, { amount, frequency });
          toast.success(`Now ${formatMoney(amount)} ${everyLabel[frequency]}`);
        }}
      />
      <Dialog open={stopping} onOpenChange={setStopping}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Stop giving to {g.targetName}?</DialogTitle>
            <DialogDescription>
              No more payments or reminders. Gifts you've already made aren't affected, and you can
              start again any time.
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-field bg-panel px-4 py-3 text-sm text-ink-soft">
            Not sure? You can <strong className="font-medium text-ink">pause</strong> instead and
            keep everything as it is.
          </p>
          <DialogFooter>
            <button
              type="button"
              className={btn("secondary")}
              onClick={() => {
                setStopping(false);
                if (!g.paused) togglePause();
              }}
            >
              Pause instead
            </button>
            <button
              type="button"
              className={btn("danger")}
              onClick={() => {
                cancel(g.id);
                setStopping(false);
                toast(`You've stopped giving to ${g.targetName}`);
              }}
            >
              Stop giving
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function ChangeAmount({
  open,
  onOpenChange,
  gift,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  gift: RecurringDonation;
  onSave: (amount: number, frequency: RecurringDonation["frequency"]) => void;
}) {
  const [amount, setAmount] = useState(gift.amount);
  const [freq, setFreq] = useState(gift.frequency);
  const changed = amount !== gift.amount || freq !== gift.frequency;
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setAmount(gift.amount);
          setFreq(gift.frequency);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Change your gift</DialogTitle>
          <DialogDescription>
            The change starts with your next gift on {shortDate(gift.nextDate)}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-0.5 rounded-[12px] bg-panel p-1">
          {(["weekly", "monthly", "quarterly"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={freq === f}
              onClick={() => setFreq(f)}
              className={cn(
                "h-9 rounded-[9px] text-[13px] font-medium transition-all",
                freq === f
                  ? "bg-paper text-ink shadow-[0_1px_2px_rgba(19,14,48,0.12)] ring-1 ring-line-soft"
                  : "text-muted-ink hover:text-ink",
              )}
            >
              {frequencyLabel[f]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={amount === p}
              onClick={() => setAmount(p)}
              className={cn(
                "h-11 rounded-field border text-sm font-medium transition-colors",
                amount === p
                  ? "border-ink bg-ink text-ink-contrast"
                  : "border-line-input hover:border-ink",
              )}
            >
              {formatMoney(p)}
            </button>
          ))}
        </div>
        <label className="relative block">
          <span className="sr-only">Another amount</span>
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
            ₦
          </span>
          <input
            type="number"
            min={100}
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className={cn(inputClass, "pl-8")}
          />
        </label>
        <DialogFooter>
          <button type="button" className={btn("secondary")} onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={btn("primary")}
            disabled={!changed || amount < 100}
            onClick={() => {
              onSave(amount, freq);
              onOpenChange(false);
            }}
          >
            Save {formatMoney(amount)} {everyLabel[freq]}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stopped({ gifts }: { gifts: RecurringDonation[] }) {
  return (
    <section className="mt-6 flex flex-col gap-3">
      <h2 className="text-[13px] font-medium text-subtle">Stopped</h2>
      <ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft">
        {gifts.map((g) => (
          <li key={g.id} className="flex items-center gap-3 py-3 text-sm">
            <img
              src={g.targetCover}
              alt=""
              className="h-9 w-9 shrink-0 rounded-[8px] object-cover opacity-60 grayscale"
            />
            <span className="min-w-0 flex-1 truncate text-ink-soft">{g.targetName}</span>
            <span className="hidden shrink-0 text-muted-ink sm:inline">
              {formatMoney(g.amount)} {everyLabel[g.frequency]}
            </span>
            <Link
              to="/donate/$id"
              params={{ id: g.targetId }}
              search={{ freq: g.frequency, amount: g.amount }}
              className={btn("secondary", "sm")}
            >
              Start again
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Every gift with its receipt (after the invoice lists in billing pages). */
function History() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-soft">
          Receipts are accepted for church and charity giving records.
        </p>
        <button
          type="button"
          className={btn("secondary", "sm")}
          onClick={() => toast("Receipts for 2026 downloaded")}
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} /> All receipts
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b border-line-soft text-[13px] text-muted-ink">
              <th className="pb-2.5 font-medium">Date</th>
              <th className="pb-2.5 font-medium">Gift to</th>
              <th className="pb-2.5 font-medium">Type</th>
              <th className="pb-2.5 text-right font-medium">Amount</th>
              <th className="w-24 pb-2.5" aria-label="Receipt" />
            </tr>
          </thead>
          <tbody>
            {myGifts.map((g, i) => (
              <tr
                key={g.id}
                className="admin-row border-b border-line-soft"
                style={{ animationDelay: `${i * 25}ms` }}
              >
                <td className="whitespace-nowrap py-3.5 text-ink-soft">{shortDate(g.date)}</td>
                <td className="max-w-[320px] py-3.5">
                  <Link
                    to="/campaign/$id"
                    params={{ id: g.campaignId }}
                    className="line-clamp-1 font-medium text-ink hover:underline"
                  >
                    {g.title}
                  </Link>
                </td>
                <td className="py-3.5 text-ink-soft">
                  <span className="inline-flex items-center gap-1.5">
                    {g.kind === "once" ? (
                      <CalendarClock className="h-3.5 w-3.5 text-muted-ink" strokeWidth={1.75} />
                    ) : (
                      <Repeat2 className="h-3.5 w-3.5 text-muted-ink" strokeWidth={1.75} />
                    )}
                    {frequencyLabel[g.kind]}
                  </span>
                </td>
                <td className="py-3.5 text-right tabular-nums text-ink">{formatMoney(g.amount)}</td>
                <td className="py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => toast(`Receipt ${g.receipt} downloaded`)}
                    className="inline-flex items-center gap-1 text-[13px] text-ink-soft hover:text-ink"
                  >
                    <Download className="h-3.5 w-3.5" strokeWidth={1.75} /> {g.receipt}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
