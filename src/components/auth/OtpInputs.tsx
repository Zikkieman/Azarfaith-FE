export function OtpInputs({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex h-[84px] w-full max-w-[312px] items-center gap-[11px]">
      {value.map((digit, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          value={digit}
          maxLength={1}
          inputMode="numeric"
          autoFocus={i === 0}
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
          className="font-display h-full flex-1 rounded-[8px] border border-[#d0d5dd] text-center text-2xl shadow-[0px_1px_1px_rgba(16,24,40,0.05)] focus:outline-none focus:ring-1 focus:ring-ring"
        />
      ))}
    </div>
  );
}
