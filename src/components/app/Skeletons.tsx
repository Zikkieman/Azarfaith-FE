import { AppShell, Container } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";

/** One shimmering block. Size it with Tailwind like the element it stands in for. */
export function Bone({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-lg", className)} />;
}

function Loading({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <AppShell>
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{label}</span>
        {children}
      </div>
    </AppShell>
  );
}

export function CampaignCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line-soft bg-paper">
      <Bone className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <Bone className="h-3.5 w-1/2" />
          <Bone className="h-5 w-4/5" />
          <Bone className="h-5 w-3/5" />
        </div>
        <Bone className="h-2 w-full rounded-full" />
        <div className="flex items-center gap-3 border-t border-line-soft pt-4">
          <Bone className="h-7 w-20 rounded-full" />
          <span className="flex-1" />
          <Bone className="h-9 w-9 rounded-full" />
          <Bone className="h-9 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function HeaderSkeleton({ lead = true }: { lead?: boolean }) {
  return (
    <section className="border-b border-line-soft pb-10 pt-10 md:pb-12 md:pt-14">
      <Container className="flex flex-col gap-4">
        <Bone className="h-[clamp(34px,3.4vw,52px)] w-[min(560px,90%)]" />
        {lead ? <Bone className="h-5 w-[min(640px,95%)]" /> : null}
      </Container>
    </section>
  );
}

function CardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={i > 0 ? "hidden md:block" : undefined}>
          <CampaignCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function DiscoverSkeleton() {
  return (
    <Loading label="Loading causes">
      <HeaderSkeleton />
      <Container className="flex gap-6 pt-8">
        {["w-28", "w-20", "w-20", "w-28"].map((w, i) => (
          <Bone key={i} className={cn("h-5 shrink-0", w)} />
        ))}
      </Container>
      <Container className="py-10">
        <CardGrid />
      </Container>
    </Loading>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading label="Loading your dashboard">
      <HeaderSkeleton />
      <Container className="flex flex-col gap-6 py-10 md:py-14">
        <Bone className="h-8 w-64" />
        <div className="flex flex-col divide-y divide-line-soft rounded-2xl border border-line-soft">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 p-5 sm:p-6">
              <Bone className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Bone className="h-4 w-2/5" />
                <Bone className="h-4 w-4/5" />
              </div>
              <Bone className="hidden h-9 w-32 rounded-full sm:block" />
            </div>
          ))}
        </div>
      </Container>
    </Loading>
  );
}

export function ListPageSkeleton({ label }: { label: string }) {
  return (
    <Loading label={label}>
      <HeaderSkeleton />
      <Container className="flex flex-col gap-4 py-12">
        <Bone className="h-8 w-56" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-line-soft p-5">
            <Bone className="h-14 w-14 shrink-0 rounded-xl sm:h-[72px] sm:w-[72px]" />
            <div className="flex flex-1 flex-col gap-2">
              <Bone className="h-5 w-3/5" />
              <Bone className="h-4 w-2/5" />
            </div>
            <Bone className="hidden h-8 w-24 sm:block" />
          </div>
        ))}
      </Container>
    </Loading>
  );
}

export function CampaignDetailSkeleton() {
  return (
    <Loading label="Loading campaign">
      <Container className="grid gap-10 py-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
        <div className="flex flex-col gap-6">
          <Bone className="h-4 w-20" />
          <Bone className="h-10 w-4/5" />
          <Bone className="-mx-6 aspect-[4/3] w-[calc(100%+48px)] rounded-none sm:mx-0 sm:aspect-[16/9] sm:w-full sm:rounded-2xl" />
          <Bone className="h-5 w-1/2" />
          <div className="flex flex-col gap-2">
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-3/4" />
          </div>
        </div>
        <div className="hidden flex-col gap-4 self-start rounded-2xl border border-line-soft p-6 lg:flex">
          <Bone className="h-8 w-40" />
          <Bone className="h-4 w-24" />
          <Bone className="h-2 w-full" />
          <Bone className="mt-2 h-12 w-full rounded-full" />
          <Bone className="h-12 w-full rounded-full" />
        </div>
      </Container>
    </Loading>
  );
}

export function ProfileSkeleton({ label }: { label: string }) {
  return (
    <Loading label={label}>
      <section className="border-b border-line-soft py-10 md:py-14">
        <Container className="flex flex-col gap-10">
          <div className="flex items-center gap-5">
            <Bone className="h-20 w-20 shrink-0 rounded-full md:h-24 md:w-24" />
            <div className="flex flex-1 flex-col gap-3">
              <Bone className="h-10 w-[min(360px,80%)]" />
              <Bone className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <Bone key={i} className="h-14" />
            ))}
          </div>
        </Container>
      </section>
      <Container className="py-12">
        <CardGrid count={3} />
      </Container>
    </Loading>
  );
}
