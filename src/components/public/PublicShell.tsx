import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useClientReady } from "@/lib/useClientReady";

export function PublicShell({ children }: { children: ReactNode }) {
  const ready = useClientReady();
  return (
    <div className="public-layout min-h-screen">
      {ready && <Navbar workspace />}
      <main className="mx-auto max-w-[1280px] px-5 py-8 md:px-10 md:py-12">{children}</main>
      {ready && <Footer />}
    </div>
  );
}

export function CatalogError({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="public-panel px-6 py-12 text-center">
      <h2 className="text-xl font-semibold">We couldn't load this right now</h2>
      <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
      <button className="public-button mt-5" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
