import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getPayoutBanks,
  getPersonalPayoutAccount,
  getPersonalPayoutSummary,
  resolvePayoutAccount,
  upsertPersonalPayoutAccount,
  getOrganizationPayoutAccount,
  getOrganizationPayoutSummary,
  upsertOrganizationPayoutAccount,
} from "@/features/catalog/api";
import { formatMoney, type PayoutAccount, type PayoutBank } from "@/lib/catalog";
import { LoadError, SettingsSection } from "./SettingsParts";

export function PayoutSettings({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId?: string;
}) {
  const scope = organizationId ?? "personal";
  const account = useQuery({
    queryKey: ["payout-account", scope, userId],
    queryFn: () =>
      organizationId ? getOrganizationPayoutAccount(organizationId) : getPersonalPayoutAccount(),
  });
  const banks = useQuery({ queryKey: ["payout-banks", userId], queryFn: getPayoutBanks });
  const summary = useQuery({
    queryKey: ["payout-summary", scope, userId],
    queryFn: () =>
      organizationId ? getOrganizationPayoutSummary(organizationId) : getPersonalPayoutSummary(),
  });
  return (
    <SettingsSection
      id="payouts"
      title={organizationId ? "Organization payouts" : "Payout account"}
      description={
        organizationId
          ? "Your verified profile account is used by default. Add a separate destination only if this organization needs a different bank account. An admin must release each payout."
          : "Use one bank account for your personal campaigns and eligible organizations. An admin reviews and releases payouts; saving an account does not release money."
      }
    >
      {account.isPending || banks.isPending ? (
        <p role="status">Getting payout account...</p>
      ) : account.isError || banks.isError ? (
        <LoadError
          message="Could not load payout account settings."
          retry={() => {
            void account.refetch();
            void banks.refetch();
          }}
        />
      ) : (
        <>
          {account.data && (
            <div className="mb-5 rounded-xl bg-[#f7f6fa] p-4 text-sm">
              <p className="font-semibold">
                {account.data.bankName} · {account.data.accountNumberMasked}
              </p>
              <p className="mt-1 text-[#777283]">
                {account.data.accountName} ·{" "}
                {account.data.status === "verified"
                  ? "Verified"
                  : account.data.status === "pending"
                    ? "Pending verification"
                    : "Inactive"}
              </p>
            </div>
          )}
          {organizationId && account.data?.ownerType === "user" && (
            <p className="mb-4 text-sm text-[#777283]">
              Using your profile payout account. Saving below creates an organization-specific
              destination.
            </p>
          )}
          <PayoutEditor
            key={`${scope}-${userId}`}
            userId={userId}
            organizationId={organizationId}
            account={account.data ?? null}
            banks={banks.data ?? []}
          />
        </>
      )}
      <div className="mt-6 border-t border-[#efedf3] pt-5">
        {summary.isPending ? (
          <p role="status">Getting payout balances...</p>
        ) : summary.isError || !summary.data ? (
          <LoadError
            message="Could not load payout balances."
            retry={() => void summary.refetch()}
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ["Collected", summary.data.totalCollected],
                ["Platform fees", summary.data.totalPlatformFees],
                ["Net collected", summary.data.totalNetCollected],
                ["Released / reserved", summary.data.totalReleased],
                ["Available for release", summary.data.availableBalance],
              ].map(([label, amount]) => (
                <div key={label} className="rounded-xl bg-[#f7f6fa] p-4">
                  <p className="text-xs text-[#777283]">{label}</p>
                  <p className="mt-2 text-lg font-semibold">{formatMoney(Number(amount))}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#777283]">
              Available balance excludes platform fees and payouts that are completed, processing or
              awaiting OTP. Tips belong to AzarFaith and are not payable to creators.
            </p>
            <h3 className="mt-5 text-sm font-semibold">Recent payouts</h3>
            {!summary.data.recentTransfers.length ? (
              <p className="mt-2 text-sm text-[#777283]">No payouts have been released yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[#efedf3]">
                {summary.data.recentTransfers.map((transfer) => (
                  <li
                    key={transfer.id}
                    className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{formatMoney(transfer.amount)}</p>
                      <p className="mt-1 break-all text-xs text-[#777283]">{transfer.reference}</p>
                    </div>
                    <div className="text-right text-xs text-[#777283]">
                      <p>{transfer.status.replaceAll("_", " ")}</p>
                      <time dateTime={transfer.releasedAt}>
                        {new Date(transfer.releasedAt).toLocaleDateString("en-NG")}
                      </time>
                    </div>
                    {transfer.failureMessage && (
                      <p className="w-full text-xs text-red-700">{transfer.failureMessage}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </SettingsSection>
  );
}

function PayoutEditor({
  userId,
  organizationId,
  account,
  banks,
}: {
  userId: string;
  organizationId?: string;
  account: PayoutAccount | null;
  banks: PayoutBank[];
}) {
  const client = useQueryClient();
  const [bankCode, setBankCode] = useState(account?.bankCode ?? "");
  const [accountNumber, setAccountNumber] = useState("");
  const [holder, setHolder] = useState(account?.accountHolderName ?? "");
  const [name, setName] = useState("");
  const [resolveError, setResolveError] = useState("");
  const [checking, setChecking] = useState(false);
  const [retry, setRetry] = useState(0);
  const lookupVersion = useRef(0);
  useEffect(() => {
    const version = ++lookupVersion.current;
    let cancelled = false;
    if (!bankCode || accountNumber.length !== 10) {
      setChecking(false);
      return;
    }
    const timer = window.setTimeout(() => {
      if (cancelled || version !== lookupVersion.current) return;
      setChecking(true);
      setResolveError("");
      void resolvePayoutAccount({ bankCode, accountNumber })
        .then((result) => {
          if (!cancelled && version === lookupVersion.current) {
            setName(result.accountName);
            setResolveError("");
          }
        })
        .catch((error: Error) => {
          if (!cancelled && version === lookupVersion.current)
            setResolveError(
              error.message ||
                "Account lookup unavailable. Enter the beneficiary name manually; verification will remain pending.",
            );
        })
        .finally(() => {
          if (!cancelled && version === lookupVersion.current) setChecking(false);
        });
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [bankCode, accountNumber, retry]);
  const save = useMutation({
    mutationFn: (payload: Parameters<typeof upsertPersonalPayoutAccount>[0]) =>
      organizationId
        ? upsertOrganizationPayoutAccount(organizationId, payload)
        : upsertPersonalPayoutAccount(payload),
    onSuccess: (result) => {
      client.setQueryData(["payout-account", organizationId ?? "personal", userId], result);
      void client.invalidateQueries({ queryKey: ["payout-summary"] });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
      void client.invalidateQueries({ queryKey: ["organization-dashboard"] });
      toast.success(
        result.status === "verified"
          ? "Payout account saved and verified."
          : "Payout account saved. Verification is pending.",
      );
      ++lookupVersion.current;
      setAccountNumber("");
      setName("");
      setResolveError("");
      setChecking(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const resetLookup = () => {
    ++lookupVersion.current;
    setName("");
    setResolveError("");
    setChecking(false);
  };
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate({
          bankCode,
          accountNumber,
          accountHolderName: holder.trim(),
          accountName: name.trim(),
        });
      }}
    >
      <fieldset disabled={save.isPending} className="grid gap-4 sm:grid-cols-2">
        <label className="giving-label">
          Bank
          <select
            aria-label="Bank"
            className="giving-input"
            value={bankCode}
            required
            onChange={(event) => {
              resetLookup();
              setBankCode(event.target.value);
            }}
          >
            <option value="">Select a bank</option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </label>
        <label className="giving-label">
          Account number
          <input
            className="giving-input"
            inputMode="numeric"
            pattern="[0-9]{10}"
            required
            placeholder={
              account ? "Re-enter 10 digits to change account" : "10-digit account number"
            }
            value={accountNumber}
            onChange={(event) => {
              resetLookup();
              setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10));
            }}
          />
        </label>
        <label className="giving-label">
          Account holder name
          <input
            className="giving-input"
            maxLength={120}
            required
            value={holder}
            onChange={(event) => setHolder(event.target.value)}
          />
        </label>
        <label className="giving-label">
          Beneficiary name
          <input
            className="giving-input"
            maxLength={120}
            required
            value={name}
            onChange={(event) => {
              ++lookupVersion.current;
              setChecking(false);
              setName(event.target.value);
            }}
          />
        </label>
      </fieldset>
      <p className="mt-3 text-xs leading-relaxed text-[#777283]">
        We check the account automatically. If the bank lookup is unavailable, enter the beneficiary
        name manually. Only a confirmed account is marked verified.
      </p>
      {checking && (
        <p role="status" className="mt-2 text-xs">
          Checking account details...
        </p>
      )}
      {resolveError && (
        <p role="status" className="mt-2 text-xs text-amber-800">
          {resolveError}
        </p>
      )}
      {save.isError && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {save.error.message}
        </p>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          className="giving-small-button"
          disabled={checking || save.isPending || !bankCode || accountNumber.length !== 10}
          onClick={() => setRetry((value) => value + 1)}
        >
          Retry account check
        </button>
        <button
          type="submit"
          disabled={
            save.isPending ||
            checking ||
            !bankCode ||
            accountNumber.length !== 10 ||
            !holder.trim() ||
            !name.trim()
          }
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {save.isPending ? "Saving..." : "Save payout account"}
        </button>
      </div>
    </form>
  );
}
