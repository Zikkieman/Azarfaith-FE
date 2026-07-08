import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { useEffect } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import appCss from "../styles.css?url";
import { store } from "@/app/store";
import { Toaster } from "@/components/ui/sonner";
import { logout } from "@/features/auth/authSlice";
import { getProfile } from "@/features/catalog/api";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
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
      { name: "robots", content: "index,follow" },
      { name: "author", content: "AzarFaith" },
      { property: "og:site_name", content: "AzarFaith" },
      { property: "og:title", content: "AzarFaith" },
      {
        property: "og:description",
        content:
          "AzarFaith connects donors to churches, missionaries, orphanages, and faith-based schools across Nigeria.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.azarfaith.com" },
      {
        property: "og:image",
        content: "https://www.azarfaith.com/og-thumbnail.svg",
      },
      { property: "og:image:alt", content: "AzarFaith faith-based giving platform" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@AzarFaith" },
      { name: "twitter:title", content: "AzarFaith" },
      {
        name: "twitter:description",
        content:
          "AzarFaith connects donors to churches, missionaries, orphanages, and faith-based schools across Nigeria.",
      },
      {
        name: "twitter:image",
        content: "https://www.azarfaith.com/og-thumbnail.svg",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.azarfaith.com",
      },
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
    <html lang="en">
      <head>
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

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppRoot />
      </QueryClientProvider>
    </Provider>
  );
}

function AppRoot() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    void getProfile().catch((error: Error) => {
      if (cancelled) return;

      if (
        error.message === "Your session is no longer valid. Please log in again." ||
        error.message === "Authentication required."
      ) {
        dispatch(logout());
      }
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken, dispatch]);

  return (
    <>
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
