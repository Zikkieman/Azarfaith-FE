import { useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Check, CircleDashed, CreditCard, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { ProfileSkeleton } from "@/components/app/Skeletons";
import { pending, simulateNetwork } from "@/lib/api";
import {
  AppShell,
  Container,
  FieldError,
  Tag,
  inputClass,
  labelClass,
} from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/lib/store";
import { me } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/profile")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <ProfileSkeleton label="Loading your profile" />,
  ...pending,
  head: () => ({ meta: [{ title: "Profile and settings — AzarFaith" }] }),
  component: Profile,
});

const nav = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "payment", label: "Payment methods" },
  { id: "security", label: "Security" },
  { id: "close", label: "Close account" },
];

/** Profile and settings (after Twenty's settings and Buildkite): one save per section. */
function Profile() {
  const navigate = useNavigate();
  const setAuthed = useApp((s) => s.setAuthed);
  return (
    <AppShell>
      <Container className="py-8 md:py-12">
        <div className="flex flex-col gap-6 border-b border-line-soft pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src={me.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
            <div>
              <h1 className="font-display text-[clamp(26px,2.6vw,34px)] leading-tight tracking-[-0.02em] text-ink">
                {me.name}
              </h1>
              <p className="text-sm text-muted-ink">
                {me.location}, giving since {me.joined}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={cn(btn("secondary", "sm"), "self-start sm:self-auto")}
            onClick={() => {
              setAuthed(false);
              navigate({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} /> Log out
          </button>
        </div>

        <div className="grid gap-8 pt-8 lg:grid-cols-[200px_minmax(0,1fr)]">
          <nav className="hidden lg:block" aria-label="Settings">
            <ul className="sticky top-24 flex flex-col gap-0.5">
              {nav.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    className={cn(
                      "block rounded-[8px] px-2.5 py-1.5 text-sm transition-colors hover:bg-panel hover:text-ink",
                      n.id === "close" ? "text-danger" : "text-ink-soft",
                    )}
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex max-w-[720px] flex-col gap-6">
            <ProfileSection />
            <NotificationsSection />
            <PaymentSection />
            <SecuritySection />
            <CloseAccount />
          </div>
        </div>
      </Container>
    </AppShell>
  );
}

function Section({
  id,
  title,
  description,
  footer,
  danger,
  children,
}: {
  id: string;
  title: string;
  description: string;
  footer?: ReactNode;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-card border",
        danger ? "border-danger/25" : "border-line-soft",
      )}
    >
      <div className="px-5 pb-1 pt-5 sm:px-6">
        <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-ink">{description}</p>
      </div>
      <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">{children}</div>
      {footer ? (
        <div className="flex items-center justify-end gap-3 border-t border-line-soft bg-panel/40 px-5 py-3 sm:px-6">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

function SaveFooter({
  dirty,
  saved,
  onSave,
  onDiscard,
  invalid,
}: {
  dirty: boolean;
  saved: boolean;
  onSave: () => void;
  onDiscard: () => void;
  invalid?: boolean;
}) {
  return (
    <>
      {saved && !dirty ? (
        <span className="inline-flex items-center gap-1 text-[13px] text-verified-ink">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Saved
        </span>
      ) : dirty ? (
        <button
          type="button"
          onClick={onDiscard}
          className="text-[13px] text-muted-ink hover:text-ink"
        >
          Discard
        </button>
      ) : null}
      <button
        type="button"
        disabled={!dirty || invalid}
        onClick={onSave}
        className={btn("primary", "sm")}
      >
        Save changes
      </button>
    </>
  );
}

function ProfileSection() {
  const [first, ...rest] = me.name.split(" ");
  const initial = {
    first,
    last: rest.join(" "),
    email: "tunde@azarfaith.com",
    phone: "+234 803 000 0000",
    city: me.location,
  };
  const [saved, setSaved] = useState(initial);
  const [d, setD] = useState(initial);
  const [justSaved, setJustSaved] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);
  const emailBad = !/^\S+@\S+\.\S+$/.test(d.email);
  const field = (k: keyof typeof d, label: string, type = "text", wide = false) => (
    <label className={cn("flex flex-col gap-1.5", wide && "sm:col-span-2")}>
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={d[k]}
        onChange={(e) => {
          setJustSaved(false);
          setD({ ...d, [k]: e.target.value });
        }}
        className={cn(inputClass, k === "email" && emailBad && "border-danger")}
      />
      {k === "email" && emailBad ? <FieldError>Enter a valid email address.</FieldError> : null}
    </label>
  );
  return (
    <Section
      id="profile"
      title="Profile"
      description="Organizations see your name on gifts unless you give anonymously."
      footer={
        <SaveFooter
          dirty={dirty}
          saved={justSaved}
          invalid={emailBad}
          onDiscard={() => setD(saved)}
          onSave={() => {
            setSaved(d);
            setJustSaved(true);
            toast.success("Profile saved");
          }}
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {field("first", "First name")}
        {field("last", "Last name")}
        {field("email", "Email", "email")}
        {field("phone", "Phone", "tel")}
        {field("city", "Town or city", "text", true)}
      </div>
      <div className="flex flex-wrap gap-2">
        {me.verifications.map((v) => (
          <Tag key={v} tone="verified">
            <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} /> {v}
          </Tag>
        ))}
      </div>
    </Section>
  );
}

const prefs = [
  {
    id: "reminders",
    title: "Gift reminders",
    body: "Two days before a regular gift is charged or due.",
    on: true,
  },
  {
    id: "updates",
    title: "Campaign updates",
    body: "When something you support posts news, photos or receipts.",
    on: true,
  },
  {
    id: "receipts",
    title: "Receipts by email",
    body: "A receipt for every gift, straight away.",
    on: true,
  },
  {
    id: "news",
    title: "AzarFaith newsletter",
    body: "A monthly round-up of verified causes.",
    on: false,
  },
];

function NotificationsSection() {
  const initial = Object.fromEntries(prefs.map((p) => [p.id, p.on])) as Record<string, boolean>;
  const [saved, setSaved] = useState(initial);
  const [d, setD] = useState(initial);
  const [justSaved, setJustSaved] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);
  return (
    <Section
      id="notifications"
      title="Notifications"
      description="What we send you, and how often."
      footer={
        <SaveFooter
          dirty={dirty}
          saved={justSaved}
          onDiscard={() => setD(saved)}
          onSave={() => {
            setSaved(d);
            setJustSaved(true);
            toast.success("Notification settings saved");
          }}
        />
      }
    >
      <ul className="flex flex-col divide-y divide-line-soft">
        {prefs.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-6 py-3.5 first:pt-0 last:pb-0"
          >
            <label htmlFor={p.id} className="cursor-pointer">
              <span className="block text-sm font-medium text-ink">{p.title}</span>
              <span className="block text-[13px] text-muted-ink">{p.body}</span>
            </label>
            <Switch
              id={p.id}
              checked={d[p.id]}
              disabled={p.id === "receipts"}
              onCheckedChange={(v) => {
                setJustSaved(false);
                setD({ ...d, [p.id]: v });
              }}
              className="data-[state=checked]:bg-ink data-[state=unchecked]:bg-line-input"
            />
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-subtle">
        Receipts can't be turned off. You'll always get proof of every gift.
      </p>
    </Section>
  );
}

type Card = { id: string; brand: string; last4: string; expires: string };

function PaymentSection() {
  const [cards, setCards] = useState<Card[]>([
    { id: "c1", brand: "Visa", last4: "4242", expires: "08/28" },
    { id: "c2", brand: "Mastercard", last4: "0019", expires: "02/27" },
  ]);
  const [preferred, setPreferred] = useState("c1");
  const gifts = useApp(
    (s) => s.recurringDonations.filter((g) => g.active && g.mode === "auto").length,
  );
  return (
    <Section
      id="payment"
      title="Payment methods"
      description="Cards you've saved through Paystack. We never see the full number."
    >
      <ul className="flex flex-col divide-y divide-line-soft rounded-field border border-line-soft">
        {cards.map((c) => {
          const isDefault = c.id === preferred;
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-12 place-items-center rounded-[6px] border border-line-soft bg-panel">
                <CreditCard className="h-4 w-4 text-ink-soft" strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                  {c.brand} ending {c.last4}
                  {isDefault ? <Tag>Default</Tag> : null}
                </span>
                <span className="block text-[13px] text-muted-ink">
                  Expires {c.expires}
                  {isDefault && gifts
                    ? `, used for ${gifts} regular gift${gifts > 1 ? "s" : ""}`
                    : ""}
                </span>
              </span>
              {!isDefault ? (
                <button
                  type="button"
                  onClick={() => setPreferred(c.id)}
                  className={btn("quiet", "sm")}
                >
                  Make default
                </button>
              ) : null}
              <button
                type="button"
                disabled={isDefault}
                title={
                  isDefault ? "Make another card the default before removing this one." : undefined
                }
                onClick={() => {
                  setCards(cards.filter((x) => x.id !== c.id));
                  toast(`${c.brand} ending ${c.last4} removed`);
                }}
                className="text-sm font-medium text-danger hover:underline disabled:cursor-not-allowed disabled:text-subtle disabled:no-underline"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => toast("Paystack opens a secure window to add your card")}
        className={cn(btn("secondary", "sm"), "self-start")}
      >
        <Plus className="h-4 w-4" strokeWidth={2} /> Add a card
      </button>
    </Section>
  );
}

function SecuritySection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const short = next.length > 0 && next.length < 8;
  const ready = current.length > 0 && next.length >= 8;
  return (
    <Section
      id="security"
      title="Security"
      description="Your password and where you're signed in."
      footer={
        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            setCurrent("");
            setNext("");
            toast.success("Password changed");
          }}
          className={btn("primary", "sm")}
        >
          Change password
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Current password</span>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>New password</span>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={cn(inputClass, short && "border-danger")}
            autoComplete="new-password"
          />
          {short ? <FieldError>Use at least 8 characters.</FieldError> : null}
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-field bg-panel px-4 py-3">
        <p className="text-sm text-ink-soft">
          Signed in on this browser and <span className="font-medium text-ink">1 phone</span>.
        </p>
        <button
          type="button"
          onClick={() => toast("Signed out of your other devices")}
          className={btn("secondary", "sm")}
        >
          Sign out other devices
        </button>
      </div>
    </Section>
  );
}

/** Closing waits until regular gifts are stopped, and says so (the Buildkite pattern). */
function CloseAccount() {
  const active = useApp((s) => s.recurringDonations.filter((g) => g.active).length);
  return (
    <Section
      id="close"
      title="Close account"
      description="Your giving history and receipts are kept for 7 years, as the law requires."
      danger
    >
      {active ? (
        <div className="flex gap-3 rounded-field bg-panel p-4">
          <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted-ink" strokeWidth={2} />
          <p className="text-sm text-ink-soft">
            You have{" "}
            <span className="font-medium text-ink">
              {active} regular gift{active > 1 ? "s" : ""}
            </span>{" "}
            still running. Stop them in{" "}
            <Link to="/my-giving" className="font-medium text-ink underline underline-offset-2">
              My giving
            </Link>{" "}
            first, so nobody is left expecting a gift that won't come.
          </p>
        </div>
      ) : null}
      <button
        type="button"
        disabled={active > 0}
        onClick={() => toast("We've emailed you a link to confirm")}
        className={cn(btn("secondary", "sm"), "self-start text-danger hover:border-danger")}
      >
        Close my account
      </button>
    </Section>
  );
}
