import { useQuery } from "@tanstack/react-query";
import { fetchSiteSettings } from "../services/publicContent";
import type { SiteSettings } from "../types";

export const SITE_SETTINGS_KEY = ["site-settings"] as const;

export function useSiteSettings() {
  const query = useQuery<SiteSettings>({
    queryKey: SITE_SETTINGS_KEY,
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000,
  });
  return query;
}
