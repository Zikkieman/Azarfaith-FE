import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Landmark, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { FieldError, Tag, inputClass, labelClass } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";

export type PayoutAccount = {
  id: string;
  ownerType: "user" | "organization";
  accountHolderName: string;
  bankCode: string;
  bankName: string;
  accountNumberMasked: string;
  accountName: string;
  currency: string;
  status: "pending" | "verified" | "inactive";
  active: boolean;
};

type Bank = { name: string; code: string };
type PayoutAccountMode = { manualEntry: boolean };
type ResolvedAccount = {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  verificationToken: string;
};

export function PayoutAccountForm({
  organizationId,
  organizationName,
  onReadyChange,
}: {
  organizationId?: string;
  organizationName?: string;
  onReadyChange?: (ready: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const scope = organizationId ? `organization-${organizationId}` : "personal";
  const accountPath = organizationId
    ? `/organizations/${encodeURIComponent(organizationId)}/payout-account`
    : "/me/payout-account";
  const account = useQuery({
    queryKey: ["payout-account", scope],
    queryFn: () => apiFetch<PayoutAccount | null>(accountPath),
  });
  const banks = useQuery({
    queryKey: ["payout-banks"],
    queryFn: () => apiFetch<Bank[]>("/me/payout-banks"),
    staleTime: 24 * 60 * 60 * 1000,
  });
  const payoutMode = useQuery({
    queryKey: ["payout-account-mode"],
    queryFn: () => apiFetch<PayoutAccountMode>("/me/payout-account/mode"),
    staleTime: Infinity,
  });
  const [editing, setEditing] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const ready = Boolean(account.data?.active && account.data.status === "verified");
  const showForm = editing || (!account.isLoading && !account.data);
  const manualEntry = payoutMode.data?.manualEntry ?? false;

  useEffect(() => onReadyChange?.(ready), [onReadyChange, ready]);
  useEffect(() => {
    setEditing(false);
    setBankCode("");
    setAccountNumber("");
    setResolvedName("");
    setVerificationToken("");
    setResolveError("");
  }, [scope]);

  const selectedBank = useMemo(
    () => banks.data?.find((bank) => bank.code === bankCode),
    [bankCode, banks.data],
  );

  useEffect(() => {
    setResolvedName("");
    setVerificationToken("");
    setResolveError("");
    if (manualEntry || !bankCode || !/^\d{10}$/.test(accountNumber)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setResolving(true);
      try {
        const result = await apiFetch<ResolvedAccount>("/me/payout-account/resolve", {
          method: "POST",
          body: JSON.stringify({ bankCode, accountNumber }),
          signal: controller.signal,
        });
        if (!result.accountName) throw new Error("The bank did not return an account name.");
        setResolvedName(result.accountName);
        setVerificationToken(result.verificationToken);
      } catch (error) {
        if (controller.signal.aborted) return;
        setResolveError(error instanceof Error ? error.message : "Could not verify this account.");
      } finally {
        if (!controller.signal.aborted) setResolving(false);
      }
    }, 450);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [accountNumber, bankCode, manualEntry]);

  const save = async () => {
    if (
      !selectedBank ||
      !/^\d{10}$/.test(accountNumber) ||
      !resolvedName ||
      (!manualEntry && !verificationToken)
    ) return;
    setSaving(true);
    try {
      const saved = await apiFetch<PayoutAccount>(accountPath, {
        method: "PATCH",
        body: JSON.stringify({
          bankCode,
          accountNumber,
          accountHolderName: resolvedName,
          accountName: resolvedName,
          verificationToken: manualEntry ? undefined : verificationToken,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["payout-account", scope] });
      setEditing(false);
      setAccountNumber("");
      setResolvedName("");
      setVerificationToken("");
      if (saved.status === "verified") toast.success(manualEntry ? "Test payout account saved" : "Payout account verified and saved");
      else toast("Payout account saved and awaiting verification");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save payout account.");
    } finally {
      setSaving(false);
    }
  };

  if (account.isLoading) return <p className="text-sm text-muted-ink">Loading payout account…</p>;
  if (account.error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-field bg-danger/5 p-4">
        <FieldError>
          {account.error instanceof Error
            ? account.error.message
            : "Could not load payout account."}
        </FieldError>
        <button
          type="button"
          className={btn("secondary", "sm")}
          onClick={() => void account.refetch()}
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {account.data && !showForm ? (
        <div className="flex flex-col gap-4 rounded-field border border-line-soft p-4 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-panel text-ink">
            <Landmark className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-ink">{account.data.accountName}</p>
              <Tag tone={ready ? "verified" : undefined}>
                {ready ? <BadgeCheck className="h-3.5 w-3.5" /> : null}
                {account.data.status[0].toUpperCase() + account.data.status.slice(1)}
              </Tag>
            </div>
            <p className="text-[13px] text-muted-ink">
              {account.data.bankName} · {account.data.accountNumberMasked}
            </p>
            {organizationId && account.data.ownerType === "user" ? (
              <p className="mt-1 text-[12px] text-muted-ink">
                Your personal payout account will be used for{" "}
                {organizationName || "this organization"}.
              </p>
            ) : null}
          </div>
          <button type="button" className={btn("secondary", "sm")} onClick={() => setEditing(true)}>
            {ready ? "Change" : "Verify again"}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Bank</span>
            <select
              className={inputClass}
              value={bankCode}
              disabled={banks.isLoading || saving}
              onChange={(event) => setBankCode(event.target.value)}
            >
              <option value="">{banks.isLoading ? "Loading banks…" : "Select a bank"}</option>
              {banks.data?.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            {banks.error ? (
              <FieldError>
                {banks.error instanceof Error ? banks.error.message : "Could not load banks."}
              </FieldError>
            ) : null}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Account number</span>
            <input
              className={inputClass}
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              placeholder="10-digit account number"
              value={accountNumber}
              disabled={saving}
              onChange={(event) =>
                setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Account name</span>
            {manualEntry ? (
              <input
                className={inputClass}
                placeholder="Enter the account holder name"
                value={resolvedName}
                disabled={saving}
                onChange={(event) => setResolvedName(event.target.value)}
              />
            ) : (
              <>
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(inputClass, "flex items-center", !resolvedName && "text-muted-ink")}
                >
                  {resolving ? "Checking account…" : resolvedName || "Verified automatically"}
                </div>
                {resolveError ? <FieldError>{resolveError}</FieldError> : null}
              </>
            )}
          </div>
          {manualEntry ? (
            <p className="sm:col-span-2 text-[12px] leading-relaxed text-muted-ink">
              Test mode: enter a placeholder account name to continue. No live bank verification or payout is performed.
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3 sm:col-span-2">
            {account.data ? (
              <button
                type="button"
                className={btn("secondary", "sm")}
                disabled={saving}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            ) : null}
            <button
              type="button"
              className={btn("primary", "sm")}
              disabled={
                !selectedBank || accountNumber.length !== 10 || !resolvedName || (!manualEntry && !verificationToken) || resolving || saving
              }
              onClick={() => void save()}
            >
              {saving ? "Saving…" : "Save payout account"}
            </button>
          </div>
        </div>
      )}
      {!ready ? (
        <p className="text-[12px] leading-relaxed text-muted-ink">
          A verified payout account is required before a campaign can be submitted. Drafts can still
          be saved.
        </p>
      ) : null}
    </div>
  );
}
