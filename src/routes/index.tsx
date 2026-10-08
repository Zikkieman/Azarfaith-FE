import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/landing/SiteNav";
import { HomeOpening } from "@/components/landing/HomeOpening";
import { fruitFontsHref } from "@/components/landing/fruit-words";
import { OpenGivingSection } from "@/components/map/OpenGiving";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturePanel } from "@/components/landing/FeaturePanel";
import { YellowPanel } from "@/components/landing/YellowPanel";
import { Testimonial } from "@/components/landing/Testimonial";
import { Campaigns } from "@/components/landing/Campaigns";
import { Faq } from "@/components/landing/Faq";
import { Cta } from "@/components/landing/Cta";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AzarFaith — Give to those doing God's work in Nigeria" },
      {
        name: "description",
        content:
          "Support churches, missionaries, orphanages and faith-based schools in Nigeria. Give once or set up a standing order.",
      },
    ],
    // Display faces for the hero's cycling word, subset to its letters (homepage only).
    links: [
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: fruitFontsHref },
    ],
  }),
  component: AzarFaithLanding,
});

function AzarFaithLanding() {
  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-gsf text-heading">
      <SiteNav revealOnScroll />
      <HomeOpening />
      <OpenGivingSection className="pt-20 md:pt-28" />
      <HowItWorks />
      <FeaturePanel />
      <YellowPanel />
      <Testimonial />
      <Campaigns />
      <Faq />
      <Cta />
      <Footer />
    </div>
  );
}
