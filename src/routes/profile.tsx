import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, ImagePlus, CreditCard, Plus, LogOut, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Container, Tag, inputClass, labelClass } from "@/components/app/AppShell";
import { ProfileSkeleton } from "@/components/app/Skeletons";
import { btn } from "@/components/app/btn";
import { LogoutButton } from "@/components/LogoutButton";
import { UserAvatar } from "@/components/UserAvatar";
import { PayoutSettings } from "@/components/profile/PayoutSettings";
import { EmailChange } from "@/components/profile/EmailChange";
import {
  DesignSettingsSection as Section,
  DesignSaveFooter,
} from "@/components/profile/DesignSettingsParts";
import { LoadError } from "@/components/profile/SettingsParts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/app/DesignDialog";
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
import { cn } from "@/lib/utils";
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

  if (!ready || query.isPending) return <ProfileSkeleton label="Loading your profile" />;
  return (
    <AppShell>
      <Container className="py-8 md:py-12">
        {!query.data ? (
          <LoadError message="Could not load your profile." retry={() => void query.refetch()} />
        ) : (
          <>
            {query.isError && (
              <LoadError
                message="Could not refresh your profile. Your unsaved changes are still here."
                retry={() => void query.refetch()}
              />
            )}
            <ProfileSettings key={query.data.id} profile={query.data} />
          </>
        )}
      </Container>
    </AppShell>
  );
}
function ProfileSettings({ profile }: { profile: UserProfile }) {
  const nav = [
    { id: "profile", label: "Profile" },
    { id: "notifications", label: "Notifications" },
    { id: "payment", label: "Payment methods" },
    { id: "security", label: "Security" },
    { id: "close", label: "Close account" },
    { id: "payouts", label: "Payout account" },
  ];
  return (
    <>
      <div className="flex flex-col gap-6 border-b border-line-soft pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar
            src={profile.avatarUrl}
            name={profile.fullName}
            className="h-16 w-16 bg-panel text-ink-soft"
          />
          <div>
            <h1 className="font-display text-[clamp(26px,2.6vw,34px)] leading-tight tracking-[-0.02em] text-ink">
              {profile.fullName}
            </h1>
            <p className="text-sm text-muted-ink">
              {profile.city ? profile.city + ", " : ""}giving since{" "}
              {profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-NG", {
                    month: "long",
                    year: "numeric",
                  })
                : "joining AzarFaith"}
            </p>
          </div>
        </div>
        <LogoutButton
          className={cn(btn("secondary", "sm"), "self-start sm:self-auto")}
          icon={<LogOut className="h-4 w-4" strokeWidth={1.75} />}
        />
      </div>
      <div className="grid gap-8 pt-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="hidden lg:block" aria-label="Settings">
          <ul className="sticky top-24 flex flex-col gap-0.5">
            {nav.map((n) => (
              <li key={n.id}>
                <a
                  href={"#" + n.id}
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
        <div className="flex max-w-[720px] min-w-0 flex-col gap-6">
          <ProfileEditor profile={profile} />
          <Preferences userId={profile.id} />
          <PaymentMethods userId={profile.id} />
          <Security />
          <CloseAccount active={profile.activeRecurringGiftCount} />
          <PayoutSettings userId={profile.id} appearance="profile" />
          <Section
            id="activity"
            title="Your activity"
            description="Track your giving and manage the causes you own."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/my-giving" className="rounded-field bg-panel p-4">
                <p className="text-xs text-muted-ink">Lifetime giving</p>
                <p className="mt-2 text-xl font-semibold">{formatMoney(profile.totalGiven)}</p>
                <p className="mt-2 text-xs">
                  {profile.activeRecurringGiftCount} active recurring gifts · View giving →
                </p>
              </Link>
              <Link to="/manage" className="rounded-field bg-panel p-4">
                <p className="font-semibold">Creator workspace</p>
                <p className="mt-2 text-sm text-muted-ink">
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
                      <span className="text-xs text-muted-ink">
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
                      <span className="text-xs text-muted-ink">
                        ({campaign.verificationStatus.replaceAll("_", " ")})
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
function ProfileEditor({ profile }: { profile: UserProfile }) {
  const [draft, setDraft] = useState<{
    first: string;
    last: string;
    phone: string;
    avatarUrl: string;
    city: string;
  } | null>(null);
  const values = draft ?? {
    first: profile.fullName.trim().split(/\s+/)[0] ?? "",
    last: profile.fullName.trim().split(/\s+/).slice(1).join(" "),
    phone: profile.phone ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    city: profile.city ?? "",
  };
  const fullName = [values.first.trim(), values.last.trim()].filter(Boolean).join(" ");
  const [justSaved, setJustSaved] = useState(false);
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
      setJustSaved(true);
      void dispatch(fetchSession());
      toast.success("Profile updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const dirty = Boolean(
    draft &&
    (fullName !== profile.fullName ||
      values.phone !== (profile.phone ?? "") ||
      values.city !== (profile.city ?? "") ||
      values.avatarUrl !== (profile.avatarUrl ?? "")),
  );

  const field = (
    key: "first" | "last" | "phone" | "city",
    label: string,
    type = "text",
    wide = false,
  ) => (
    <label className={cn("flex flex-col gap-1.5", wide && "sm:col-span-2")}>
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={values[key]}
        maxLength={key === "city" ? 100 : 120}
        onChange={(e) => {
          setJustSaved(false);
          setDraft({ ...values, [key]: e.target.value });
        }}
        className={inputClass}
      />
    </label>
  );
  return (
    <Section
      id="profile"
      title="Profile"
      description="Organizations see your name on gifts unless you give anonymously."
      footer={
        <DesignSaveFooter
          form="profile-details"
          pending={save.isPending || upload.isPending}
          dirty={dirty}
          saved={justSaved}
          invalid={fullName.length < 2 || fullName.length > 120}
          discard={() => {
            setDraft(null);
            save.reset();
          }}
        />
      }
    >
      <form
        id="profile-details"
        className="contents"
        onSubmit={(e) => {
          e.preventDefault();
          if (save.isPending || upload.isPending) return;
          if (fullName.length < 2 || fullName.length > 120) {
            toast.error("Use 2 to 120 characters for your full name.");
            return;
          }
          save.mutate({
            fullName,
            phone: values.phone.trim() || null,
            avatarUrl: values.avatarUrl,
            city: values.city.trim(),
          });
        }}
      >
        <fieldset disabled={save.isPending || upload.isPending} className="contents">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("first", "First name")}
            {field("last", "Last name")}
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Email</span>
              <input type="email" readOnly value={profile.email} className={inputClass} />
            </label>
            {field("phone", "Phone", "tel")}
            {field("city", "Town or city", "text", true)}
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.verifications.map((v) => (
              <Tag key={v} tone="verified">
                <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
                {v}
              </Tag>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <UserAvatar
              src={values.avatarUrl}
              name={fullName}
              label="Profile photo preview"
              className="bg-panel text-ink-soft"
            />
            <div>
              <button
                type="button"
                className={btn("secondary", "sm")}
                disabled={!media.data?.enabled}
                onClick={() => input.current?.click()}
              >
                <ImagePlus size={16} />
                {upload.isPending ? "Uploading..." : "Change photo"}
              </button>
              <p className="mt-2 text-[12px] text-subtle">JPEG, PNG or WebP. Up to 5 MB.</p>
            </div>
            <input
              ref={input}
              type="file"
              aria-label="Profile photo"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                const failure = validateAvatar(file);
                if (failure) toast.error(failure);
                else upload.mutate(file);
              }}
            />
          </div>
        </fieldset>
        {media.isError && (
          <LoadError
            message="Could not check photo upload availability."
            retry={() => void media.refetch()}
          />
        )}
        {media.data && !media.data.enabled && (
          <p className="text-sm text-muted-ink">Photo uploads are currently unavailable.</p>
        )}
        {save.isError && (
          <p role="alert" className="text-sm text-danger">
            {save.error.message}
          </p>
        )}
      </form>
      <p className="text-[12px] text-subtle">
        Changing your sign-in email requires verification of both inboxes.
      </p>
      <EmailChange currentEmail={profile.email} appearance="app" />
    </Section>
  );
}
function Preferences({ userId }: { userId: string }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["notification-preferences", userId],
    queryFn: getNotificationPreferences,
  });
  const [draft, setDraft] = useState<NotificationPreferences | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const save = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (result) => {
      client.setQueryData(["notification-preferences", userId], result);
      setDraft(null);
      setJustSaved(true);
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

  const sourcePrefs = [
    {
      id: "systemMessages",
      title: "Gift reminders",
      body: "Recurring gift and platform alerts in the app. Transactional email reminders are still sent.",
    },
    {
      id: "campaignUpdates",
      title: "Campaign updates",
      body: "When something you support posts news, photos or receipts.",
    },
    {
      id: "receipts",
      title: "Receipts by email",
      body: "A receipt for every confirmed gift.",
      fixed: true,
    },
    {
      id: "news",
      title: "AzarFaith newsletter",
      body: "Newsletter subscriptions are not available yet.",
      fixed: false,
    },
    {
      id: "donationsReceived",
      title: "Donations received",
      body: "When someone supports a campaign you created.",
    },
    { id: "comments", title: "Comments", body: "Comments and replies on your campaigns." },
  ];
  const dirty = Boolean(draft && options.some(([key]) => draft[key] !== query.data?.[key]));
  return (
    <Section
      id="notifications"
      title="Notifications"
      description="What we send you, and how often."
      footer={
        values && !query.isError ? (
          <DesignSaveFooter
            form="profile-notifications"
            pending={save.isPending}
            dirty={dirty}
            saved={justSaved}
            discard={() => {
              setDraft(null);
              save.reset();
            }}
          />
        ) : undefined
      }
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
          id="profile-notifications"
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            if (!save.isPending) save.mutate(values);
          }}
        >
          <fieldset disabled={save.isPending} className="contents">
            <ul className="flex flex-col divide-y divide-line-soft">
              {sourcePrefs.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-6 py-3.5 first:pt-0 last:pb-0"
                >
                  <label htmlFor={"pref-" + p.id} className="cursor-pointer">
                    <span className="block text-sm font-medium text-ink">{p.title}</span>
                    <span className="block text-[13px] text-muted-ink">{p.body}</span>
                  </label>
                  <Switch
                    id={"pref-" + p.id}
                    aria-label={p.title}
                    checked={
                      p.fixed !== undefined
                        ? p.fixed
                        : values[p.id as keyof NotificationPreferences]
                    }
                    disabled={p.fixed !== undefined}
                    onCheckedChange={(checked) => {
                      setJustSaved(false);
                      setDraft({ ...values, [p.id]: checked });
                    }}
                    className="data-[state=checked]:bg-ink data-[state=unchecked]:bg-line-input"
                  />
                </li>
              ))}
            </ul>
          </fieldset>
          {save.isError && (
            <p role="alert" className="text-sm text-danger">
              {save.error.message}
            </p>
          )}
        </form>
      )}
      <p className="text-[12px] text-subtle">
        Receipts cannot be turned off. These controls change in-app preferences, not transactional
        emails.
      </p>
    </Section>
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
    <Section
      id="payment"
      title="Payment methods"
      description="Cards you've saved through Paystack. We never see the full number."
    >
      <span id="payments" className="sr-only" />
      {query.isPending ? (
        <p role="status">Getting payment methods...</p>
      ) : query.isError ? (
        <LoadError message="Could not load payment methods." retry={() => void query.refetch()} />
      ) : !query.data?.length ? (
        <p className="text-sm text-muted-ink">
          No saved cards yet. A reusable card is saved after an automatic recurring checkout with
          your consent.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line-soft rounded-field border border-line-soft">
          {query.data.map((card) => (
            <li key={card.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-12 shrink-0 place-items-center rounded-[6px] border border-line-soft bg-panel">
                <CreditCard className="h-4 w-4 text-ink-soft" strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-ink">
                  {card.label || (card.brand || card.cardType || "Card") + " ending " + card.last4}
                  {card.isPreferred && <Tag>Default</Tag>}
                </span>
                <span className="block text-[13px] text-muted-ink">
                  {card.expMonth && card.expYear
                    ? "Expires " + card.expMonth + "/" + card.expYear
                    : ""}
                  {card.linkedRecurringGiftCount > 0
                    ? " · Used by " + card.linkedRecurringGiftCount + " recurring gifts"
                    : "Not linked to an active or paused recurring gift."}
                </span>
              </span>
              <span className="flex w-full items-center gap-4 pl-[60px] sm:w-auto sm:pl-0">
                {card.active && card.reusable && card.channel === "card" && !card.isPreferred && (
                  <button
                    type="button"
                    className={btn("quiet", "sm")}
                    disabled={preferred.isPending || remove.isPending}
                    onClick={() => preferred.mutate(card.id)}
                  >
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  className="text-sm font-medium text-danger hover:underline disabled:cursor-not-allowed disabled:text-subtle disabled:no-underline"
                  disabled={
                    card.linkedRecurringGiftCount > 0 ||
                    remove.isPending ||
                    preferred.isPending ||
                    !card.active
                  }
                  onClick={() => setSelected(card)}
                  title={
                    card.linkedRecurringGiftCount > 0
                      ? "Change or cancel the linked recurring gifts before removing this card."
                      : undefined
                  }
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled
        title="Standalone card setup is not available yet. Save a reusable card through a consented recurring checkout."
        className={cn(btn("secondary", "sm"), "self-start")}
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        Add a card
      </button>
      <Link to="/my-giving" className="text-sm font-medium text-ink underline underline-offset-2">
        Manage recurring gifts
      </Link>
      <p className="text-[12px] text-subtle">
        A default card is suggested for future choices. It does not change existing recurring
        authorizations or create a charge.
      </p>
      {preferred.isError && (
        <p role="alert" className="text-sm text-danger">
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
            <p role="alert" className="text-sm text-danger">
              {remove.error.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className={btn("secondary", "sm")}
              disabled={remove.isPending}
              onClick={() => setSelected(null)}
            >
              Keep card
            </button>
            <button
              type="button"
              className={btn("primary", "sm")}
              disabled={remove.isPending}
              onClick={() => selected && remove.mutate(selected.id)}
            >
              {remove.isPending ? "Removing..." : "Remove card"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Section>
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
    <Section
      id="security"
      title="Security"
      description="Your password and where you're signed in."
      footer={
        <DesignSaveFooter
          form="profile-security"
          label="Change password"
          pending={change.isPending}
          dirty={Boolean(current && password && confirmation)}
        />
      }
    >
      <form
        id="profile-security"
        className="contents"
        onSubmit={(event) => {
          event.preventDefault();
          if (change.isPending) return;
          const failure = validatePassword(current, password, confirmation);
          setError(failure ?? "");
          if (!failure) change.mutate();
        }}
      >
        <fieldset disabled={change.isPending} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Current password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>New password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Confirm new password</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className={inputClass}
            />
          </label>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </form>
      <p className="text-[12px] text-subtle">
        Changing your password signs you out on all devices. If you use Google and have not set a
        password, use{" "}
        <Link to="/forgot-password" className="underline">
          password reset
        </Link>{" "}
        first.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-field bg-panel px-4 py-3">
        <p className="text-sm text-ink-soft">
          Keep this browser signed in and revoke existing sessions on other devices.
        </p>
        <button
          type="button"
          className={btn("secondary", "sm")}
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
            <p role="alert" className="text-sm text-danger">
              {devices.error.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className={btn("secondary", "sm")}
              disabled={devices.isPending}
              onClick={() => setDevicesDialog(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={btn("primary", "sm")}
              disabled={devices.isPending}
              onClick={() => devices.mutate()}
            >
              {devices.isPending ? "Signing out..." : "Confirm"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  );
}

function CloseAccount({ active }: { active: number }) {
  return (
    <Section
      id="close"
      title="Close account"
      description="Account closure is not available yet. Contact support for help with your account."
      danger
    >
      {active > 0 && (
        <div className="flex gap-3 rounded-field bg-panel p-4">
          <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted-ink" strokeWidth={2} />
          <p className="text-sm text-ink-soft">
            You have{" "}
            <span className="font-medium text-ink">
              {active} regular gift{active > 1 ? "s" : ""}
            </span>{" "}
            still running. Manage them in{" "}
            <Link to="/my-giving" className="font-medium text-ink underline underline-offset-2">
              My giving
            </Link>
            .
          </p>
        </div>
      )}
      <button
        type="button"
        disabled
        title="A secure closure and financial-record retention workflow has not been implemented."
        className={cn(btn("secondary", "sm"), "self-start text-danger hover:border-danger")}
      >
        Close my account
      </button>
    </Section>
  );
}
