import logoMark from "@/assets/signup/logo-mark.svg";
import logoWordmark from "@/assets/signup/logo-wordmark.svg";

export function AuthLogo({ className }: { className?: string }) {
  return (
    <div className={className ?? "flex items-center gap-[3px]"}>
      <img src={logoMark} alt="" className="mt-[1px] h-[26px] w-[26px]" />
      <img src={logoWordmark} alt="AzarFaith" className="h-[23px] w-auto" />
    </div>
  );
}
