import type { ReactNode } from "react";

type SealProps = {
  width: number | string;
  height: number | string;
  icon: ReactNode;
  label: string;
  caption?: string;
  className?: string;
};

export function Seal({ width, height, icon, label, caption, className = "" }: SealProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 border border-line bg-panel-olive px-3 text-center ${className}`}
      style={{ width, height }}
    >
      {icon}
      <span className="font-gsf text-[11px] font-semibold uppercase leading-[14px] tracking-[0.12em] text-ink">
        {label}
      </span>
      {caption ? (
        <span className="font-gsf text-[12px] leading-[16px] text-ink-soft">{caption}</span>
      ) : null}
    </div>
  );
}
