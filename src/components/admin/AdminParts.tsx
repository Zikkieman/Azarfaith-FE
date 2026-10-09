import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Circle,
  Copy,
  FileText,
  X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import {
  checkDefs,
  fullDate,
  timeAgo,
  type AuditAction,
  type AuditEntry,
  type CheckState,
} from "@/lib/admin";
import { btn } from "@/components/app/btn";
import { inputClass } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";
import { actionText, useCheckSummary } from "./useAdmin";

/* ─── Field panel (after Twenty's record fields) ─── */

/** A collapsible group of fields on the left of a record page. */
export function FieldGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-line-soft py-3 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-[6px] px-1 py-1 text-[12px] font-medium text-subtle transition-colors hover:text-ink"
      >
        {title}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", !open && "-rotate-90")}
          strokeWidth={2}
        />
      </button>
      <div className="expand" data-open={open ? "" : undefined}>
        <div>
          <dl className="flex flex-col gap-0.5 pt-1">{children}</dl>
        </div>
      </div>
    </section>
  );
}

/** One field: icon, label, value. `copy` adds a copy button for emails, phones and IDs. */
export function Field({
  icon: Icon,
  label,
  children,
  copy,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  copy?: string;
}) {
  return (
    <div className="group flex min-h-8 items-center gap-2 rounded-[6px] px-1 text-[13px]">
      <dt className="flex w-[118px] shrink-0 items-center gap-2 text-muted-ink">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="flex min-w-0 flex-1 items-center gap-1 text-ink">
        <span className="min-w-0 truncate">{children}</span>
        {copy ? (
          <button
            type="button"
            aria-label={`Copy ${label.toLowerCase()}`}
            onClick={() => {
              navigator.clipboard?.writeText(copy);
              toast(`${label} copied`);
            }}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-[5px] text-muted-ink opacity-0 transition-opacity hover:bg-panel hover:text-ink focus:opacity-100 group-hover:opacity-100"
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        ) : null}
      </dd>
    </div>
  );
}

/* ─── Verification ─── */

const stateStyle: Record<CheckState, { icon: LucideIcon; ring: string; label: string }> = {
  passed: { icon: Check, ring: "bg-verified text-white", label: "Passed" },
  failed: { icon: XIcon, ring: "bg-danger text-white", label: "Failed" },
  waiting: {
    icon: Circle,
    ring: "border border-dashed border-line-input text-transparent",
    label: "Waiting",
  },
};

