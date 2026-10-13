import { SiteNav } from "@/components/landing/SiteNav";
import { HomeOpening } from "@/components/landing/HomeOpening";
import { OpenGivingSection } from "@/components/map/OpenGiving";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturePanel } from "@/components/landing/FeaturePanel";
import { PhotoCollage } from "@/components/landing/PhotoCollage";
import { Testimonial } from "@/components/landing/Testimonial";
import { Campaigns } from "@/components/landing/Campaigns";
import { Faq } from "@/components/landing/Faq";
import { Cta } from "@/components/landing/Cta";
import { Footer } from "@/components/landing/Footer";

import { LandingDataProvider } from "./data";

export function LandingPage() {
  return (
    <LandingDataProvider>
      <div className="designer-landing min-h-screen overflow-x-clip bg-paper font-gsf text-heading">
        <SiteNav revealOnScroll />
        <HomeOpening />
        <OpenGivingSection className="pt-20 md:pt-28" />
        <HowItWorks />
        <FeaturePanel />
        <PhotoCollage />
        <Testimonial />
        <Campaigns />
        <Faq />
        <Cta />
        <Footer />
      </div>
    </LandingDataProvider>
  );
}
