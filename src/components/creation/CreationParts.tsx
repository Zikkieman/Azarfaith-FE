import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCloudinaryStatus, uploadMedia, type UploadMediaPayload } from "@/features/catalog/api";
import { validateMedia } from "@/lib/creation";

export function CreationLogo() {
  return (
    <Link to="/manage" className="inline-flex items-center gap-2 font-semibold">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-500">
        <Flame size={16} className="fill-white text-white" />
      </span>
      AzarFaith
    </Link>
  );
}
export function Field({
  id,
  label,
  error,
  children,
  hint,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div id={`field-${id}`} className="min-w-0 scroll-mt-24">
      <label htmlFor={id} className="giving-label">
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs leading-relaxed text-[#777283]">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
export function MediaPicker({
  label,
  folder,
  urls,
  limit,
  onChange,
  error,
  onBusy,
}: {
  label: string;
  folder: UploadMediaPayload["folder"];
  urls: string[];
  limit: number;
  onChange: (urls: string[]) => void;
  error?: string;
  onBusy: (busy: boolean) => void;
}) {
  const status = useQuery({
    queryKey: ["media", "cloudinary-status"],
    queryFn: getCloudinaryStatus,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const documents = folder === "organization-document";
  const upload = async (files: File[]) => {
    if (!files.length) return;
    const invalid = validateMedia(files, urls.length, limit, documents);
    if (invalid) {
      setMessage(invalid);
      return;
    }
    setBusy(true);
    onBusy(true);
    setMessage(null);
    // Keep successful uploads even if a later file fails, so retrying doesn't lose work.
    const uploaded = [...urls];
    try {
      for (const file of files) {
        const result = await uploadMedia({ file, folder });
        uploaded.push(result.url);
      }
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : "Upload failed. Please try again.");
    } finally {
      onChange(uploaded);
      setBusy(false);
      onBusy(false);
    }
  };
  return (
    <div id={`field-${folder}`} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="giving-label !mb-0">{label}</p>
        <span className="text-xs text-[#777283]">
          {urls.length}/{limit}
        </span>
      </div>
      <div className="rounded-2xl border border-dashed border-[#d8d5e0] bg-[#f8f7fa] p-5 text-center">
        <ImagePlus size={26} className="mx-auto mb-3 text-[#777283]" />
        <p className="mb-3 text-xs text-[#777283]">
          {documents ? "PDF, JPEG, PNG or WebP" : "JPEG, PNG or WebP"}. Up to 5 MB per file.
        </p>
        <label
          className={`giving-small-button inline-flex cursor-pointer items-center gap-2 ${busy || !status.data?.enabled || urls.length >= limit ? "pointer-events-none opacity-50" : ""}`}
        >
          {busy && <Loader2 size={15} className="animate-spin" />}
          {busy ? "Uploading..." : documents ? "Add document" : "Choose photos"}
          <input
            aria-label={label}
            type="file"
            className="sr-only"
            disabled={busy || !status.data?.enabled || urls.length >= limit}
            multiple={limit > 1}
            accept={
              documents
                ? "application/pdf,image/jpeg,image/png,image/webp"
                : "image/jpeg,image/png,image/webp"
            }
            onChange={(event) => {
              void upload(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        </label>
        {status.isPending && <p className="mt-3 text-xs">Checking upload connection...</p>}
        {status.isError && (
          <button
            type="button"
            className="mt-3 block w-full text-sm text-red-700 underline"
            onClick={() => void status.refetch()}
          >
            Uploads unavailable. Retry connection
          </button>
        )}
        {status.data && !status.data.enabled && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            Uploads are temporarily unavailable. You can still save a draft.
          </p>
        )}
      </div>
      {urls.length > 0 && (
        <div className={documents ? "space-y-2" : "grid grid-cols-3 gap-3"}>
          {urls.map((url, index) => (
            <div
              key={url}
              className="relative min-w-0 overflow-hidden rounded-xl border border-[#efedf3]"
            >
              {documents ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block break-all p-3 pr-10 text-xs underline"
                >
                  Document {index + 1}
                </a>
              ) : (
                <img
                  src={url}
                  alt={`Uploaded photo ${index + 1}`}
                  className="aspect-square w-full object-cover"
                />
              )}
              <button
                type="button"
                aria-label={`Remove ${documents ? "document" : "photo"} ${index + 1}`}
                disabled={busy}
                onClick={() => onChange(urls.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full border bg-white text-[#130e30]"
              >
                <Trash2 size={14} />
              </button>
              {!documents && index === 0 && folder === "organization-photo" && (
                <span className="absolute bottom-1 left-1 rounded bg-white px-2 py-1 text-xs">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {(message || error) && (
        <p role="alert" className="text-sm text-red-700">
          {message || error}
        </p>
      )}
    </div>
  );
}
export function CreationNotice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-[#e5e1ee] bg-[#f8f7fa] p-4 text-sm leading-relaxed text-[#777283]"
    >
      {children}
    </div>
  );
}
