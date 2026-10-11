import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAppSelector } from "@/app/hooks";
import {
  addAdminReviewNote,
  getAdminReviewRecords,
  updateAdminReviewCheck,
  type AdminReviewRecordType,
} from "@/features/catalog/api";
import { AdminLoadError } from "./AdminLoadError";

export function AdminReviewPanel({ type, id }: { type: AdminReviewRecordType; id: string }) {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [page, setPage] = useState(1);
  const [body, setBody] = useState("");
  const noteId = useId();
  const client = useQueryClient();
  const key = ["admin", "review-records", userId, type, id];
  const query = useQuery({
    queryKey: [...key, page],
    queryFn: () => getAdminReviewRecords(type, id, page),
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: key });
    void client.invalidateQueries({ queryKey: ["admin", "activity"] });
    void client.invalidateQueries({ queryKey: ["admin", "inbox"] });
  };
  const note = useMutation({
    mutationFn: () => addAdminReviewNote(type, id, body.trim()),
    onSuccess: () => {
      setBody("");
      setPage(1);
      refresh();
      toast.success("Internal note saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const check = useMutation({
    mutationFn: (payload: { key: string; checked: boolean; expectedVersion?: string }) =>
      updateAdminReviewCheck(type, id, payload),
    onSuccess: () => {
      refresh();
      toast.success("Review check saved.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
      void query.refetch();
    },
  });
  return (
    <section
      className="mt-6 rounded-xl border border-line-soft bg-paper p-5"
      aria-label="Internal review records"
    >
      <h2 className="text-lg font-semibold">Internal review</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-ink">
        Private to platform admins. Notes are permanent audit records. Checks are manual review
        acknowledgements, not automatic verification or approval.
      </p>
      {query.isPending ? (
        <p role="status" className="mt-4 text-sm">
          Loading review records...
        </p>
      ) : query.isError ? (
        <AdminLoadError retry={() => void query.refetch()} />
      ) : (
        query.data && (
          <>
            {!!query.data.checklist.length && (
              <fieldset
                className="mt-5 grid gap-3 sm:grid-cols-2"
                disabled={check.isPending || query.isFetching}
              >
                <legend className="mb-3 text-sm font-semibold">Review checklist</legend>
                {query.data.checklist.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 rounded-lg border border-line-soft p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={item.checked}
                      onChange={(event) =>
                        check.mutate({
                          key: item.key,
                          checked: event.target.checked,
                          expectedVersion: item.version ?? undefined,
                        })
                      }
                    />
                    <span>
                      {item.label}
                      <span className="mt-1 block text-xs text-muted-ink">
                        {item.updatedBy
                          ? `${item.updatedBy.fullName} · ${new Date(item.version!).toLocaleString("en-NG")}`
                          : "Not checked yet"}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            <form
              className="mt-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (body.trim() && !note.isPending) note.mutate();
              }}
            >
              <label className="giving-label" htmlFor={noteId}>
                Internal note
              </label>
              <textarea
                id={noteId}
                className="giving-input mt-2 min-h-28"
                maxLength={2000}
                required
                value={body}
                disabled={note.isPending}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Record what you reviewed or what the next admin should know. Do not include payment secrets or passwords."
              />
              <button
                className="giving-small-button mt-3"
                type="submit"
                disabled={note.isPending || !body.trim()}
              >
                {note.isPending ? "Saving note..." : "Save internal note"}
              </button>
              {note.isError && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {note.error.message} Your draft has been kept.
                </p>
              )}
            </form>
            <h3 className="mb-3 mt-6 text-sm font-semibold">Saved notes ({query.data.total})</h3>
            {!query.data.notes.length ? (
              <p className="text-sm text-muted-ink">No internal notes yet.</p>
            ) : (
              <ol className="space-y-3">
                {query.data.notes.map((item) => (
                  <li key={item.id} className="rounded-lg border border-line-soft p-3">
                    <p className="whitespace-pre-wrap break-words text-sm">{item.body}</p>
                    <p className="mt-2 text-xs text-muted-ink">
                      {item.author.fullName} ·{" "}
                      <time dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleString("en-NG")}
                      </time>
                    </p>
                  </li>
                ))}
              </ol>
            )}
            {query.data.total > query.data.pageSize && (
              <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  className="giving-small-button"
                  disabled={page === 1 || query.isFetching}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous notes
                </button>
                <span>Page {page}</span>
                <button
                  type="button"
                  className="giving-small-button"
                  disabled={!query.data.hasMore || query.isFetching}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next notes
                </button>
              </div>
            )}
          </>
        )
      )}
    </section>
  );
}
