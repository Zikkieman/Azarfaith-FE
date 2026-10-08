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
      className={`flex flex-col items-center justify-center gap-1.5 border border-[#D9DDBC] bg-[#F7F8F2] px-3 text-center ${className}`}
      style={{ width, height }}
    >
      {icon}
      <span className="font-gsf text-[11px] font-semibold uppercase leading-[14px] tracking-[0.12em] text-[#130E30]">
        {label}
      </span>
      {caption ? (
        <span className="font-gsf text-[12px] leading-[16px] text-[#4A4660]">{caption}</span>
      ) : null}
    </div>
  );
}
