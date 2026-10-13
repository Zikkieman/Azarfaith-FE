import { LandingDataProvider } from "@/components/landing/data";
import { Footer as LandingFooter } from "@/components/landing/Footer";

/** Legacy import bridge that now renders the designer footer exclusively. */
export function Footer() {
  return (
    <LandingDataProvider>
      <LandingFooter />
    </LandingDataProvider>
  );
}
