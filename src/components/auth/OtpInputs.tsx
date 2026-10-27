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
    <div className="flex h-16 w-full max-w-[420px] items-center gap-2 sm:gap-3">
      {value.map((digit, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          value={digit}
          maxLength={1}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
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
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, value.length);
            if (!pasted) return;
            event.preventDefault();
            const next = Array.from({ length: value.length }, (_, index) => pasted[index] ?? "");
            onChange(next);
            document.getElementById(`otp-${Math.min(pasted.length, value.length) - 1}`)?.focus();
          }}
          aria-label={`Digit ${i + 1}`}
          className="h-full w-0 min-w-0 flex-1 rounded-field border border-line-input bg-paper text-center font-display text-2xl text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
        />
      ))}
    </div>
  );
}
