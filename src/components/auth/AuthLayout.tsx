import { Link } from "@tanstack/react-router";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { TestimonialPanel } from "@/components/auth/TestimonialPanel";
import backgroundIllustration from "@/assets/signup/background.svg";

/** Shared frame for signup, login and password reset (Figma signup redesign). */
export function AuthLayout({
  prompt,
  linkLabel,
  linkTo,
  children,
}: {
  prompt: string;
  linkLabel: string;
  linkTo: "/login" | "/signup";
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-paper font-gsf">
      <img
        src={backgroundIllustration}
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
      />

      <header className="mx-auto flex max-w-6xl flex-col items-start gap-1 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-8 sm:py-6">
        <Link to="/">
          <AuthLogo />
        </Link>
        <p className="text-[14px] leading-6 text-heading sm:text-[16px] sm:leading-[35px]">
          {prompt}{" "}
          <Link to={linkTo} className="font-bold underline underline-offset-2">
            {linkLabel}
          </Link>
        </p>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center gap-[45px] px-6 pb-16 pt-4 sm:px-8 sm:pt-6 lg:flex-row lg:items-start lg:justify-center">
        {children}
        <TestimonialPanel />
      </main>
    </div>
  );
}
