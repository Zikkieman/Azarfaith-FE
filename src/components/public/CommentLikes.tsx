import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { apiFetch } from "@/lib/api";
export type CommentReaction = { id: string; count: number; liked: boolean };
export function CommentLikes({
  campaignId,
  commentId,
  state,
  authenticated,
  designer = false,
}: {
  campaignId: string;
  commentId: string;
  state?: CommentReaction;
  authenticated: boolean;
  designer?: boolean;
}) {
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      apiFetch(
        `/campaigns/${encodeURIComponent(campaignId)}/comments/${encodeURIComponent(commentId)}/reaction`,
        { method: "PATCH", body: JSON.stringify({ liked: !state?.liked }) },
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: ["comment-reactions", campaignId] }),
  });
  return (
    <div className={designer ? undefined : "mt-3"}>
      <button
        type="button"
        aria-label={state?.liked ? "Unlike comment" : "Like comment"}
        aria-pressed={Boolean(state?.liked)}
        disabled={!authenticated || !state || save.isPending}
        onClick={() => save.mutate()}
        className={
          designer
            ? cn(
                "flex w-fit items-center gap-1.5 text-[13px] font-medium disabled:opacity-50",
                state?.liked ? "text-brand" : "text-muted-ink hover:text-ink",
              )
            : "inline-flex items-center gap-1.5 text-xs text-muted-foreground disabled:opacity-50"
        }
      >
        <Heart
          size={designer ? 16 : 15}
          strokeWidth={1.75}
          className={
            state?.liked ? (designer ? "fill-brand" : "fill-orange-500 text-orange-500") : ""
          }
        />
        {state?.liked ? "Liked" : "Like"}
        {state && state.count > 0 ? ` (${state.count})` : ""}
      </button>
      {save.isError && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {save.error.message}
        </p>
      )}
    </div>
  );
}
