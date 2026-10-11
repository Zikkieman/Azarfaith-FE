import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Bell, CreditCard, ImagePlus, LockKeyhole, UserRound, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/app/DashboardShell";
import { PageSpinner } from "@/components/PageSpinner";
import { LogoutButton } from "@/components/LogoutButton";
import { UserAvatar } from "@/components/UserAvatar";
import { PayoutSettings } from "@/components/profile/PayoutSettings";
import { EmailChange } from "@/components/profile/EmailChange";
import { LoadError, SaveActions, SettingsSection } from "@/components/profile/SettingsParts";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { changePassword, fetchSession } from "@/features/auth/authSlice";
import {
  deactivatePaymentMethod,
  getCloudinaryStatus,
  getNotificationPreferences,
  getPaymentMethods,
  getProfile,
  updateNotificationPreferences,
  updateProfile,
  uploadMedia,
} from "@/features/catalog/api";
import {
  formatMoney,
  type NotificationPreferences,
  type Profile as UserProfile,
  type SavedPaymentMethod,
} from "@/lib/catalog";
import { validateAvatar, validatePassword } from "@/lib/profile";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useClientReady } from "@/lib/useClientReady";
import { ApiError, apiFetch } from "@/lib/api";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const dispatch = useAppDispatch();
  const authed = useRequireAuth();
  const ready = useClientReady() && authed;
  const userId = useAppSelector((state) => state.auth.user?.id);
  const query = useQuery({
    queryKey: ["profile", userId],
    queryFn: getProfile,
    enabled: ready && Boolean(userId),
  });
  useEffect(() => {
    if (ready && query.error instanceof ApiError && [401, 403].includes(query.error.status)) {
      void dispatch(fetchSession());
    }
  }, [dispatch, ready, query.error]);
  return (
    <DashboardShell>
      {!ready || query.isPending ? (
        <PageSpinner label="Loading profile" />
      ) : !query.data ? (
        <LoadError message="Could not load your profile." retry={() => void query.refetch()} />
      ) : (
        <>
          {query.isError && (
            <div className="mb-5">
              <LoadError
                message="Could not refresh your profile. Your unsaved changes are still here."
                retry={() => void query.refetch()}
              />
            </div>
          )}
          <ProfileSettings key={query.data.id} profile={query.data} />
        </>
      )}
    </DashboardShell>
  );
}

