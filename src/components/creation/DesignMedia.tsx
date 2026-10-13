import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, FileText, Loader2, Trash2 } from "lucide-react";
import { getCloudinaryStatus, uploadMedia, type UploadMediaPayload } from "@/features/catalog/api";
import { useAppSelector } from "@/app/hooks";
import { validateMedia } from "@/lib/creation";
import { btnSecondary } from "@/components/app/btn";
import { cn } from "@/lib/utils";
import { Photo } from "@/components/app/Photo";

type Props = {
  folder: UploadMediaPayload["folder"];
  urls: string[];
  limit: number;
  onChange: (urls: string[]) => void;
  onBusy: (busy: boolean) => void;
  disabled?: boolean;
  error?: string;
};
function useUpload({ folder, urls, limit, onChange, onBusy }: Props) {
  const userId = useAppSelector((s) => s.auth.user?.id);
  const status = useQuery({
    queryKey: ["media", "cloudinary-status", userId],
    queryFn: getCloudinaryStatus,
    enabled: Boolean(userId),
  });
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null),
    locked = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function upload(files: File[]) {
    if (!files.length || locked.current) return;
    const invalid = validateMedia(files, urls.length, limit, folder === "organization-document");
    if (invalid) {
      setMessage(invalid);
      return;
    }
    if (!status.data?.enabled) {
      setMessage("Uploads are unavailable. Retry the connection or save a draft.");
      return;
    }
    locked.current = true;
    setBusy(true);
    onBusy(true);
    setMessage("");
    const uploaded = [...urls];
    try {
      for (const file of files) {
        const result = await uploadMedia({ file, folder });
        if (!mounted.current) break;
        uploaded.push(result.url);
      }
    } catch (error) {
      if (mounted.current)
        setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      locked.current = false;
      if (mounted.current) {
        onChange(uploaded);
        setBusy(false);
        onBusy(false);
      }
    }
  }
  const fileInput = (
    <input
      ref={input}
      type="file"
      className="sr-only"
      aria-label={
        folder === "organization-document"
          ? "Registration evidence"
          : folder === "organization-photo"
            ? "Organization photos"
            : folder === "campaign-cover"
              ? "Cover photo"
              : "Gallery photos"
      }
      disabled={busy || !status.data?.enabled || urls.length >= limit}
      multiple={limit > 1}
      accept={
        folder === "organization-document"
          ? "application/pdf,image/jpeg,image/png,image/webp"
          : "image/jpeg,image/png,image/webp"
      }
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        void upload(files);
      }}
    />
  );
  const connection = (
    <>
      {status.isPending && (
        <p role="status" className="text-[13px] text-muted-ink">
          Checking upload connection...
        </p>
      )}
      {status.isError && (
        <button
          type="button"
          className="text-sm text-danger underline"
          onClick={() => void status.refetch()}
        >
          Uploads unavailable. Retry connection
        </button>
      )}
      {status.data && !status.data.enabled && (
        <p role="alert" className="text-sm text-danger">
          Uploads are temporarily unavailable. You can still save a draft.
        </p>
      )}
      {message && (
        <p role="alert" className="text-sm text-danger">
          {message}
        </p>
      )}
    </>
  );
  return { busy, input, fileInput, connection, enabled: Boolean(status.data?.enabled) };
}

