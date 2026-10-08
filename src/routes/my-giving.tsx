import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, HeartHandshake, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import {
  AppShell,
  Container,
  EmptyState,
  PageHeader,
  SectionHeading,
  StatTile,
  btnPrimary,
  btnSecondary,
  cardClass,
} from "@/components/app/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useApp } from "@/lib/store";
import { formatCompactMoney, formatMoney, me, type RecurringDonation } from "@/lib/mock";

export const Route = createFileRoute("/my-giving")({
  head: () => ({ meta: [{ title: "My giving — AzarFaith" }] }),
  component: MyGiving,
});

const frequencyLabel: Record<RecurringDonation["frequency"], string> = {
  weekly: "Every week",
  monthly: "Every month",
  quarterly: "Every quarter",
};

const perMonth: Record<RecurringDonation["frequency"], number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MyGiving() {
  const recurringDonations = useApp((s) => s.recurringDonations);
  const cancelRecurringDonation = useApp((s) => s.cancelRecurringDonation);

  const active = recurringDonations.filter((r) => r.active);
  const cancelled = recurringDonations.filter((r) => !r.active);
  const monthly = Math.round(active.reduce((sum, r) => sum + r.amount * perMonth[r.frequency], 0));

  return (
    <AppShell>
      <PageHeader
        eyebrow="My giving"
        title="Your giving, in one place"
        lead="See every standing gift, when it is next due, and change your mind at any time."
        actions={
          <Link to="/discover" className={btnPrimary}>
            Find a cause
          </Link>
        }
      >
        <div className="grid grid-cols-3 gap-3 pt-2 sm:gap-6">
          <StatTile value={formatCompactMoney(me.totalGiven)} label="Given since joining" />
          <StatTile value={active.length} label="Recurring gifts" />
          <StatTile value={formatCompactMoney(monthly)} label="Each month" />
        </div>
      </PageHeader>

      <Container className="flex flex-col gap-14 py-12 md:py-16">
        <section className="flex flex-col gap-6">
          <SectionHeading>Recurring gifts</SectionHeading>
          {active.length === 0 ? (
            <EmptyState
              icon={<Repeat2 className="h-5 w-5" strokeWidth={1.5} />}
              title="No recurring gifts yet"
              body="Standing gifts give churches and missionaries something they can plan around. Start one from any ongoing campaign."
              action={
                <Link to="/discover" className={btnSecondary}>
                  Browse ongoing campaigns
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {active.map((r) => (
                <li
                  key={r.id}
                  className={`${cardClass} flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:gap-5 sm:p-5`}
                >
                  <img
                    src={r.targetCover}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-[72px] sm:w-[72px]"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      to="/campaign/$id"
                      params={{ id: r.targetId }}
                      className="line-clamp-2 text-lg font-semibold leading-[24px] text-[#0B0E0D] hover:underline sm:truncate sm:leading-[27px]"
                    >
                      {r.targetName}
                    </Link>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-5 text-[#667085]">
                      <span className="inline-flex items-center gap-1.5">
                        <Repeat2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {frequencyLabel[r.frequency]}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Next on {formatDate(r.nextDate)}
                      </span>
                      <span className="rounded-full bg-[#F7F5F3] px-2 py-0.5 text-xs font-medium text-[#4A4660]">
                        {r.mode === "auto" ? "Automatic" : "Reminder"}
                      </span>
                    </p>
                  </div>
                  <div className="flex w-full items-center justify-between gap-5 border-t border-[#EBECEC] pt-4 sm:w-auto sm:justify-end sm:border-0 sm:pt-0">
                    <p className="font-display text-2xl text-[#130E30]">{formatMoney(r.amount)}</p>
                    <CancelGift
                      name={r.targetName}
                      onConfirm={() => {
                        cancelRecurringDonation(r.id);
                        toast(`Recurring gift to ${r.targetName} cancelled`);
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {cancelled.length > 0 ? (
          <section className="flex flex-col gap-4">
            <p className="text-[13px] font-semibold uppercase leading-[19.5px] tracking-[0.1em] text-[#4A4660]">
              Cancelled
            </p>
            <ul className="flex flex-col border-t border-[#D9DDBC]">
              {cancelled.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-4 border-b border-[#D9DDBC] py-4 text-[#667085]"
                >
                  <img
                    src={r.targetCover}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-lg object-cover opacity-60 grayscale"
                  />
                  <p className="min-w-0 flex-1 truncate text-base">{r.targetName}</p>
                  <p className="shrink-0 text-sm">
                    {formatMoney(r.amount)} · {frequencyLabel[r.frequency].toLowerCase()}
                  </p>
                  <Link
                    to="/donate/$id"
                    params={{ id: r.targetId }}
                    search={{ freq: r.frequency }}
                    className="hidden shrink-0 text-sm font-medium text-[#130E30] underline underline-offset-2 sm:block"
                  >
                    Restart
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="flex flex-col items-start gap-4 rounded-xl bg-[#FFEFE7] p-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#FE5102]">
              <HeartHandshake className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-display text-2xl leading-[1.2] text-[#130E30]">
                Every gift is traceable
              </p>
              <p className="text-base leading-[25.6px] tracking-[-0.02em] text-[#4A4660]">
                Verified organizations post updates so you can see what your giving made possible.
              </p>
            </div>
          </div>
          <Link to="/$page" params={{ page: "donor-stories" }} className={btnSecondary}>
            Read donor stories
          </Link>
        </section>
      </Container>
    </AppShell>
  );
}

function CancelGift({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="rounded-full border border-[#EBEBEB] px-4 py-2 text-sm font-medium text-[#232323] transition-colors hover:bg-[#F8F8F8]">
        Cancel
      </AlertDialogTrigger>
      <AlertDialogContent className="font-gsf">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl font-normal text-[#130E30]">
            Stop giving to {name}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#4A4660]">
            No further payments or reminders will be sent. Gifts already made are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Keep giving</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-full border-2 border-black bg-[#130E30] text-[#EFF2E5] hover:bg-[#130E30]/90"
          >
            Cancel gift
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
