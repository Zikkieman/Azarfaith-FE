import facebookIcon from "@/assets/signup/facebook-icon.svg";
import { SocialButton } from "./SocialButton";

export function UnavailableFacebook() {
  return (
    <SocialButton
      disabled
      title="Facebook sign-in is not connected yet. Use Google or email."
      aria-label="Continue with Facebook (unavailable)"
      icon={<img src={facebookIcon} alt="" className="h-5 w-5" />}
    >
      Continue with Facebook
    </SocialButton>
  );
}
