import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Download, Pause, Play, Repeat2, SkipForward, Wallet } from "lucide-react";
import { toast } from "sonner";
import { ListPageSkeleton } from "@/components/app/Skeletons";
import { apiFetch, pending } from "@/lib/api";
import { AppShell, Container, EmptyState, PageHeader, Tabs, Tag, inputClass } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RequireUser } from "@/components/auth/RequireUser";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/my-giving")({
  pendingComponent: () => <ListPageSkeleton label="Loading your giving" />,
  ...pending,
  head: () => ({ meta: [{ title: "My giving — AzarFaith" }] }),
  component: ProtectedMyGiving,
});

function ProtectedMyGiving() {
  return <RequireUser><MyGiving /></RequireUser>;
}

type Tab = "regular" | "history";
type Frequency = "once" | "weekly" | "monthly" | "quarterly";
type RecurringGift = {
  id: string; targetId: string; targetName: string; targetCover: string; amount: number;
  frequency: Exclude<Frequency, "once">; mode: "auto" | "pledge"; status: string;
  nextDate: string; createdAt: string; updatedAt: string;
  frequencies: Array<Exclude<Frequency, "once">>; minDonation: number; maxDonation: number;
  hasPendingPayment: boolean; active: boolean;
};
type Donation = {
  id: string; campaignId: string; campaignTitle: string; amount: number; status: string;
  frequency: Frequency | null; reference: string; paidAt: string | null; createdAt: string;
};

const frequencyLabel: Record<Frequency, string> = { once: "One time", weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly" };
const everyLabel: Record<Exclude<Frequency, "once">, string> = { weekly: "every week", monthly: "every month", quarterly: "every quarter" };
const presets = [5000, 10000, 25000, 50000];
const formatMoney = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
// A paused gift is still managed here, even though it is not currently charging.
const isActive = (gift: RecurringGift) => !["cancelled", "completed"].includes(gift.status);

/** Live recurring schedules, paid donation history and receipt access. */
function MyGiving() {
  const [tab, setTab] = useState<Tab>("regular");
  const giftsQuery = useQuery({ queryKey: ["recurring-gifts"], queryFn: () => apiFetch<RecurringGift[]>("/me/recurring-gifts") });
  const donationsQuery = useQuery({ queryKey: ["donations"], queryFn: () => apiFetch<Donation[]>("/me/donations") });
  if (giftsQuery.isLoading || donationsQuery.isLoading) return <ListPageSkeleton label="Loading your giving" />;
  if (giftsQuery.error) throw giftsQuery.error;
  if (donationsQuery.error) throw donationsQuery.error;

  const gifts = giftsQuery.data ?? [];
  const donations = donationsQuery.data ?? [];
  const active = gifts.filter(isActive);
  const stopped = gifts.filter((gift) => !isActive(gift));
  const upcoming = active.filter((gift) => gift.status !== "paused").sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0];
  const currentYear = new Date().getFullYear();
  const paidThisYear = donations.filter((donation) => donation.status === "succeeded" && new Date(donation.paidAt ?? donation.createdAt).getFullYear() === currentYear);
  const thisYear = paidThisYear.reduce((total, donation) => total + donation.amount, 0);

  return <AppShell>
    <PageHeader
      tabs={<Tabs value={tab} onChange={setTab} items={[{ value: "regular", label: "Regular gifts", count: active.length }, { value: "history", label: "History", count: donations.length }]} />}
      title="My giving"
      lead="Your regular gifts, every past gift and its receipt."
      actions={<Link to="/discover" className={btn("primary")}>Find a cause</Link>}
    >
      <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-line-soft lg:grid-cols-4">
        {[
          { label: `Given in ${currentYear}`, value: formatMoney(thisYear) },
          { label: "Regular gifts", value: `${active.length} active` },
          { label: "Next gift", value: upcoming ? shortDate(upcoming.nextDate) : "None scheduled", note: upcoming ? `${formatMoney(upcoming.amount)} to ${upcoming.targetName}` : undefined },
          { label: "Receipts", value: `${paidThisYear.length} this year` },
        ].map((stat, index) => <div key={stat.label} className={cn("flex min-w-0 flex-col gap-1.5 p-5", index % 2 === 1 && "border-l border-line-soft", index >= 2 && "border-t border-line-soft lg:border-t-0", index === 2 && "lg:border-l")}>
          <dt className="text-[13px] text-muted-ink">{stat.label}</dt>
          <dd className="font-display text-[22px] leading-tight tracking-[-0.02em] text-ink">{stat.value}</dd>
          {stat.note ? <dd className="truncate text-[12px] text-muted-ink">{stat.note}</dd> : null}
        </div>)}
      </dl>
    </PageHeader>
    <Container className="py-8 md:py-10"><div key={tab} className="admin-rise">
      {tab === "regular" ? <div className="flex flex-col gap-4">
        {active.length === 0 ? <EmptyState icon={<Repeat2 className="h-5 w-5" strokeWidth={1.5} />} title="No regular gifts yet" body="Regular gifts give churches and missionaries something they can plan around. Start one from any ongoing campaign." action={<Link to="/discover" search={{ view: "regular" }} className={btn("secondary")}>Find ongoing work</Link>} /> : active.map((gift) => <RegularGift key={gift.id} gift={gift} />)}
        {stopped.length ? <Stopped gifts={stopped} /> : null}
      </div> : <History donations={donations} />}
    </div></Container>
  </AppShell>;
}

