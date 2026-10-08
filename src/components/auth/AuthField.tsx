import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
  label: string;
  error?: string;
  containerClassName?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function AuthField({
  label,
  error,
  containerClassName,
  className,
  id,
  ...props
}: AuthFieldProps) {
  return (
    <div className={cn("flex w-full flex-col items-start gap-[2px]", containerClassName)}>
      <Label htmlFor={id} className="text-[14px] font-semibold leading-[26.25px] text-heading">
        {label}
      </Label>
      <Input
        id={id}
        className={cn(
          "h-auto rounded-[8px] border-line-input px-[12px] py-[8px] text-[14px] leading-[26.25px] shadow-[0px_1px_1px_rgba(16,24,40,0.05)]",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
