import facebookIcon from "@/assets/signup/facebook-icon.svg";
import { API_BASE_URL } from "@/lib/api";
import { SocialButton } from "./SocialButton";

export function FacebookSignInButton({ disabled }: { disabled?: boolean }) {
  return (
    <SocialButton
      disabled={disabled}
      aria-label="Continue with Facebook"
      icon={<img src={facebookIcon} alt="" className="h-5 w-5" />}
      onClick={() => window.location.assign(`${API_BASE_URL}/auth/facebook/start`)}
    >
      Continue with Facebook
    </SocialButton>
  );
}
