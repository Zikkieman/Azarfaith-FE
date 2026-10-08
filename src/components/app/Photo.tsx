import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Image that shows a shimmering placeholder until it has loaded, then fades in.
 * `className` sizes the frame; `imgClassName` styles the image inside it.
 */
export function Photo({
  className,
  imgClassName,
  alt = "",
  ...img
}: ImgHTMLAttributes<HTMLImageElement> & { imgClassName?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // An image that finished before hydration never fires onLoad.
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <div className={cn("relative overflow-hidden", !loaded && "skeleton", className)}>
      <img
        ref={ref}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        {...img}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
      />
    </div>
  );
}
