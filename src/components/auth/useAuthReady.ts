import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/hooks";

/** Keep SSR and first hydration identical; accept input only once session restoration finishes. */
export function useAuthReady() {
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && hydrated;
}
