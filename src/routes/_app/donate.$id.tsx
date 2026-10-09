import { useState, type ReactNode } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  BadgeCheck,
  BellRing,
  Building2,
  Check,
  ChevronLeft,
  CreditCard,
  Download,
  Lock,
  Mail,
  Repeat2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { btn } from "@/components/app/btn";
import { FieldError, inputClass, labelClass } from "@/components/app/AppShell";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/lib/store";
import { formatMoney, me } from "@/lib/mock";
import {
  PLATFORM_FEE,
  everyLabel,
  frequenciesFor,
  frequencyLabel,
  hintFor,
  presets,
  shortDate,
  skipDate,
  type Frequency,
} from "@/lib/giving";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/donate/$id")({
  head: () => ({ meta: [{ title: "Give — AzarFaith" }] }),
  validateSearch: (s: Record<string, unknown>): { freq: string; amount?: number } => ({
    freq: typeof s.freq === "string" ? s.freq : "",
    amount: Number(s.amount) || undefined,
  }),
  component: Checkout,
});

const tips = [0, 500, 1000, 2500];
const freqHint: Record<Frequency, string> = {
  once: "A single gift today",
  weekly: "Every week, cancel any time",
  monthly: "Every month, cancel any time",
  quarterly: "Every three months, cancel any time",
};

/**
 * One-page checkout (after Loom's upgrade flow): numbered sections on the left, a full-height
 * summary on the right that always shows exactly what will be charged and when.
 */
