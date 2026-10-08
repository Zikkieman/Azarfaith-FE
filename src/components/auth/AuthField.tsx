import { useId } from "react";
import { FieldError, inputClass, labelClass } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
  label: string;
  error?: string;
  containerClassName?: string;
} & React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> };

/** Labelled input built from the app kit, so auth forms match every other form. */
export function AuthField({
  label,
  error,
  containerClassName,
  className,
  id,
  ...props
}: AuthFieldProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(inputClass, error && "border-danger", className)}
        {...props}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}