function RegularGift({ gift }: { gift: RecurringGift }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [reason, setReason] = useState("");
  const action = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) => apiFetch<{ message: string }>(path, body === undefined ? { method: "PATCH" } : { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: async (result) => { await queryClient.invalidateQueries({ queryKey: ["recurring-gifts"] }); toast.success(result.message); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update this gift."),
  });
  const paused = gift.status === "paused";
  const facts = [
    { label: "Amount", value: formatMoney(gift.amount) }, { label: "How often", value: frequencyLabel[gift.frequency] },
    { label: "Next gift", value: paused ? "Paused" : shortDate(gift.nextDate) },
    { label: "Paid with", value: gift.mode === "pledge" ? "Reminder, you pay" : "Automatic card" }, { label: "Since", value: shortDate(gift.createdAt) },
  ];
  const status = paused ? <Tag>Paused</Tag> : gift.mode === "pledge" ? <Tag tone="attention">Reminder</Tag> : <Tag tone="verified">Automatic</Tag>;
  return <article className="overflow-hidden rounded-card border border-line-soft">
    <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
      {gift.targetCover ? <img src={gift.targetCover} alt="" className="h-12 w-12 shrink-0 rounded-field object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-field bg-panel"><Repeat2 className="h-4 w-4 text-muted-ink" /></span>}
      <div className="min-w-0 flex-1"><Link to="/campaign/$id" params={{ id: gift.targetId }} className="line-clamp-2 text-[16px] font-semibold leading-snug text-ink hover:underline">{gift.targetName}</Link><p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-ink">{formatMoney(gift.amount)} {everyLabel[gift.frequency]}<span className="sm:hidden">{status}</span></p></div>
      <span className="hidden sm:block">{status}</span>
    </div>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line-soft px-5 py-4 sm:grid-cols-3 lg:grid-cols-5">{facts.map((fact) => <div key={fact.label} className="min-w-0"><dt className="text-[12px] text-muted-ink">{fact.label}</dt><dd className={cn("truncate text-sm text-ink", fact.value === "Paused" && "text-muted-ink")}>{fact.value}</dd></div>)}</dl>
    <div className="flex flex-wrap items-center gap-2 border-t border-line-soft bg-panel/50 px-5 py-3">
      <button type="button" className={btn("secondary", "sm")} onClick={() => setEditing(true)} disabled={action.isPending}><Wallet className="h-3.5 w-3.5" strokeWidth={1.75} /> Change amount</button>
      <button type="button" className={btn("secondary", "sm")} disabled={paused || gift.hasPendingPayment || action.isPending} onClick={() => action.mutate({ path: `/me/recurring-gifts/${gift.id}/skip`, body: { expectedUpdatedAt: gift.updatedAt } })}><SkipForward className="h-3.5 w-3.5" strokeWidth={1.75} /> Skip next</button>
      <button type="button" className={btn("secondary", "sm")} disabled={action.isPending} onClick={() => action.mutate({ path: `/me/recurring-gifts/${gift.id}/${paused ? "resume" : "pause"}` })}>{paused ? <><Play className="h-3.5 w-3.5" strokeWidth={1.75} /> Resume</> : <><Pause className="h-3.5 w-3.5" strokeWidth={1.75} /> Pause</>}</button>
      <button type="button" onClick={() => setStopping(true)} className="ml-auto text-sm font-medium text-danger hover:underline" disabled={action.isPending}>Stop giving</button>
    </div>
    <ChangeAmount open={editing} onOpenChange={setEditing} gift={gift} onSave={(amount, frequency) => action.mutate({ path: `/me/recurring-gifts/${gift.id}`, body: { amount, frequency: frequency.toUpperCase(), expectedUpdatedAt: gift.updatedAt, consentToAutoCharge: gift.mode === "auto" } })} />
    <Dialog open={stopping} onOpenChange={setStopping}><DialogContent className="sm:max-w-[460px]"><DialogHeader><DialogTitle>Stop giving to {gift.targetName}?</DialogTitle><DialogDescription>No more payments or reminders. Gifts you've already made aren't affected, and you can start again any time.</DialogDescription></DialogHeader><label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-ink">Reason (optional)</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={240} className={cn(inputClass, "min-h-20 resize-y")} placeholder="Tell us why you are stopping this gift" /></label><DialogFooter><button type="button" className={btn("secondary")} onClick={() => { setStopping(false); if (!paused) action.mutate({ path: `/me/recurring-gifts/${gift.id}/pause` }); }}>Pause instead</button><button type="button" className={btn("danger")} disabled={action.isPending} onClick={() => { action.mutate({ path: `/me/recurring-gifts/${gift.id}/cancel`, body: reason.trim() ? { reason: reason.trim() } : {} }, { onSuccess: () => setStopping(false) }); }}>Stop giving</button></DialogFooter></DialogContent></Dialog>
  </article>;
}