function Checkout() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const campaigns = useApp((s) => s.campaigns);
  const orgs = useApp((s) => s.orgs);
  const donate = useApp((s) => s.donate);
  const addRecurring = useApp((s) => s.addRecurringDonation);

  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) throw notFound();
  const org = campaign.orgId ? orgs.find((o) => o.id === campaign.orgId) : undefined;
  const freqs = frequenciesFor(campaign);

  const initialFreq = (freqs as string[]).includes(search.freq)
    ? (search.freq as Frequency)
    : freqs[0];
  const [freq, setFreq] = useState<Frequency>(initialFreq);
  const startAmount = search.amount ?? presets[1];
  const [amount, setAmount] = useState(presets.includes(startAmount) ? startAmount : presets[1]);
  const [custom, setCustom] = useState(presets.includes(startAmount) ? "" : String(startAmount));
  const [tip, setTip] = useState(0);
  const [name, setName] = useState(me.name);
  const [anonymous, setAnonymous] = useState(false);
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<"saved" | "card" | "bank">("saved");
  const [mode, setMode] = useState<"auto" | "pledge">("auto");
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);

  const gift = custom ? Number(custom) || 0 : amount;
  const fee = Math.round(gift * PLATFORM_FEE);
  const total = gift + fee + tip;
  const recurring = freq !== "once";
  const nextDate = recurring ? skipDate(new Date().toISOString().slice(0, 10), freq) : "";
  const invalid = gift < 100;

  const submit = () => {
    if (invalid) return;
    setProcessing(true);
    setTimeout(() => {
      donate(campaign.id, gift, anonymous ? "Anonymous" : name || "A giver", note || undefined);
      if (recurring) {
        addRecurring({
          id: Math.random().toString(36).slice(2),
          donorId: "me",
          targetId: campaign.id,
          targetName: campaign.title,
          targetCover: campaign.cover,
          amount: gift,
          frequency: freq,
          mode: method === "bank" ? "pledge" : mode,
          nextDate,
          active: true,
          startedAt: new Date().toISOString().slice(0, 10),
          method:
            method === "saved" ? "Visa ending 4242" : method === "card" ? "Card" : "Bank transfer",
        });
      }
      setProcessing(false);
      setReceipt(`AF-${Math.floor(24000 + Math.random() * 900)}`);
    }, 1300);
  };

  if (receipt) {
    return (
      <Done
        receipt={receipt}
        campaignId={campaign.id}
        title={campaign.title}
        to={org?.name ?? campaign.raiser.name}
        gift={gift}
        fee={fee}
        tip={tip}
        recurring={
          recurring
            ? `${formatMoney(gift)} ${everyLabel[freq as Exclude<Frequency, "once">]}, next on ${shortDate(nextDate)}`
            : null
        }
        method={method === "bank" ? "Bank transfer" : "Visa ending 4242"}
      />
    );
  }

  const cta = (
    <button
      type="button"
      onClick={submit}
      disabled={invalid || processing}
      className={cn(btn("primary", "lg"), "w-full")}
    >
      {processing ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-contrast/30 border-t-ink-contrast" />
          Processing
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" strokeWidth={2} /> Give {formatMoney(total)}
          {recurring ? ` ${everyLabel[freq as Exclude<Frequency, "once">]}` : ""}
        </>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-paper font-gsf text-heading lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
      <div className="pb-32 lg:pb-16">
        <header className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
          <Link to="/" aria-label="AzarFaith home">
            <AuthLogo />
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-ink">
            <Lock className="h-3.5 w-3.5" strokeWidth={2} /> Secure checkout
          </span>
        </header>

        <main className="mx-auto flex w-full max-w-[600px] flex-col gap-10 px-6 pt-4 sm:px-10">
          <div className="flex flex-col gap-3">
            <Link
              to="/campaign/$id"
              params={{ id: campaign.id }}
              className="inline-flex w-fit items-center gap-1 text-sm text-muted-ink transition-colors hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} /> Back to campaign
            </Link>
            <h1 className="font-display text-[clamp(26px,2.6vw,34px)] leading-[1.15] tracking-[-0.02em] text-ink">
              Your gift to {org?.name ?? campaign.raiser.name}
            </h1>
            <p className="text-[15px] text-ink-soft">{campaign.title}</p>
          </div>

          {freqs.length > 1 ? (
            <Step n={1} title="How often">
              <div className="grid gap-2 sm:grid-cols-2">
                {freqs.map((f) => (
                  <Option key={f} selected={freq === f} onClick={() => setFreq(f)}>
                    <span className="flex items-center gap-2 text-[15px] font-medium text-ink">
                      {frequencyLabel[f]}
                      {f === "monthly" ? (
                        <span className="rounded-[6px] bg-verified/10 px-1.5 py-0.5 text-[11px] font-medium text-verified-ink">
                          Most givers
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[13px] text-muted-ink">{freqHint[f]}</span>
                  </Option>
                ))}
              </div>
            </Step>
          ) : null}

          <Step n={freqs.length > 1 ? 2 : 1} title="Amount">
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => {
                const hint = hintFor(campaign, p);
                return (
                  <Option
                    key={p}
                    selected={!custom && amount === p}
                    onClick={() => {
                      setAmount(p);
                      setCustom("");
                    }}
                  >
                    <span className="font-display text-[19px] leading-tight text-ink">
                      {formatMoney(p)}
                    </span>
                    {hint ? <span className="text-[13px] text-muted-ink">{hint}</span> : null}
                  </Option>
                );
              })}
            </div>
            <label className="relative mt-2 block">
              <span className="sr-only">Another amount</span>
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
                ₦
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={100}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Another amount"
                className={cn(inputClass, "pl-8", custom && "border-ink")}
              />
            </label>
            {custom && invalid ? <FieldError>The smallest gift is ₦100.</FieldError> : null}
          </Step>

          <Step n={freqs.length > 1 ? 3 : 2} title="A tip for AzarFaith" optional>
            <div className="flex flex-col gap-3 rounded-field bg-panel p-4">
              <p className="text-sm text-ink-soft">
                Tips pay for verifying organizations, so churches and missions never pay to join.
              </p>
              <div className="flex flex-wrap gap-2">
                {tips.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={tip === t}
                    onClick={() => setTip(t)}
                    className={cn(
                      "h-9 rounded-[10px] border px-3.5 text-sm font-medium transition-colors",
                      tip === t
                        ? "border-ink bg-ink text-ink-contrast"
                        : "border-line-input bg-paper text-ink hover:border-ink",
                    )}
                  >
                    {t ? formatMoney(t) : "No tip"}
                  </button>
                ))}
              </div>
            </div>
          </Step>

          <Step n={freqs.length > 1 ? 4 : 3} title="Your details">
            <div className="flex flex-col gap-4">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-field border border-line-soft px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-ink">Give anonymously</span>
                  <span className="block text-[13px] text-muted-ink">
                    Your name won't appear on the campaign. The organization still sees it for your
                    receipt.
                  </span>
                </span>
                <Switch
                  checked={anonymous}
                  onCheckedChange={setAnonymous}
                  className="data-[state=checked]:bg-ink data-[state=unchecked]:bg-line-input"
                />
              </label>
              {!anonymous ? (
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Name on the campaign</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </label>
              ) : null}
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>
                  Message <span className="font-normal text-muted-ink">(optional)</span>
                </span>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Praying for you and the team"
                  className={cn(inputClass, "resize-none")}
                />
              </label>
            </div>
          </Step>

          <Step n={freqs.length > 1 ? 5 : 4} title="Payment">
            <div className="flex flex-col gap-2">
              <Option selected={method === "saved"} onClick={() => setMethod("saved")} row>
                <CreditCard className="h-5 w-5 text-ink-soft" strokeWidth={1.5} />
                <span className="flex-1">
                  <span className="block text-[15px] font-medium text-ink">Visa ending 4242</span>
                  <span className="block text-[13px] text-muted-ink">
                    Saved card, expires 08/28
                  </span>
                </span>
              </Option>
              <Option selected={method === "card"} onClick={() => setMethod("card")} row>
                <CreditCard className="h-5 w-5 text-ink-soft" strokeWidth={1.5} />
                <span className="flex-1 text-[15px] font-medium text-ink">A different card</span>
              </Option>
              <Option selected={method === "bank"} onClick={() => setMethod("bank")} row>
                <Building2 className="h-5 w-5 text-ink-soft" strokeWidth={1.5} />
                <span className="flex-1">
                  <span className="block text-[15px] font-medium text-ink">Bank transfer</span>
                  <span className="block text-[13px] text-muted-ink">
                    {recurring ? "We remind you each time it's due" : "Pay from your banking app"}
                  </span>
                </span>
              </Option>
              {method === "card" ? (
                <p className="rounded-field bg-panel px-4 py-3 text-[13px] text-ink-soft">
                  Paystack opens a secure window for your card details. AzarFaith never sees or
                  stores them.
                </p>
              ) : null}
              {recurring && method !== "bank" ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Option selected={mode === "auto"} onClick={() => setMode("auto")}>
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      <Repeat2 className="h-4 w-4" strokeWidth={1.75} /> Charge me automatically
                    </span>
                    <span className="text-[13px] text-muted-ink">Nothing to remember</span>
                  </Option>
                  <Option selected={mode === "pledge"} onClick={() => setMode("pledge")}>
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      <BellRing className="h-4 w-4" strokeWidth={1.75} /> Remind me each time
                    </span>
                    <span className="text-[13px] text-muted-ink">You confirm every gift</span>
                  </Option>
                </div>
              ) : null}
            </div>
          </Step>
        </main>
      </div>

      <aside className="hidden border-l border-line-soft bg-panel lg:block">
        <div className="sticky top-0 flex min-h-screen flex-col gap-6 px-8 py-10">
          <Summary
            cover={campaign.cover}
            title={campaign.title}
            org={org?.name ?? campaign.raiser.name}
            verified={org?.verificationStatus === "verified"}
            gift={gift}
            fee={fee}
            tip={tip}
            total={total}
            freq={freq}
            nextDate={nextDate}
          />
          {cta}
          <ul className="flex flex-col gap-2 text-[13px] text-muted-ink">
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-verified" strokeWidth={1.75} /> Every organization
              is checked before it gets a naira
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" strokeWidth={1.75} /> A receipt goes to your email straight
              away
            </li>
            {recurring ? (
              <li className="flex items-center gap-2">
                <Repeat2 className="h-4 w-4" strokeWidth={1.75} /> Change or stop it any time in My
                giving
              </li>
            ) : null}
          </ul>
        </div>
      </aside>

      {/* Phones: the total and the button stay in reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-line-soft bg-paper px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-muted-ink">
            Total{recurring ? ` ${everyLabel[freq as Exclude<Frequency, "once">]}` : ""}, fee
            included
          </p>
          <p className="font-display text-[20px] leading-tight text-ink">{formatMoney(total)}</p>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={invalid || processing}
          className={btn("primary")}
        >
          {processing ? "Processing" : "Give"}
        </button>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  optional,
  children,
}: {
  n: number;
  title: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3.5 border-t border-line-soft pt-8 first-of-type:border-0">
      <h2 className="flex items-center gap-3 text-[17px] font-semibold text-ink">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-panel text-[12px] font-semibold text-ink-soft">
          {n}
        </span>
        {title}
        {optional ? <span className="text-sm font-normal text-muted-ink">Optional</span> : null}
      </h2>
      {children}
    </section>
  );
}

function Option({
  selected,
  onClick,
  row,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  row?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "relative flex rounded-field border px-4 py-3 text-left transition-[border-color,box-shadow] duration-200",
        row ? "items-center gap-3" : "flex-col gap-0.5",
        selected
          ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]"
          : "border-line-input hover:border-ink/50",
      )}
    >
      {children}
      <span
        className={cn(
          "absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border transition-colors",
          selected ? "border-ink bg-ink text-ink-contrast" : "border-line-input",
          row && "static ml-auto",
        )}
      >
        {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

function Summary({
  cover,
  title,
  org,
  verified,
  gift,
  fee,
  tip,
  total,
  freq,
  nextDate,
}: {
  cover: string;
  title: string;
  org: string;
  verified: boolean;
  gift: number;
  fee: number;
  tip: number;
  total: number;
  freq: Frequency;
  nextDate: string;
}) {
  const recurring = freq !== "once";
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13px] font-medium text-subtle">Summary</p>
      <div className="flex items-center gap-3">
        <img src={cover} alt="" className="h-14 w-14 shrink-0 rounded-[12px] object-cover" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-medium text-ink">{title}</p>
          <p className="flex items-center gap-1 text-[13px] text-muted-ink">
            {org}
            {verified ? <BadgeCheck className="h-3.5 w-3.5 text-verified" strokeWidth={2} /> : null}
          </p>
        </div>
      </div>
      <dl className="flex flex-col gap-2.5 border-t border-line-soft pt-5 text-sm">
        <Row
          label={`Gift${recurring ? `, ${frequencyLabel[freq].toLowerCase()}` : ""}`}
          value={formatMoney(gift)}
        />
        <Row label="Platform fee (2.5%)" value={formatMoney(fee)} />
        {tip ? <Row label="Tip for AzarFaith" value={formatMoney(tip)} /> : null}
      </dl>
      <div className="flex items-baseline justify-between border-t border-line-soft pt-5">
        <span className="text-[15px] font-medium text-ink">{recurring ? "Today" : "Total"}</span>
        <span className="font-display text-[28px] leading-none tracking-[-0.02em] text-ink">
          {formatMoney(total)}
        </span>
      </div>
      {recurring ? (
        <p className="-mt-2 text-[13px] text-muted-ink">
          Then {formatMoney(gift + fee)} {everyLabel[freq as Exclude<Frequency, "once">]}, next on{" "}
          {shortDate(nextDate)}. Tips are one-off.
        </p>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-ink">{label}</dt>
      <dd className="tabular-nums text-ink">{value}</dd>
    </div>
  );
}

/** The confirmation is a receipt: everything they'd need if anyone asked. */
function Done({
  receipt,
  campaignId,
  title,
  to,
  gift,
  fee,
  tip,
  recurring,
  method,
}: {
  receipt: string;
  campaignId: string;
  title: string;
  to: string;
  gift: number;
  fee: number;
  tip: number;
  recurring: string | null;
  method: string;
}) {
  const today = shortDate(new Date().toISOString());
  return (
    <div className="min-h-screen bg-panel px-6 py-10 font-gsf">
      <div className="mx-auto flex max-w-[480px] flex-col items-center gap-6">
        <Link to="/" aria-label="AzarFaith home">
          <AuthLogo />
        </Link>
        <div className="admin-rise w-full overflow-hidden rounded-card bg-paper shadow-[0_24px_64px_-24px_rgba(19,14,48,0.25)]">
          <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-verified text-white animate-pop">
              <Check className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <h1 className="font-display text-[26px] leading-tight text-ink">Thank you</h1>
            <p className="text-[15px] text-ink-soft">
              Your gift to {to} is on its way. A copy of this receipt is in your inbox.
            </p>
          </div>
          <div className="border-t border-dashed border-line-input px-6 py-5">
            <dl className="flex flex-col gap-2.5 text-sm">
              <Row label="Receipt" value={receipt} />
              <Row label="Date" value={today} />
              <Row label="For" value={title.length > 34 ? `${title.slice(0, 34)}…` : title} />
              <Row label="Gift" value={formatMoney(gift)} />
              <Row label="Platform fee" value={formatMoney(fee)} />
              {tip ? <Row label="Tip" value={formatMoney(tip)} /> : null}
              <Row label="Paid with" value={method} />
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-line-soft pt-4">
              <span className="text-[15px] font-medium text-ink">Total</span>
              <span className="font-display text-[24px] text-ink">
                {formatMoney(gift + fee + tip)}
              </span>
            </div>
            {recurring ? (
              <p className="mt-3 rounded-field bg-panel px-3.5 py-2.5 text-[13px] text-ink-soft">
                Regular gift set up: {recurring}.
              </p>
            ) : null}
          </div>
          <div className="flex gap-2 border-t border-line-soft px-6 py-4">
            <button
              type="button"
              className={cn(btn("secondary", "sm"), "flex-1")}
              onClick={() => toast("Receipt downloaded")}
            >
              <Download className="h-4 w-4" strokeWidth={1.75} /> Receipt
            </button>
            <button
              type="button"
              className={cn(btn("secondary", "sm"), "flex-1")}
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/campaign/${campaignId}`);
                toast("Campaign link copied. Thanks for sharing");
              }}
            >
              <Share2 className="h-4 w-4" strokeWidth={1.75} /> Share
            </button>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/campaign/$id" params={{ id: campaignId }} className={btn("primary")}>
            Back to campaign
          </Link>
          <Link to={recurring ? "/my-giving" : "/discover"} className={btn("secondary")}>
            {recurring ? "Manage my giving" : "Find another cause"}
          </Link>
        </div>
      </div>
    </div>
  );
}
