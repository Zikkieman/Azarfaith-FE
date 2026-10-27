import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Check, CircleDashed, CreditCard, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { ProfileSkeleton } from "@/components/app/Skeletons";
import { apiFetch, pending } from "@/lib/api";
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
import { RequireUser } from "@/components/auth/RequireUser";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { PayoutAccountForm } from "@/components/app/PayoutAccountForm";
import { NigerianPhoneField } from "@/components/app/NigerianPhoneField";

export const Route = createFileRoute("/_app/profile")({
  pendingComponent: () => <ProfileSkeleton label="Loading your profile" />,
  ...pending,
  head: () => ({ meta: [{ title: "Profile and settings — AzarFaith" }] }),
  component: ProtectedProfile,
});

function ProtectedProfile() {
  return <RequireUser><Profile /></RequireUser>;
}

const nav = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "payout", label: "Payout account" },
  { id: "payment", label: "Payment methods" },
  { id: "security", label: "Security" },
  { id: "close", label: "Close account" },
];

/** Profile and settings (after Twenty's settings and Buildkite): one save per section. */
function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => apiFetch<ProfileData>("/me/profile") });
  const preferences = useQuery({ queryKey: ["notification-preferences"], queryFn: () => apiFetch<Preferences>("/me/notification-preferences") });
  const paymentMethods = useQuery({ queryKey: ["payment-methods"], queryFn: () => apiFetch<PaymentMethod[]>("/me/payment-methods") });
  if (profile.isLoading) return <ProfileSkeleton label="Loading your profile" />;
  if (profile.error) throw profile.error;
  if (!profile.data) return <ProfileSkeleton label="Loading your profile" />;
  const user = profile.data;
  return (
    <AppShell>
      <Container className="py-8 md:py-12">
        <div className="flex flex-col gap-6 border-b border-line-soft pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <ProfileAvatar name={user.fullName} url={user.avatarUrl} />
            <div>
              <h1 className="font-display text-[clamp(26px,2.6vw,34px)] leading-tight tracking-[-0.02em] text-ink">
                {user.fullName}
              </h1>
              <p className="text-sm text-muted-ink">
                {user.city || "Nigeria"}, giving since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={cn(btn("secondary", "sm"), "self-start sm:self-auto")}
            onClick={() => { void logout().finally(() => navigate({ to: "/" })); }}
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
            <ProfileSection profile={user} />
            <NotificationsSection preferences={preferences.data} />
            <PayoutSection />
            <PaymentSection methods={paymentMethods.data ?? []} />
            <SecuritySection />
            <CloseAccount />
          </div>
        </div>
      </Container>
    </AppShell>
  );
}

