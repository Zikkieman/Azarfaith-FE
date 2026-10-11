import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/app/hooks";

declare global {
  interface Window {
    __azarfaithGoogleClientId?: string;
    __azarfaithGoogleCallback?: (credential: string) => void;
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>,
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services";

export function GoogleSignInButton({
  onCredential,
  disabled = false,
}: {
  onCredential: (credential: string) => void;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const inactive = disabled || !mounted || !hydrated;
  const onCredentialRef = useRef(onCredential);
  const disabledRef = useRef(disabled);
  const [failed, setFailed] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    onCredentialRef.current = onCredential;
    disabledRef.current = inactive;
  }, [onCredential, inactive]);

  useEffect(() => {
    if (!clientId) return;
    const container = containerRef.current;
    if (!container) return;
    let mounted = true;
    let renderedWidth = 0;
    const callback = (credential: string) => {
      if (mounted && !disabledRef.current) onCredentialRef.current(credential);
    };
    window.__azarfaithGoogleCallback = callback;

    const render = () => {
      if (!mounted || !window.google?.accounts.id) return;
      // GIS accepts a numeric pixel width up to 400, not "100%".
      const width = Math.min(
        400,
        Math.max(200, Math.floor(container.getBoundingClientRect().width)),
      );
      if (width === renderedWidth) return;
      if (window.__azarfaithGoogleClientId !== clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            if (credential) window.__azarfaithGoogleCallback?.(credential);
          },
        });
        window.__azarfaithGoogleClientId = clientId;
      }
      container.replaceChildren();
      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width,
      });
      renderedWidth = width;
    };
    const onError = () => {
      if (mounted) setFailed(true);
    };
    let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    script.addEventListener("error", onError);
    const observer = new ResizeObserver(render);
    observer.observe(container);
    render();
    return () => {
      mounted = false;
      observer.disconnect();
      script.removeEventListener("load", render);
      script.removeEventListener("error", onError);
      if (window.__azarfaithGoogleCallback === callback) delete window.__azarfaithGoogleCallback;
    };
  }, [clientId]);

  if (!clientId)
    return (
      <p className="text-center text-sm text-[#667085]">
        Google sign-in is unavailable. Continue with email below.
      </p>
    );
  return (
    <div className="w-full">
      <div
        ref={containerRef}
        aria-disabled={inactive}
        inert={inactive}
        className={`min-h-10 w-full ${inactive ? "pointer-events-none opacity-60" : ""}`}
      />
      {failed && (
        <p role="status" className="mt-2 text-center text-sm text-[#667085]">
          Google sign-in couldn't load. Continue with email below.
        </p>
      )}
    </div>
  );
}