function ChangeAmount({ open, onOpenChange, gift, onSave }: { open: boolean; onOpenChange: (value: boolean) => void; gift: RecurringGift; onSave: (amount: number, frequency: RecurringGift["frequency"]) => void }) {
  const [amount, setAmount] = useState(gift.amount);
  const [frequency, setFrequency] = useState(gift.frequency);
  const changed = amount !== gift.amount || frequency !== gift.frequency;
  return <Dialog open={open} onOpenChange={(value) => { if (value) { setAmount(gift.amount); setFrequency(gift.frequency); } onOpenChange(value); }}><DialogContent className="sm:max-w-[460px]"><DialogHeader><DialogTitle>Change your gift</DialogTitle><DialogDescription>The change starts with your next gift on {shortDate(gift.nextDate)}.</DialogDescription></DialogHeader><div className="grid grid-cols-3 gap-0.5 rounded-[12px] bg-panel p-1">{gift.frequencies.map((item) => <button key={item} type="button" aria-pressed={frequency === item} onClick={() => setFrequency(item)} className={cn("h-9 rounded-[9px] text-[13px] font-medium transition-all", frequency === item ? "bg-paper text-ink shadow-[0_1px_2px_rgba(19,14,48,0.12)] ring-1 ring-line-soft" : "text-muted-ink hover:text-ink")}>{frequencyLabel[item]}</button>)}</div><div className="grid grid-cols-4 gap-2">{presets.map((preset) => <button key={preset} type="button" aria-pressed={amount === preset} onClick={() => setAmount(preset)} className={cn("h-11 rounded-field border text-sm font-medium transition-colors", amount === preset ? "border-ink bg-ink text-ink-contrast" : "border-line-input hover:border-ink")}>{formatMoney(preset)}</button>)}</div><label className="relative block"><span className="sr-only">Another amount</span><span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">₦</span><input type="number" min={gift.minDonation} max={gift.maxDonation} value={amount || ""} onChange={(event) => setAmount(Number(event.target.value) || 0)} className={cn(inputClass, "pl-8")} /></label><DialogFooter><button type="button" className={btn("secondary")} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn("primary")} disabled={!changed || amount < gift.minDonation || amount > gift.maxDonation} onClick={() => { onSave(amount, frequency); onOpenChange(false); }}>Save {formatMoney(amount)} {everyLabel[frequency]}</button></DialogFooter></DialogContent></Dialog>;
}

