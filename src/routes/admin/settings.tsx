import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Save } from "lucide-react";
import {
  getAdminPlatformSettings,
  updateAdminPlatformSettings,
  type AdminPlatformSettings,
} from "@/features/catalog/api";
import { AdminPageWrapper } from "@/components/admin/AdminLayout";
import { PageSpinner } from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const isClient = typeof window !== "undefined";
  const queryClient = useQueryClient();
  const { data: platformSettings, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: getAdminPlatformSettings,
    enabled: isClient,
  });
  const [settings, setSettings] = useState<AdminPlatformSettings | null>(null);

  useEffect(() => {
    if (platformSettings) {
      setSettings(platformSettings);
    }
  }, [platformSettings]);

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<Omit<AdminPlatformSettings, "id" | "updatedAt">>) =>
      updateAdminPlatformSettings(payload),
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(["admin", "settings"], savedSettings);
      setSettings(savedSettings);
      toast.success("Settings saved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading || !settings || !platformSettings) {
    return (
      <AdminPageWrapper title="Platform Settings">
        <PageSpinner label="Loading settings..." fullScreen={false} />
      </AdminPageWrapper>
    );
  }

  const handleSave = () => {
    saveMutation.mutate({
      platformFeePercent: settings.platformFeePercent,
      minDonation: settings.minDonation,
      maxDonation: settings.maxDonation,
      maxTipAmount: settings.maxTipAmount,
      campaignExpiryDays: settings.campaignExpiryDays,
      autoApproveVerifiedOrgs: settings.autoApproveVerifiedOrgs,
      requirePhoneForCampaigns: settings.requirePhoneForCampaigns,
      reapplicationDays: settings.reapplicationDays,
      emailNotifications: settings.emailNotifications,
      smsNotifications: settings.smsNotifications,
      adminNotificationEmail: settings.adminNotificationEmail.trim(),
    });
  };

  const handleReset = () => {
    setSettings(platformSettings);
    toast.info("Settings reset to saved values");
  };

  return (
    <AdminPageWrapper title="Platform Settings">
      <div className="max-w-3xl space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Fee Configuration</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-600">Platform Fee (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.platformFeePercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platformFeePercent: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <p className="mt-1 text-xs text-gray-400">Percentage taken from each donation</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Maximum Tip Amount (₦)</label>
              <input
                type="number"
                min="0"
                value={settings.maxTipAmount}
                onChange={(e) =>
                  setSettings({ ...settings, maxTipAmount: parseInt(e.target.value) || 0 })
                }
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <p className="mt-1 text-xs text-gray-400">
                Maximum tip donors can leave per donation
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Donation Limits</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-600">Minimum Donation (₦)</label>
              <input
                type="number"
                min="0"
                value={settings.minDonation}
                onChange={(e) =>
                  setSettings({ ...settings, minDonation: parseInt(e.target.value) || 0 })
                }
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Maximum Donation (₦)</label>
              <input
                type="number"
                min="0"
                value={settings.maxDonation}
                onChange={(e) =>
                  setSettings({ ...settings, maxDonation: parseInt(e.target.value) || 0 })
                }
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Campaign Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600">Campaign Expiry (days)</label>
              <input
                type="number"
                min="30"
                max="365"
                value={settings.campaignExpiryDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    campaignExpiryDays: parseInt(e.target.value) || 90,
                  })
                }
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <p className="mt-1 text-xs text-gray-400">
                One-time campaigns auto-expire after this period
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-approve verified orgs</p>
                <p className="text-xs text-gray-500">
                  Campaigns from verified organizations skip moderation
                </p>
              </div>
              <Switch
                checked={settings.autoApproveVerifiedOrgs}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoApproveVerifiedOrgs: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Require phone for campaigns</p>
                <p className="text-xs text-gray-500">
                  Users must verify phone number before creating campaigns
                </p>
              </div>
              <Switch
                checked={settings.requirePhoneForCampaigns}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requirePhoneForCampaigns: checked })
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Verification</h3>
          <div>
            <label className="block text-sm text-gray-600">Re-application Period (days)</label>
            <input
              type="number"
              min="7"
              max="90"
              value={settings.reapplicationDays}
              onChange={(e) =>
                setSettings({ ...settings, reapplicationDays: parseInt(e.target.value) || 30 })
              }
              className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              Days before rejected organizations can re-apply
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-500">
                  Send transactional emails for donations, updates, etc.
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
                <p className="text-xs text-gray-500">
                  Send SMS for OTP, large donations, and payment failures
                </p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, smsNotifications: checked })
                }
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Admin Notification Email</label>
              <input
                type="email"
                value={settings.adminNotificationEmail}
                onChange={(e) =>
                  setSettings({ ...settings, adminNotificationEmail: e.target.value })
                }
                className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <p className="mt-1 text-xs text-gray-400">Email address for admin notifications</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" className="gap-2" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            className="gap-2 bg-amber-500 text-white hover:bg-amber-600"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
