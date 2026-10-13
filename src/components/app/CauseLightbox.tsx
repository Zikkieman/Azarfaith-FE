import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "./DesignDialog";
import { btn } from "./btn";

export function CauseLightbox({
  photos,
  index,
  onIndex,
  title,
  open,
  onOpenChange,
}: {
  photos: string[];
  index: number;
  onIndex: (value: number) => void;
  title: string;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const selected = Math.min(index, Math.max(0, photos.length - 1));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl" aria-describedby={undefined}>
        <DialogTitle className="pr-8 text-sm font-medium text-ink">
          {title} photo gallery
        </DialogTitle>
        {photos[selected] && (
          <img
            src={photos[selected]}
            alt={title + " photo " + (selected + 1)}
            className="max-h-[65dvh] w-full object-contain"
          />
        )}
        {photos.length > 1 && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Previous enlarged photo"
              className={btn("secondary", "sm")}
              onClick={() => onIndex((selected + photos.length - 1) % photos.length)}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="text-sm text-muted-ink">
              {selected + 1} / {photos.length}
            </span>
            <button
              type="button"
              aria-label="Next enlarged photo"
              className={btn("secondary", "sm")}
              onClick={() => onIndex((selected + 1) % photos.length)}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
