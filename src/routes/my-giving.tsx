import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Repeat2, X } from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/Navbar";
import { PageSpinner } from "@/components/PageSpinner";
import { Footer } from "@/components/Footer";
import { cancelRecurringGift, getRecurringGifts } from "@/features/catalog/api";
import { frequencyLabel, formatMoney } from "@/lib/catalog";

export const Route = createFileRoute("/my-giving")({ component: MyGiving });

function MyGiving() {
  const queryClient = useQueryClient();
  const { data: recurringDonations = [], isLoading } = useQuery({
    queryKey: ["recurring-gifts"],
    queryFn: getRecurringGifts,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelRecurringGift(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-gifts"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const active = recurringDonations.filter((gift) => gift.active);
  const cancelled = recurringDonations.filter((gift) => !gift.active);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-3xl px-5 py-12 md:px-8">
        <h1 className="font-display text-3xl tracking-tight">My giving</h1>
        <p className="mt-2 text-muted-foreground">Your recurring support, in one place.</p>

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <PageSpinner label="Loading recurring gifts..." fullScreen={false} />
          ) : active.length === 0 ? (
            <p className="text-sm text-muted-foreground">You don't have any active recurring gifts yet.</p>
          ) : (
            active.map((gift) => (
              <div key={gift.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                <img src={gift.targetCover} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{gift.targetName}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${gift.status === "on_track" ? "bg-emerald-50 text-emerald-700" : gift.status === "missed" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                      {gift.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Repeat2 className="h-3 w-3" /> {formatMoney(gift.amount)} · {frequencyLabel[gift.frequency]} · {gift.mode === "auto" ? "Automatic" : "Reminder"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Next scheduled date: {gift.nextDate}</p>
                  {gift.nextReminderDate ? <p className="mt-0.5 text-xs text-muted-foreground">Next reminder: {gift.nextReminderDate}</p> : null}
                  {gift.missedCount > 0 ? <p className="mt-0.5 text-xs text-amber-700">Missed pledges: {gift.missedCount}</p> : null}
                  {gift.retryCount > 0 ? <p className="mt-0.5 text-xs text-amber-700">Retry attempts tracked: {gift.retryCount}</p> : null}
                </div>
                <button
                  onClick={() => cancelMutation.mutate(gift.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition hover:bg-muted"
                  aria-label="Cancel recurring gift"
                  disabled={cancelMutation.isPending}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))
          )}
        </div>

        {cancelled.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-medium text-muted-foreground">Cancelled</h2>
            <div className="mt-3 space-y-3">
              {cancelled.map((gift) => (
                <div key={gift.id} className="flex items-center gap-4 rounded-2xl border border-border p-4 opacity-60">
                  <img src={gift.targetCover} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{gift.targetName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatMoney(gift.amount)} · {frequencyLabel[gift.frequency]} · Cancelled</p>
                    {gift.cancellationReason ? <p className="mt-0.5 text-xs text-muted-foreground">{gift.cancellationReason}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to="/discover" className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 transition hover:text-amber-700">
          Discover more causes to support
        </Link>
      </main>
      <Footer />
    </div>
  );
}
