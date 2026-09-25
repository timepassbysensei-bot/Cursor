import { useQuery } from "@tanstack/react-query";
import { fetchSiteContent } from "../services/content";
import type { SiteContent } from "../types";

export const SITE_CONTENT_KEY = ["site-content"] as const;

/**
 * Site copy changes rarely, so it is cached for the session and shared between
 * the shell, the pages and the assistant preview.
 */
export function useSiteContent() {
  return useQuery<SiteContent>({
    queryKey: SITE_CONTENT_KEY,
    queryFn: fetchSiteContent,
    staleTime: 5 * 60 * 1000,
  });
}
