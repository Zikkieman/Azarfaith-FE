import { useState } from "react";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserAvatar({
  src,
  name,
  label = "Profile photo",
  className,
}: {
  src?: string | null;
  name?: string | null;
  label?: string;
  className?: string;
}) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials = [words[0], words.length > 1 ? words.at(-1) : undefined]
    .filter(Boolean)
    .map((word) => Array.from(word!)[0])
    .join("")
    .toUpperCase();
  const source = src?.trim();
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "relative inline-grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eee8ff] text-xl font-semibold",
        className,
      )}
    >
      <span aria-hidden="true" className="inline-grid h-full w-full place-items-center">
        {initials || <UserRound className="h-1/2 w-1/2" />}
      </span>
      {source && <AvatarPhoto key={source} src={source} />}
    </span>
  );
}

function AvatarPhoto({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      className={cn("absolute inset-0 h-full w-full object-cover", !loaded && "invisible")}
      onLoad={(event) => {
        if (event.currentTarget.naturalWidth > 0) setLoaded(true);
        else setFailed(true);
      }}
      onError={() => setFailed(true)}
    />
  );
}