/** The checks an organization must pass before it can be verified. Each can be marked by hand. */
export function CheckList({ orgId, editable = true }: { orgId: string; editable?: boolean }) {
  const checks = useApp((s) => s.checks[orgId]);
  const setCheck = useApp((s) => s.setCheck);
  if (!checks) return null;
  return (
    <ul className="flex flex-col divide-y divide-line-soft rounded-field border border-line-soft">
      {checkDefs.map((d) => {
        const state = checks[d.key];
        const s = stateStyle[state];
        return (
          <li key={d.key} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full", s.ring)}>
              <s.icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{d.label}</p>
              <p
                className={cn("text-[13px]", state === "failed" ? "text-danger" : "text-muted-ink")}
              >
                {state === "failed" ? d.failHint : d.hint}
              </p>
            </div>
            {editable ? (
              <CheckToggle
                value={state}
                onChange={(v) =>
                  setCheck(
                    orgId,
                    d.key,
                    v,
                    `${d.label} marked ${stateStyle[v].label.toLowerCase()}.`,
                  )
                }
              />
            ) : (
              <span className="text-[13px] text-muted-ink">{s.label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function CheckToggle({
  value,
  onChange,
}: {
  value: CheckState;
  onChange: (v: CheckState) => void;
}) {
  const opts: { v: CheckState; label: string }[] = [
    { v: "passed", label: "Pass" },
    { v: "failed", label: "Fail" },
    { v: "waiting", label: "Waiting" },
  ];
  return (
    <div className="inline-flex shrink-0 rounded-[9px] bg-panel p-0.5" role="radiogroup">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "h-7 rounded-[7px] px-2.5 text-[12px] font-medium transition-all duration-200",
            value === o.v
              ? cn(
                  "bg-paper shadow-[0_1px_2px_rgba(19,14,48,0.1)] ring-1 ring-line-soft",
                  o.v === "passed" && "text-verified-ink",
                  o.v === "failed" && "text-danger",
                  o.v === "waiting" && "text-ink",
                )
              : "text-muted-ink hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CheckMeter({ orgId }: { orgId: string }) {
  const { passed, total, failed } = useCheckSummary(orgId);
  if (!total) return <span className="text-muted-ink">No checks</span>;
  return (
    <span className="inline-flex items-center gap-2 text-[13px]">
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-3 rounded-full",
              i < passed
                ? "bg-verified"
                : i < passed + failed.length
                  ? "bg-danger"
                  : "bg-line-soft",
            )}
          />
        ))}
      </span>
      <span className={cn("tabular-nums", failed.length ? "text-danger" : "text-ink-soft")}>
        {passed} of {total}
      </span>
    </span>
  );
}

/** Problems worth a second look before approving anything (after Modash's fake-follower flag). */
export function RiskSignals({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex gap-3 rounded-field border border-danger/20 bg-danger/[0.04] p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">
          {items.length === 1 ? "1 thing needs a look" : `${items.length} things need a look`}
        </p>
        <ul className="mt-1 flex flex-col gap-0.5 text-[13px] text-ink-soft">
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DocumentList({ documents }: { documents: { name: string; size: string }[] }) {
  if (!documents.length) {
    return (
      <p className="rounded-field border border-dashed border-line-input px-4 py-5 text-center text-[13px] text-muted-ink">
        No documents uploaded yet. Ask the organization to add their CAC certificate.
      </p>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {documents.map((d) => (
        <li key={d.name}>
          <button
            type="button"
            onClick={() => toast("The document viewer is coming soon")}
            className="flex w-full items-center gap-3 rounded-field border border-line-soft p-3 text-left transition-colors hover:border-line-input hover:bg-panel/50"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-panel text-ink-soft">
              <FileText className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-ink">{d.name}</span>
              <span className="block text-[12px] text-muted-ink">PDF, {d.size}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ─── Activity & notes ─── */

const dotTone: Partial<Record<AuditAction, string>> = {
  org_verified: "bg-verified",
  campaign_approved: "bg-verified",
  user_reactivated: "bg-verified",
  org_rejected: "bg-danger",
  org_revoked: "bg-danger",
  campaign_rejected: "bg-danger",
  user_suspended: "bg-danger",
  giving_paused: "bg-danger",
};

/** Vertical timeline of audit entries. `showTarget` adds the record name for global feeds. */
export function Timeline({
  entries,
  showTarget = false,
  empty = "No activity yet.",
}: {
  entries: AuditEntry[];
  showTarget?: boolean;
  empty?: string;
}) {
  if (!entries.length) {
    return <p className="py-10 text-center text-sm text-muted-ink">{empty}</p>;
  }
  return (
    <ol className="relative flex flex-col">
      {entries.map((e, i) => (
        <li
          key={e.id}
          className="admin-row relative flex gap-3 pb-5 last:pb-0"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          {i < entries.length - 1 ? (
            <span aria-hidden className="absolute left-[5px] top-4 h-full w-px bg-line-soft" />
          ) : null}
          <span
            aria-hidden
            className={cn(
              "relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-paper",
              dotTone[e.action] ?? "bg-line-input",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-soft">
              <span className="font-medium text-ink">{e.actor}</span> {actionText[e.action]}
              {(showTarget || e.target.kind === "platform") && e.actor !== e.target.name ? (
                <>
                  {" "}
                  <span className="font-medium text-ink">{e.target.name}</span>
                </>
              ) : null}
            </p>
            {e.detail ? <p className="mt-0.5 text-[13px] text-muted-ink">{e.detail}</p> : null}
            <time
              dateTime={e.at}
              title={fullDate(e.at)}
              className="mt-0.5 block text-[12px] text-subtle"
            >
              {timeAgo(e.at)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}

const NO_NOTES: never[] = [];

/** Internal notes on a record. Only the team sees them. */
export function Notes({ recordId }: { recordId: string }) {
  const notes = useApp((s) => s.notes[recordId]) ?? NO_NOTES;
  const addNote = useApp((s) => s.addNote);
  const [draft, setDraft] = useState("");
  const save = () => {
    if (!draft.trim()) return;
    addNote(recordId, draft.trim());
    setDraft("");
    toast("Note added");
  };
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-field border border-line-input focus-within:border-ink">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
          }}
          rows={3}
          placeholder="Add a note for the team. Givers and organizations never see these."
          className={cn(inputClass, "resize-none border-0 focus:ring-0")}
        />
        <div className="flex items-center justify-between border-t border-line-soft px-3 py-2">
          <span className="text-[12px] text-subtle">⌘ + Enter to save</span>
          <button
            type="button"
            onClick={save}
            disabled={!draft.trim()}
            className={btn("primary", "sm")}
          >
            Add note
          </button>
        </div>
      </div>
      {notes.length === 0 ? (
        <p className="text-center text-sm text-muted-ink">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {notes.map((n) => (
            <li key={n.id} className="admin-row">
              <p className="text-[13px]">
                <span className="font-medium text-ink">{n.author}</span>{" "}
                <time dateTime={n.at} title={fullDate(n.at)} className="text-subtle">
                  {timeAgo(n.at)}
                </time>
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-[1.6] text-ink-soft">
                {n.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
