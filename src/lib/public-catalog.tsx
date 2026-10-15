import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCampaigns, getOrganizations } from "@/lib/catalog";
import { useApp } from "@/lib/store";

/** Keeps existing designer components data-driven without changing their visual composition. */
export function PublicCatalogProvider({ children }: { children: ReactNode }) {
  const campaigns = useQuery({
    queryKey: ["public-campaigns", "landing"],
    queryFn: () => getCampaigns("?page=1&pageSize=24&view=all&sort=urgent"),
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
  });
  const organizations = useQuery({
    queryKey: ["public-organizations", "landing"],
    queryFn: () => getOrganizations("?page=1&pageSize=24"),
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
  });

  useEffect(() => {
    if (campaigns.data) useApp.setState({ campaigns: campaigns.data.items });
  }, [campaigns.data]);

  useEffect(() => {
    if (organizations.data) useApp.setState({ orgs: organizations.data.items });
  }, [organizations.data]);

  return children;
}
