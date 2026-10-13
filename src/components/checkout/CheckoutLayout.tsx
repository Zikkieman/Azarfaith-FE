import type { ReactNode } from "react";

export function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="designer-app checkout-layout min-h-screen bg-paper font-gsf text-heading">
      {children}
    </div>
  );
}
