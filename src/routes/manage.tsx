import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Link2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { AppShell, Container, PageHeader, Tag } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import {
  ManagementEmpty,
  ManagementError,
  ManagementLoading,
  ManagementPanel,
} from "@/components/app/ManagementParts";
import { PageSpinner } from "@/components/PageSpinner";
import { useCreationSession } from "@/components/creation/useCreationSession";
import {
  deleteCampaignDraft,
  deleteOrganizationDraft,
  getProfile,
  listCampaignDrafts,
  listOrganizationDrafts,
} from "@/features/catalog/api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/manage")({
  component: ManageWorkspace,
  head: () => ({
    meta: [
      { title: "Your causes and drafts - AzarFaith" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
function ManageWorkspace() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // Child organization dashboards must not depend on workspace list requests succeeding.
  return pathname.replace(/\/$/, "") === "/manage" ? <Workspace /> : <Outlet />;
}
function retryRead(attempt: number, error: Error) {
  return !(error instanceof ApiError && [401, 403, 404].includes(error.status)) && attempt < 1;
}
function Workspace() {
  const { ready, userId } = useCreationSession();
  const profile = useQuery({
    queryKey: ["profile", userId],
    queryFn: getProfile,
    enabled: ready,
    retry: retryRead,
  });
  const orgDrafts = useQuery({
    queryKey: ["organization-drafts", userId],
    queryFn: listOrganizationDrafts,
    enabled: ready,
    retry: retryRead,
  });
  const campaignDrafts = useQuery({
    queryKey: ["campaign-drafts", userId],
    queryFn: listCampaignDrafts,
    enabled: ready,
    retry: retryRead,
  });
  useCreationSession(profile.error || orgDrafts.error || campaignDrafts.error);
  if (!ready) return <PageSpinner label="Checking your session..." />;
  return (
    <AppShell>
      <PageHeader
        title="Your causes and drafts"
        lead="Manage your organizations and campaigns, or pick up where you left off."
        actions={
          <>
            <Link to="/register-org" className={btn("secondary")}>
              <Plus className="h-4 w-4" strokeWidth={2} /> Organization
            </Link>
            <Link to="/create" className={btn("primary")}>
              <Plus className="h-4 w-4" strokeWidth={2} /> Campaign
            </Link>
          </>
        }
      />
      <Container className="grid items-start gap-6 py-10 md:py-12 lg:grid-cols-2">
        <ManagementPanel title="Your organizations">
          {profile.isPending ? (
            <ManagementLoading />
          ) : (
            <>
              {profile.isError && (
                <ManagementError
                  message={profile.error.message || "Could not load your organizations."}
                  retry={() => void profile.refetch()}
                  pending={profile.isFetching}
                />
              )}
              {profile.data && (
                <>
                  {!profile.data.ownedOrganizations.length && (
                    <ManagementEmpty>
                      No organizations yet. Register one to introduce your ministry.
                    </ManagementEmpty>
                  )}
                  <ul className="divide-y divide-line-soft">
                    {profile.data.ownedOrganizations.map((org) => (
                      <CauseRow
                        key={org.id}
                        title={org.name}
                        status={
                          org.reviewAction === "rejected"
                            ? "Rejected"
                            : org.reviewAction === "more_info_requested"
                              ? "More information needed"
                              : org.verificationStatus === "pending"
                                ? "In review"
                                : org.verificationStatus === "verified"
                                  ? "Verified"
                                  : "Not verified"
                        }
                        publicPath={`/org/${encodeURIComponent(org.id)}`}
                        published={
                          org.verificationStatus === "verified" &&
                          !["rejected", "more_info_requested"].includes(org.reviewAction ?? "")
                        }
                        open={
                          <Link
                            to="/manage/org/$id"
                            params={{ id: org.id }}
                            className={btn("secondary", "sm")}
                          >
                            Manage <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </Link>
                        }
                      />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </ManagementPanel>
        <ManagementPanel title="Your campaigns">
          {profile.isPending ? (
            <ManagementLoading />
          ) : (
            <>
              {profile.isError && (
                <ManagementError
                  message={profile.error.message || "Could not load your campaigns."}
                  retry={() => void profile.refetch()}
                  pending={profile.isFetching}
                />
              )}
              {profile.data && (
                <>
                  {!profile.data.ownedCampaigns.length && (
                    <ManagementEmpty>
                      No campaigns yet. Create one for your next need or ongoing work.
                    </ManagementEmpty>
                  )}
                  <ul className="divide-y divide-line-soft">
                    {profile.data.ownedCampaigns.map((campaign) => (
                      <CauseRow
                        key={campaign.id}
                        title={campaign.title}
                        status={
                          campaign.reviewAction === "rejected"
                            ? "Rejected"
                            : campaign.reviewAction === "changes_requested"
                              ? "Changes requested"
                              : campaign.isPublic === true &&
                                  campaign.verificationStatus === "verified"
                                ? "Live"
                                : campaign.verificationStatus === "pending"
                                  ? "In review"
                                  : "Not published"
                        }
                        publicPath={`/campaign/${encodeURIComponent(campaign.id)}`}
                        published={
                          campaign.isPublic === true &&
                          campaign.verificationStatus === "verified" &&
                          !["rejected", "changes_requested"].includes(campaign.reviewAction ?? "")
                        }
                        open={
                          <Link
                            to="/campaign/$id"
                            params={{ id: campaign.id }}
                            className={btn("secondary", "sm")}
                          >
                            Manage <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </Link>
                        }
                      />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </ManagementPanel>
        <ManagementPanel title="Organization drafts">
          {orgDrafts.isPending ? (
            <ManagementLoading />
          ) : (
            <>
              {orgDrafts.isError && (
                <ManagementError
                  message={orgDrafts.error.message || "Could not load your organization drafts."}
                  retry={() => void orgDrafts.refetch()}
                  pending={orgDrafts.isFetching}
                />
              )}
              {orgDrafts.data && (
                <>
                  {!orgDrafts.data.length && (
                    <ManagementEmpty>No saved organization drafts yet.</ManagementEmpty>
                  )}
                  <ul className="divide-y divide-line-soft">
                    {orgDrafts.data.map((draft) => (
                      <DraftRow key={draft.id} title={draft.name} savedAt={draft.draftSavedAt}>
                        <DraftActions id={draft.id} kind="organization" />
                      </DraftRow>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </ManagementPanel>
        <ManagementPanel title="Campaign drafts">
          {campaignDrafts.isPending ? (
            <ManagementLoading />
          ) : (
            <>
              {campaignDrafts.isError && (
                <ManagementError
                  message={campaignDrafts.error.message || "Could not load your campaign drafts."}
                  retry={() => void campaignDrafts.refetch()}
                  pending={campaignDrafts.isFetching}
                />
              )}
              {campaignDrafts.data && (
                <>
                  {!campaignDrafts.data.length && (
                    <ManagementEmpty>No saved campaign drafts yet.</ManagementEmpty>
                  )}
                  <ul className="divide-y divide-line-soft">
                    {campaignDrafts.data.map((draft) => (
                      <DraftRow key={draft.id} title={draft.title} savedAt={draft.draftSavedAt}>
                        <DraftActions id={draft.id} kind="campaign" />
                      </DraftRow>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </ManagementPanel>
      </Container>
    </AppShell>
  );
}
function DraftActions({ id, kind }: { id: string; kind: "organization" | "campaign" }) {
  const queryClient = useQueryClient();
  const label = kind === "organization" ? "organization" : "campaign";
  const remove = useMutation({
    mutationFn: () => (kind === "organization" ? deleteOrganizationDraft(id) : deleteCampaignDraft(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [kind === "organization" ? "organization-drafts" : "campaign-drafts"],
      });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`${label[0].toUpperCase()}${label.slice(1)} draft deleted.`);
    },
    onError: (error: Error) => toast.error(error.message || `Could not delete this ${label} draft.`),
  });
  const confirmDelete = () => {
    if (window.confirm(`Delete this ${label} draft? This cannot be undone.`)) remove.mutate();
  };
  return (
    <>
      {kind === "organization" ? (
        <Link to="/register-org" search={{ draftId: id }} className={btn("secondary", "sm")}>
          Continue <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      ) : (
        <Link to="/create" search={{ draftId: id }} className={btn("secondary", "sm")}>
          Continue <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      )}
      <button
        type="button"
        className={btn("secondary", "sm")}
        onClick={confirmDelete}
        disabled={remove.isPending}
        aria-label={`Delete ${label} draft`}
        title={`Delete ${label} draft`}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </>
  );
}
function DraftRow({
  title,
  savedAt,
  children,
}: {
  title: string;
  savedAt: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <h3 className="break-words text-sm font-medium text-ink [overflow-wrap:anywhere]">
          {title}
        </h3>
        <p className="mt-1 text-[12px] text-muted-ink">
          Saved <time dateTime={savedAt}>{new Date(savedAt).toLocaleDateString("en-NG")}</time>
        </p>
      </div>
      <div className="flex shrink-0">{children}</div>
    </li>
  );
}
function CauseRow({
  title,
  status,
  publicPath,
  published,
  open,
}: {
  title: string;
  status: string;
  publicPath: string;
  published: boolean;
  open: ReactNode;
}) {
  const url = typeof window !== "undefined" ? `${window.location.origin}${publicPath}` : publicPath;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Public donation link copied.");
    } catch {
      toast.error("Could not copy the link. Open the preview and copy its address.");
    }
  };
  return (
    <li className="flex flex-col gap-3 px-5 py-4">
      <div className="flex min-w-0 flex-col items-start gap-2">
        <h3 className="break-words text-sm font-medium text-ink [overflow-wrap:anywhere]">
          {title}
        </h3>
        <Tag tone={published ? "verified" : "attention"}>{status}</Tag>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {open}
        <a href={url} className={btn("secondary", "sm")} target="_blank" rel="noreferrer">
          Preview
        </a>
        {published && (
          <>
            <button type="button" onClick={() => void copy()} className={btn("secondary", "sm")}>
              <Link2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Copy link
            </button>
            <a
              className={btn("secondary", "sm")}
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`Support ${title} on AzarFaith: ${url}`)}`}
            >
              WhatsApp
            </a>
          </>
        )}
      </div>
      {!published && (
        <p className="text-[12px] text-muted-ink">
          Owner preview only. Public sharing becomes available after approval.
        </p>
      )}
    </li>
  );
}
