import { Building2, Megaphone, DollarSign, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityItem = {
  id: string;
  type: "org_registered" | "campaign_submitted" | "donation" | "user_suspended";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
};

const typeConfig = {
  org_registered: { icon: Building2, color: "text-blue-500", bg: "bg-blue-50" },
  campaign_submitted: { icon: Megaphone, color: "text-amber-500", bg: "bg-amber-50" },
  donation: { icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50" },
  user_suspended: { icon: UserX, color: "text-red-500", bg: "bg-red-50" },
};

const activityItems: ActivityItem[] = [
  {
    id: "a1",
    type: "org_registered",
    title: "New organization registered",
    description: "CAPROS Nigeria has registered and is awaiting verification.",
    timestamp: "2 days ago",
    link: "/admin/orgs/o4",
  },
  {
    id: "a2",
    type: "campaign_submitted",
    title: "Campaign pending review",
    description: "Emergency food for displaced Christians in Mangu.",
    timestamp: "2 days ago",
    link: "/admin/campaigns/gfc6",
  },
  {
    id: "a3",
    type: "donation",
    title: "Large donation received",
    description: "₦500,000 donated to Build a permanent worship hall for ECWA Kano.",
    timestamp: "5 days ago",
    link: "/admin/campaigns/gfc4",
  },
  {
    id: "a4",
    type: "org_registered",
    title: "New organization registered",
    description: "Lifegate Christian Academy has registered.",
    timestamp: "2 weeks ago",
    link: "/admin/orgs/o5",
  },
  {
    id: "a5",
    type: "user_suspended",
    title: "User suspended",
    description: "David Ogundimu suspended for suspicious activity.",
    timestamp: "2 weeks ago",
    link: "/admin/users/u7",
  },
];

export function AdminActivityFeed() {
  return (
    <div className="space-y-0">
      {activityItems.map((item) => {
        const config = typeConfig[item.type];
        const Icon = config.icon;

        return (
          <div key={item.id} className="flex gap-3 border-b border-gray-100 py-3 last:border-0">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                config.bg,
              )}
            >
              <Icon className={cn("h-4 w-4", config.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="mt-0.5 text-xs text-gray-500 truncate">{item.description}</p>
              <p className="mt-1 text-[10px] text-gray-400">{item.timestamp}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
