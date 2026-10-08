import { BadgeCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { giverPriorities, pipeline, update, verifiedOrg, type Priority } from "./data";

export function AppealCard({
  source,
  text,
  urgent,
  className,
}: {
  source: string;
  text: string;
  urgent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-center gap-1 rounded-lg border border-line-soft bg-paper px-3.5 py-2.5",
        className,
      )}
    >
      <span className="flex items-center gap-1.5 font-gsf text-[11px] font-medium uppercase tracking-[0.06em] text-muted-ink">
        {urgent ? (
          <span className="rounded bg-[#FE5102] px-1 py-px text-[9px] text-white">Urgent</span>
        ) : null}
        {source}
      </span>
      <span className="line-clamp-2 font-gsf text-[13px] leading-[17px] text-heading">{text}</span>
    </div>
  );
}

export function CheckNode({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex h-full w-full items-center gap-2.5 rounded-full border border-line bg-paper px-3.5">
      <span
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors duration-500",
          done ? "bg-[#00B67A] text-white" : "border border-line-input bg-paper text-transparent",
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="truncate font-gsf text-[13px] font-medium text-heading">{label}</span>
    </div>
  );
}

export function OrgCard({ verified }: { verified: boolean }) {
  return (
    <div className="flex w-[300px] items-center gap-4 rounded-2xl border border-line-soft bg-paper p-4 max-sm:w-[250px]">
      <img
        src={verifiedOrg.photo}
        alt=""
        className="h-16 w-16 shrink-0 rounded-xl object-cover max-sm:h-12 max-sm:w-12"
      />
      <div className="min-w-0">
        <p className="truncate font-gsf text-base font-semibold text-heading">{verifiedOrg.name}</p>
        <p className="text-[13px] text-muted-ink">{verifiedOrg.place}</p>
        <p
          className={cn(
            "mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors duration-500",
            verified ? "bg-[#00B67A]/12 text-[#00875A]" : "bg-panel text-muted-ink",
          )}
        >
          {verified ? <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} /> : null}
          {verified ? "Verified" : "Checking…"}
        </p>
      </div>
    </div>
  );
}

export function CauseCard({
  name,
  place,
  detail,
  highlighted,
}: {
  name: string;
  place: string;
  detail: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "group/cause relative flex h-full w-full flex-col justify-center rounded-lg border bg-paper px-3.5 py-2 transition-[border-color,box-shadow] duration-300",
        highlighted
          ? "border-[#FE5102] shadow-[0_0_0_3px_rgba(254,81,2,0.15)]"
          : "border-line-soft",
      )}
    >
      <span className="truncate font-gsf text-[13px] font-semibold text-heading">{name}</span>
      <span className="font-gsf text-[12px] text-muted-ink">{place}</span>
      <span className="pointer-events-none absolute -bottom-2 left-3 right-3 translate-y-full rounded-md bg-ink px-2.5 py-1.5 font-gsf text-[11px] text-ink-contrast opacity-0 transition-opacity duration-200 group-hover/cause:opacity-100">
        {detail}
      </span>
    </div>
  );
}

export function GiverChip({
  hovered,
  onHover,
}: {
  hovered: Priority | null;
  onHover: (p: Priority | null) => void;
}) {
  return (
    <div className="flex w-[290px] flex-col items-center gap-3 rounded-2xl border border-line-soft bg-paper p-4 text-center max-sm:w-[230px]">
      <img
        src="https://images.unsplash.com/photo-1623916439294-c8a1ca6d735c?auto=format&fit=crop&w=200&q=80"
        alt=""
        className="h-14 w-14 rounded-full object-cover"
      />
      <div>
        <p className="font-gsf text-base font-semibold text-heading">You · Lagos</p>
        <p className="text-[12px] text-muted-ink">What you care about</p>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {giverPriorities.map((p) => (
          <button
            key={p}
            type="button"
            onMouseEnter={() => onHover(p)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(p)}
            onBlur={() => onHover(null)}
            className={cn(
              "rounded-full border px-2.5 py-1 font-gsf text-[12px] font-medium transition-colors",
              hovered === p
                ? "border-[#FE5102] bg-[#FE5102] text-white"
                : "border-line bg-paper text-ink-soft",
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PipelineStage({
  index,
  active,
  done,
}: {
  index: number;
  active: boolean;
  done: boolean;
}) {
  const s = pipeline[index];
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border p-3.5 transition-[background-color,border-color,transform] duration-500",
        active
          ? "scale-[1.03] border-[#FE5102] bg-paper"
          : done
            ? "border-line bg-paper"
            : "border-line-soft bg-paper/60",
      )}
    >
      <span className="flex items-center gap-2 font-gsf text-[13px] font-semibold text-heading">
        <span
          className={cn(
            "grid h-5 w-5 place-items-center rounded-full text-[10px] transition-colors duration-500",
            done || active ? "bg-[#FE5102] text-white" : "bg-panel text-muted-ink",
          )}
        >
          {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
        </span>
        {s.stage}
      </span>
      <span
        className={cn(
          "font-gsf text-[12px] leading-[16px] transition-opacity duration-500",
          done || active ? "text-ink-soft opacity-100" : "text-muted-ink opacity-50",
        )}
      >
        {s.detail}
      </span>
    </div>
  );
}

export function UpdateCard() {
  return (
    <article className="w-[min(440px,88vw)] overflow-hidden rounded-2xl border border-[#130E30]/10 bg-white">
      <img src={update.photo} alt="" className="aspect-[16/9] w-full object-cover" />
      <div className="flex flex-col gap-2 p-5">
        <p className="flex items-center gap-1.5 font-gsf text-[13px] text-[#667085]">
          <BadgeCheck className="h-4 w-4 text-[#00B67A]" strokeWidth={1.5} />
          {update.org} · {update.date}
        </p>
        <p className="font-gsf text-[17px] leading-[24px] text-[#130E30]">{update.text}</p>
      </div>
    </article>
  );
}
