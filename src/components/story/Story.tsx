import { Link } from "@tanstack/react-router";
import { useReducedMotion } from "motion/react";
import logoMark from "@/assets/signup/logo-mark.svg";
import { Stage } from "./Stage";
import { StaticStory } from "./StaticStory";
import { StoryNav } from "./StoryNav";

export function Story() {
  const reduce = useReducedMotion();
  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-gsf text-heading">
      <StoryNav />
      <main>
        {reduce ? <StaticStory /> : <Stage />}

        <section className="flex flex-col items-center gap-6 px-6 py-32 text-center md:py-44">
          <img src={logoMark} alt="" className="h-14 w-14" />
          <h2 className="max-w-[900px] font-display text-[clamp(34px,4.8vw,76px)] leading-[1.04] tracking-[-0.015em] text-ink">
            Someone near you is already doing God&rsquo;s work.
          </h2>
          <p className="max-w-[560px] font-gsf text-lg leading-[1.5] text-ink-soft">
            Let AzarFaith help you find them, trust them, and see what your giving does.
          </p>
          <Link
            to="/signup"
            className="press inline-flex items-center rounded-full border-2 border-ink bg-ink px-6 py-3 font-gsf text-base font-medium text-ink-contrast hover:opacity-90"
          >
            Start giving
          </Link>
        </section>
      </main>

      <footer className="border-t border-line-soft px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 font-gsf text-[13px] text-muted-ink sm:flex-row">
          <p>© 2026 AzarFaith · Registered in Nigeria</p>
          <nav className="flex flex-wrap gap-5">
            <Link to="/$page" params={{ page: "terms" }} className="hover:text-ink">
              Terms
            </Link>
            <Link to="/$page" params={{ page: "privacy" }} className="hover:text-ink">
              Privacy
            </Link>
            <Link to="/$page" params={{ page: "verification" }} className="hover:text-ink">
              Verification
            </Link>
            <Link to="/" className="hover:text-ink">
              Main site
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
