import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __azarfaithGoogleInitialized?: boolean;
  }
  interface Window {
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

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
  disabled?: boolean;
};

export function GoogleSignInButton({
  onCredential,
  disabled = false,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId || disabled) return;

    const render = () => {
      const container = containerRef.current;
      if (!container || !window.google?.accounts.id) return;

      const width = Math.max(Math.round(container.getBoundingClientRect().width), 240);

      container.innerHTML = "";
      if (!window.__azarfaithGoogleInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            if (credential) {
              onCredentialRef.current(credential);
            }
          },
        });
        window.__azarfaithGoogleInitialized = true;
      }

      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width,
      });
    };

    const existingScript = document.getElementById(
      GOOGLE_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (window.google?.accounts.id) {
      render();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", render);
      return () => existingScript.removeEventListener("load", render);
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", render);
    document.head.appendChild(script);

    return () => script.removeEventListener("load", render);
  }, [clientId, disabled]);

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3.5 rounded-xl bg-card border border-border font-medium flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
      >
        Google sign-in not configured
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full [&>div]:w-full ${disabled ? "pointer-events-none opacity-60" : ""}`}
    />
  );
}
