import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { inputClass } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";

export type ReviewEntityType = "organization" | "campaign" | "user";

type ReviewCheck = {
  key: string;
  label: string;
  checked: boolean;
  version: string | null;
  updatedBy: { id: string; fullName: string } | null;
};

export type ReviewRecords = {
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; fullName: string };
  }>;
  total: number;
  checklist: ReviewCheck[];
};

export function useReviewRecords(entityType: ReviewEntityType, id: string) {
  return useQuery({
    queryKey: ["admin", "review-records", entityType, id],
    queryFn: () =>
      apiFetch<ReviewRecords>(
        `/admin/review/records/${entityType}/${id}/review?page=1&pageSize=50`,
      ),
  });
}

export function ReviewChecklist({ entityType, id }: { entityType: ReviewEntityType; id: string }) {
  const queryClient = useQueryClient();
  const records = useReviewRecords(entityType, id);
  const save = useMutation({
    mutationFn: ({ check, checked }: { check: ReviewCheck; checked: boolean }) =>
      apiFetch(`/admin/review/records/${entityType}/${id}/checklist`, {
        method: "PATCH",
        body: JSON.stringify({ key: check.key, checked, expectedVersion: check.version ?? undefined }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "review-records", entityType, id] }),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save this review check."),
  });

  if (records.isLoading) {
    return <p className="rounded-field border border-line-soft px-4 py-5 text-sm text-muted-ink">Loading checks...</p>;
  }
  if (records.error) {
    return <p className="rounded-field border border-danger/20 bg-danger/[0.04] px-4 py-5 text-sm text-danger">Could not load review checks.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-line-soft rounded-field border border-line-soft">
      {(records.data?.checklist ?? []).map((check) => (
        <li key={check.key} className="flex items-center gap-3 p-4">
          <span
            className={cn(
              "grid h-6 w-6 shrink-0 place-items-center rounded-full",
              check.checked ? "bg-verified text-white" : "border border-dashed border-line-input text-transparent",
            )}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">{check.label}</p>
            <p className="text-[13px] text-muted-ink">
              {check.updatedBy ? `Last reviewed by ${check.updatedBy.fullName}` : "Not reviewed yet"}
            </p>
          </div>
          <button
            type="button"
            disabled={save.isPending}
            aria-pressed={check.checked}
            onClick={() => save.mutate({ check, checked: !check.checked })}
            className={btn(check.checked ? "secondary" : "primary", "sm")}
          >
            {check.checked ? "Mark incomplete" : "Mark complete"}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ReviewNotes({ entityType, id }: { entityType: ReviewEntityType; id: string }) {
  const queryClient = useQueryClient();
  const records = useReviewRecords(entityType, id);
  const [draft, setDraft] = useState("");
  const add = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/review/records/${entityType}/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ body: draft.trim() }),
      }),
    onSuccess: () => {
      setDraft("");
      toast.success("Internal note added");
      queryClient.invalidateQueries({ queryKey: ["admin", "review-records", entityType, id] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not add the note."),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-field border border-line-input focus-within:border-ink">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && draft.trim()) add.mutate();
          }}
          rows={3}
          placeholder="Add a note for the team. Givers and organizers never see these."
          className={cn(inputClass, "resize-none border-0 focus:ring-0")}
        />
        <div className="flex items-center justify-between border-t border-line-soft px-3 py-2">
          <span className="text-[12px] text-subtle">Ctrl + Enter to save</span>
          <button
            type="button"
            onClick={() => add.mutate()}
            disabled={!draft.trim() || add.isPending}
            className={btn("primary", "sm")}
          >
            Add note
          </button>
        </div>
      </div>
      {records.isLoading ? <p className="text-center text-sm text-muted-ink">Loading notes...</p> : null}
      {records.error ? <p className="text-center text-sm text-danger">Could not load notes.</p> : null}
      {!records.isLoading && !records.error && records.data?.notes.length === 0 ? (
        <p className="text-center text-sm text-muted-ink">No notes yet.</p>
      ) : null}
      <ul className="flex flex-col gap-4">
        {(records.data?.notes ?? []).map((note) => (
          <li key={note.id} className="admin-row">
            <p className="text-[13px]">
              <span className="font-medium text-ink">{note.author.fullName}</span>{" "}
              <time dateTime={note.createdAt} className="text-subtle">
                {new Date(note.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
              </time>
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-[1.6] text-ink-soft">{note.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReviewDocuments({ documents }: { documents: string[] }) {
  if (!documents.length) {
    return (
      <p className="rounded-field border border-dashed border-line-input px-4 py-5 text-center text-[13px] text-muted-ink">
        No registration documents were uploaded.
      </p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {documents.map((url, index) => {
        const name = decodeURIComponent(url.split("/").pop()?.split("?")[0] || `Document ${index + 1}`);
        return (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-3 rounded-field border border-line-soft p-3 text-left transition-colors hover:border-line-input hover:bg-panel/50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-panel text-ink-soft">
                <FileText className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink">{name}</span>
                <span className="block text-[12px] text-muted-ink">Open uploaded file</span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

type ReviewActivityItem = {
  id: string;
  action: string;
  entityLabel: string;
  reason: string | null;
  actor: { fullName: string };
  createdAt: string;
};

const activityLabel = (action: string) =>
  action
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());

export function ReviewActivity({ entityType, id }: { entityType: ReviewEntityType; id: string }) {
  const activity = useQuery({
    queryKey: ["admin", "activity", entityType, id],
    queryFn: () =>
      apiFetch<{ items: ReviewActivityItem[] }>(
        `/admin/review/activity?entityType=${entityType}&entityId=${id}&page=1&pageSize=50`,
      ),
  });

  if (activity.isLoading) return <p className="py-10 text-center text-sm text-muted-ink">Loading activity...</p>;
  if (activity.error) return <p className="py-10 text-center text-sm text-danger">Could not load activity.</p>;
  if (!activity.data?.items.length) return <p className="py-10 text-center text-sm text-muted-ink">No activity yet.</p>;

  return (
    <ol className="flex flex-col divide-y divide-line-soft">
      {activity.data.items.map((item) => (
        <li key={item.id} className="py-4 first:pt-0">
          <p className="text-sm text-ink-soft">
            <span className="font-medium text-ink">{item.actor.fullName}</span> {activityLabel(item.action)}
          </p>
          {item.reason ? <p className="mt-1 text-[13px] text-muted-ink">{item.reason}</p> : null}
          <time dateTime={item.createdAt} className="mt-1 block text-[12px] text-subtle">
            {new Date(item.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
          </time>
        </li>
      ))}
    </ol>
  );
}
