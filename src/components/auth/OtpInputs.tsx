import { useEffect, useId, useRef } from "react";
import { useAuthReady } from "./useAuthReady";

export function OtpInputs({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  error?: string;
}) {
  const id = useId();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const ready = useAuthReady();
  const focused = useRef(false);
  useEffect(() => {
    if (ready && !disabled && !focused.current) {
      inputs.current[0]?.focus();
      focused.current = true;
    }
  }, [ready, disabled]);
  return (
    <div>
      <div className="flex h-16 w-full max-w-[312px] items-center gap-3">
        {value.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            id={`${id}-${i}`}
            value={digit}
            maxLength={1}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            disabled={disabled || !ready}
            onChange={(event) => {
              const char = event.target.value.replace(/\D/g, "").slice(-1);
              const next = [...value];
              next[i] = char;
              onChange(next);
              if (char && i < value.length - 1) inputs.current[i + 1]?.focus();
            }}
            onPaste={(event) => {
              const digits = event.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, value.length - i);
              if (!digits) return;
              event.preventDefault();
              const next = [...value];
              [...digits].forEach((digit, index) => {
                next[i + index] = digit;
              });
              onChange(next);
              inputs.current[Math.min(value.length - 1, i + digits.length)]?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !value[i] && i > 0) inputs.current[i - 1]?.focus();
              if (event.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
              if (event.key === "ArrowRight" && i < value.length - 1)
                inputs.current[i + 1]?.focus();
            }}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="h-full w-0 min-w-0 flex-1 rounded-field border border-line-input bg-paper text-center font-display text-2xl text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 font-gsf text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