export function OrganizationUploads(props: Props & { documents?: boolean }) {
  const upload = useUpload(props),
    documents = props.documents;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line-input bg-panel px-6 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-paper text-ink">
          {documents ? (
            <FileText className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
          )}
        </span>
        <p className="text-base font-semibold text-ink">
          {documents ? "Registration evidence" : "Upload photos of your work"}
        </p>
        <p className="text-sm text-muted-ink">
          {documents
            ? "A CAC registration document or recommendation letter from a recognized parent ministry."
            : "Buildings, team, community, events — real photos, not stock."}
        </p>
        <button
          type="button"
          className={cn(btnSecondary, "mt-2")}
          disabled={
            props.disabled || upload.busy || !upload.enabled || props.urls.length >= props.limit
          }
          onClick={() => upload.input.current?.click()}
        >
          {upload.busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : documents ? (
            "Add document"
          ) : (
            "Choose photos"
          )}
        </button>
        {upload.fileInput}
        <p className="text-[12px] text-subtle">
          {documents ? "PDF, JPEG, PNG or WebP" : "JPEG, PNG or WebP"}. Up to 5 MB each.{" "}
          {props.urls.length}/{props.limit}
        </p>
      </div>
      {props.urls.length > 0 && (
        <div className={documents ? "flex flex-col gap-2" : "grid grid-cols-3 gap-3"}>
          {props.urls.map((url, i) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-field border border-line-soft"
            >
              {documents ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-all p-3 pr-10 text-sm text-ink-soft underline"
                >
                  Document {i + 1}
                </a>
              ) : (
                <Photo src={url} alt={"Organization photo " + (i + 1)} className="aspect-square" />
              )}
              <button
                type="button"
                aria-label={"Remove " + (documents ? "document" : "photo") + " " + (i + 1)}
                disabled={props.disabled || upload.busy}
                className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-paper text-ink"
                onClick={() => props.onChange(props.urls.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {!documents && i === 0 && (
                <span className="absolute bottom-1 left-1 rounded-[6px] bg-paper px-2 py-1 text-[11px] text-ink">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {upload.connection}
      {props.error && (
        <p role="alert" className="text-[13px] text-danger">
          {props.error}
        </p>
      )}
    </div>
  );
}

export function CampaignUploads(props: Props & { cover?: boolean }) {
  const upload = useUpload(props),
    cover = props.cover;
  return (
    <div className="flex flex-col gap-3">
      {cover ? (
        <PhotoTile
          label="Cover photo"
          tall
          src={props.urls[0]}
          disabled={props.disabled || upload.busy || (!props.urls[0] && !upload.enabled)}
          onAdd={() => upload.input.current?.click()}
          onRemove={() => props.onChange([])}
        />
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {props.urls.map((url, i) => (
            <PhotoTile
              key={url}
              label={"Photo " + (i + 1)}
              src={url}
              disabled={props.disabled || upload.busy}
              onRemove={() => props.onChange(props.urls.filter((_, j) => j !== i))}
            />
          ))}
          {props.urls.length < props.limit && (
            <PhotoTile
              label="Add"
              disabled={props.disabled || upload.busy || !upload.enabled}
              onAdd={() => upload.input.current?.click()}
            />
          )}
        </div>
      )}
      {upload.fileInput}
      {upload.busy && (
        <p role="status" className="text-[13px] text-muted-ink">
          Uploading...
        </p>
      )}
      {upload.connection}
      {props.error && (
        <p role="alert" className="text-[13px] text-danger">
          {props.error}
        </p>
      )}
    </div>
  );
}

export function PhotoTile({
  label,
  src,
  tall,
  onAdd,
  onRemove,
  disabled,
}: {
  label: string;
  src?: string;
  tall?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  if (src)
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-field bg-panel",
          tall ? "aspect-[16/9]" : "aspect-square",
        )}
      >
        <Photo src={src} alt={label} className="h-full w-full" />
        <span className="absolute left-2 top-2 rounded-[6px] bg-paper/90 px-1.5 py-0.5 text-[11px] font-medium text-ink">
          {label}
        </span>
        {onRemove && (
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            aria-label={"Remove " + label.toLowerCase()}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-paper/90 text-ink opacity-0 transition-opacity hover:bg-paper focus:opacity-100 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
    );
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAdd}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-field border border-dashed border-line-input bg-panel/50 text-[13px] text-muted-ink transition-colors hover:border-ink hover:text-ink",
        tall ? "aspect-[16/9]" : "aspect-square",
      )}
    >
      <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
      {label}
    </button>
  );
}
