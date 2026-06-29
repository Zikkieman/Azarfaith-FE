import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useApp } from "@/lib/store";
import { formatMoney, me } from "@/lib/mock";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { recurringDonations } = useApp();
  const authUser = useAppSelector((state) => state.auth.user);
  const activeCount = recurringDonations.filter((r) => r.active).length;
  const displayName = authUser?.fullName ?? me.name;
  const displayMeta = authUser
    ? `${authUser.email} · ${authUser.phone}`
    : `${me.location} · Giving since ${me.joined}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-2xl w-full px-5 md:px-8 py-12">
        <div className="flex items-center gap-4">
          <img src={me.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover" />
          <div>
            <h1 className="font-display text-2xl tracking-tight">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{displayMeta}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-2xl font-display">{formatMoney(me.totalGiven)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total given</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-2xl font-display">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Active recurring gifts</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Verifications</h2>
          <div className="flex flex-wrap gap-2">
            {me.verifications.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 text-amber-700"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> {v}
              </span>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
