import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AppShell, Container, EmptyState, PageHeader, Tabs } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { cn } from "@/lib/utils";
import { PageSpinner } from "@/components/PageSpinner";
import { GivingHistory } from "@/components/giving/GivingHistory";
import { GiftActionDialog, type GiftActionValues } from "@/components/giving/GiftActionDialog";
import {
  RecurringGiftCard,
  GiftPhoto,
  type GiftAction,
} from "@/components/giving/RecurringGiftCard";
import { fetchSession } from "@/features/auth/authSlice";
import {
  cancelRecurringGiftWithReason,
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
import { formatMoney } from "@/lib/catalog";
import { givingOverview, currentGifts, everyLabel, givingDate, money } from "@/lib/giving";
import { useClientReady } from "@/lib/useClientReady";
import { useRequireAuth } from "@/lib/useRequireAuth";
export const Route = createFileRoute("/my-giving")({
  head: () => ({
    meta: [{ title: "My giving — AzarFaith" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: MyGiving,
});
function MyGiving() {
  const authed = useRequireAuth();
  const ready = useClientReady() && authed;
  const userId = useAppSelector((state) => state.auth.user?.id);
  const dispatch = useAppDispatch();
  const cache = useQueryClient();
  const actionLock = useRef(false);
  const [tab, setTab] = useState("regular");
  const [target, setTarget] = useState<{ gift: RecurringDonation; action: GiftAction } | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

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
    onSettled: () => {
      actionLock.current = false;
    },
    onError: (error) => {
      setActionError(error.message);
      if (error instanceof ApiError && error.status === 409) {
        setTarget(null);
        toast.error(error.message);
        void refresh();
      }
      if (error instanceof ApiError && [401, 403].includes(error.status)) dispatch(fetchSession());
      // A transport/server error may occur after the change was committed.
      else if (!(error instanceof ApiError) || error.status >= 500) void refresh();
    },
  });

  if (!ready || !userId) return <PageSpinner label="Checking your session..." />;
  const current = recurring.data ? currentGifts(recurring.data) : undefined;
  const stopped = recurring.data?.filter(
    (gift) => !current?.some((active) => active.id === gift.id),
  );
  const overview =
    history.data && recurring.data ? givingOverview(history.data, recurring.data) : null;
  function submitAction(gift: RecurringDonation, kind: GiftAction, values: GiftActionValues) {
    if (actionLock.current) return;
    actionLock.current = true;
    setActionError(null);
    action.mutate({ gift, kind, values });
  }
  function selectAction(gift: RecurringDonation, kind: GiftAction) {
    if (action.isPending || actionLock.current) return;
    setActionError(null);
    if (kind === "skip" || kind === "pause" || kind === "resume") {
      submitAction(gift, kind, {
        amount: gift.amount,
        frequency: gift.frequency,
        consent: false,
        reason: "",
        authorizationId: gift.authorizationId ?? "",
      });
    } else setTarget({ gift, action: kind });
  }
  return (
    <AppShell>
      <PageHeader
        tabs={
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "regular", label: "Regular gifts", count: current?.length },
              { value: "history", label: "History", count: history.data?.length },
            ]}
          />
        }
        title="My giving"
        lead="Your regular gifts, every past gift and its receipt."
        actions={
          <Link to="/discover" className={btn("primary")}>
            Find a cause
          </Link>
        }
      >
        {history.error ? (
          <ErrorPanel
            title="We couldn't load your giving totals"
            error={history.error}
            retry={() => void history.refetch()}
          />
        ) : recurring.error ? (
          <ErrorPanel
            title="We couldn't load your recurring gifts"
            error={recurring.error}
            retry={() => void recurring.refetch()}
          />
        ) : !overview ? (
          <PageSpinner fullScreen={false} label="Loading your giving summary..." />
        ) : (
          <>
            <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-line-soft lg:grid-cols-4">
              {[
                {
                  label: "Given in " + overview.year,
                  value: money(overview.yearGiven),
                  note: overview.lifetime ? "Lifetime: " + money(overview.lifetime) : undefined,
                },
                {
                  label: "Regular gifts",
                  value: overview.activeCount + " active",
                  note: overview.pausedCount ? overview.pausedCount + " paused" : undefined,
                },
                {
                  label: "Next gift",
                  value: overview.upcoming
                    ? overview.dueNow
                      ? "Due now"
                      : givingDate(overview.upcoming.nextDate)
                    : current?.some((gift) => gift.hasPendingPayment)
                      ? "Processing"
                      : current?.some((gift) => gift.status === "missed")
                        ? "Needs attention"
                        : "None scheduled",
                  note: overview.upcoming
                    ? money(overview.upcoming.amount) + " to " + overview.upcoming.targetName
                    : undefined,
                },
                {
                  label: "Receipts",
                  value: overview.yearReceipts + " this year",
                  note: overview.campaigns
                    ? "This month: " +
                      money(overview.month) +
                      "; " +
                      overview.campaigns +
                      (overview.campaigns === 1 ? " cause supported" : " causes supported")
                    : undefined,
                },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className={cn(
                    "flex min-w-0 flex-col gap-1.5 p-5",
                    i % 2 === 1 && "border-l border-line-soft",
                    i >= 2 && "border-t border-line-soft lg:border-t-0",
                    i === 2 && "lg:border-l",
                  )}
                >
                  <dt className="text-[13px] text-muted-ink">{s.label}</dt>
                  <dd className="font-display text-[22px] leading-tight tracking-[-0.02em] text-ink">
                    {s.value}
                  </dd>
                  {s.note ? (
                    <dd title={s.note} className="truncate text-[12px] text-muted-ink">
                      {s.note}
                    </dd>
                  ) : null}
                </div>
              ))}
            </dl>
          </>
        )}
      </PageHeader>
      <Container className="py-8 md:py-10">
        {actionError && !target ? (
          <p role="alert" className="mb-4 text-sm text-danger">
            {actionError}
          </p>
        ) : null}
        <div key={tab} className="admin-rise">
          {tab === "regular" ? (
            <div className="flex flex-col gap-4">
              {recurring.error ? (
                <ErrorPanel
                  title="Recurring gifts unavailable"
                  error={recurring.error}
                  retry={() => void recurring.refetch()}
                />
              ) : !current ? (
                <PageSpinner fullScreen={false} label="Loading recurring gifts..." />
              ) : current.length === 0 ? (
                <EmptyState
                  icon={<Repeat2 className="h-5 w-5" strokeWidth={1.5} />}
                  title="No regular gifts yet"
                  body="Regular gifts give churches and missionaries something they can plan around. Start one from any ongoing campaign."
                  action={
                    <Link to="/discover" search={{ view: "regular" }} className={btn("secondary")}>
                      Find ongoing work
                    </Link>
                  }
                />
              ) : (
                current.map((gift) => (
                  <RecurringGiftCard
                    key={gift.id}
                    gift={gift}
                    methods={cards.data}
                    busy={action.isPending}
                    onAction={selectAction}
                  />
                ))
              )}
              {stopped?.length ? <Stopped gifts={stopped} /> : null}
              {cards.error ? (
                <ErrorPanel
                  title="Saved card details unavailable"
                  error={cards.error}
                  retry={() => void cards.refetch()}
                />
              ) : null}
            </div>
          ) : history.error ? (
            <ErrorPanel
              title="History unavailable"
              error={history.error}
              retry={() => void history.refetch()}
            />
          ) : history.data ? (
            <GivingHistory donations={history.data} userId={userId} />
          ) : (
            <PageSpinner fullScreen={false} label="Loading payment history..." />
          )}
        </div>
        {target ? (
          <GiftActionDialog
            key={target.gift.id + "-" + target.action}
            gift={target.gift}
            action={target.action}
            methods={cards.data ?? []}
            busy={action.isPending}
            error={actionError}
            onClose={() => {
              if (!actionLock.current) setTarget(null);
            }}
            onConfirm={(values) => submitAction(target.gift, target.action, values)}
            onPauseInstead={() =>
              target.gift.status === "paused"
                ? setTarget(null)
                : submitAction(target.gift, "pause", {
                    amount: target.gift.amount,
                    frequency: target.gift.frequency,
                    consent: false,
                    reason: "",
                    authorizationId: target.gift.authorizationId ?? "",
                  })
            }
          />
        ) : null}
      </Container>
    </AppShell>
  );
}

