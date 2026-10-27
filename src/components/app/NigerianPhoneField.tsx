import { useId, type ReactNode } from "react";
import { FieldError, inputClass, labelClass } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";

const NIGERIAN_PREFIX = "+234";

/** Converts a saved E.164 value into the local ten digits shown beside the fixed prefix. */
function localNumber(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("234")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function normalizeNigerianPhone(value: string) {
  const local = localNumber(value);
  return local ? `${NIGERIAN_PREFIX}${local}` : "";
}

export function isNigerianPhone(value: string) {
  return /^\+234\d{10}$/.test(value);
}

/**
 * Nigerian numbers are stored as E.164 (+234xxxxxxxxxx), while people type only
 * their familiar local number. The country prefix is intentionally not editable.
 */
export function NigerianPhoneField({
  value,
  onChange,
  label = "Phone number",
  id,
  error,
  description,
  disabled,
  required,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  error?: string;
  description?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className={labelClass}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <div
        className={cn(
          "flex overflow-hidden rounded-field border border-line-input bg-paper focus-within:border-ink focus-within:ring-1 focus-within:ring-ink",
          error && "border-danger",
        )}
      >
        <span className="flex shrink-0 items-center border-r border-line-input bg-panel px-3.5 font-gsf text-[15px] font-medium leading-6 text-ink">
          {NIGERIAN_PREFIX}
        </span>
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          aria-invalid={error ? true : undefined}
          aria-describedby={description || error ? `${inputId}-help` : undefined}
          disabled={disabled}
          placeholder="801 234 5678"
          value={localNumber(value)}
          onChange={(event) => onChange(normalizeNigerianPhone(event.target.value))}
          className={cn(
            inputClass,
            "rounded-none border-0 bg-transparent focus:border-0 focus:ring-0",
          )}
        />
      </div>
      {description ? (
        <p id={`${inputId}-help`} className="text-[12px] leading-relaxed text-muted-ink">
          {description}
        </p>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}
