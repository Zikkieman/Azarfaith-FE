export function OtpInputs({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex h-16 w-full max-w-[312px] items-center gap-3">
      {value.map((digit, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          value={digit}
          maxLength={1}
          inputMode="numeric"
          autoFocus={i === 0}
          disabled={disabled}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, "").slice(-1);
            const next = [...value];
            next[i] = char;
            onChange(next);
            if (char && i < value.length - 1) {
              document.getElementById(`otp-${i + 1}`)?.focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) {
              document.getElementById(`otp-${i - 1}`)?.focus();
            }
          }}
          aria-label={`Digit ${i + 1}`}
          className="h-full w-0 min-w-0 flex-1 rounded-field border border-line-input bg-paper text-center font-display text-2xl text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
        />
      ))}
    </div>
  );
}
