import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { SocialButton } from "@/components/auth/SocialButton";
import googleIcon from "@/assets/signup/google-icon.svg";

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
  appearance = "default",
}: {
  onCredential: (credential: string) => void;
  disabled?: boolean;
  appearance?: "default" | "designer";
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
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
      const available = Math.max(
        200,
        Math.floor((wrapperRef.current ?? container).getBoundingClientRect().width),
      );
      const width = Math.min(400, available);
      if (appearance === "designer") {
        container.style.width = `${width}px`;
        container.style.transform = `scale(${available / width})`;
        container.style.transformOrigin = "center";
      }
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
        shape: appearance === "designer" ? "pill" : "rectangular",
        text: "continue_with",
        logo_alignment: appearance === "designer" ? "center" : "left",
        width,
      });
      renderedWidth = width;
    };
    const onError = () => {
      if (script) script.dataset.failed = "true";
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
    if (script.dataset.failed === "true") setFailed(true);
    const observer = new ResizeObserver(render);
    observer.observe(wrapperRef.current ?? container);
    render();
    return () => {
      mounted = false;
      observer.disconnect();
      script.removeEventListener("load", render);
      script.removeEventListener("error", onError);
      if (window.__azarfaithGoogleCallback === callback) delete window.__azarfaithGoogleCallback;
    };
  }, [clientId, appearance]);

  if (!clientId && appearance === "designer")
    return (
      <SocialButton
        disabled
        title="Google sign-in is unavailable. Continue with email."
        icon={<img src={googleIcon} alt="" className="h-5 w-5" />}
      >
        Continue with Google
      </SocialButton>
    );
  if (!clientId)
    return (
      <p className="text-center text-sm text-[#667085]">
        Google sign-in is unavailable. Continue with email below.
      </p>
    );
  return (
    <div className="w-full">
      <div
        ref={wrapperRef}
        className={
          appearance === "designer" ? "flex min-h-12 w-full items-center justify-center" : "w-full"
        }
      >
        <div
          ref={containerRef}
          aria-disabled={inactive}
          inert={inactive}
          className={`min-h-10 w-full ${inactive ? "pointer-events-none opacity-60" : ""}`}
        />
      </div>
      {failed && (
        <p role="status" className="mt-2 text-center text-sm text-[#667085]">
          Google sign-in couldn't load. Continue with email below.
        </p>
      )}
    </div>
  );
}
