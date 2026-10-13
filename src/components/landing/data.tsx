import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/app/hooks";
import { discoverCampaigns, discoverOrganizations } from "@/features/catalog/api";
import { apiFetch } from "@/lib/api";
import type { Campaign, Org } from "@/lib/catalog";
import { isPublished } from "@/lib/discovery";
import type { GivingOverview } from "@/components/public/OpenGiving";
import { orgs as examples, campaigns as campaignExamples } from "./design-preview";
import {
  stats as sampleStats,
  totals as sampleTotals,
  type StateStats,
} from "@/components/map/data";
import { states } from "@/components/map/nigeria";

export type LandingCampaign = Campaign & { designPreview?: boolean };
export type LandingOrg = Org & { designPreview?: boolean };
const previewOrgs: LandingOrg[] = examples.map((org) => ({
  ...org,
  ownerId: "",
  isDraft: false,
  isPublic: false,
  links: [],
  registrationDocuments: [],
  campaignCount: org.campaignIds.length,
  verificationStatus: org.verificationStatus === "rejected" ? "unverified" : org.verificationStatus,
  designPreview: true,
}));
const previewCampaigns: LandingCampaign[] = campaignExamples.map((campaign) => ({
  ...campaign,
  ownerId: "",
  isDraft: false,
  isPublic: false,
  verificationStatus:
    campaign.verificationStatus === "rejected" ? "unverified" : campaign.verificationStatus,
  designPreview: true,
}));

export function locationState(location: string) {
  const text = location
    .toLowerCase()
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (/\b(fct|abuja|federal capital territory)\b/.test(text)) return "FC";
  return (
    states.find((state) => new RegExp(`\\b${state.name.toLowerCase()}\\b`).test(text))?.id ??
    "other"
  );
}

export function mapLiveGiving(overview: GivingOverview, campaigns: LandingCampaign[]) {
  const stats: Record<string, StateStats> = {};
  for (const state of states) {
    const rows = overview.locations.filter((row) => locationState(row.location) === state.id);
    const campaign = campaigns.find((item) => locationState(item.location) === state.id);
    stats[state.id] = {
      orgs: { church: 0, mission: 0, orphanage: 0, school: 0 },
      totalOrganizations: rows.reduce((n, row) => n + row.organizations, 0),
      givenWeek: rows.reduce((n, row) => n + row.given, 0),
      receipts: rows.reduce((n, row) => n + row.gifts, 0),
      featured: campaign
        ? {
            org: campaign.raiser.name,
            place: campaign.location,
            text: campaign.updates[0]?.title || campaign.title,
            photo: campaign.cover,
            to: `/campaign/${campaign.id}`,
          }
        : undefined,
    };
  }
  return {
    stats,
    totals: {
      givenWeek: overview.totals.given,
      orgs: overview.totals.organizations,
      receipts: overview.totals.gifts,
    },
  };
}

type Data = {
  authed: boolean;
  admin: boolean;
  campaigns: LandingCampaign[];
  orgs: LandingOrg[];
  catalogPreview: boolean;
  catalogError: boolean;
  catalogLoading: boolean;
  retryCatalog: () => void;
  mapStats: Record<string, StateStats>;
  mapTotals: typeof sampleTotals;
  mapPreview: boolean;
  mapError: boolean;
  retryMap: () => void;
};
const Context = createContext<Data | null>(null);
export function useLandingData<T>(select: (data: Data) => T): T {
  const data = useContext(Context);
  if (!data) throw new Error("Landing data must be used inside its provider");
  return select(data);
}
export function LandingDataProvider({ children }: { children: ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  const campaigns = useQuery({
    queryKey: ["landing", "featured"],
    queryFn: () => discoverCampaigns({ pageSize: 6 }),
  });
  const orgs = useQuery({
    queryKey: ["landing", "organizations"],
    queryFn: () => discoverOrganizations({ pageSize: 6 }),
  });
  const giving = useQuery({
    queryKey: ["public-giving"],
    queryFn: () => apiFetch<GivingOverview>("/public/giving"),
    refetchInterval: 60000,
  });
  const liveCampaigns = (campaigns.data?.items ?? []).filter(isPublished);
  const liveOrgs = (orgs.data?.items ?? []).filter(isPublished);
  const liveMap = giving.data ? mapLiveGiving(giving.data, liveCampaigns) : null;
  useEffect(() => {
    document.documentElement.classList.add("js");
    return () => document.documentElement.classList.remove("js");
  }, []);
  return (
    <Context.Provider
      value={{
        authed: Boolean(user),
        admin: user?.role === "platform_admin",
        campaigns: liveCampaigns.length ? liveCampaigns : previewCampaigns,
        orgs: liveOrgs.length ? liveOrgs : previewOrgs,
        catalogPreview: !liveCampaigns.length,
        catalogError: campaigns.isError || orgs.isError,
        catalogLoading: campaigns.isPending || orgs.isPending,
        retryCatalog: () => {
          void campaigns.refetch();
          void orgs.refetch();
        },
        mapStats: liveMap?.stats ?? sampleStats,
        mapTotals: liveMap?.totals ?? sampleTotals,
        mapPreview: !liveMap,
        mapError: giving.isError,
        retryMap: () => {
          void giving.refetch();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