function ProfileSettings({ profile }: { profile: UserProfile }) {
  const nav = [
    ["details", "Profile", UserRound],
    ["notifications", "Notifications", Bell],
    ["payments", "Payment methods", CreditCard],
    ["payouts", "Payout account", Wallet],
    ["security", "Security", LockKeyhole],
  ] as const;
  return (
    <>
      <div className="mb-9 flex flex-wrap items-center justify-between gap-5 border-b border-[#efedf3] pb-8">
        <div className="flex min-w-0 items-center gap-4">
          <UserAvatar src={profile.avatarUrl} name={profile.fullName} className="text-2xl" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{profile.fullName}</h1>
            <p className="mt-1 break-all text-sm text-[#777283]">{profile.email}</p>
            {profile.createdAt && (
              <p className="mt-1 text-xs text-[#777283]">
                Joined{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-NG", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
        <LogoutButton className="giving-small-button" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12">
        <aside>
          <nav
            aria-label="Profile settings"
            className="flex flex-wrap gap-2 lg:sticky lg:top-24 lg:flex-col"
          >
            {nav.map(([id, label, Icon]) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#777283] transition hover:bg-[#f7f6fa] hover:text-[#130e30]"
              >
                <Icon size={17} />
                {label}
              </a>
            ))}
          </nav>
          <p className="mt-6 hidden text-xs leading-relaxed text-[#777283] lg:block">
            Your details, preferences and secure account settings, all in one place.
          </p>
        </aside>
        <div className="min-w-0 space-y-6">
          <ProfileEditor profile={profile} />
          <Preferences userId={profile.id} />
          <PaymentMethods userId={profile.id} />
          <PayoutSettings userId={profile.id} />
          <Security />
          <SettingsSection
            id="activity"
            title="Your activity"
            description="Track your giving and manage the causes you own."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/my-giving" className="rounded-xl bg-[#f7f6fa] p-4">
                <p className="text-xs text-[#777283]">Lifetime giving</p>
                <p className="mt-2 text-xl font-semibold">{formatMoney(profile.totalGiven)}</p>
                <p className="mt-2 text-xs">
                  {profile.activeRecurringGiftCount} active recurring gifts · View giving →
                </p>
              </Link>
              <Link to="/manage" className="rounded-xl bg-[#f7f6fa] p-4">
                <p className="font-semibold">Creator workspace</p>
                <p className="mt-2 text-sm text-[#777283]">
                  {profile.ownedOrganizations.length} organizations ·{" "}
                  {profile.ownedCampaigns.length} campaigns
                </p>
                <p className="mt-3 text-xs">Manage your causes →</p>
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {profile.ownedOrganizations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold">Your organizations</h3>
                  {profile.ownedOrganizations.map((org) => (
                    <Link
                      key={org.id}
                      to="/org/$id"
                      params={{ id: org.id }}
                      className="mt-3 block text-sm underline underline-offset-4"
                    >
                      {org.name}{" "}
                      <span className="text-xs text-[#777283]">
                        ({org.verificationStatus.replaceAll("_", " ")})
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              {profile.ownedCampaigns.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold">Your campaigns</h3>
                  {profile.ownedCampaigns.map((campaign) => (
                    <Link
                      key={campaign.id}
                      to="/campaign/$id"
                      params={{ id: campaign.id }}
                      className="mt-3 block text-sm underline underline-offset-4"
                    >
                      {campaign.title}{" "}
                      <span className="text-xs text-[#777283]">
                        ({campaign.verificationStatus.replaceAll("_", " ")})
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </SettingsSection>
        </div>
      </div>
    </>
  );
}

function ProfileEditor({ profile }: { profile: UserProfile }) {
  const [draft, setDraft] = useState<{
    fullName: string;
    phone: string;
    avatarUrl: string;
    city: string;
  } | null>(null);
  const values = draft ?? {
    fullName: profile.fullName,
    phone: profile.phone ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    city: profile.city ?? "",
  };
  const input = useRef<HTMLInputElement>(null);
  const client = useQueryClient();
  const dispatch = useAppDispatch();
  const media = useQuery({
    queryKey: ["media", "cloudinary-status", profile.id],
    queryFn: getCloudinaryStatus,
  });
  const upload = useMutation({
    mutationFn: (file: File) => uploadMedia({ file, folder: "user-avatar", entityId: profile.id }),
    onSuccess: (result) => {
      setDraft((current) => ({ ...(current ?? values), avatarUrl: result.url }));
      toast.success("Photo uploaded. Save changes to update your profile.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: (result) => {
      client.setQueryData(["profile", profile.id], result);
      setDraft(null);
      void dispatch(fetchSession());
      toast.success("Profile updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const dirty = Boolean(
    draft &&
    (values.fullName !== profile.fullName ||
      values.phone !== (profile.phone ?? "") ||
      values.city !== (profile.city ?? "") ||
      values.avatarUrl !== (profile.avatarUrl ?? "")),
  );
  return (
    <SettingsSection
      id="details"
      title="Profile"
      description="Your name appears on donations unless you choose to give anonymously."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (values.fullName.trim().length < 2) {
            toast.error("Enter at least 2 characters for your name.");
            return;
          }
          save.mutate({
            fullName: values.fullName.trim(),
            phone: values.phone.trim() || null,
            avatarUrl: values.avatarUrl,
            city: values.city.trim(),
          });
        }}
      >
        <fieldset disabled={save.isPending || upload.isPending}>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <UserAvatar
              src={values.avatarUrl}
              name={values.fullName}
              label="Profile photo preview"
            />
            <div>
              <button
                type="button"
                className="giving-small-button"
                disabled={!media.data?.enabled}
                onClick={() => input.current?.click()}
              >
                <ImagePlus size={16} />
                {upload.isPending ? "Uploading..." : "Change photo"}
              </button>
              <p className="mt-2 text-xs text-[#777283]">JPEG, PNG or WebP. Up to 5 MB.</p>
            </div>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                const error = validateAvatar(file);
                if (error) toast.error(error);
                else upload.mutate(file);
              }}
            />
          </div>
          {media.isError && (
            <div className="mb-5">
              <LoadError
                message="Could not check photo upload availability."
                retry={() => void media.refetch()}
              />
            </div>
          )}
          {media.data && !media.data.enabled && (
            <p className="mb-5 text-sm text-[#777283]">Photo uploads are currently unavailable.</p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="giving-label">
              Full name
              <input
                className="giving-input"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                value={values.fullName}
                onChange={(event) => setDraft({ ...values, fullName: event.target.value })}
              />
            </label>
            <label className="giving-label">
              Phone number <span className="font-normal text-[#777283]">(optional)</span>
              <input
                className="giving-input"
                type="tel"
                autoComplete="tel"
                placeholder="+234..."
                value={values.phone}
                onChange={(event) => setDraft({ ...values, phone: event.target.value })}
              />
            </label>
            <label className="giving-label sm:col-span-2">
              Email address
              <input className="giving-input" type="email" readOnly value={profile.email} />
              <span className="mt-2 block text-xs font-normal text-[#777283]">
                Changing your sign-in email requires verification of both inboxes.
                {profile.verifications.includes("Email verified") ? " Email verified." : ""}
              </span>
            </label>
            <label className="giving-label sm:col-span-2">
              City (optional)
              <input
                className="giving-input"
                autoComplete="address-level2"
                maxLength={100}
                value={values.city}
                onChange={(event) => setDraft({ ...values, city: event.target.value })}
              />
            </label>
          </div>
        </fieldset>
        {save.isError && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {save.error.message}
          </p>
        )}
        <SaveActions
          pending={save.isPending || upload.isPending}
          dirty={dirty}
          discard={() => {
            setDraft(null);
            save.reset();
          }}
        />
      </form>
      <EmailChange currentEmail={profile.email} />
    </SettingsSection>
  );
}

function Preferences({ userId }: { userId: string }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["notification-preferences", userId],
    queryFn: getNotificationPreferences,
  });
  const [draft, setDraft] = useState<NotificationPreferences | null>(null);
  const save = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (result) => {
      client.setQueryData(["notification-preferences", userId], result);
      setDraft(null);
      toast.success("Notification preferences saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const values = draft ?? query.data;
  const options = [
    ["donationsReceived", "Donations received", "When someone supports a campaign you created."],
    ["campaignUpdates", "Campaign updates", "News from campaigns you support."],
    ["comments", "Comments", "Comments and replies on your campaigns."],
    ["systemMessages", "System messages", "Reviews, recurring gifts and platform alerts."],
  ] as const;
  return (
    <SettingsSection
      id="notifications"
      title="Notifications"
      description="Choose which in-app notifications you receive. These preferences do not change transactional emails such as receipts and security messages."
    >
      {query.isPending ? (
        <p role="status">Getting preferences...</p>
      ) : query.isError || !values ? (
        <LoadError
          message="Could not load notification preferences."
          retry={() => void query.refetch()}
        />
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(values);
          }}
        >
          <fieldset disabled={save.isPending} className="divide-y divide-[#efedf3]">
            {options.map(([key, label, description]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between gap-4 py-4"
              >
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#777283]">
                    {description}
                  </span>
                </span>
                <Switch
                  aria-label={label}
                  checked={values[key]}
                  onCheckedChange={(checked) => setDraft({ ...values, [key]: checked })}
                  className="data-[state=checked]:bg-black"
                />
              </label>
            ))}
          </fieldset>
          {save.isError && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {save.error.message}
            </p>
          )}
          <SaveActions
            pending={save.isPending}
            dirty={Boolean(draft && options.some(([key]) => draft[key] !== query.data?.[key]))}
            discard={() => {
              setDraft(null);
              save.reset();
            }}
          />
        </form>
      )}
    </SettingsSection>
  );
}

function PaymentMethods({ userId }: { userId: string }) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["payment-methods", userId], queryFn: getPaymentMethods });
  const [selected, setSelected] = useState<SavedPaymentMethod | null>(null);
  const preferred = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ message: string }>(`/me/payment-methods/${encodeURIComponent(id)}/preferred`, {
        method: "PATCH",
      }),
    onSuccess: (response) => {
      void client.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success(response.message);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deactivatePaymentMethod(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["payment-methods"] });
      setSelected(null);
      toast.success("Payment method removed.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <SettingsSection
      id="payments"
      title="Payment methods"
      description="Cards saved securely by Paystack for automatic recurring gifts. AzarFaith never stores your full card number."
    >
      {query.isPending ? (
        <p role="status">Getting payment methods...</p>
      ) : query.isError ? (
        <LoadError message="Could not load payment methods." retry={() => void query.refetch()} />
      ) : !query.data?.length ? (
        <p className="text-sm text-[#777283]">
          No saved cards yet. A reusable card is saved after an automatic recurring checkout with
          your consent.
        </p>
      ) : (
        <ul className="space-y-3">
          {query.data.map((card) => (
            <li
              key={card.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#efedf3] p-4"
            >
              <div>
                <p className="text-sm font-semibold">
                  {card.label}
                  {card.isPreferred && (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                      Preferred
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-[#777283]">
                  {card.linkedRecurringGiftCount
                    ? `Used by ${card.linkedRecurringGiftCount} recurring gifts. Change or cancel those gifts before removing this card.`
                    : "Not linked to an active or paused recurring gift."}
                </p>
              </div>
              {card.active && card.reusable && card.channel === "card" && !card.isPreferred && (
                <button
                  type="button"
                  className="giving-small-button"
                  disabled={preferred.isPending || remove.isPending}
                  onClick={() => preferred.mutate(card.id)}
                >
                  Make preferred
                </button>
              )}
              <button
                type="button"
                className="giving-small-button"
                disabled={
                  card.linkedRecurringGiftCount > 0 ||
                  remove.isPending ||
                  preferred.isPending ||
                  !card.active
                }
                onClick={() => setSelected(card)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/my-giving"
        className="mt-5 inline-block text-sm font-semibold underline underline-offset-4"
      >
        Manage recurring gifts
      </Link>
      <p className="mt-3 text-xs text-muted-ink">
        A preferred card is suggested when choosing a card. It does not change the card already
        linked to a recurring gift or authorize a new charge.
      </p>
      {preferred.isError && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {preferred.error.message}
        </p>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) {
            setSelected(null);
            remove.reset();
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Remove saved card?</DialogTitle>
          <DialogDescription>
            {selected?.label} will no longer be available for future automatic gifts.
          </DialogDescription>
          {remove.isError && (
            <p role="alert" className="text-sm text-red-700">
              {remove.error.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              className="giving-small-button"
              disabled={remove.isPending}
              onClick={() => setSelected(null)}
            >
              Keep card
            </button>
            <button
              className="giving-small-button"
              disabled={remove.isPending}
              onClick={() => selected && remove.mutate(selected.id)}
            >
              {remove.isPending ? "Removing..." : "Remove card"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}

function Security() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [devicesDialog, setDevicesDialog] = useState(false);
  const devices = useMutation({
    mutationFn: () => apiFetch("/auth/signout-other-devices", { method: "POST" }),
    onSuccess: () => {
      setDevicesDialog(false);
      toast.success("Other sessions revoked. This browser remains signed in.");
    },
  });
  const change = useMutation({
    mutationFn: () =>
      dispatch(changePassword({ currentPassword: current, newPassword: password })).unwrap(),
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
      toast.success("Password changed. Sign in again with your new password.");
      await navigate({ to: "/login" });
    },
    onError: (failure: Error) => setError(failure.message),
  });
  return (
    <SettingsSection
      id="security"
      title="Security"
      description="Changing your password signs you out on all devices. Sign in again with your new password."
    >
      <p className="mb-5 text-xs leading-relaxed text-[#777283]">
        If you normally use Google and have not set a password, use{" "}
        <Link to="/forgot-password" className="underline">
          password reset
        </Link>{" "}
        first.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const failure = validatePassword(current, password, confirmation);
          setError(failure ?? "");
          if (!failure) change.mutate();
        }}
      >
        <fieldset disabled={change.isPending} className="grid gap-5 sm:grid-cols-2">
          <label className="giving-label sm:col-span-2">
            Current password
            <input
              className="giving-input"
              required
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </label>
          <label className="giving-label">
            New password
            <input
              className="giving-input"
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className="giving-label">
            Confirm new password
            <input
              className="giving-input"
              required
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
        </fieldset>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <SaveActions
          label="Change password"
          pending={change.isPending}
          dirty={Boolean(current || password || confirmation)}
          discard={() => {
            setCurrent("");
            setPassword("");
            setConfirmation("");
            setError("");
          }}
        />
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-panel p-4">
        <p className="text-sm text-muted-ink">
          Keep this browser signed in and revoke existing sessions on your other devices.
        </p>
        <button
          type="button"
          className="giving-small-button"
          disabled={change.isPending || devices.isPending}
          onClick={() => {
            devices.reset();
            setDevicesDialog(true);
          }}
        >
          Sign out other devices
        </button>
      </div>
      <Dialog
        open={devicesDialog}
        onOpenChange={(value) => {
          if (!devices.isPending) setDevicesDialog(value);
        }}
      >
        <DialogContent>
          <DialogTitle>Sign out other devices?</DialogTitle>
          <DialogDescription>
            Other browsers will need to log in again. This browser receives a new secure session
            cookie. No device count is inferred.
          </DialogDescription>
          {devices.isError && (
            <p role="alert" className="text-sm text-red-700">
              {devices.error.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              className="giving-small-button"
              disabled={devices.isPending}
              onClick={() => setDevicesDialog(false)}
            >
              Cancel
            </button>
            <button
              className="giving-small-button bg-black text-white"
              disabled={devices.isPending}
              onClick={() => devices.mutate()}
            >
              {devices.isPending ? "Signing out..." : "Confirm"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
