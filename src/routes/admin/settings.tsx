import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import type { PlatformSettings } from "@/lib/domain";
import { apiFetch, pending } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { FieldError, inputClass, labelClass } from "@/components/app/AppShell";
import { Switch } from "@/components/ui/switch";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminDetailSkeleton } from "@/components/admin/AdminSkeletons";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({
  pendingComponent: () => <AdminDetailSkeleton label="Loading settings" />,
  ...pending,
  head: () => ({ meta: [{ title: "Settings — AzarFaith admin" }] }),
  component: AdminSettings,
});

const sections = [
  { id: "fees", label: "Fees" },
  { id: "limits", label: "Gift limits" },
  { id: "campaigns", label: "Campaigns" },
  { id: "verification", label: "Verification" },
  { id: "notifications", label: "Notifications" },
  { id: "danger", label: "Pause giving" },
];

type Keys = (keyof PlatformSettings)[];

/** Settings with one save per section (after Buildkite), so a change never rides along unseen. */
function AdminSettings() {
  return (
    <AdminPage
      title="Settings"
      lead="Fees, limits and rules that apply to everyone on AzarFaith. Every change is logged."
      crumbs={[{ label: "Settings" }]}
    >
      <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="hidden lg:block">
          <ul className="sticky top-20 flex flex-col gap-0.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    "block rounded-[8px] px-2.5 py-1.5 text-sm transition-colors hover:bg-panel hover:text-ink",
                    s.id === "danger" ? "text-danger" : "text-ink-soft",
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex max-w-[760px] flex-col gap-6">
          <Section
            id="fees"
            title="Fees"
            description="What AzarFaith keeps to run the platform and pay for verification."
            keys={["platformFeePercent", "maxTipAmount"]}
            validate={(d) =>
              d.platformFeePercent < 0 || d.platformFeePercent > 10
                ? { platformFeePercent: "Keep the fee between 0% and 10%." }
                : {}
            }
          >
            {(d, set, errors) => (
              <>
                <NumberField
                  label="Platform fee"
                  hint="Taken from each gift and shown to givers before they pay."
                  suffix="%"
                  step={0.1}
                  value={d.platformFeePercent}
                  onChange={(v) => set("platformFeePercent", v)}
                  error={errors.platformFeePercent}
                />
                <NumberField
                  label="Largest tip"
                  hint="The most a giver can add as a tip to AzarFaith."
                  prefix="₦"
                  value={d.maxTipAmount}
                  onChange={(v) => set("maxTipAmount", v)}
                />
              </>
            )}
          </Section>

          <Section
            id="limits"
            title="Gift limits"
            description="The smallest and largest single gift anyone can make."
            keys={["minDonation", "maxDonation"]}
            validate={(d) =>
              d.minDonation >= d.maxDonation
                ? { maxDonation: "The largest gift has to be more than the smallest." }
                : {}
            }
          >
            {(d, set, errors) => (
              <>
                <NumberField
                  label="Smallest gift"
                  prefix="₦"
                  value={d.minDonation}
                  onChange={(v) => set("minDonation", v)}
                />
                <NumberField
                  label="Largest gift"
                  hint="Bigger gifts are asked to contact the team."
                  prefix="₦"
                  value={d.maxDonation}
                  onChange={(v) => set("maxDonation", v)}
                  error={errors.maxDonation}
                />
              </>
            )}
          </Section>

          <Section
            id="campaigns"
            title="Campaigns"
            description="How long campaigns run and what it takes to start one."
            keys={["campaignExpiryDays", "autoApproveVerifiedOrgs", "requirePhoneForCampaigns"]}
            validate={(d) =>
              d.campaignExpiryDays < 30 || d.campaignExpiryDays > 365
                ? { campaignExpiryDays: "Choose between 30 and 365 days." }
                : {}
            }
          >
            {(d, set, errors) => (
              <>
                <NumberField
                  label="One-time campaigns end after"
                  hint="Ongoing campaigns never end on their own."
                  suffix="days"
                  value={d.campaignExpiryDays}
                  onChange={(v) => set("campaignExpiryDays", v)}
                  error={errors.campaignExpiryDays}
                />
                <Toggle
                  label="Approve campaigns from verified organizations automatically"
                  hint="They skip the review queue. Personal campaigns are always reviewed."
                  checked={d.autoApproveVerifiedOrgs}
                  onChange={(v) => set("autoApproveVerifiedOrgs", v)}
                />
                <Toggle
                  label="Require a confirmed phone number"
                  hint="Before anyone can start a campaign."
                  checked={d.requirePhoneForCampaigns}
                  onChange={(v) => set("requirePhoneForCampaigns", v)}
                />
              </>
            )}
          </Section>

          <Section
            id="verification"
            title="Verification"
            description="What happens after an organization is rejected."
            keys={["reapplicationDays"]}
          >
            {(d, set) => (
              <NumberField
                label="They can apply again after"
                hint="Counted from the day they were rejected."
                suffix="days"
                value={d.reapplicationDays}
                onChange={(v) => set("reapplicationDays", v)}
              />
            )}
          </Section>

          <Section
            id="notifications"
            title="Notifications"
            description="Messages the platform sends to people, and to this team."
            keys={["emailNotifications", "smsNotifications", "adminNotificationEmail"]}
            validate={(d) =>
              /^\S+@\S+\.\S+$/.test(d.adminNotificationEmail)
                ? {}
                : { adminNotificationEmail: "Enter a valid email address." }
            }
          >
            {(d, set, errors) => (
              <>
                <Toggle
                  label="Email"
                  hint="Receipts, campaign updates and account messages."
                  checked={d.emailNotifications}
                  onChange={(v) => set("emailNotifications", v)}
                />
                <Toggle
                  label="SMS"
                  hint="Sign-in codes, large gifts and failed payments."
                  checked={d.smsNotifications}
                  onChange={(v) => set("smsNotifications", v)}
                />
                <label className="flex max-w-[420px] flex-col gap-1.5">
                  <span className={labelClass}>Team inbox</span>
                  <input
                    type="email"
                    value={d.adminNotificationEmail}
                    onChange={(e) => set("adminNotificationEmail", e.target.value)}
                    className={cn(inputClass, errors.adminNotificationEmail && "border-danger")}
                  />
                  <FieldError>{errors.adminNotificationEmail}</FieldError>
                  <span className="text-[13px] text-muted-ink">
                    Review requests and reports go here.
                  </span>
                </label>
              </>
            )}
          </Section>

          <DangerZone />
        </div>
      </div>
    </AdminPage>
  );
}

