import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function PhotoGallery({
  photos,
  title,
  panoramic = false,
}: {
  photos: string[];
  title: string;
  panoramic?: boolean;
}) {
  const images = [...new Set(photos.filter(Boolean))];
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const selected = Math.min(index, Math.max(0, images.length - 1));
  const controls = images.length > 1 && (
    <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white p-1">
      <button
        aria-label="Previous photo"
        className="rounded-full p-2"
        onClick={() => setIndex((selected + images.length - 1) % images.length)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs">
        {selected + 1} / {images.length}
      </span>
      <button
        aria-label="Next photo"
        className="rounded-full p-2"
        onClick={() => setIndex((selected + 1) % images.length)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
  return (
    <>
      <div
        className={`relative aspect-[16/9] overflow-hidden rounded-2xl bg-stone-100 ${panoramic ? "md:aspect-[3/1]" : ""}`}
      >
        {images.length ? (
          <img
            src={images[selected]}
            alt={`${title} photo ${selected + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            No photos yet
          </span>
        )}
        {images.length > 0 && (
          <button
            aria-label="Enlarge photo"
            className="absolute left-4 bottom-4 rounded-full bg-white p-3"
            onClick={() => setOpen(true)}
          >
            <Expand className="h-4 w-4" />
          </button>
        )}
        {controls}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src}
              aria-label={`View photo ${i + 1}`}
              aria-pressed={selected === i}
              onClick={() => setIndex(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${selected === i ? "border-orange-400" : "border-transparent"}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{title} photo gallery</DialogTitle>
          <div className="relative">
            {images[selected] && (
              <img
                src={images[selected]}
                alt={`${title} photo ${selected + 1}`}
                className="max-h-[75vh] w-full object-contain"
              />
            )}
            {controls}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
