import { Link } from "@tanstack/react-router";
import type { PayoutAccount } from "@/lib/catalog";
import { LoadError } from "@/components/profile/SettingsParts";
import { inputClass } from "@/components/app/AppShell";
import { Field } from "./CreationParts";

export function CampaignPayoutAccount({
  account,
  loading,
  failed,
  message,
  retry,
  organizationId,
  appearance,
}: {
  account?: PayoutAccount | null;
  loading: boolean;
  failed: boolean;
  message?: string;
  retry: () => void;
  organizationId?: string;
  appearance?: "app";
}) {
  const app = appearance === "app";
  return (
    <section
      id="field-payoutAccount"
      className={
        app ? "flex scroll-mt-24 flex-col gap-4" : "scroll-mt-24 border-t border-[#efedf3] pt-8"
      }
    >
      <h2
        className={
          app
            ? "font-display text-[22px] leading-tight tracking-[-0.02em] text-ink"
            : "text-lg font-semibold"
        }
      >
        Payout account
      </h2>
      <p
        className={
          app ? "mt-1 text-sm text-muted-ink" : "mb-5 mt-1 text-sm leading-relaxed text-[#777283]"
        }
      >
        Reuse your saved account. No bank details need to be entered for this campaign.
      </p>
      {loading ? (
        <p role="status" className="text-sm">
          Loading your saved payout account...
        </p>
      ) : failed ? (
        <LoadError
          message="Could not load your saved payout account. Nothing has been changed."
          retry={retry}
        />
      ) : account ? (
        <div
          className={
            app
              ? "rounded-field border border-line-soft bg-panel p-4"
              : "rounded-2xl border border-[#e5e1ee] bg-[#f8f7fa] p-4"
          }
        >
          <Field id="savedPayoutAccount" label="Saved payout account" error={message}>
            <select
              id="savedPayoutAccount"
              className={app ? inputClass : "giving-input"}
              key={account.id}
              defaultValue={account.id}
            >
              <option value={account.id}>
                {account.bankName} - {account.accountNumberMasked}
              </option>
            </select>
          </Field>
          <p className="mt-3 break-words text-sm font-medium">{account.accountName}</p>
          <p className="mt-1 text-xs text-[#777283]">
            {account.ownerType === "organization"
              ? "Saved organization account"
              : "Saved profile account"}
            {" · "}
            {account.active && account.status === "verified"
              ? "Verified"
              : account.active && account.status === "pending"
                ? "Pending verification"
                : "Inactive"}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[#777283]">
            This saved destination is selected automatically. An admin must still release payouts.
          </p>
        </div>
      ) : (
        <p className="text-sm text-[#777283]">
          No saved payout account found. Add one once in your profile, then return here.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {account?.ownerType === "organization" && organizationId ? (
          <Link to="/org/$id" params={{ id: organizationId }} className="font-medium underline">
            Manage saved organization account
          </Link>
        ) : (
          <Link to="/profile" hash="payouts" className="font-medium underline">
            {account ? "Manage saved account" : "Add payout account in profile"}
          </Link>
        )}
        <button type="button" className="underline" onClick={retry}>
          Refresh saved account
        </button>
      </div>
    </section>
  );
}
