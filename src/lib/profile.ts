export function safeNotificationLink(link?: string | null) {
  return link &&
    link.startsWith("/") &&
    !link.startsWith("//") &&
    !link.includes("\\") &&
    ![...link].some((character) => character.charCodeAt(0) <= 32)
    ? link
    : "/profile";
}

export function validateAvatar(file: Pick<File, "size" | "type">) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "Choose a JPEG, PNG or WebP image.";
  return file.size > 5 * 1024 * 1024 ? "Choose an image no larger than 5 MB." : null;
}

export function validatePassword(current: string, password: string, confirmation: string) {
  if (!current) return "Enter your current password.";
  if (password.length < 8) return "Use at least 8 characters for your new password.";
  if (new TextEncoder().encode(password).length > 72)
    return "Use a password no longer than 72 bytes.";
  if (password === current) return "Choose a different password.";
  if (password !== confirmation) return "The new passwords do not match.";
  return null;
}
