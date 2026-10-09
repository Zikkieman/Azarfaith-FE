import { Bone } from "@/components/app/Skeletons";
import { AdminHeader } from "./AdminHeader";

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <AdminHeader />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-5 py-8 sm:px-8 lg:py-10">
        <div className="flex flex-col gap-3">
          <Bone className="h-8 w-56" />
          <Bone className="h-4 w-80 max-w-full" />
        </div>
        {children}
      </div>
    </div>
  );
}

const card = "rounded-card border border-line-soft bg-paper";

export function AdminDashboardSkeleton() {
  return (
    <Frame label="Loading overview">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${card} flex flex-col gap-4 p-5`}>
            <Bone className="h-3.5 w-24" />
            <Bone className="h-8 w-32" />
            <Bone className="h-3.5 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${card} flex flex-col gap-5 p-6 lg:col-span-2`}>
          <Bone className="h-4 w-36" />
          <div className="flex h-52 items-end gap-3">
            {[60, 45, 80, 50, 100, 70, 40].map((h, i) => (
              <Bone key={i} className="flex-1 rounded-b-none" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className={`${card} flex flex-col gap-4 p-6`}>
          <Bone className="h-4 w-32" />
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </Frame>
  );
}

export function AdminListSkeleton({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <div className="flex gap-6 border-b border-line-soft pb-3">
        {[64, 56, 72, 64].map((w, i) => (
          <Bone key={i} className="h-4" style={{ width: w }} />
        ))}
      </div>
      <div className="flex gap-3">
        <Bone className="h-10 w-80 max-w-full" />
        <Bone className="h-10 w-36" />
      </div>
      <div className={`${card} overflow-hidden`}>
        <div className="h-11 border-b border-line-soft bg-panel/50" />
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex h-16 items-center gap-4 border-b border-line-soft px-5 last:border-0"
          >
            <Bone className="h-9 w-9 shrink-0 rounded-[8px]" />
            <Bone className="h-4 w-48" />
            <Bone className="ml-auto hidden h-5 w-20 rounded-full sm:block" />
            <Bone className="hidden h-4 w-24 md:block" />
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function AdminDetailSkeleton({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <div className={`${card} flex flex-col gap-3 p-6`}>
            <Bone className="h-4 w-24" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-11/12" />
            <Bone className="h-4 w-3/4" />
          </div>
          <div className={`${card} grid grid-cols-3 gap-3 p-6`}>
            {[0, 1, 2].map((i) => (
              <Bone key={i} className="aspect-square w-full" />
            ))}
          </div>
        </div>
        <div className={`${card} flex flex-col gap-4 self-start p-6`}>
          <Bone className="h-4 w-28" />
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </Frame>
  );
}
