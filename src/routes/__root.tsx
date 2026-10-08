import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { btnPrimary, btnSecondary } from "@/components/app/AppShell";

function StatusScreen({
  code,
  title,
  body,
  children,
}: {
  code?: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-6 text-center font-gsf">
      {code ? (
        <p className="font-display text-[clamp(56px,10vw,120px)] leading-none text-ink">{code}</p>
      ) : null}
      <h1 className="font-display text-[clamp(28px,2.78vw,40px)] leading-[1.14] tracking-[-0.03em] text-ink">
        {title}
      </h1>
      <p className="max-w-md text-base leading-[25.6px] text-ink-soft">{body}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <StatusScreen
      code="404"
      title="Page not found"
      body="The page you're looking for doesn't exist or has been moved."
    >
      <Link to="/" className={btnPrimary}>
        Go home
      </Link>
      <Link to="/discover" className={btnSecondary}>
        Browse causes
      </Link>
    </StatusScreen>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <StatusScreen
      title="This page didn't load"
      body="Something went wrong on our end. You can try again or head back home."
    >
      <button
        type="button"
        onClick={() => {
          router.invalidate();
          reset();
        }}
        className={btnPrimary}
      >
        Try again
      </button>
      <a href="/" className={btnSecondary}>
        Go home
      </a>
    </StatusScreen>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AzarFaith" },
      {
        name: "description",
        content:
          "AzarFaith connects donors to churches, missionaries, orphanages, and faith-based schools across Nigeria.",
      },
      { name: "author", content: "AzarFaith" },
      { property: "og:title", content: "AzarFaith" },
      {
        property: "og:description",
        content:
          "AzarFaith connects donors to churches, missionaries, orphanages, and faith-based schools across Nigeria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@AzarFaith" },
      { name: "twitter:title", content: "AzarFaith" },
      {
        name: "twitter:description",
        content:
          "AzarFaith connects donors to churches, missionaries, orphanages, and faith-based schools across Nigeria.",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            // Reveal animations only hide content while JS runs. If the app never hydrates
            // (blocked or failed bundle), drop the flag after 8s so everything shows.
            __html:
              "var d=document.documentElement;d.classList.add('js');setTimeout(function(){if(!d.classList.contains('hydrated'))d.classList.remove('js')},8000)",
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => document.documentElement.classList.add("hydrated"), []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
