import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowUpRight, CreditCard, Heart, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { DashboardShell } from "@/components/app/DashboardShell";
import { PageSpinner } from "@/components/PageSpinner";
import { GivingHistory } from "@/components/giving/GivingHistory";
import { GiftActionDialog, type GiftActionValues } from "@/components/giving/GiftActionDialog";
import { RecurringGiftCard, type GiftAction } from "@/components/giving/RecurringGiftCard";
import { fetchSession } from "@/features/auth/authSlice";
import {
  cancelRecurringGiftWithReason,
  deactivatePaymentMethod,
  getDonationHistory,
  getPaymentMethods,
  getRecurringGifts,
  pauseRecurringGift,
  resumeRecurringGift,
  skipRecurringGift,
  updateRecurringGift,
  updateRecurringGiftPaymentMethod,
} from "@/features/catalog/api";
import { ApiError } from "@/lib/api";
import type { RecurringDonation } from "@/lib/catalog";
import { frequencyLabels, givingSummary, money } from "@/lib/giving";
import { useClientReady } from "@/lib/useClientReady";
import { useRequireAuth } from "@/lib/useRequireAuth";

export const Route = createFileRoute("/my-giving")({
  head: () => ({
    meta: [{ title: "My Giving | AzarFaith" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: MyGiving,
});

function MyGiving() {
  const authed = useRequireAuth();
  const ready = useClientReady() && authed;
  const userId = useAppSelector((state) => state.auth.user?.id);
  const dispatch = useAppDispatch();
  const cache = useQueryClient();
  const [tab, setTab] = useState("regular");
  const [target, setTarget] = useState<{ gift: RecurringDonation; action: GiftAction } | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const recurring = useQuery({
    queryKey: ["recurring-gifts", userId],
    queryFn: getRecurringGifts,
    enabled: ready,
    retry: false,
  });
  const history = useQuery({
    queryKey: ["donations", userId],
    queryFn: getDonationHistory,
    enabled: ready,
    retry: false,
  });
  const cards = useQuery({
    queryKey: ["payment-methods", userId],
    queryFn: getPaymentMethods,
    enabled: ready,
    retry: false,
  });
  const queryError = recurring.error ?? history.error ?? cards.error;
  useEffect(() => {
    if (queryError instanceof ApiError && [401, 403].includes(queryError.status))
      dispatch(fetchSession());
  }, [queryError, dispatch]);
  async function refresh() {
    for (const key of [
      "recurring-gifts",
      "payment-methods",
      "donations",
      "profile",
      "dashboard",
      "notifications",
    ])
      await cache.invalidateQueries({ queryKey: [key] });
  }
  const action = useMutation({
    mutationFn: async ({
      gift,
      kind,
      values,
    }: {
      gift: RecurringDonation;
      kind: GiftAction;
      values: GiftActionValues;
    }) => {
      if (kind === "edit")
        return updateRecurringGift(gift.id, {
          amount: values.amount,
          frequency: values.frequency.toUpperCase() as "WEEKLY" | "MONTHLY" | "QUARTERLY",
          expectedUpdatedAt: gift.updatedAt,
          consentToAutoCharge: values.consent,
        });
      if (kind === "skip") return skipRecurringGift(gift.id, gift.updatedAt);
      if (kind === "pause") return pauseRecurringGift(gift.id);
      if (kind === "resume") return resumeRecurringGift(gift.id);
      if (kind === "card")
        return updateRecurringGiftPaymentMethod(gift.id, {
          authorizationId: values.authorizationId,
          consentToAutoCharge: values.consent,
        });
      return cancelRecurringGiftWithReason(gift.id, { reason: values.reason || undefined });
    },
    onSuccess: async (result) => {
      setTarget(null);
      toast.success(result.message);
      await refresh();
    },
    onError: (error) => {
      setActionError(error.message);
      if (error instanceof ApiError && error.status === 409) {
        setTarget(null);
        toast.error(error.message);
        void refresh();
      }
      if (error instanceof ApiError && [401, 403].includes(error.status)) dispatch(fetchSession());
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deactivatePaymentMethod(id),
    onSuccess: async (result) => {
      setRemoveId(null);
      toast.success(result.message);
      await refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  if (!ready || !userId) return <PageSpinner label="Checking your session..." />;
  const summary = history.data ? givingSummary(history.data) : null;
  const current = recurring.data?.filter(
    (gift) => !["cancelled", "completed"].includes(gift.status),
  );
  const stopped = recurring.data?.filter((gift) =>
    ["cancelled", "completed"].includes(gift.status),
  );
  return (
    <DashboardShell>
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[#777283]">
            Your generosity, in one place
          </p>
          <h1 className="text-[clamp(28px,3vw,40px)] font-medium tracking-[-0.03em]">My giving</h1>
          <p className="mt-2 text-[15px] text-[#777283]">
            A record of your gifts. A little control over what comes next.
          </p>
        </div>
        <Link to="/discover" className="dashboard-button secondary">
          Find a cause <ArrowUpRight size={15} />
        </Link>
      </header>
      {history.error ? (
        <ErrorPanel
          title="We couldn't load your giving totals"
          error={history.error}
          retry={() => history.refetch()}
        />
      ) : !summary ? (
        <PageSpinner label="Loading your giving summary..." fullScreen={false} />
      ) : (
        <section aria-label="Giving summary" className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Lifetime given", money(summary.lifetime)],
            ["Given this month", money(summary.month)],
            ["Causes supported", String(summary.campaigns)],
            ["Available receipts", String(summary.receipts)],
          ].map(([label, value]) => (
            <div key={label} className="dashboard-panel p-4 sm:p-5">
              <p className="text-xs text-[#777283]">{label}</p>
              <p className="mt-2 break-words text-[clamp(21px,2vw,30px)] font-medium tracking-tight tabular-nums">
                {value}
              </p>
            </div>
          ))}
        </section>
      )}
      {summary && (
        <p className="mb-6 flex items-center gap-2 text-xs leading-relaxed text-[#777283]">
          <Heart size={15} className="shrink-0 text-[#e88b00]" />
          You've supported {summary.campaigns} cause{summary.campaigns === 1 ? "" : "s"}. More
          impact insights are coming. Totals exclude platform fees and tips.
        </p>
      )}
      <nav aria-label="Giving sections" className="mb-6 flex gap-6 border-b border-[#e8e5ed]">
        {[
          ["regular", "Regular gifts"],
          ["history", "Payment history"],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${tab === value ? "border-[#130e30] text-[#130e30]" : "border-transparent text-[#777283]"}`}
          >
            {label}
            {value === "regular" && current && (
              <span className="ml-2 rounded-full bg-[#f2eff5] px-2 py-0.5 text-xs">
                {current.length}
              </span>
            )}
          </button>
        ))}
      </nav>
      {tab === "history" ? (
        history.error ? (
          <ErrorPanel
            title="History unavailable"
            error={history.error}
            retry={() => history.refetch()}
          />
        ) : history.data ? (
          <GivingHistory donations={history.data} userId={userId} />
        ) : (
          <PageSpinner label="Loading payment history..." fullScreen={false} />
        )
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-[#615970]">
            <Repeat2 size={16} />
            <p>Regular support, on your terms. Pause, skip a date, or change your gift.</p>
          </div>
          {recurring.error ? (
            <ErrorPanel
              title="We couldn't load your recurring gifts"
              error={recurring.error}
              retry={() => recurring.refetch()}
            />
          ) : !current ? (
            <PageSpinner label="Loading recurring gifts..." fullScreen={false} />
          ) : current.length ? (
            <div className="grid items-start gap-4 xl:grid-cols-2">
              {current.map((gift) => (
                <RecurringGiftCard
                  key={gift.id}
                  gift={gift}
                  methods={cards.data}
                  busy={action.isPending}
                  onAction={(selected, kind) => {
                    setActionError(null);
                    setTarget({ gift: selected, action: kind });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="dashboard-panel flex flex-col items-center gap-3 p-10 text-center">
              <Heart className="text-[#e88b00]" size={28} />
              <h2 className="text-lg font-medium">Make support a regular thing</h2>
              <p className="max-w-sm text-sm text-[#777283]">
                Choose an ongoing cause and set up an automatic gift or a reminder-based pledge.
                You're always in control.
              </p>
              <Link to="/discover" className="dashboard-button mt-2">
                Explore causes
              </Link>
            </div>
          )}
          {Boolean(stopped?.length) && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-[#777283]">Stopped gifts</h2>
              <div className="divide-y divide-[#eeedf1] border-y border-[#eeedf1]">
                {stopped?.map((gift) => (
                  <div
                    key={gift.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div className="min-w-0">
                      <Link
                        to="/campaign/$id"
                        params={{ id: gift.targetId }}
                        className="text-sm font-medium hover:underline"
                      >
                        {gift.targetName}
                      </Link>
                      <p className="mt-1 text-xs text-[#777283]">
                        {money(gift.amount)} · {frequencyLabels[gift.frequency]} · {gift.status}
                      </p>
                      {gift.cancellationReason && (
                        <p className="mt-1 text-xs text-[#777283]">{gift.cancellationReason}</p>
                      )}
                    </div>
                    <Link
                      to="/donate/$id"
                      params={{ id: gift.targetId }}
                      search={{ freq: gift.frequency, amount: String(gift.amount) }}
                      className="giving-small-button"
                    >
                      Start a new gift
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="dashboard-panel p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-medium">
              <CreditCard size={18} /> Saved payment methods
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#777283]">
              Saved after a successful automatic card donation. We display only card metadata, never
              your card number or Paystack authorization token.
            </p>
            {cards.error ? (
              <ErrorPanel
                title="Saved cards unavailable"
                error={cards.error}
                retry={() => cards.refetch()}
              />
            ) : !cards.data ? (
              <PageSpinner label="Loading saved cards..." fullScreen={false} />
            ) : cards.data.filter((card) => card.active && card.reusable).length === 0 ? (
              <p className="mt-5 text-sm text-[#777283]">
                No reusable saved card yet. Pledges don't need one.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-[#eeedf1]">
                {cards.data
                  .filter((card) => card.active && card.reusable)
                  .map((card) => (
                    <li
                      key={card.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium">{card.label}</p>
                        <p className="mt-1 text-xs text-[#777283]">
                          {card.expMonth && card.expYear
                            ? `Expires ${card.expMonth}/${card.expYear}. `
                            : ""}
                          {card.linkedRecurringGiftCount} linked gift
                          {card.linkedRecurringGiftCount === 1 ? "" : "s"}, including paused gifts.
                        </p>
                      </div>
                      {removeId === card.id ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="giving-small-button"
                            disabled={remove.isPending}
                            onClick={() => setRemoveId(null)}
                          >
                            Keep card
                          </button>
                          <button
                            type="button"
                            className="giving-small-button text-red-700"
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(card.id)}
                          >
                            Confirm removal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="giving-small-button"
                          disabled={remove.isPending || card.linkedRecurringGiftCount > 0}
                          onClick={() => setRemoveId(card.id)}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      )}
      {target && (
        <GiftActionDialog
          key={`${target.gift.id}-${target.action}`}
          gift={target.gift}
          action={target.action}
          methods={cards.data ?? []}
          busy={action.isPending}
          error={actionError}
          onClose={() => setTarget(null)}
          onConfirm={(values) => action.mutate({ gift: target.gift, kind: target.action, values })}
        />
      )}
    </DashboardShell>
  );
}

function ErrorPanel({ title, error, retry }: { title: string; error: Error; retry: () => void }) {
  return (
    <section role="alert" className="dashboard-panel my-5 p-6">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-2 text-sm text-[#777283]">{error.message}</p>
      <button type="button" className="dashboard-button secondary mt-4" onClick={retry}>
        Try again
      </button>
    </section>
  );
}
