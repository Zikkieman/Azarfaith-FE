import { createFileRoute, Link, notFound, type SearchSchemaInput } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppSelector } from "@/app/hooks";
import { PageSpinner } from "@/components/PageSpinner";
import { CatalogError } from "@/components/public/PublicShell";
import { CheckoutLayout } from "@/components/checkout/CheckoutLayout";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PaymentResult } from "@/components/checkout/PaymentResult";
import { getCampaign, getCheckoutContext, verifyDonation } from "@/features/catalog/api";
import { ApiError } from "@/lib/api";
import { useClientReady } from "@/lib/useClientReady";

export const Route = createFileRoute("/donate/$id")({
  validateSearch: (
    search: SearchSchemaInput & {
      freq?: string;
      reference?: string;
      trxref?: string;
      amount?: string | number;
      recurringGiftId?: string;
    },
  ) => ({
    freq: typeof search.freq === "string" ? search.freq : "once",
    reference: typeof search.reference === "string" ? search.reference : "",
    trxref: typeof search.trxref === "string" ? search.trxref : "",
    amount:
      typeof search.amount === "string" || typeof search.amount === "number"
        ? String(search.amount)
        : "",
    recurringGiftId: typeof search.recurringGiftId === "string" ? search.recurringGiftId : "",
  }),
  component: Donate,
});

function Donate() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const { user, hydrated } = useAppSelector((state) => state.auth);
  const ready = useClientReady() && hydrated;
  const queryClient = useQueryClient();
  const reference = search.reference || search.trxref;
  const campaign = useQuery({
    queryKey: ["campaign", id, user?.id ?? "guest"],
    queryFn: () => getCampaign(id),
    enabled: ready && !reference,
    retry: false,
  });
  const checkout = useQuery({
    queryKey: ["checkout", id, user?.id ?? "guest", search.recurringGiftId],
    queryFn: () => getCheckoutContext(id, search.recurringGiftId || undefined),
    enabled: ready && !reference,
    retry: false,
  });
  const verification = useQuery({
    queryKey: ["payment-verification", id, reference],
    queryFn: () => verifyDonation(id, reference),
    enabled: ready && Boolean(reference),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (verification.data?.status !== "success") return;
    for (const key of [
      "campaign",
      "campaigns",
      "organizations",
      "donations",
      "donation-detail",
      "profile",
      "recurring-gifts",
      "payment-methods",
      "dashboard",
      "notifications",
      "payout-summary",
    ]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  }, [verification.data, queryClient]);

  if (!ready)
    return (
      <CheckoutLayout>
        <PageSpinner label="Preparing checkout..." />
      </CheckoutLayout>
    );
  // The callback must remain verifiable even if the campaign is no longer public.
  if (reference)
    return (
      <CheckoutLayout>
        <PaymentResult
          id={id}
          result={verification.data}
          error={verification.error}
          loading={verification.isFetching}
          retry={() => {
            void verification.refetch();
          }}
          signedIn={Boolean(user)}
        />
      </CheckoutLayout>
    );
  const error = campaign.error ?? checkout.error;
  if (checkout.error instanceof ApiError && [401, 403].includes(checkout.error.status)) {
    return (
      <CheckoutLayout>
        <main className="mx-auto max-w-xl px-5 py-14 text-center">
          <h1 className="text-2xl font-semibold">Sign in to continue</h1>
          <p className="mt-4 text-sm text-[#686479]">
            Please sign in, then reopen your donation or reminder link. Recurring gifts are tied to
            your account.
          </p>
          <Link to="/login" className="public-button mt-6">
            Log in
          </Link>
        </main>
      </CheckoutLayout>
    );
  }
  if (error instanceof ApiError && error.status === 404) throw notFound();
  if (error)
    return (
      <CheckoutLayout>
        <div className="mx-auto max-w-xl px-5 py-12">
          <CatalogError
            retry={() => {
              void campaign.refetch();
              void checkout.refetch();
            }}
          />
        </div>
      </CheckoutLayout>
    );
  if (!campaign.data || !checkout.data)
    return (
      <CheckoutLayout>
        <PageSpinner label="Preparing checkout..." />
      </CheckoutLayout>
    );
  return (
    <CheckoutLayout>
      <CheckoutForm
        key={`${id}:${user?.id ?? "guest"}:${search.recurringGiftId}`}
        campaign={campaign.data}
        context={checkout.data}
        search={search}
        user={user}
      />
    </CheckoutLayout>
  );
}
