import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageSpinner } from "@/components/PageSpinner";
import {
  getPayoutBanks,
  getPersonalPayoutAccount,
  getPersonalPayoutSummary,
  getCloudinaryStatus,
  getNotificationPreferences,
  getProfile,
  resolvePayoutAccount,
  updateNotificationPreferences,
  updateProfile,
  upsertPersonalPayoutAccount,
  uploadMedia,
} from "@/features/catalog/api";
import { formatMoney } from "@/lib/catalog";
import { useRequireAuth } from "@/lib/useRequireAuth";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const isAuthed = useRequireAuth();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: isAuthed,
  });
  const {
    data: mediaStatus,
    isLoading: mediaStatusLoading,
    isError: mediaStatusError,
  } = useQuery({
    queryKey: ["media", "cloudinary-status"],
    queryFn: getCloudinaryStatus,
    enabled: isAuthed,
  });
  const { data: notificationPreferences } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: getNotificationPreferences,
    enabled: isAuthed,
  });
  const { data: payoutBanks } = useQuery({
    queryKey: ["payout-banks"],
    queryFn: getPayoutBanks,
    enabled: isAuthed,
  });
  const { data: payoutAccount } = useQuery({
    queryKey: ["payout-account", "personal"],
    queryFn: getPersonalPayoutAccount,
    enabled: isAuthed,
  });
  const { data: payoutSummary } = useQuery({
    queryKey: ["payout-summary", "personal"],
    queryFn: getPersonalPayoutSummary,
    enabled: isAuthed,
  });
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [payoutBankCode, setPayoutBankCode] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutAccountHolderName, setPayoutAccountHolderName] = useState("");
  const [resolvedAccountName, setResolvedAccountName] = useState("");
  const [resolveError, setResolveError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhone(profile.phone ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");
  }, [profile]);

  useEffect(() => {
    if (!payoutAccount) return;
    setPayoutBankCode(payoutAccount.bankCode);
    setPayoutAccountHolderName(payoutAccount.accountHolderName);
    setResolvedAccountName(payoutAccount.accountName);
  }, [payoutAccount]);

  useEffect(() => {
    if (!payoutBankCode || payoutAccountNumber.length !== 10) {
      setResolveError("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      resolvePayoutMutation.mutate();
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [payoutBankCode, payoutAccountNumber]);

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) =>
      uploadMedia({
        file,
        folder: "user-avatar",
        entityId: profile?.id,
      }),
    onSuccess: (upload) => {
      setAvatarUrl(upload.url);
      toast.success("Avatar uploaded.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        fullName,
        phone,
        avatarUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
      toast.success("Profile updated.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateNotificationPreferencesMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification preferences updated.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resolvePayoutMutation = useMutation({
    mutationFn: () =>
      resolvePayoutAccount({
        bankCode: payoutBankCode,
        accountNumber: payoutAccountNumber,
      }),
    onSuccess: (response) => {
      setResolvedAccountName(response.accountName);
      setResolveError("");
    },
    onError: (error: Error) => {
      setResolveError(
        error.message ||
          "Paystack could not confirm this account right now. You can still save it manually as pending.",
      );
    },
  });

  const savePayoutMutation = useMutation({
    mutationFn: () =>
      upsertPersonalPayoutAccount({
        accountHolderName: payoutAccountHolderName.trim(),
        bankCode: payoutBankCode,
        accountNumber: payoutAccountNumber,
        accountName: resolvedAccountName.trim() || payoutAccountHolderName.trim(),
      }),
    onSuccess: (response) => {
      setResolvedAccountName(response.accountName);
      queryClient.invalidateQueries({ queryKey: ["payout-account", "personal"] });
      queryClient.invalidateQueries({ queryKey: ["payout-summary", "personal"] });
      toast.success(
        response.status === "verified"
          ? "Personal payout account saved and verified."
          : "Payout account saved. It is pending verification before payouts can be released.",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!isAuthed) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex-1 w-full max-w-5xl px-5 py-12 md:px-8">
          <PageSpinner label="Redirecting to login..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex-1 w-full max-w-5xl px-5 py-12 text-muted-foreground md:px-8">
          {isLoading ? <PageSpinner label="Loading profile..." /> : "Log in to view your profile."}
        </main>
        <Footer />
      </div>
    );
  }

  const ensureMediaReady = () => {
    if (mediaStatus?.enabled) return true;
    if (mediaStatusLoading) {
      toast.error("Checking media upload connection. Try again in a moment.");
      return false;
    }
    if (mediaStatusError) {
      toast.error("Could not confirm media upload setup. Refresh and try again.");
      return false;
    }
    toast.error("Media upload is not configured yet.");
    return false;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-5xl px-5 py-12 md:px-8">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 font-display text-2xl text-amber-700">
              {profile.fullName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl tracking-tight">{profile.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              {profile.email}
              {profile.phone ? ` · ${profile.phone}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Profile settings
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update the account details donors and campaign pages rely on.
              </p>
            </div>
            <button
              onClick={() => setEditing((current) => !current)}
              className="rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted"
            >
              {editing ? "Close" : "Edit profile"}
            </button>
          </div>

          {editing ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadAvatarMutation.mutate(file);
                  event.target.value = "";
                }}
              />
              <div className="md:col-span-2 rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                    ) : (
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 font-display text-2xl text-amber-700">
                        {fullName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">Profile avatar</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Upload a square image to personalize your donor profile.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!ensureMediaReady()) return;
                      avatarInputRef.current?.click();
                    }}
                    disabled={uploadAvatarMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
                  >
                    {uploadAvatarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    {uploadAvatarMutation.isPending ? "Uploading..." : "Change avatar"}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Full name</label>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Phone number</label>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  onClick={() => updateProfileMutation.mutate()}
                  disabled={updateProfileMutation.isPending}
                  className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="font-display text-2xl">{formatMoney(profile.totalGiven)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Total given</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="font-display text-2xl">{profile.activeRecurringGiftCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Active recurring gifts</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Personal payout account
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set the bank account AzarFaith should use when an admin releases money from your personal campaigns.
              </p>
            </div>
            {payoutAccount ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {payoutAccount.bankName} · {payoutAccount.accountNumberMasked}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Bank</label>
              <select
                value={payoutBankCode}
                onChange={(event) => setPayoutBankCode(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Select a bank</option>
                {(payoutBanks ?? []).map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Account number</label>
              <input
                value={payoutAccountNumber}
                onChange={(event) =>
                  setPayoutAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit account number"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Account holder name</label>
              <input
                value={payoutAccountHolderName}
                onChange={(event) => setPayoutAccountHolderName(event.target.value)}
                placeholder="Legal account holder name"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Beneficiary name</label>
              <input
                value={resolvedAccountName}
                onChange={(event) => setResolvedAccountName(event.target.value)}
                placeholder="Beneficiary account name"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                AzarFaith will try to confirm this automatically. If Paystack is unavailable, you can still save it manually and it will stay pending.
              </p>
            </div>
          </div>

          {resolvePayoutMutation.isPending ? (
            <p className="mt-3 text-xs text-muted-foreground">Checking account details with Paystack...</p>
          ) : null}
          {resolveError ? (
            <p className="mt-3 text-xs text-amber-700">{resolveError}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                if (!payoutBankCode || payoutAccountNumber.length !== 10) {
                  toast.error("Select a bank and enter a valid 10-digit account number.");
                  return;
                }
                resolvePayoutMutation.mutate();
              }}
              disabled={resolvePayoutMutation.isPending}
              className="rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
            >
              {resolvePayoutMutation.isPending ? "Checking..." : "Retry account check"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  !payoutBankCode ||
                  payoutAccountNumber.length !== 10 ||
                  !payoutAccountHolderName.trim() ||
                  !resolvedAccountName.trim()
                ) {
                  toast.error("Complete the payout account form before saving.");
                  return;
                }
                savePayoutMutation.mutate();
              }}
              disabled={savePayoutMutation.isPending}
              className="rounded-full bg-amber-500 px-5 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
            >
              {savePayoutMutation.isPending ? "Saving..." : "Save payout account"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="font-display text-2xl">
                {formatMoney(payoutSummary?.totalCollected ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Collected on personal campaigns</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="font-display text-2xl">
                {formatMoney(payoutSummary?.totalReleased ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Already released</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="font-display text-2xl">
                {formatMoney(payoutSummary?.availableBalance ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Available for admin release</p>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-medium text-muted-foreground">Recent payout releases</h3>
            <div className="mt-3 space-y-3">
              {(payoutSummary?.recentTransfers ?? []).length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                  No payout has been released to your personal account yet.
                </p>
              ) : (
                payoutSummary!.recentTransfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex flex-col gap-2 rounded-2xl border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{formatMoney(transfer.amount)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(transfer.releasedAt).toLocaleString()} · {transfer.status.replaceAll("_", " ")}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{transfer.reference}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              Notification preferences
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose which in-app notifications AzarFaith should store and show in your account.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <PreferenceToggle
              label="Donations received"
              description="For creators when someone supports your campaign."
              checked={notificationPreferences?.donationsReceived ?? true}
              onChange={(checked) =>
                updateNotificationPreferencesMutation.mutate({ donationsReceived: checked })
              }
              disabled={updateNotificationPreferencesMutation.isPending}
            />
            <PreferenceToggle
              label="Campaign updates"
              description="When a campaign you supported posts a new update."
              checked={notificationPreferences?.campaignUpdates ?? true}
              onChange={(checked) =>
                updateNotificationPreferencesMutation.mutate({ campaignUpdates: checked })
              }
              disabled={updateNotificationPreferencesMutation.isPending}
            />
            <PreferenceToggle
              label="Comments"
              description="When someone comments on a campaign you created."
              checked={notificationPreferences?.comments ?? true}
              onChange={(checked) =>
                updateNotificationPreferencesMutation.mutate({ comments: checked })
              }
              disabled={updateNotificationPreferencesMutation.isPending}
            />
            <PreferenceToggle
              label="System messages"
              description="Review outcomes, recurring failures, and other platform alerts."
              checked={notificationPreferences?.systemMessages ?? true}
              onChange={(checked) =>
                updateNotificationPreferencesMutation.mutate({ systemMessages: checked })
              }
              disabled={updateNotificationPreferencesMutation.isPending}
            />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Recent donations</h2>
          <div className="space-y-3">
            {profile.donationHistory.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                Your successful donations will appear here.
              </p>
            ) : (
              profile.donationHistory.map((donation) => (
                <div key={donation.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{formatMoney(donation.amount)}</p>
                    <p className="text-xs text-muted-foreground">{donation.date} · {donation.status.replaceAll("_", " ")}</p>
                  </div>
                  <Link to="/my-giving" className="text-xs font-medium text-amber-600 transition hover:text-amber-700">
                    View giving
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Creator workspace</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open one place to manage the organizations and campaigns you own.
                </p>
              </div>
              <Link
                to="/manage"
                className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Open workspace
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground">Your organizations</h2>
            <div className="mt-3 space-y-3">
              {profile.ownedOrganizations.length === 0 ? (
                <p className="text-sm text-muted-foreground">You have not created an organization yet.</p>
              ) : (
                profile.ownedOrganizations.map((organization) => (
                  <Link
                    key={organization.id}
                    to="/org/$id"
                    params={{ id: organization.id }}
                    className="block rounded-xl border border-border px-4 py-3 transition hover:border-amber-300"
                  >
                    <p className="text-sm font-medium">{organization.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {organization.verificationStatus.replaceAll("_", " ")}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground">Your campaigns</h2>
            <div className="mt-3 space-y-3">
              {profile.ownedCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">You have not created a campaign yet.</p>
              ) : (
                profile.ownedCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to="/campaign/$id"
                    params={{ id: campaign.id }}
                    className="block rounded-xl border border-border px-4 py-3 transition hover:border-amber-300"
                  >
                    <p className="text-sm font-medium">{campaign.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {campaign.verificationStatus.replaceAll("_", " ")}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Verifications</h2>
          <div className="flex flex-wrap gap-2">
            {profile.verifications.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                <ShieldCheck className="h-3.5 w-3.5" /> {item}
              </span>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-border px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-1 h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-400"
      />
    </label>
  );
}
