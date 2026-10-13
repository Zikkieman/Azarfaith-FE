import type { ReactNode } from "react";
import { LandingDataProvider } from "@/components/landing/data";
import { Footer } from "@/components/landing/Footer";
import { SiteNav } from "@/components/landing/SiteNav";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <LandingDataProvider>
      <div className="designer-app min-h-screen bg-paper font-gsf text-heading">
        <SiteNav />
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-12 md:px-12 md:py-16">
          {children}
        </main>
        <Footer />
      </div>
    </LandingDataProvider>
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
