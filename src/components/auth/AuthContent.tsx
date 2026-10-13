import type { ButtonHTMLAttributes } from "react";
import { SocialButton } from "./SocialButton";
export { AuthHeading, AuthDivider } from "./AuthCard";

export function AuthButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <SocialButton variant="solid" type="submit" {...props}>
      {props.children}
    </SocialButton>
  );
}
export function AuthError({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="font-gsf text-[13px] text-danger">
      {message}
    </p>
  ) : null;
}
