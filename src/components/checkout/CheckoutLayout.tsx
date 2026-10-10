import { Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import logoMark from "@/assets/signup/logo-mark.svg";
import logoWordmark from "@/assets/signup/logo-wordmark.svg";

export function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="checkout-layout public-layout min-h-screen">
      <header className="checkout-header mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-6 md:px-10">
        <Link to="/" aria-label="AzarFaith home" className="flex shrink-0 items-center gap-1">
          <img src={logoMark} alt="" className="h-[26px] w-[26px]" />
          <img src={logoWordmark} alt="AzarFaith" className="h-[23px] w-auto" />
        </Link>
        <span className="flex items-center gap-2 text-xs text-[#686479]">
          <LockKeyhole size={14} />
          Secure checkout
        </span>
      </header>
      {children}
    </div>
  );
}