function Stopped({ gifts }: { gifts: RecurringGift[] }) {
  return <section className="mt-6 flex flex-col gap-3"><h2 className="text-[13px] font-medium text-subtle">Stopped</h2><ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft">{gifts.map((gift) => <li key={gift.id} className="flex items-center gap-3 py-3 text-sm">{gift.targetCover ? <img src={gift.targetCover} alt="" className="h-9 w-9 shrink-0 rounded-[8px] object-cover opacity-60 grayscale" /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-panel"><Repeat2 className="h-3.5 w-3.5 text-muted-ink" /></span>}<span className="min-w-0 flex-1 truncate text-ink-soft">{gift.targetName}</span><span className="hidden shrink-0 text-muted-ink sm:inline">{formatMoney(gift.amount)} {everyLabel[gift.frequency]}</span><Link to="/donate/$id" params={{ id: gift.targetId }} search={{ freq: gift.frequency, amount: gift.amount }} className={btn("secondary", "sm")}>Start again</Link></li>)}</ul></section>;
}

function History({ donations }: { donations: Donation[] }) {
  const download = async (donation: Donation) => {
    try {
      const detail = await apiFetch<{ receipt: { donorName: string; amount: number; campaignName: string; organization: string | null; date: string; transactionReference: string } }>(`/me/donations/${donation.id}`);
      const receipt = detail.receipt;
      const text = ["AzarFaith giving receipt", "", `Gift to: ${receipt.campaignName}`, `Organization: ${receipt.organization ?? "Independent campaign"}`, `Amount: ${formatMoney(receipt.amount)}`, `Date: ${shortDate(receipt.date)}`, `Reference: ${receipt.transactionReference}`, "", "Thank you for giving in faith."].join("\n");
      const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
      const link = document.createElement("a"); link.href = url; link.download = `azarfaith-receipt-${donation.reference}.txt`; link.click(); URL.revokeObjectURL(url);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not download this receipt."); }
  };
  const paid = donations.filter((donation) => donation.status === "succeeded");
  return <div className="flex flex-col gap-4"><div className="flex items-center justify-between gap-4"><p className="text-sm text-ink-soft">Receipts are accepted for church and charity giving records.</p><span className="text-[13px] text-muted-ink">{paid.length} completed gifts</span></div>{paid.length === 0 ? <EmptyState icon={<CalendarClock className="h-5 w-5" strokeWidth={1.5} />} title="No completed gifts yet" body="When a payment is confirmed, its receipt will appear here." /> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-line-soft text-[13px] text-muted-ink"><th className="pb-2.5 font-medium">Date</th><th className="pb-2.5 font-medium">Gift to</th><th className="pb-2.5 font-medium">Type</th><th className="pb-2.5 text-right font-medium">Amount</th><th className="w-24 pb-2.5" aria-label="Receipt" /></tr></thead><tbody>{paid.map((donation, index) => <tr key={donation.id} className="admin-row border-b border-line-soft" style={{ animationDelay: `${index * 25}ms` }}><td className="whitespace-nowrap py-3.5 text-ink-soft">{shortDate(donation.paidAt ?? donation.createdAt)}</td><td className="max-w-[320px] py-3.5"><Link to="/campaign/$id" params={{ id: donation.campaignId }} className="line-clamp-1 font-medium text-ink hover:underline">{donation.campaignTitle}</Link></td><td className="py-3.5 text-ink-soft"><span className="inline-flex items-center gap-1.5">{donation.frequency && donation.frequency !== "once" ? <Repeat2 className="h-3.5 w-3.5 text-muted-ink" strokeWidth={1.75} /> : <CalendarClock className="h-3.5 w-3.5 text-muted-ink" strokeWidth={1.75} />}{frequencyLabel[donation.frequency ?? "once"]}</span></td><td className="py-3.5 text-right tabular-nums text-ink">{formatMoney(donation.amount)}</td><td className="py-3.5 text-right"><button type="button" onClick={() => void download(donation)} className="inline-flex items-center gap-1 text-[13px] text-ink-soft hover:text-ink"><Download className="h-3.5 w-3.5" strokeWidth={1.75} /> Receipt</button></td></tr>)}</tbody></table></div>}</div>;
}
