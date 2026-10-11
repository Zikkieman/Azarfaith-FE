import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAdminPlatformSettings,
  updateAdminPlatformSettings,
  type AdminPlatformSettings,
} from "@/features/catalog/api";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { PageSpinner } from "@/components/PageSpinner";
import { Switch } from "@/components/ui/switch";
import { formatAmountInput, parseAmountInput } from "@/lib/catalog";
import { AdminGivingControl } from "@/components/admin/AdminGivingControl";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });
function AdminSettings() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "settings"], queryFn: getAdminPlatformSettings });
  return (
    <AdminPageWrapper
      title="Platform settings"
      lead="Changes are saved to the backend and recorded in the admin activity log."
    >
      {query.isPending ? (
        <PageSpinner label="Loading settings" fullScreen={false} />
      ) : query.isError || !query.data ? (
        <AdminLoadError retry={() => void query.refetch()} />
      ) : (
        <SettingsEditor
          initial={query.data}
          saveCache={(saved) => {
            client.setQueryData(["admin", "settings"], saved);
            void client.invalidateQueries({ queryKey: ["admin", "activity"] });
          }}
        />
      )}
      <AdminGivingControl />
    </AdminPageWrapper>
  );
}

function SettingsEditor({
  initial,
  saveCache,
}: {
  initial: AdminPlatformSettings;
  saveCache: (saved: AdminPlatformSettings) => void;
}) {
  // A refetch cannot overwrite an in-progress edit. Discard explicitly loads the latest saved values.
  const [settings, setSettings] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [formError, setFormError] = useState("");
  const edit = (change: Partial<AdminPlatformSettings>) => {
    setSettings((old) => ({ ...old, ...change }));
    setDirty(true);
  };
  const save = useMutation({
    mutationFn: updateAdminPlatformSettings,
    onSuccess: (result) => {
      setSettings(result);
      setDirty(false);
      saveCache(result);
      toast.success("Platform settings saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const numericFields = [
    {
      key: "platformFeePercent" as const,
      label: "Platform fee (%)",
      min: 0,
      max: 10,
      step: 0.01,
      money: false,
    },
    { key: "minDonation" as const, label: "Minimum donation (NGN)", min: 1, money: true },
    { key: "maxDonation" as const, label: "Maximum donation (NGN)", min: 1, money: true },
    {
      key: "campaignExpiryDays" as const,
      label: "One-time campaign expiry (days)",
      min: 30,
      max: 365,
      money: false,
    },
    {
      key: "reapplicationDays" as const,
      label: "Rejected organization waiting period (days)",
      min: 7,
      max: 90,
      money: false,
    },
  ];
  return (
    <form
      className="max-w-4xl space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        setFormError("");
        if (
          settings.minDonation < 1 ||
          settings.maxDonation < 1 ||
          settings.minDonation > settings.maxDonation
        ) {
          setFormError("Enter positive donation limits; the minimum cannot exceed the maximum.");
          return;
        }
        save.mutate({
          platformFeePercent: settings.platformFeePercent,
          minDonation: settings.minDonation,
          maxDonation: settings.maxDonation,
          campaignExpiryDays: settings.campaignExpiryDays,
          reapplicationDays: settings.reapplicationDays,
          autoApproveVerifiedOrgs: settings.autoApproveVerifiedOrgs,
          requirePhoneForCampaigns: settings.requirePhoneForCampaigns,
          emailNotifications: settings.emailNotifications,
          adminNotificationEmail: settings.adminNotificationEmail.trim(),
        });
      }}
    >
      <fieldset disabled={save.isPending} className="space-y-6">
        <section className="rounded-xl border border-line-soft p-5 sm:p-6">
          <h2 className="text-base font-semibold">Giving & review policies</h2>
          <p className="mt-1 text-sm text-muted-ink">
            Amounts use naira. Platform fees are deducted from creator payout balances.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {numericFields.map((field) => (
              <label key={field.key} className="giving-label">
                {field.label}
                <input
                  className="giving-input"
                  type={field.money ? "text" : "number"}
                  inputMode={field.money ? "numeric" : "decimal"}
                  required
                  min={field.min}
                  max={field.max}
                  step={field.step ?? 1}
                  value={
                    field.money
                      ? formatAmountInput(String(settings[field.key]))
                      : settings[field.key]
                  }
                  onChange={(event) =>
                    edit({
                      [field.key]: field.money
                        ? parseAmountInput(event.target.value)
                        : Number(event.target.value),
                    })
                  }
                />
              </label>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-line-soft p-5 sm:p-6">
          <h2 className="text-base font-semibold">Campaign safeguards</h2>
          <div className="mt-5 divide-y divide-line-soft">
            <PolicyToggle
              label="Auto-approve verified organizations"
              description="Eligible campaigns from verified organizations can skip manual moderation. Only enable this when your team approves that policy."
              checked={settings.autoApproveVerifiedOrgs}
              change={(value) => edit({ autoApproveVerifiedOrgs: value })}
            />
            <PolicyToggle
              label="Require a contact phone for campaigns"
              description="Creators must have a phone number on their profile. This does not claim an independent SMS verification."
              checked={settings.requirePhoneForCampaigns}
              change={(value) => edit({ requirePhoneForCampaigns: value })}
            />
          </div>
        </section>
        <section className="rounded-xl border border-line-soft p-5 sm:p-6">
          <h2 className="text-base font-semibold">Communications</h2>
          <PolicyToggle
            label="Platform notification emails"
            description="Allow optional platform event emails. Security and payment receipts remain transactional."
            checked={settings.emailNotifications}
            change={(value) => edit({ emailNotifications: value })}
          />
          <label className="giving-label mt-4">
            Admin notification email
            <input
              className="giving-input"
              type="email"
              required
              value={settings.adminNotificationEmail}
              onChange={(event) => edit({ adminNotificationEmail: event.target.value })}
            />
          </label>
          <p className="mt-4 text-xs text-muted-ink">
            SMS is not enabled for this release. Donors can enter custom tips; there is no legacy
            tip-cap control here.
          </p>
        </section>
      </fieldset>
      {formError && (
        <p role="alert" className="text-sm text-red-700">
          {formError}
        </p>
      )}
      {save.isError && (
        <p role="alert" className="text-sm text-red-700">
          {save.error.message}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="mr-auto text-xs text-muted-ink">
          {dirty ? "Unsaved changes" : "Saved settings"}
        </span>
        <button
          type="button"
          className="giving-small-button"
          disabled={save.isPending || !dirty}
          onClick={() => {
            setSettings(initial);
            setDirty(false);
            setFormError("");
          }}
        >
          Discard changes
        </button>
        <button
          type="submit"
          className="rounded-xl bg-black px-5 py-3 text-sm text-white disabled:opacity-40"
          disabled={save.isPending || !dirty}
        >
          {save.isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
function PolicyToggle({
  label,
  description,
  checked,
  change,
}: {
  label: string;
  description: string;
  checked: boolean;
  change: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-ink">{description}</p>
      </div>
      <Switch aria-label={label} checked={checked} onCheckedChange={change} />
    </div>
  );
}