function Stopped({ gifts }: { gifts: RecurringDonation[] }) {
  return (
    <section className="mt-6 flex flex-col gap-3">
      <h2 className="text-[13px] font-medium text-subtle">Stopped</h2>
      <ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft">
        {gifts.map((g) => (
          <li key={g.id} className="flex items-center gap-3 py-3 text-sm">
            <GiftPhoto
              src={g.targetCover}
              className="h-9 w-9 shrink-0 rounded-[8px] object-cover opacity-60 grayscale"
            />
            <Link
              to="/campaign/$id"
              params={{ id: g.targetId }}
              className="min-w-0 flex-1 truncate text-ink-soft hover:underline"
            >
              {g.targetName}
            </Link>
            <span className="hidden shrink-0 text-muted-ink sm:inline">
              {formatMoney(g.amount)} {everyLabel[g.frequency]}
            </span>
            <Link
              to="/donate/$id"
              params={{ id: g.targetId }}
              search={{ freq: g.frequency, amount: String(g.amount) }}
              className={btn("secondary", "sm")}
            >
              Start again
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ErrorPanel({ title, error, retry }: { title: string; error: Error; retry: () => void }) {
  return (
    <section
      role="alert"
      className="flex flex-col items-start gap-3 rounded-card border border-line-soft p-5"
    >
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      <p className="text-sm text-ink-soft">{error.message}</p>
      <button type="button" className={btn("secondary", "sm")} onClick={retry}>
        Try again
      </button>
    </section>
  );
}
