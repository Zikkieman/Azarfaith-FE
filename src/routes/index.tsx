import { useEffect, useRef } from "react";
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
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rows = [...el.children].map((c) => ({
      tag: c.tagName,
      cls: (c.className || "").toString().slice(0, 30),
      top: Math.round(c.getBoundingClientRect().top + window.scrollY),
      h: Math.round(c.getBoundingClientRect().height),
      kids: [...c.children].map((k) => ({
        cls: (k.className || "").toString().slice(0, 26),
        h: Math.round(k.getBoundingClientRect().height),
        gk: [...k.children].map((g) => ({
          cls: (g.className || "").toString().slice(0, 24),
          h: Math.round(g.getBoundingClientRect().height),
        })),
      })),
    }));
    document.title = JSON.stringify({ total: el.scrollHeight, rows });
  }, []);
  return (
    <div ref={ref} className="min-h-screen overflow-x-hidden bg-white font-gsf text-[#232323]">
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
