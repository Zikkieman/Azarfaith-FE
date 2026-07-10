import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, FileClock, FolderKanban } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageSpinner } from "@/components/PageSpinner";
import { getProfile, listOrganizationDrafts } from "@/features/catalog/api";
import { useRequireAuth } from "@/lib/useRequireAuth";

export const Route = createFileRoute("/manage")({
  component: ManageWorkspace,
});

function ManageWorkspace() {
  const isAuthed = useRequireAuth();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", "manage"],
    queryFn: getProfile,
    enabled: isAuthed,
  });
  const { data: drafts = [] } = useQuery({
    queryKey: ["organization-drafts"],
    queryFn: listOrganizationDrafts,
    enabled: isAuthed,
  });

  if (!isAuthed) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex-1 w-full max-w-4xl px-5 py-12 md:px-8">
          <PageSpinner label="Redirecting to login..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex-1 w-full max-w-4xl px-5 py-12 md:px-8">
          {isLoading ? <PageSpinner label="Loading workspace..." /> : null}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-4xl px-5 py-12 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Manage workspace</h1>
            <p className="mt-2 text-muted-foreground">
              One place to manage the organizations and campaigns you own.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register-org"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
            >
              Create organization
            </Link>
            <Link
              to="/create"
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Create campaign
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-5 md:col-span-2">
            <div className="flex items-center gap-2">
              <FileClock className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Saved drafts
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {drafts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No saved organization drafts yet.
                </div>
              ) : (
                drafts.map((draft) => (
                  <Link
                    key={draft.id}
                    to="/register-org"
                    search={{ draftId: draft.id }}
                    className="flex items-center justify-between rounded-2xl border border-border px-4 py-4 transition hover:border-amber-300"
                  >
                    <div>
                      <p className="text-sm font-medium">{draft.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Saved {new Date(draft.draftSavedAt).toLocaleDateString()} · {draft.hasMinimumSubmissionData ? "Ready to submit" : "Needs more details"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                      Continue <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Your organizations
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {profile.ownedOrganizations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No organizations yet. Create one to start collecting support under a verified profile.
                </div>
              ) : (
                profile.ownedOrganizations.map((organization) => (
                  <Link
                    key={organization.id}
                    to="/org/$id"
                    params={{ id: organization.id }}
                    className="flex items-center justify-between rounded-2xl border border-border px-4 py-4 transition hover:border-amber-300"
                  >
                    <div>
                      <p className="text-sm font-medium">{organization.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {organization.verificationStatus.replaceAll("_", " ")}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                Your campaigns
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {profile.ownedCampaigns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No campaigns yet. Start one for a ministry need, emergency, or ongoing support.
                </div>
              ) : (
                profile.ownedCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to="/campaign/$id"
                    params={{ id: campaign.id }}
                    className="flex items-center justify-between rounded-2xl border border-border px-4 py-4 transition hover:border-amber-300"
                  >
                    <div>
                      <p className="text-sm font-medium">{campaign.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {campaign.verificationStatus.replaceAll("_", " ")}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
