import { cn } from "@/lib/utils";
import { ShieldCheck, Clock, ShieldAlert, AlertTriangle } from "lucide-react";

type BadgeVariant =
  | "verified"
  | "pending"
  | "unverified"
  | "rejected"
  | "active"
  | "suspended"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "money"
  | "item"
  | "volunteer"
  | "professional"
  | "emergency"
  | "one-time"
  | "ongoing"
  | "church"
  | "mission"
  | "orphanage"
  | "school"
  | "other";

const variantStyles: Record<BadgeVariant, string> = {
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  unverified: "bg-gray-50 text-gray-600 border-gray-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
  money: "bg-green-50 text-green-700 border-green-200",
  item: "bg-purple-50 text-purple-700 border-purple-200",
  volunteer: "bg-cyan-50 text-cyan-700 border-cyan-200",
  professional: "bg-indigo-50 text-indigo-700 border-indigo-200",
  emergency: "bg-red-50 text-red-700 border-red-200",
  "one-time": "bg-gray-50 text-gray-600 border-gray-200",
  ongoing: "bg-amber-50 text-amber-700 border-amber-200",
  church: "bg-blue-50 text-blue-700 border-blue-200",
  mission: "bg-green-50 text-green-700 border-green-200",
  orphanage: "bg-purple-50 text-purple-700 border-purple-200",
  school: "bg-cyan-50 text-cyan-700 border-cyan-200",
  other: "bg-gray-50 text-gray-600 border-gray-200",
};

type AdminBadgeProps = {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
};

export function AdminBadge({ variant, children, className }: AdminBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
}: {
  status: "verified" | "pending" | "unverified" | "rejected";
}) {
  const icons = {
    verified: <ShieldCheck className="h-3 w-3" />,
    pending: <Clock className="h-3 w-3" />,
    unverified: <ShieldAlert className="h-3 w-3" />,
    rejected: <AlertTriangle className="h-3 w-3" />,
  };

  return (
    <AdminBadge variant={status}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </AdminBadge>
  );
}
