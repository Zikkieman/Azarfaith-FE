import { ChevronLeft } from "lucide-react";

export function AuthBack({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex w-fit items-center gap-1.5 font-gsf text-sm font-medium text-ink-soft transition-colors hover:text-ink"
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
      {children}
    </button>
  );
}
