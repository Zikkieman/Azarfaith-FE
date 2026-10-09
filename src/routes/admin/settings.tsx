import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import type { PlatformSettings } from "@/lib/mock";
import { pending, simulateNetwork } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { inputClass, labelClass } from "@/components/app/AppShell";
import { Switch } from "@/components/ui/switch";
import { AdminPage } from "@/components/admin/AdminLayout";
import { AdminDetailSkeleton } from "@/components/admin/AdminSkeletons";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <AdminDetailSkeleton label="Loading settings" />,
  ...pending,
  head: () => ({ meta: [{ title: "Settings — AzarFaith admin" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const saved = useApp((s) => s.platformSettings);
  const update = useApp((s) => s.updatePlatformSettings);
  const [draft, setDraft] = useState<PlatformSettings>({ ...saved });
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const set = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const num =
    (key: keyof PlatformSettings, parse = parseInt) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      set(key, (parse(e.target.value) || 0) as never);

  return (
    <AdminPage
      title="Settings"
      lead="Fees, limits and rules that apply to everyone on AzarFaith."
      crumbs={[{ label: "Settings" }]}
      className="pb-32"
    >
      <div className="flex flex-col gap-6">
        <Section
          title="Fees"
          description="What AzarFaith keeps to run the platform and pay for verification."
        >
          <Field label="Platform fee" hint="Taken from each gift.">
            <Affixed suffix="%">
              <input
                type="number"
                step="0.1"
                min={0}
                max={10}
                value={draft.platformFeePercent}
                onChange={num("platformFeePercent", parseFloat)}
                className={cn(inputClass, "pr-9")}
              />
            </Affixed>
          </Field>
          <Field label="Largest tip" hint="The most a giver can add as a tip to AzarFaith.">
            <Affixed prefix="₦">
              <input
                type="number"
                min={0}
                value={draft.maxTipAmount}
                onChange={num("maxTipAmount")}
                className={cn(inputClass, "pl-8")}
              />
            </Affixed>
          </Field>
        </Section>

        <Section
          title="Gift limits"
          description="The smallest and largest single gift anyone can make."
        >
          <Field label="Smallest gift">
            <Affixed prefix="₦">
              <input
                type="number"
                min={0}
                value={draft.minDonation}
                onChange={num("minDonation")}
                className={cn(inputClass, "pl-8")}
              />
            </Affixed>
          </Field>
          <Field label="Largest gift">
            <Affixed prefix="₦">
              <input
                type="number"
                min={0}
                value={draft.maxDonation}
                onChange={num("maxDonation")}
                className={cn(inputClass, "pl-8")}
              />
            </Affixed>
          </Field>
        </Section>

        <Section
          title="Campaigns"
          description="How long campaigns run and what it takes to start one."
        >
          <Field label="One-time campaigns end after" hint="Ongoing campaigns never expire.">
            <Affixed suffix="days">
              <input
                type="number"
                min={30}
                max={365}
                value={draft.campaignExpiryDays}
                onChange={num("campaignExpiryDays")}
                className={cn(inputClass, "pr-14")}
              />
            </Affixed>
          </Field>
          <Toggle
            label="Approve verified organizations automatically"
            hint="Their campaigns go live without waiting for review."
            checked={draft.autoApproveVerifiedOrgs}
            onChange={(v) => set("autoApproveVerifiedOrgs", v)}
          />
          <Toggle
            label="Require a verified phone"
            hint="People must confirm their phone number before starting a campaign."
            checked={draft.requirePhoneForCampaigns}
            onChange={(v) => set("requirePhoneForCampaigns", v)}
          />
        </Section>

        <Section title="Verification" description="What happens after an organization is rejected.">
          <Field label="They can apply again after" hint="Counted from the day of rejection.">
            <Affixed suffix="days">
              <input
                type="number"
                min={7}
                max={90}
                value={draft.reapplicationDays}
                onChange={num("reapplicationDays")}
                className={cn(inputClass, "pr-14")}
              />
            </Affixed>
          </Field>
        </Section>

        <Section
          title="Notifications"
          description="Messages the platform sends to people, and to this team."
        >
          <Toggle
            label="Email"
            hint="Receipts, campaign updates and account messages."
            checked={draft.emailNotifications}
            onChange={(v) => set("emailNotifications", v)}
          />
          <Toggle
            label="SMS"
            hint="Sign-in codes, large gifts and failed payments."
            checked={draft.smsNotifications}
            onChange={(v) => set("smsNotifications", v)}
          />
          <Field label="Team inbox" hint="Where review requests and reports are sent.">
            <input
              type="email"
              value={draft.adminNotificationEmail}
              onChange={(e) => set("adminNotificationEmail", e.target.value)}
              className={inputClass}
            />
          </Field>
        </Section>
      </div>

      <SaveBar
        dirty={dirty}
        onDiscard={() => setDraft({ ...saved })}
        onSave={() => {
          update(draft);
          toast.success("Settings saved");
        }}
      />
    </AdminPage>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5 rounded-card border border-line-soft bg-paper p-5 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <p className="text-sm leading-[1.55] text-muted-ink">{description}</p>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex max-w-[420px] flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className="text-[13px] text-muted-ink">{hint}</span> : null}
    </label>
  );
}

function Affixed({
  prefix,
  suffix,
  children,
}: {
  prefix?: string;
  suffix?: string;
  children: ReactNode;
}) {
  return (
    <span className="relative block">
      {prefix ? (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
          {prefix}
        </span>
      ) : null}
      {children}
      {suffix ? (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-ink">
          {suffix}
        </span>
      ) : null}
    </span>
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

/**
 * Appears when something has changed. Portalled to <body> because the page's rise-in animation
 * transforms its container, which would otherwise pin a fixed bar to the page, not the screen.
 */
function SaveBar({
  dirty,
  onDiscard,
  onSave,
}: {
  dirty: boolean;
  onDiscard: () => void;
  onSave: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div
      className={cn(
        "fixed bottom-5 left-1/2 z-30 flex w-[min(560px,calc(100%-32px))] -translate-x-1/2 items-center justify-between gap-4 rounded-card border border-line-soft bg-paper/90 py-3 pl-5 pr-3 shadow-[0_24px_64px_-20px_rgba(19,14,48,0.35)] backdrop-blur-md transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] lg:ml-32",
        dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
      aria-hidden={!dirty}
    >
      <p className="text-sm text-ink">You have unsaved changes</p>
      <div className="flex gap-2">
        <button
          type="button"
          className={btn("quiet", "sm")}
          tabIndex={dirty ? 0 : -1}
          onClick={onDiscard}
        >
          Discard
        </button>
        <button
          type="button"
          className={btn("primary", "sm")}
          tabIndex={dirty ? 0 : -1}
          onClick={onSave}
        >
          Save changes
        </button>
      </div>
    </div>,
    document.body,
  );
}