function Section({
  id,
  title,
  description,
  keys,
  validate,
  children,
}: {
  id: string;
  title: string;
  description: string;
  keys: Keys;
  validate?: (d: PlatformSettings) => Partial<Record<keyof PlatformSettings, string>>;
  children: (
    d: PlatformSettings,
    set: <K extends keyof PlatformSettings>(k: K, v: PlatformSettings[K]) => void,
    errors: Partial<Record<keyof PlatformSettings, string>>,
  ) => ReactNode;
}) {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => apiFetch<PlatformSettings>("/admin/review/settings"),
  });
  const update = useMutation({
    mutationFn: (data: Partial<PlatformSettings>) =>
      apiFetch<PlatformSettings>("/admin/review/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (next) => queryClient.setQueryData(["admin", "settings"], next),
  });
  const saved = settings.data;
  const [draft, setDraft] = useState<PlatformSettings | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (saved) setDraft((current) => current ?? saved);
  }, [saved]);
  if (settings.error) {
    return <section id={id} className="rounded-card border border-danger/20 bg-danger/[0.04] px-5 py-4 text-sm text-danger">Could not load {title.toLowerCase()} settings.</section>;
  }
  if (settings.isLoading || !saved || !draft) {
    return <section id={id} className="h-48 animate-pulse rounded-card border border-line-soft bg-panel/30" />;
  }
  const dirty = keys.some((k) => draft[k] !== saved[k]);
  const errors = validate ? validate(draft) : {};
  const invalid = Object.keys(errors).length > 0;

  const set = <K extends keyof PlatformSettings>(k: K, v: PlatformSettings[K]) => {
    setJustSaved(false);
    setDraft((current) => (current ? { ...current, [k]: v } as PlatformSettings : current));
  };

  return (
    <section id={id} className="scroll-mt-20 rounded-card border border-line-soft">
      <div className="px-5 pb-1 pt-5 sm:px-6">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-ink">{description}</p>
      </div>
      <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">{children(draft, set, errors)}</div>
      <div className="flex items-center justify-end gap-3 border-t border-line-soft bg-panel/40 px-5 py-3 sm:px-6">
        {justSaved && !dirty ? (
          <span className="inline-flex items-center gap-1 text-[13px] text-verified-ink">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Saved
          </span>
        ) : dirty ? (
          <button
            type="button"
            onClick={() => setDraft(saved)}
            className="text-[13px] text-muted-ink transition-colors hover:text-ink"
          >
            Discard
          </button>
        ) : null}
        <button
          type="button"
          disabled={!dirty || invalid}
          className={btn("primary", "sm")}
          onClick={async () => {
            try {
              await update.mutateAsync(Object.fromEntries(keys.map((k) => [k, draft[k]])) as Partial<PlatformSettings>);
              setJustSaved(true);
              toast.success(`${title} saved`);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : `Could not save ${title.toLowerCase()}.`);
            }
          }}
        >
          Save {title.toLowerCase()}
        </button>
      </div>
    </section>
  );
}

