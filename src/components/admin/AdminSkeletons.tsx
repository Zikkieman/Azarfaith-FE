import { Bone } from "@/components/app/Skeletons";
import { AdminHeader } from "./AdminHeader";

/** Loading frames that match the real admin layouts, so nothing jumps when data arrives. */
function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <AdminHeader />
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-5 pb-16 pt-6 sm:px-8">
        <div className="flex flex-col gap-2">
          <Bone className="h-7 w-52" />
          <Bone className="h-4 w-80 max-w-full" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <Frame label="Loading overview">
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-card border border-line-soft">
            <div className="border-b border-line-soft px-5 py-4">
              <Bone className="h-4 w-44" />
            </div>
            {[0, 1].map((j) => (
              <div key={j} className="flex items-center gap-3 px-5 py-3">
                <Bone className="h-9 w-9 rounded-[8px]" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Bone className="h-3.5 w-1/2" />
                  <Bone className="h-3 w-1/3" />
                </div>
                <Bone className="h-9 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line-soft lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-3 p-5">
            <Bone className="h-3.5 w-20" />
            <Bone className="h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="rounded-card border border-line-soft p-6">
        <div className="flex h-52 items-end gap-3">
          {[60, 45, 80, 50, 100, 70, 40].map((h, i) => (
            <Bone key={i} className="flex-1 rounded-b-none" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </Frame>
  );
}

export function AdminListSkeleton({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
        <Bone className="h-9 w-[420px] max-w-full rounded-[10px]" />
        <div className="flex gap-2">
          <Bone className="h-9 w-60 rounded-[10px]" />
          <Bone className="h-9 w-20 rounded-[10px]" />
        </div>
      </div>
      <div className="flex flex-col">
        <div className="h-8 border-b border-line-soft" />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex h-14 items-center gap-4 border-b border-line-soft px-1">
            <Bone className="h-4 w-4 rounded-[4px]" />
            <Bone className="h-8 w-8 shrink-0 rounded-[8px]" />
            <Bone className="h-3.5 w-48" />
            <Bone className="ml-auto hidden h-5 w-24 rounded-full sm:block" />
            <Bone className="hidden h-3.5 w-20 md:block" />
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function AdminDetailSkeleton({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <div className="grid overflow-hidden rounded-card border border-line-soft lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3 border-b border-line-soft bg-panel/40 p-5 lg:border-b-0 lg:border-r">
          {Array.from({ length: 9 }, (_, i) => (
            <Bone key={i} className="h-3.5 w-full" />
          ))}
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex gap-6 border-b border-line-soft pb-3">
            {[80, 72, 64, 52].map((w, i) => (
              <Bone key={i} className="h-4" style={{ width: w }} />
            ))}
          </div>
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-16 w-full rounded-field" />
          ))}
        </div>
      </div>
    </Frame>
  );
}
