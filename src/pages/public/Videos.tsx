import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Youtube } from "lucide-react";
import { useSeo } from "../../hooks/useSeo";
import { useSiteContent } from "../../hooks/useSiteContent";
import { fetchPublishedVideos } from "../../services/content";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";
import { GAMES, VIDEO_CATEGORIES } from "../../lib/options";
import { cn, safeExternal } from "../../lib/utils";
import { youtubeChannelUrl } from "../../lib/supabaseClient";
import { Button, ButtonLink } from "../../components/ui/Button";
import { FilterChips, Badge } from "../../components/ui/Section";
import { EmptyState, ErrorState, SkeletonGrid } from "../../components/ui/States";
import { RevealGroup, RevealItem, Reveal } from "../../components/Reveal";
import { VideoCard } from "../../components/VideoCard";

type SortKey = "newest" | "featured";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "featured", label: "Featured first" },
];

export default function Videos() {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-videos"],
    queryFn: fetchPublishedVideos,
  });

  const [query, setQuery] = useState("");
  const [game, setGame] = useState("All");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<SortKey>("newest");

  useSeo({
    title: `Videos — ${content.brandName}`,
    description:
      "Every video Arian has published: Genshin Impact and Wuthering Waves lore, story explanations, builds, banner advice and beginner guides in Hindi.",
  });

  const videos = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = videos.filter((video) => {
      if (game !== "All" && video.game !== game) return false;
      if (category !== "All" && video.category !== category) return false;
      if (!needle) return true;
      return (
        video.title.toLowerCase().includes(needle) ||
        (video.description ?? "").toLowerCase().includes(needle)
      );
    });

    return [...result].sort((a, b) => {
      if (sort === "featured") {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      }
      return Date.parse(b.published_at) - Date.parse(a.published_at);
    });
  }, [videos, query, game, category, sort]);

  const activeFilters = (game !== "All" ? 1 : 0) + (category !== "All" ? 1 : 0) + (query ? 1 : 0);
  const channelUrl = safeExternal(content.socialYouTube) ?? youtubeChannelUrl;

  return (
    <div className="shell py-14 sm:py-20">
      <Reveal>
        <header className="max-w-3xl">
          <p className="eyebrow mb-5">Video library</p>
          <h1 className="font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.02em] text-ink text-balance sm:text-5xl">
            Every video, searchable.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted text-pretty">
            Filter by game, by the kind of video you need, or search a title. Each card opens the video on
            YouTube in a new tab.
          </p>
        </header>
      </Reveal>

      {/* Toolbar */}
      <Reveal delay={0.08}>
        <div className="panel mt-10 p-5 sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                  aria-hidden
                />
                <label htmlFor="video-search" className="sr-only">
                  Search videos
                </label>
                <input
                  id="video-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search titles and descriptions…"
                  className="input pl-10"
                />
              </div>

              <div className="flex items-center gap-2" role="group" aria-label="Sort videos">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-faint" aria-hidden />
                {SORTS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSort(option.key)}
                    aria-pressed={sort === option.key}
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                      sort === option.key
                        ? "bg-white/[0.08] text-ink"
                        : "text-muted hover:bg-white/[0.04] hover:text-ink"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 border-t border-hairline pt-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.18em] text-faint">Game</p>
                <FilterChips
                  label="Filter by game"
                  options={["All", ...GAMES]}
                  value={game}
                  onChange={setGame}
                />
              </div>
              <div>
                <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.18em] text-faint">Category</p>
                <FilterChips
                  label="Filter by category"
                  options={["All", ...VIDEO_CATEGORIES]}
                  value={category}
                  onChange={setCategory}
                />
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-faint" aria-live="polite">
          {isLoading ? "Loading videos…" : `${filtered.length} video${filtered.length === 1 ? "" : "s"}`}
          {activeFilters > 0 && !isLoading ? " filtered" : ""}
        </p>
        <div className="flex items-center gap-2">
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setGame("All");
                setCategory("All");
              }}
            >
              Clear filters
            </Button>
          )}
          <ButtonLink to={channelUrl} external variant="secondary" size="sm">
            <Youtube className="h-3.5 w-3.5" aria-hidden />
            Open the channel
          </ButtonLink>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <SkeletonGrid count={6} />
        ) : isError ? (
          <ErrorState
            title="Videos could not load"
            hint="The library did not come back. Check the connection and try again."
            onRetry={() => void refetch()}
          />
        ) : videos.length === 0 ? (
          <EmptyState
            icon={<Youtube className="h-5 w-5 text-faint" aria-hidden />}
            title="No videos published yet"
            hint="Once Arian adds videos in the studio, they show up here with filters and search."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nothing matches those filters"
            hint="Try clearing the filters or searching for a different title."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setGame("All");
                  setCategory("All");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((video) => (
              <RevealItem key={video.id}>
                <VideoCard video={video} className="h-full" />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-3 border-t border-hairline pt-8">
        <Badge tone="cyan">Tip</Badge>
        <p className="text-xs text-muted">
          Looking for something specific? Ask{" "}
          <a href="/chat" className="font-semibold text-cyan underline-offset-2 hover:underline">
            Arian Assistant
          </a>{" "}
          — it only answers questions about this channel and site.
        </p>
      </div>
    </div>
  );
}
