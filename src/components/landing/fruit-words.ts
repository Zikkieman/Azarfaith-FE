/** Words and faces for the hero FruitCycler (homepage only). */
export const words = [
  "fruit",
  "harvest",
  "receipt",
  "impact",
  "roof",
  "beds",
  "meals",
  "Bibles",
  "wells",
  "smiles",
  "classroom",
  "clinic",
  "uniforms",
  "books",
  "medicine",
  "water",
  "light",
  "hope",
  "joy",
  "growth",
  "proof",
  "change",
  "progress",
  "difference",
  "blessing",
  "outreach",
  "mission",
  "school",
  "results",
  "future",
];

export type Face = { family: string; weight?: number; italic?: boolean; accent?: boolean };

/** Index 0 stays in the brand face so the resting word matches the rest of the headline. */
export const faces: Face[] = [
  { family: "inherit" },
  { family: "'Coustard', serif", weight: 900 },
  { family: "'Playfair Display', serif", weight: 800, italic: true, accent: true },
  { family: "'Space Mono', monospace", weight: 700 },
  { family: "'Pacifico', cursive", weight: 400, accent: true },
  { family: "'Bungee', sans-serif", weight: 400 },
  { family: "'Abril Fatface', serif", weight: 400 },
  { family: "'Caveat', cursive", weight: 700, accent: true },
  { family: "'Rubik Mono One', sans-serif", weight: 400 },
  { family: "'Shrikhand', cursive", weight: 400, accent: true },
  { family: "'Instrument Serif', serif", weight: 400, italic: true },
  { family: "'Unbounded', sans-serif", weight: 800 },
  { family: "'Bricolage Grotesque', sans-serif", weight: 800, accent: true },
];

const glyphs = [...new Set(words.join("").split(""))].sort().join("");

/** One small request: every face, trimmed to just the letters these words use. */
export const fruitFontsHref =
  "https://fonts.googleapis.com/css2?family=Coustard:wght@900&family=Playfair+Display:ital,wght@1,800&family=Space+Mono:wght@700&family=Pacifico&family=Bungee&family=Abril+Fatface&family=Caveat:wght@700&family=Rubik+Mono+One&family=Shrikhand&family=Instrument+Serif:ital@1&family=Unbounded:wght@800&family=Bricolage+Grotesque:wght@800&display=swap&text=" +
  encodeURIComponent(glyphs);
