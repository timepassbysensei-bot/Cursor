import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Images } from "lucide-react";
import { useSeo } from "../../hooks/useSeo";
import { useSiteContent } from "../../hooks/useSiteContent";
import { fetchPublishedGallery } from "../../services/content";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";
import { Button } from "../../components/ui/Button";
import { FilterChips } from "../../components/ui/Section";
import { EmptyState, ErrorState, SkeletonGrid } from "../../components/ui/States";
import { Reveal } from "../../components/Reveal";
import { GalleryGrid, Lightbox } from "../../components/GalleryGrid";

export default function Gallery() {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-gallery"],
    queryFn: fetchPublishedGallery,
  });

  const [category, setCategory] = useState("All");
  const [index, setIndex] = useState<number | null>(null);

  useSeo({
    title: `Gallery — ${content.brandName}`,
    description:
      "Artwork, screenshots and behind-the-scenes images from Arian's gaming videos, organised by category.",
  });

  const items = useMemo(() => data ?? [], [data]);

  // Categories come from what is actually published, so the filter row never
  // offers an empty bucket.
  const categories = useMemo(() => {
    const found = new Set<string>();
    for (const item of items) if (item.category) found.add(item.category);
    return ["All", ...Array.from(found).sort()];
  }, [items]);

  const filtered = useMemo(
    () => (category === "All" ? items : items.filter((item) => item.category === category)),
    [items, category]
  );

  return (
    <div className="shell py-14 sm:py-20">
      <Reveal>
        <header className="max-w-3xl">
          <p className="eyebrow mb-5">Gallery</p>
          <h1 className="font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.02em] text-ink text-balance sm:text-5xl">
            Artwork, screenshots and the work behind the videos.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted text-pretty">
            Everything here was uploaded by Arian and is published with permission. Open any image for the full
            view — arrow keys move between them.
          </p>
        </header>
      </Reveal>

      {categories.length > 1 && (
        <Reveal delay={0.08}>
          <div className="mt-9">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.18em] text-faint">
              Filter by category
            </p>
            <FilterChips
              label="Filter gallery by category"
              options={categories}
              value={category}
              onChange={setCategory}
            />
          </div>
        </Reveal>
      )}

      <div className="mt-8">
        {isLoading ? (
          <SkeletonGrid count={6} className="sm:grid-cols-2 lg:grid-cols-3" />
        ) : isError ? (
          <ErrorState
            title="The gallery could not load"
            hint="Something went wrong fetching the images."
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Images className="h-5 w-5 text-faint" aria-hidden />}
            title="The gallery is empty"
            hint="Images uploaded in the studio appear here automatically, in an editorial grid."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nothing in this category yet"
            hint="Try another category."
            action={
              <Button variant="outline" size="sm" onClick={() => setCategory("All")}>
                Show everything
              </Button>
            }
          />
        ) : (
          <>
            <p className="mb-5 text-xs text-faint" aria-live="polite">
              {filtered.length} image{filtered.length === 1 ? "" : "s"}
            </p>
            <GalleryGrid items={filtered} onOpen={setIndex} />
          </>
        )}
      </div>

      <Lightbox
        items={filtered}
        index={index}
        onClose={() => setIndex(null)}
        onIndexChange={setIndex}
      />
    </div>
  );
}
