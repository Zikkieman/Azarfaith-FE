import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { CircleCheck, LoaderCircle, ShieldCheck } from "lucide-react";

import { PublicShell } from "@/components/public/PublicShell";
import { apiFetch } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

type DeletionRequestResponse = {
  message: string;
  confirmationCode: string;
  statusUrl: string;
};

type DeletionStatusResponse = {
  confirmationCode: string;
  status: "received" | "completed";
  requestedAt: string;
  completedAt: string | null;
};

export const Route = createFileRoute("/data-deletion")({
  validateSearch: (search: Record<string, unknown>) => ({
    confirmation:
      typeof search.confirmation === "string" ? search.confirmation : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Request data deletion | AzarFaith" },
      {
        name: "description",
        content: "Request deletion of your AzarFaith account data.",
      },
    ],
  }),
  component: DataDeletion,
});

function DataDeletion() {
  const { confirmation } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState<DeletionRequestResponse | null>(null);
  const status = useQuery({
    queryKey: ["data-deletion-request", confirmation],
    queryFn: () => apiFetch<DeletionStatusResponse>(`/auth/data-deletion-requests/${confirmation}`),
    enabled: Boolean(confirmation),
    retry: false,
  });
  const request = useMutation({
    mutationFn: () =>
      apiFetch<DeletionRequestResponse>("/auth/data-deletion-requests", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    onSuccess: setSubmitted,
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    request.mutate();
  };

  const statusMessage = status.data
    ? status.data.status === "completed"
      ? "This Facebook deletion request has been completed."
      : "This deletion request has been received and is being processed."
    : null;

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl py-8 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-700">
          Your data
        </p>
        <h1 className="mt-4 font-display text-4xl md:text-6xl">Request data deletion</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
          You can ask us to delete your AzarFaith account and personal data. We retain only the
          minimum anonymized financial and audit records required for legal, accounting and fraud
          prevention obligations.
        </p>

        {status.isLoading ? (
          <div className="public-panel mt-10 flex items-center gap-3 p-6 text-ink-soft">
            <LoaderCircle className="h-5 w-5 animate-spin text-orange-600" /> Checking request status…
          </div>
        ) : statusMessage ? (
          <div className="public-panel mt-10 flex gap-3 border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-semibold">{statusMessage}</p>
              <p className="mt-1 text-sm text-emerald-900">
                Confirmation reference: {status.data?.confirmationCode}
              </p>
            </div>
          </div>
        ) : null}

        <section className="public-panel mt-10 p-6 md:p-8">
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-orange-600" />
            <div>
              <h2 className="text-xl font-semibold">Start a deletion request</h2>
              <p className="mt-2 leading-7 text-ink-soft">
                Enter the email address on your account. To protect accounts, we do not confirm
                whether an email is registered. We will verify ownership before processing a
                self-service request.
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
              <p className="font-semibold">Request received</p>
              <p className="mt-1 text-sm leading-6">{submitted.message}</p>
              <p className="mt-3 text-sm">
                Reference: <span className="font-medium">{submitted.confirmationCode}</span>
              </p>
            </div>
          ) : (
            <form className="mt-7" onSubmit={onSubmit}>
              <label className="block text-sm font-medium text-ink" htmlFor="deletion-email">
                Account email address
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  id="deletion-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-12 flex-1 rounded-xl border border-border bg-background px-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  placeholder="you@example.com"
                />
                <button className="public-button justify-center" disabled={request.isPending} type="submit">
                  {request.isPending ? "Submitting…" : "Request deletion"}
                </button>
              </div>
              {request.isError ? (
                <p className="mt-3 text-sm text-red-700" role="alert">
                  {getErrorMessage(request.error, "We could not submit your request. Try again.")}
                </p>
              ) : null}
            </form>
          )}
        </section>
      </div>
    </PublicShell>
  );
}
