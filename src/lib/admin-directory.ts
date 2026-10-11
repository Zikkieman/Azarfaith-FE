export type DirectoryEntity = "organization" | "campaign" | "user";
export type DirectoryRow = {
  id: string;
  name: string;
  detail: string;
  image: string | null;
  status: "pending" | "verified" | "unverified" | "rejected" | "active" | "suspended";
  category: string | null;
  mode: string | null;
  type: string | null;
  urgency: string | null;
  amount: number;
  count: number;
  createdAt: string;
  submittedAt: string | null;
  updatedAt: string;
  checks: number;
  emailVerified: boolean | null;
};
export type DirectoryPage = {
  items: DirectoryRow[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
export type BulkResult = {
  results: Array<{
    id: string;
    outcome: "applied" | "already_applied" | "failed";
    message: string;
  }>;
  applied: number;
  failed: number;
};
export function adminCsv(rows: Array<Array<string | number>>) {
  return (
    "\ufeff" +
    rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value);
            const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
            return `"${safe.replaceAll('"', '""')}"`;
          })
          .join(","),
      )
      .join("\r\n")
  );
}
export function downloadAdminCsv(filename: string, rows: Array<Array<string | number>>) {
  const url = URL.createObjectURL(new Blob([adminCsv(rows)], { type: "text/csv;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
