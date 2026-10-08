export type Card = {
  title: string;
  meta?: string;
  tag?: string;
  text?: string;
  href?: string;
};

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string; id?: string }
  | { type: "h3"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "callout"; title?: string; text: string }
  | { type: "quote"; text: string; by?: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "faq"; items: { q: string; a: string }[] }
  | { type: "cards"; items: Card[] };

export type PageCta = {
  heading: string;
  text?: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
};

export type PageTemplate = "legal" | "guide" | "cards" | "directory" | "handbook";

export type PageDoc = {
  slug: string;
  eyebrow: string;
  title: string;
  lead: string;
  template: PageTemplate;
  updated?: string;
  blocks: Block[];
  cta?: PageCta;
};
