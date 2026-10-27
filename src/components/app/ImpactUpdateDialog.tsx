import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, ImagePlus, Trash2, Video } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import { btn } from "@/components/app/btn";
import { inputClass, labelClass } from "@/components/app/AppShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MB = 1024 * 1024;
const limits = { image: 8, video: 2, receipt: 5 } as const;
type EvidenceKind = keyof typeof limits;
type UpdateKind = "PROGRESS" | "MILESTONE" | "COMPLETION";

const allowed = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/webm"],
  receipt: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
} as const;

const maxBytes = { image: 5 * MB, video: 15 * MB, receipt: 5 * MB } as const;
const folder = {
  image: "campaign-update-image",
  video: "campaign-update-video",
  receipt: "campaign-update-receipt",
} as const;

function videoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read the duration of ${file.name}.`));
    };
    video.src = url;
  });
}

type UploadedEvidence = {
  kind: EvidenceKind;
  url: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
};

async function cleanupEvidence(campaignId: string, uploads: UploadedEvidence[]) {
  if (!uploads.length) return;
  await apiFetch("/media/cleanup", {
    method: "POST",
    body: JSON.stringify({
      entityId: campaignId,
      assets: uploads.map(({ publicId, resourceType }) => ({ publicId, resourceType })),
    }),
  });
}

async function uploadEvidenceBatch(campaignId: string, selections: Record<EvidenceKind, File[]>) {
  const tasks = (Object.keys(selections) as EvidenceKind[]).flatMap((kind) =>
    selections[kind].map(async (file): Promise<UploadedEvidence> => {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder[kind]);
      form.append("entityId", campaignId);
      const uploaded = await apiFetch<{
        url: string;
        publicId: string;
        resourceType: "image" | "video" | "raw";
      }>("/media/upload", { method: "POST", body: form });
      return { kind, ...uploaded };
    }),
  );
  const results = await Promise.allSettled(tasks);
  const uploads = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const failed = results.find((result) => result.status === "rejected");
  if (failed) {
    await cleanupEvidence(campaignId, uploads).catch(() => undefined);
    throw failed.reason;
  }
  return uploads;
}

export function ImpactUpdateDialog({
  campaignId,
  campaignTitle,
  open,
  onOpenChange,
  onPublished,
}: {
  campaignId: string;
  campaignTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished?: () => void;
}) {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<UpdateKind>("PROGRESS");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [amountSpent, setAmountSpent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [receipts, setReceipts] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const files = { image: images, video: videos, receipt: receipts };
  const setters = { image: setImages, video: setVideos, receipt: setReceipts };
  const evidenceCount = images.length + videos.length + receipts.length;
  const canPublish =
    title.trim().length >= 3 &&
    body.trim().length >= 10 &&
    (kind !== "COMPLETION" || evidenceCount > 0) &&
    !publishing;

  const previews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images],
  );
  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews],
  );

  const choose = async (evidenceKind: EvidenceKind, selected: FileList | null) => {
    if (!selected?.length) return;
    const current = files[evidenceKind];
    const next = Array.from(selected);
    const available = limits[evidenceKind] - current.length;
    if (next.length > available) {
      toast.error(`You can add ${available} more ${evidenceKind}${available === 1 ? "" : "s"}.`);
      return;
    }
    if (next.some((file) => !(allowed[evidenceKind] as readonly string[]).includes(file.type))) {
      toast.error(
        evidenceKind === "video"
          ? "Choose MP4 or WebM videos."
          : evidenceKind === "receipt"
            ? "Choose JPEG, PNG, WebP or PDF receipts."
            : "Choose JPEG, PNG or WebP images.",
      );
      return;
    }
    if (next.some((file) => file.size > maxBytes[evidenceKind])) {
      toast.error(
        `${evidenceKind === "video" ? "Videos" : "Files"} must be ${evidenceKind === "video" ? "15" : "5"} MB or smaller.`,
      );
      return;
    }
    if (evidenceKind === "video") {
      try {
        const durations = await Promise.all(next.map(videoDuration));
        if (durations.some((duration) => !Number.isFinite(duration) || duration > 60)) {
          toast.error("Each video must be 60 seconds or shorter.");
          return;
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not inspect this video.");
        return;
      }
    }
    setters[evidenceKind]([...current, ...next]);
  };

  const remove = (evidenceKind: EvidenceKind, index: number) => {
    setters[evidenceKind](files[evidenceKind].filter((_, itemIndex) => itemIndex !== index));
  };

  const reset = () => {
    setKind("PROGRESS");
    setTitle("");
    setBody("");
    setAmountSpent("");
    setImages([]);
    setVideos([]);
    setReceipts([]);
  };

  const publish = async () => {
    if (!canPublish) return;
    setPublishing(true);
    let uploads: UploadedEvidence[] = [];
    let saved = false;
    try {
      uploads = await uploadEvidenceBatch(campaignId, {
        image: images,
        video: videos,
        receipt: receipts,
      });
      await apiFetch(`/campaigns/${campaignId}/updates`, {
        method: "POST",
        body: JSON.stringify({
          kind,
          title: title.trim(),
          body: body.trim(),
          amountSpent: amountSpent ? Number(amountSpent.replaceAll(",", "")) : undefined,
          imageUrls: uploads.filter((item) => item.kind === "image").map((item) => item.url),
          videoUrls: uploads.filter((item) => item.kind === "video").map((item) => item.url),
          receiptUrls: uploads.filter((item) => item.kind === "receipt").map((item) => item.url),
        }),
      });
      saved = true;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] }),
        queryClient.invalidateQueries({ queryKey: ["my-dashboard"] }),
      ]);
      toast.success("Impact update published. Givers will be notified.");
      reset();
      onOpenChange(false);
      onPublished?.();
    } catch (error) {
      if (!saved) await cleanupEvidence(campaignId, uploads).catch(() => undefined);
      toast.error(error instanceof Error ? error.message : "Could not publish this update.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!publishing) onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share an impact update</DialogTitle>
          <DialogDescription>
            Show givers what happened after they gave to {campaignTitle}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-1 rounded-[12px] bg-panel p-1">
            {(["PROGRESS", "MILESTONE", "COMPLETION"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
                className={cn(
                  "rounded-[9px] px-2 py-2 text-[13px] font-medium capitalize",
                  kind === value ? "bg-paper text-ink shadow-sm" : "text-muted-ink",
                )}
              >
                {value.toLowerCase()}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Update title</span>
            <input
              className={inputClass}
              maxLength={120}
              placeholder="e.g. The new classroom is complete"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>What happened?</span>
            <textarea
              className={cn(inputClass, "min-h-32 resize-y py-3")}
              maxLength={3000}
              placeholder="Tell givers what was completed, who benefited and what happens next."
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>
              Amount spent <span className="font-normal text-muted-ink">(optional)</span>
            </span>
            <input
              className={inputClass}
              inputMode="numeric"
              placeholder="₦ 0"
              value={amountSpent}
              onChange={(event) =>
                setAmountSpent(
                  event.target.value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                )
              }
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <EvidencePicker
              icon={ImagePlus}
              label="Photos"
              hint="Up to 8 · 5 MB each"
              accept="image/jpeg,image/png,image/webp"
              disabled={publishing}
              onChange={(files) => void choose("image", files)}
            />
            <EvidencePicker
              icon={Video}
              label="Videos"
              hint="2 · 15 MB · 60 sec"
              accept="video/mp4,video/webm"
              disabled={publishing}
              onChange={(files) => void choose("video", files)}
            />
            <EvidencePicker
              icon={FileText}
              label="Receipts"
              hint="Up to 5 · PDF or image"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={publishing}
              onChange={(files) => void choose("receipt", files)}
            />
          </div>

          {evidenceCount ? (
            <div className="flex flex-col gap-3 rounded-field border border-line-soft p-4">
              <p className="text-sm font-medium text-ink">Evidence to publish ({evidenceCount})</p>
              {previews.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {previews.map((preview, index) => (
                    <EvidenceItem
                      key={`${preview.file.name}-${index}`}
                      name={preview.file.name}
                      onRemove={() => remove("image", index)}
                    >
                      <img
                        src={preview.url}
                        alt=""
                        className="h-20 w-full rounded-[8px] object-cover"
                      />
                    </EvidenceItem>
                  ))}
                </div>
              ) : null}
              {videos.map((file, index) => (
                <EvidenceRow
                  key={`${file.name}-${index}`}
                  icon={Video}
                  name={file.name}
                  onRemove={() => remove("video", index)}
                />
              ))}
              {receipts.map((file, index) => (
                <EvidenceRow
                  key={`${file.name}-${index}`}
                  icon={FileText}
                  name={file.name}
                  onRemove={() => remove("receipt", index)}
                />
              ))}
            </div>
          ) : null}
          <p className="text-[12px] leading-relaxed text-muted-ink">
            Only publish evidence you have permission to share. Hide account numbers, addresses and
            other private details on receipts.
          </p>
          {kind === "COMPLETION" && evidenceCount === 0 ? (
            <p className="text-[12px] font-medium text-danger">
              Add at least one photo, video or receipt to publish a completion report.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <button
            type="button"
            className={btn("secondary")}
            disabled={publishing}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={btn("primary")}
            disabled={!canPublish}
            onClick={() => void publish()}
          >
            {publishing ? "Uploading and publishing…" : "Publish update"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EvidencePicker({
  icon: Icon,
  label,
  hint,
  accept,
  disabled,
  onChange,
}: {
  icon: typeof ImagePlus;
  label: string;
  hint: string;
  accept: string;
  disabled: boolean;
  onChange: (files: FileList | null) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1 rounded-field border border-dashed border-line-input p-4 text-center hover:bg-panel",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Icon className="h-5 w-5 text-ink-soft" strokeWidth={1.6} />
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="text-[11px] text-muted-ink">{hint}</span>
      <input
        type="file"
        multiple
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          onChange(event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function EvidenceItem({
  name,
  onRemove,
  children,
}: {
  name: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="group relative min-w-0">
      {children}
      <button
        type="button"
        aria-label={`Remove ${name}`}
        title="Remove"
        onClick={onRemove}
        className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-paper/95 text-danger shadow-sm"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <p className="mt-1 truncate text-[11px] text-muted-ink">{name}</p>
    </div>
  );
}

function EvidenceRow({
  icon: Icon,
  name,
  onRemove,
}: {
  icon: typeof Video;
  name: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[8px] bg-panel px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-ink-soft" />
      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{name}</span>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={onRemove}
        className="text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
