import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageSpinner } from "@/components/PageSpinner";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import {
  getCloudinaryStatus,
  getNotificationPreferences,
  getProfile,
  updateNotificationPreferences,
  updateProfile,
  uploadMedia,
} from "@/features/catalog/api";

export const Route = createFileRoute("/admin/profile")({
  component: AdminProfile,
});

function AdminProfile() {
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });
  const {
    data: mediaStatus,
    isLoading: mediaStatusLoading,
    isError: mediaStatusError,
  } = useQuery({
    queryKey: ["media", "cloudinary-status"],
    queryFn: getCloudinaryStatus,
  });
  const { data: notificationPreferences } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: getNotificationPreferences,
  });

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhone(profile.phone ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");
  }, [profile]);

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) =>
      uploadMedia({
        file,
        folder: "admin-avatar",
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

  if (!profile) {
    return (
      <AdminPageWrapper title="Admin Profile">
        {isLoading ? (
          <PageSpinner label="Loading admin profile..." fullScreen={false} />
        ) : (
          <p className="text-sm text-gray-500">Could not load your admin profile.</p>
        )}
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="Admin Profile">
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-amber-100 font-display text-3xl text-amber-700">
                {profile.fullName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-display text-2xl text-gray-900">{profile.fullName}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {profile.email}
                {profile.phone ? ` · ${profile.phone}` : ""}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                <ShieldCheck className="h-4 w-4" />
                Platform admin account
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Profile settings
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Update the account details tied to your admin session.
              </p>
            </div>
            <button
              onClick={() => setEditing((current) => !current)}
              className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium transition hover:bg-gray-50"
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
              <div className="md:col-span-2 rounded-2xl border border-gray-200 p-4">
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
                      <p className="text-sm font-medium text-gray-900">Profile avatar</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Upload a square image for your admin account.
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
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-medium transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    {uploadAvatarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    {uploadAvatarMutation.isPending ? "Uploading..." : "Change avatar"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900">Full name</label>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900">Phone number</label>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
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
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Account email
            </p>
            <p className="mt-2 text-lg font-medium text-gray-900">{profile.email}</p>
            <p className="mt-1 text-sm text-gray-500">
              This is the email used for admin authentication.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Verification
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.verifications.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              Notification preferences
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose which in-app notifications AzarFaith should store and show in your admin account.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <PreferenceToggle
              label="Donations received"
              description="Notifications when campaigns you own receive donations."
              checked={notificationPreferences?.donationsReceived ?? true}
              onChange={(checked) =>
                updateNotificationPreferencesMutation.mutate({ donationsReceived: checked })
              }
            />
            <PreferenceToggle
              label="Campaign updates"
              description="Notifications for activity related to campaign update broadcasts."
              checked={notificationPreferences?.campaignUpdates ?? true}
              onChange={(checked) =>
                updateNotificationPreferencesMutation.mutate({ campaignUpdates: checked })
              }
            />
            <PreferenceToggle
              label="Comments"
              description="Notifications when new comments need your attention."
              checked={notificationPreferences?.comments ?? true}
              onChange={(checked) =>
                updateNotificationPreferencesMutation.mutate({ comments: checked })
              }
            />
            <PreferenceToggle
              label="System messages"
              description="Review decisions, account events, and platform system notices."
              checked={notificationPreferences?.systemMessages ?? true}
              onChange={(checked) =>
                updateNotificationPreferencesMutation.mutate({ systemMessages: checked })
              }
            />
          </div>
        </section>
      </div>
    </AdminPageWrapper>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 p-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded accent-amber-500"
      />
    </label>
  );
}
