import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Building2, HandCoins, Megaphone, UserX } from "lucide-react";

type ActivityItem = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  timestamp: string;
  to: string;
};

const activity: ActivityItem[] = [
  {
    id: "a1",
    icon: Building2,
    title: "New organization registered",
    description: "CAPROS Nigeria registered and is waiting for verification.",
    timestamp: "2 days ago",
    to: "/admin/orgs/o4",
  },
  {
    id: "a2",
    icon: Megaphone,
    title: "Campaign waiting for review",
    description: "Emergency food for displaced Christians in Mangu.",
    timestamp: "2 days ago",
    to: "/admin/campaigns/gfc6",
  },
  {
    id: "a3",
    icon: HandCoins,
    title: "Large gift received",
    description: "₦500,000 to Build a permanent worship hall for ECWA Kano.",
    timestamp: "5 days ago",
    to: "/admin/campaigns/gfc4",
  },
  {
    id: "a4",
    icon: Building2,
    title: "New organization registered",
    description: "Lifegate Christian Academy registered.",
    timestamp: "2 weeks ago",
    to: "/admin/orgs/o5",
  },
  {
    id: "a5",
    icon: UserX,
    title: "User suspended",
    description: "David Ogundimu was suspended for suspicious activity.",
    timestamp: "2 weeks ago",
    to: "/admin/users/u7",
  },
];

/** Recent platform events, newest first. Each row opens the thing it is about. */
export function AdminActivityFeed() {
  return (
    <ol className="-mx-2 flex flex-col">
      {activity.map((item, i) => (
        <li key={item.id} className="admin-row" style={{ animationDelay: `${i * 40}ms` }}>
          <Link
            to={item.to as "/admin"}
            className="flex gap-3 rounded-field px-2 py-3 transition-colors hover:bg-panel"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-panel text-ink-soft">
              <item.icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">{item.title}</span>
              <span className="block truncate text-[13px] text-ink-soft">{item.description}</span>
            </span>
            <span className="shrink-0 pt-0.5 text-[12px] text-subtle">{item.timestamp}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
