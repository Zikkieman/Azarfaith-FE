import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthReady } from "./useAuthReady";

const labelClass = "font-gsf text-sm font-semibold leading-[21px] text-ink";
const inputClass =
  "w-full rounded-field border border-line-input bg-paper px-3.5 py-3 font-gsf text-[15px] leading-6 text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink";
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
  type,
  disabled,
  ...props
}: AuthFieldProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const ready = useAuthReady();
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <div className="relative flex">
        <input
          {...props}
          id={inputId}
          type={password && visible ? "text" : type}
          disabled={disabled || !ready}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(inputClass, error && "border-danger", password && "pr-12", className)}
        />
        {password && (
          <button
            type="button"
            disabled={disabled || !ready}
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-ink"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p role="alert" id={`${inputId}-error`} className="font-gsf text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
