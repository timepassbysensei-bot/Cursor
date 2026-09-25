import { useEffect } from "react";

interface SeoOptions {
  title: string;
  description?: string;
  image?: string | null;
  /** Set for pages that should not be indexed, e.g. dashboards. */
  noIndex?: boolean;
}

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/**
 * Sets the document title plus the meta tags that matter for sharing.
 * Open Graph and Twitter tags are updated in place so a deep link previews
 * with the right title instead of the site default.
 */
export function useSeo({ title, description, image, noIndex }: SeoOptions): void {
  useEffect(() => {
    document.title = title;

    if (description) {
      upsertMeta('meta[name="description"]', "name", "description", description);
    }

    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
    upsertMeta('meta[property="og:url"]', "property", "og:url", window.location.href);

    if (description) {
      upsertMeta('meta[property="og:description"]', "property", "og:description", description);
      upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    }
    if (image) {
      upsertMeta('meta[property="og:image"]', "property", "og:image", image);
      upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    }

    upsertMeta('meta[name="robots"]', "name", "robots", noIndex ? "noindex, nofollow" : "index, follow");

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + window.location.pathname;
  }, [title, description, image, noIndex]);
}
