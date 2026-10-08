import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
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
  }),
  component: AzarFaithLanding,
});

function AzarFaithLanding() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-gsf text-[#232323]">
      <Nav />
      <Hero />
      <Stats />
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
