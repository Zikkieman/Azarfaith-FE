import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageSpinner } from "@/components/PageSpinner";
import { getProfile } from "@/features/catalog/api";
import { formatMoney } from "@/lib/catalog";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex-1 w-full max-w-2xl px-5 py-12 text-muted-foreground md:px-8">
          {isLoading ? <PageSpinner label="Loading profile..." /> : "Log in to view your profile."}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-2xl px-5 py-12 md:px-8">
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
            <p className="text-sm text-muted-foreground">{profile.email} · {profile.phone}</p>
          </div>
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
