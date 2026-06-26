import { createFileRoute, Link } from "@tanstack/react-router";
import { Repeat2, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/mock";

export const Route = createFileRoute("/my-giving")({ component: MyGiving });

const frequencyLabel: Record<string, string> = {
  weekly: "Every week",
  monthly: "Every month",
  quarterly: "Every quarter",
};

function MyGiving() {
  const { recurringDonations, cancelRecurringDonation } = useApp();

  const active = recurringDonations.filter((r) => r.active);
  const cancelled = recurringDonations.filter((r) => !r.active);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-5 md:px-8 py-12">
        <h1 className="font-display text-3xl tracking-tight">My giving</h1>
        <p className="mt-2 text-muted-foreground">Your recurring support, in one place.</p>

        <div className="mt-8 space-y-4">
          {active.length === 0 && (
            <p className="text-sm text-muted-foreground">You don't have any active recurring gifts yet.</p>
          )}
          {active.map((r) => (
            <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
              <img src={r.targetCover} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.targetName}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Repeat2 className="w-3 h-3" /> {formatMoney(r.amount)} · {frequencyLabel[r.frequency]} · {r.mode === "auto" ? "Automatic" : "Reminder"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Next: {r.nextDate}</p>
              </div>
              <button
                onClick={() => cancelRecurringDonation(r.id)}
                className="w-9 h-9 grid place-items-center rounded-full hover:bg-muted transition shrink-0"
                aria-label="Cancel recurring gift"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>

        {cancelled.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-medium text-muted-foreground">Cancelled</h2>
            <div className="mt-3 space-y-3">
              {cancelled.map((r) => (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border opacity-60">
                  <img src={r.targetCover} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.targetName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatMoney(r.amount)} · {frequencyLabel[r.frequency]} · Cancelled</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to="/discover" className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition">
          Discover more causes to support
        </Link>
      </main>
      <Footer />
    </div>
  );
}
