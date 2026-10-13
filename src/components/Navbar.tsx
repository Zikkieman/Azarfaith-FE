import { AppNav } from "@/components/app/AppNav";
import { LandingDataProvider } from "@/components/landing/data";
import { SiteNav } from "@/components/landing/SiteNav";
import { useAppSelector } from "@/app/hooks";
import { useClientReady } from "@/lib/useClientReady";

/**
 * Compatibility bridge for routes that predate the designer navigation.
 * It intentionally renders no legacy UI: signed-in users get AppNav and visitors get SiteNav.
 */
export function Navbar({ workspace: _workspace = false }: { workspace?: boolean }) {
  const ready = useClientReady();
  const user = useAppSelector((state) => state.auth.user);

  if (ready && user) return <AppNav />;

  return (
    <LandingDataProvider>
      <SiteNav />
    </LandingDataProvider>
  );
}
