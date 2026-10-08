import type { PageDoc } from "@/components/pages/types";
import { legalPages } from "@/content/legal";
import { trustPages } from "@/content/trust";
import { givingPages } from "@/content/giving";
import { orgPages } from "@/content/org";
import { companyPages } from "@/content/company";

export const allPages: PageDoc[] = [
  ...legalPages,
  ...trustPages,
  ...givingPages,
  ...orgPages,
  ...companyPages,
];

export const pageMap: Record<string, PageDoc> = Object.fromEntries(
  allPages.map((page) => [page.slug, page]),
);
