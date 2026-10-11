import { useEffect, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAppSelector } from "@/app/hooks";

export function AuthField({
  label,
  error,
  action,
  type,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  action?: ReactNode;
}) {
  const generatedId = useId();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const id = props.id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-[#130e30]">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <input
          {...props}
          disabled={props.disabled || !mounted || !hydrated}
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-12 w-full rounded-xl border bg-white px-4 text-[15px] outline-none transition focus:border-[#130e30] focus:ring-2 focus:ring-[#130e30]/10 disabled:opacity-60 ${isPassword ? "pr-12" : ""} ${error ? "border-red-500" : "border-[#d0d5dd]"}`}
        />
        {isPassword && (
          <button
            type="button"
            disabled={props.disabled || !mounted || !hydrated}
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#667085]"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
