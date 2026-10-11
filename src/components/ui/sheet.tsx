import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTitle = Dialog.Title;
export function SheetContent({
  children,
  className,
  side = "left",
  ...props
}: ComponentProps<typeof Dialog.Content> & { side?: "left" | "right" }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm" />
      <Dialog.Content
        aria-describedby={undefined}
        {...props}
        className={cn(
          "fixed inset-y-0 z-50 h-dvh bg-paper shadow-xl",
          side === "left" ? "left-0" : "right-0",
          className,
        )}
      >
        {children}
        <Dialog.Close
          aria-label="Close admin navigation"
          className="absolute right-3 top-5 rounded-lg p-2 text-muted-ink hover:bg-paper"
        >
          <X className="h-4 w-4" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
