import { useEffect, useRef, useState } from "react";

import googleIcon from "@/assets/signup/google-icon.svg";
import { SocialButton } from "@/components/auth/SocialButton";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const scriptId = "google-identity-services";

export function GoogleSignInButton({ onCredential, disabled = false }: { onCredential: (credential: string) => void; disabled?: boolean }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const callback = useRef(onCredential);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return;
    const initialize = () => {
      if (!window.google?.accounts.id) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }) => credential && callback.current(credential) });
      setReady(true);
    };
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", initialize);
    initialize();
    return () => script?.removeEventListener("load", initialize);
  }, [clientId]);

  return (
    <SocialButton type="button" disabled={disabled || !ready} title={clientId ? undefined : "Google sign-in is not configured."} icon={<img src={googleIcon} alt="" className="h-5 w-5" />} onClick={() => window.google?.accounts.id.prompt()}>
      Continue with Google
    </SocialButton>
  );
}
