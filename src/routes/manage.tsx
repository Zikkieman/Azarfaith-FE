import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Building2, FileClock, FolderKanban, Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/app/DashboardShell";
import { PageSpinner } from "@/components/PageSpinner";
import { LoadError } from "@/components/profile/SettingsParts";
import { useCreationSession } from "@/components/creation/useCreationSession";
import { getProfile, listCampaignDrafts, listOrganizationDrafts } from "@/features/catalog/api";

export const Route = createFileRoute("/manage")({ component: ManageWorkspace });
function ManageWorkspace() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // Child organization dashboards must not depend on workspace list requests succeeding.
  return pathname.replace(/\/$/, "") === "/manage" ? <Workspace /> : <Outlet />;
}
function Workspace() {
  const { ready, userId } = useCreationSession();
  const profile = useQuery({ queryKey: ["profile", userId], queryFn: getProfile, enabled: ready });
  const orgDrafts = useQuery({
    queryKey: ["organization-drafts", userId],
    queryFn: listOrganizationDrafts,
    enabled: ready,
  });
  const campaignDrafts = useQuery({
    queryKey: ["campaign-drafts", userId],
    queryFn: listCampaignDrafts,
    enabled: ready,
  });
  useCreationSession(profile.error || orgDrafts.error || campaignDrafts.error);
  return (
    <DashboardShell>
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#777283]">
            Your workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Manage your causes</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#777283]">
            Pick up a draft, manage your organization, or share an approved cause with people ready
            to help.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/register-org" className="giving-small-button">
            <Plus size={15} /> Organization
          </Link>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 rounded-full bg-[#130e30] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={15} /> Campaign
          </Link>
        </div>
      </div>
      {!ready ? (
        <PageSpinner label="Loading workspace" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <WorkspaceSection title="Your organizations" icon={<Building2 size={19} />}>
            {profile.isPending ? (
              <SectionLoading />
            ) : !profile.data ? (
              <LoadError
                message="Could not load your organizations."
                retry={() => void profile.refetch()}
              />
            ) : (
              <>
                {profile.isError && (
                  <LoadError
                    message="Could not refresh your organizations."
                    retry={() => void profile.refetch()}
                  />
                )}
                {!profile.data.ownedOrganizations.length && (
                  <Empty>No organizations yet. Register one to introduce your ministry.</Empty>
                )}
                {profile.data.ownedOrganizations.map((org) => (
                  <CauseRow
                    key={org.id}
                    title={org.name}
                    status={
                      org.reviewAction === "rejected"
                        ? "Rejected"
                        : org.reviewAction === "more_info_requested"
                          ? "More information needed"
                          : org.verificationStatus.replaceAll("_", " ")
                    }
                    publicPath={`/org/${org.id}`}
                    published={org.verificationStatus === "verified"}
                    open={
                      <Link
                        to="/manage/org/$id"
                        params={{ id: org.id }}
                        className="giving-small-button"
                      >
                        Manage <ArrowUpRight size={14} />
                      </Link>
                    }
                  />
                ))}
              </>
            )}
          </WorkspaceSection>
          <WorkspaceSection title="Your campaigns" icon={<FolderKanban size={19} />}>
            {profile.isPending ? (
              <SectionLoading />
            ) : !profile.data ? (
              <LoadError
                message="Could not load your campaigns."
                retry={() => void profile.refetch()}
              />
            ) : (
              <>
                {profile.isError && (
                  <LoadError
                    message="Could not refresh your campaigns."
                    retry={() => void profile.refetch()}
                  />
                )}
                {!profile.data.ownedCampaigns.length && (
                  <Empty>No campaigns yet. Create one for your next need or ongoing work.</Empty>
                )}
                {profile.data.ownedCampaigns.map((campaign) => (
                  <CauseRow
                    key={campaign.id}
                    title={campaign.title}
                    status={
                      campaign.reviewAction === "rejected"
                        ? "Rejected"
                        : campaign.reviewAction === "changes_requested"
                          ? "Changes requested"
                          : campaign.verificationStatus.replaceAll("_", " ")
                    }
                    publicPath={`/campaign/${campaign.id}`}
                    published={campaign.isPublic === true}
                    open={
                      <Link
                        to="/campaign/$id"
                        params={{ id: campaign.id }}
                        className="giving-small-button"
                      >
                        Manage <ArrowUpRight size={14} />
                      </Link>
                    }
                  />
                ))}
              </>
            )}
          </WorkspaceSection>
          <WorkspaceSection title="Organization drafts" icon={<FileClock size={19} />}>
            {orgDrafts.isPending ? (
              <SectionLoading />
            ) : !orgDrafts.data ? (
              <LoadError
                message="Could not load your organization drafts."
                retry={() => void orgDrafts.refetch()}
              />
            ) : (
              <>
                {orgDrafts.isError && (
                  <LoadError
                    message="Could not refresh your drafts."
                    retry={() => void orgDrafts.refetch()}
                  />
                )}
                {!orgDrafts.data.length && <Empty>No saved organization drafts yet.</Empty>}
                {orgDrafts.data.map((draft) => (
                  <DraftRow key={draft.id} title={draft.name} savedAt={draft.draftSavedAt}>
                    <Link
                      to="/register-org"
                      search={{ draftId: draft.id }}
                      className="giving-small-button"
                    >
                      Continue <ArrowUpRight size={14} />
                    </Link>
                  </DraftRow>
                ))}
              </>
            )}
          </WorkspaceSection>
          <WorkspaceSection title="Campaign drafts" icon={<FileClock size={19} />}>
            {campaignDrafts.isPending ? (
              <SectionLoading />
            ) : !campaignDrafts.data ? (
              <LoadError
                message="Could not load your campaign drafts."
                retry={() => void campaignDrafts.refetch()}
              />
            ) : (
              <>
                {campaignDrafts.isError && (
                  <LoadError
                    message="Could not refresh your drafts."
                    retry={() => void campaignDrafts.refetch()}
                  />
                )}
                {!campaignDrafts.data.length && <Empty>No saved campaign drafts yet.</Empty>}
                {campaignDrafts.data.map((draft) => (
                  <DraftRow key={draft.id} title={draft.title} savedAt={draft.draftSavedAt}>
                    <Link
                      to="/create"
                      search={{ draftId: draft.id }}
                      className="giving-small-button"
                    >
                      Continue <ArrowUpRight size={14} />
                    </Link>
                  </DraftRow>
                ))}
              </>
            )}
          </WorkspaceSection>
        </div>
      )}
    </DashboardShell>
  );
}
function WorkspaceSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-[#efedf3] p-5 sm:p-6">
      <h2 className="mb-5 flex items-center gap-3 text-lg font-semibold">
        {icon}
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function SectionLoading() {
  return (
    <p role="status" className="text-sm text-[#777283]">
      Fetching your saved work...
    </p>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-[#f8f7fa] p-5 text-sm leading-relaxed text-[#777283]">{children}</p>
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
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#efedf3] pt-4">
      <div className="min-w-0 flex-1">
        <h3 className="break-words text-sm font-medium">{title}</h3>
        <p className="mt-2 text-xs text-[#777283]">
          Saved {new Date(savedAt).toLocaleDateString()}
        </p>
      </div>
      {children}
    </div>
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
    <article className="min-w-0 rounded-xl bg-[#f8f7fa] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 break-words text-base font-medium leading-relaxed">
          {title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs capitalize ${published ? "bg-[#e3f4e9] text-[#226747]" : "bg-[#fff0d6] text-[#885f1f]"}`}
        >
          {status}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {open}
        <a href={url} className="giving-small-button" target="_blank" rel="noreferrer">
          Preview
        </a>
        {published && (
          <>
            <button type="button" onClick={() => void copy()} className="giving-small-button">
              <Link2 size={14} /> Copy link
            </button>
            <a
              className="giving-small-button"
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
        <p className="mt-3 text-xs leading-relaxed text-[#777283]">
          Owner preview only. Public sharing becomes available after approval.
        </p>
      )}
    </article>
  );
}