function NumberField({
  label,
  hint,
  prefix,
  suffix,
  step,
  value,
  onChange,
  error,
}: {
  label: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  error?: string;
}) {
  return (
    <label className="flex max-w-[420px] flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <span className="relative block">
        {prefix ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
            {prefix}
          </span>
        ) : null}
        <input
          type="number"
          step={step}
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
          className={cn(inputClass, prefix && "pl-8", suffix && "pr-14", error && "border-danger")}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
            {suffix}
          </span>
        ) : null}
      </span>
      <FieldError>{error}</FieldError>
      {hint ? <span className="text-[13px] text-muted-ink">{hint}</span> : null}
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6">
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-[13px] text-muted-ink">{hint}</span>
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="mt-0.5 data-[state=checked]:bg-ink data-[state=unchecked]:bg-line-input"
      />
    </label>
  );
}

/** Stop all payments in an emergency. Typing PAUSE makes it impossible to do by accident. */
function DangerZone() {
  const queryClient = useQueryClient();
  const giving = useQuery({
    queryKey: ["admin", "giving-control"],
    queryFn: () => apiFetch<{ givingPaused: boolean }>("/admin/review/giving-control"),
  });
  const setPaused = useMutation({
    mutationFn: (givingPaused: boolean) =>
      apiFetch("/admin/review/giving-control", {
        method: "PATCH",
        body: JSON.stringify({ givingPaused }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "giving-control"] }),
  });
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  if (giving.isLoading) return <section id="danger" className="h-32 animate-pulse rounded-card border border-line-soft bg-panel/30" />;
  if (giving.error) return <section id="danger" className="rounded-card border border-danger/20 bg-danger/[0.04] px-5 py-4 text-sm text-danger">Could not load giving controls.</section>;
  const paused = giving.data?.givingPaused ?? false;

  return (
    <section id="danger" className="scroll-mt-20 rounded-card border border-danger/25">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">
            {paused ? "Giving is paused" : "Pause all giving"}
          </h2>
          <p className="mt-0.5 max-w-[480px] text-sm text-muted-ink">
            {paused
              ? "No payments are being taken anywhere on AzarFaith. Givers see a notice on every campaign."
              : "Stops every payment on AzarFaith at once, for a payment outage or a security problem. Recurring gifts wait and resume later."}
          </p>
        </div>
        {paused ? (
          <button
            type="button"
            className={btn("primary", "sm")}
            onClick={async () => {
              try {
                await setPaused.mutateAsync(false);
                toast.success("Giving resumed");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not resume giving.");
              }
            }}
          >
            Resume giving
          </button>
        ) : (
          <button
            type="button"
            className={cn(btn("secondary", "sm"), "text-danger hover:border-danger")}
            onClick={() => setConfirming(true)}
          >
            Pause giving
          </button>
        )}
      </div>

      <AdminConfirmDialog
        open={confirming}
        onOpenChange={(v) => {
          setConfirming(v);
          if (!v) setTyped("");
        }}
        title="Pause all giving?"
        consequences={[
          "Every campaign stops taking gifts immediately.",
          "Recurring gifts due while paused are held, not charged.",
          "Givers see a notice that giving is paused.",
        ]}
        confirmLabel="Pause giving"
        variant="destructive"
        confirmDisabled={typed !== "PAUSE"}
        onConfirm={async () => {
          try {
            await setPaused.mutateAsync(true);
            setTyped("");
            toast("Giving is paused across AzarFaith");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not pause giving.");
          }
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-soft">
            Type <span className="font-semibold text-ink">PAUSE</span> to confirm
          </span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            className={inputClass}
            aria-label="Type PAUSE to confirm"
          />
        </label>
      </AdminConfirmDialog>
    </section>
  );
}