function ProfileAvatar({ name, url }: { name: string; url: string | null }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "AF";
  if (!url || failed) return <span className="grid h-16 w-16 place-items-center rounded-full bg-panel font-display text-xl text-ink">{initials}</span>;
  return <img src={url} alt="" onError={() => setFailed(true)} className="h-16 w-16 rounded-full object-cover" />;
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

type ProfileData = { fullName: string; email: string; phone: string | null; city: string; avatarUrl: string | null; createdAt: string; verifications: string[] };
type Preferences = { donationsReceived: boolean; campaignUpdates: boolean; comments: boolean; systemMessages: boolean };
type PaymentMethod = { id: string; brand: string | null; last4: string | null; expMonth: number | null; expYear: number | null; isPreferred: boolean; active: boolean; linkedRecurringGiftCount: number };

function ProfileSection({ profile }: { profile: ProfileData }) {
  const queryClient = useQueryClient();
  const [first, ...rest] = profile.fullName.split(" ");
  const initial = {
    first,
    last: rest.join(" "),
    email: profile.email,
    phone: profile.phone ?? "",
    city: profile.city,
  };
  const [saved, setSaved] = useState(initial);
  const [d, setD] = useState(initial);
  const [justSaved, setJustSaved] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);
  const emailBad = !/^\S+@\S+\.\S+$/.test(d.email);
  const field = (k: keyof typeof d, label: string, type = "text", wide = false, readOnly = false) => (
    <label className={cn("flex flex-col gap-1.5", wide && "sm:col-span-2")}>
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={d[k]}
        readOnly={readOnly}
        onChange={(e) => {
          if (readOnly) return;
          setJustSaved(false);
          setD({ ...d, [k]: e.target.value });
        }}
        className={cn(inputClass, readOnly && "cursor-not-allowed bg-panel text-muted-ink", k === "email" && emailBad && "border-danger")}
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
          onSave={() => { void apiFetch<ProfileData>("/me/profile", { method: "PATCH", body: JSON.stringify({ fullName: `${d.first} ${d.last}`.trim(), phone: d.phone || null, city: d.city }) }).then(() => { setSaved(d); setJustSaved(true); void queryClient.invalidateQueries({ queryKey: ["profile"] }); toast.success("Profile saved"); }).catch((error) => toast.error(error instanceof Error ? error.message : "Could not save profile.")); }}
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {field("first", "First name")}
        {field("last", "Last name")}
        <div className="flex flex-col gap-1.5">
          {field("email", "Email", "email", false, true)}
          <p className="text-[12px] text-subtle">To change your sign-in email, use the email-change flow in Security.</p>
        </div>
        <NigerianPhoneField
          label="Phone"
          value={d.phone}
          onChange={(phone) => {
            setJustSaved(false);
            setD({ ...d, phone });
          }}
        />
        {field("city", "Town or city", "text", true)}
      </div>
      <div className="flex flex-wrap gap-2">
        {profile.verifications.map((v) => (
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
] as const;

function NotificationsSection({ preferences }: { preferences?: Preferences }) {
  const queryClient = useQueryClient();
  const initial = { reminders: preferences?.donationsReceived ?? true, updates: preferences?.campaignUpdates ?? true, receipts: true, news: preferences?.systemMessages ?? true };
  const [saved, setSaved] = useState(initial);
  const [d, setD] = useState(initial);
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (!preferences) return;
    const next = { reminders: preferences.donationsReceived, updates: preferences.campaignUpdates, receipts: true, news: preferences.systemMessages };
    setSaved(next);
    setD(next);
  }, [preferences]);
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
          onSave={() => { void apiFetch<Preferences>("/me/notification-preferences", { method: "PATCH", body: JSON.stringify({ donationsReceived: d.reminders, campaignUpdates: d.updates, comments: d.updates, systemMessages: d.news }) }).then(() => { setSaved(d); setJustSaved(true); void queryClient.invalidateQueries({ queryKey: ["notification-preferences"] }); toast.success("Notification settings saved"); }).catch((error) => toast.error(error instanceof Error ? error.message : "Could not save notification settings.")); }}
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

function PaymentSection({ methods }: { methods: PaymentMethod[] }) {
  return (
    <Section
      id="payment"
      title="Payment methods"
      description="Cards you've saved through Paystack. We never see the full number."
    >
      <ul className="flex flex-col divide-y divide-line-soft rounded-field border border-line-soft">
        {methods.filter((method) => method.active).map((c) => {
          const isDefault = c.isPreferred;
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-12 shrink-0 place-items-center rounded-[6px] border border-line-soft bg-panel">
                <CreditCard className="h-4 w-4 text-ink-soft" strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-ink">
                  {c.brand ?? "Card"} ending {c.last4 ?? "••••"}
                  {isDefault ? <Tag>Default</Tag> : null}
                </span>
                <span className="block text-[13px] text-muted-ink">
                  Expires {c.expMonth ?? "--"}/{c.expYear ? String(c.expYear).slice(-2) : "--"}
                  {c.linkedRecurringGiftCount
                    ? `, used for ${c.linkedRecurringGiftCount} regular gift${c.linkedRecurringGiftCount > 1 ? "s" : ""}`
                    : ""}
                </span>
              </span>
              <span className="flex w-full items-center gap-4 pl-[60px] sm:w-auto sm:pl-0">
                <span className="text-[13px] text-muted-ink">Managed securely by Paystack</span>
              </span>
            </li>
          );
        })}
      </ul>
      {methods.filter((method) => method.active).length === 0 ? <p className="text-sm text-muted-ink">No reusable payment methods are saved yet.</p> : null}
      <button
        type="button"
        onClick={() => toast("A card is saved automatically when you set up an eligible recurring gift.")}
        className={cn(btn("secondary", "sm"), "self-start")}
      >
        <Plus className="h-4 w-4" strokeWidth={2} /> Add a card
      </button>
    </Section>
  );
}

function PayoutSection() {
  return (
    <Section
      id="payout"
      title="Payout account"
      description="Where money raised by your personal campaigns is paid. This is separate from cards you use to donate."
    >
      <PayoutAccountForm />
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
          onClick={() => { void apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword: current, newPassword: next }) }).then(() => { setCurrent(""); setNext(""); toast.success("Password changed"); }).catch((error) => toast.error(error instanceof Error ? error.message : "Could not change password.")); }}
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
          onClick={() => { void apiFetch("/auth/signout-other-devices", { method: "POST" }).then(() => toast.success("Signed out of your other devices")).catch((error) => toast.error(error instanceof Error ? error.message : "Could not sign out other devices.")); }}
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
  const recurring = useQuery({ queryKey: ["recurring-gifts"], queryFn: () => apiFetch<Array<{ active: boolean }>>("/me/recurring-gifts") });
  const active = recurring.data?.filter((gift) => gift.active).length ?? 0;
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
