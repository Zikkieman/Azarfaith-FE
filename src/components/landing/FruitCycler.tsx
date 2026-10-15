import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { faces, words } from "./fruit-words";

/**
 * Playful hero word: "See the ___." flicks through the fruits of giving, each in its own
 * typeface. To revert, replace <FruitCycler /> in HomeOpening with the word "fruit".
 */
const TICK_MS = 400;

export function FruitCycler() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [i, setI] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || hovered || !onScreen) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % words.length), TICK_MS);
    return () => window.clearInterval(t);
  }, [reduce, hovered, onScreen]);

  const index = reduce ? 0 : i;
  const face = faces[index % faces.length];
  const style: CSSProperties = {
    fontFamily: face.family,
    fontWeight: face.weight,
    fontStyle: face.italic ? "italic" : undefined,
    letterSpacing: face.family === "inherit" ? undefined : "-0.01em",
    color: face.accent ? "#FE5102" : undefined,
  };

  return (
    <span
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-block cursor-default"
    >
      <span className="sr-only">fruit</span>
      <span aria-hidden style={style} className="inline-block leading-[0.98]">
        {words[index]}
      </span>
    </span>
  );
}
