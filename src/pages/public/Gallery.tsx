import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { Section, Card, Badge } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useSeo } from "../../hooks/useSeo";
import {
  fetchPublishedAlbums,
  fetchAlbumImages,
} from "../../services/publicContent";
import { formatDate } from "../../lib/utils";

export default function Gallery() {
  useSeo("Gallery — Bokaro Defence Academy", "Photos from classrooms, training sessions and academy life.");
  const { data: albums, isLoading, isError, refetch } = useQuery({
    queryKey: ["albums", "page"],
    queryFn: fetchPublishedAlbums,
  });

  const [lightboxAlbum, setLightboxAlbum] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const imagesQ = useQuery({
    queryKey: ["album-images", lightboxAlbum],
    queryFn: () => fetchAlbumImages(lightboxAlbum!),
    enabled: Boolean(lightboxAlbum),
  });

  const images = imagesQ.data ?? [];
  const current = images[lightboxIndex];

  return (
    <>
      <section className="bg-navy py-12 text-white lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron-soft">Gallery</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Life at the academy</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Classrooms, study sessions, fitness training and moments from academy life.
          </p>
        </div>
      </section>

      <Section tone="offwhite">
        {isLoading ? (
          <LoadingState label="Loading gallery…" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : albums && albums.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <Card key={album.id} className="overflow-hidden">
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => {
                    setLightboxAlbum(album.id);
                    setLightboxIndex(0);
                  }}
                  aria-label={`Open album: ${album.title}`}
                >
                  <div className="aspect-[4/3] bg-navy/[0.06]">
                    {album.cover_image_url ? (
                      <img
                        src={album.cover_image_url}
                        alt={album.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-navy/30">
                        <Images className="h-10 w-10" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-base font-bold text-navy">{album.title}</h2>
                      {album.category && <Badge tone="gray">{album.category}</Badge>}
                    </div>
                    {album.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{album.description}</p>}
                    {album.event_date && <p className="mt-1 text-xs text-muted">{formatDate(album.event_date)}</p>}
                  </div>
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Images className="h-8 w-8 text-muted/60" aria-hidden />}
            title="Gallery coming soon"
            hint="Photographs from the academy will be published here."
          />
        )}
      </Section>

      {/* Empty album feedback — clicking an album with no photos must not look broken */}
      {lightboxAlbum && !imagesQ.isLoading && images.length === 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Album is empty"
          onClick={() => setLightboxAlbum(null)}
        >
          <div className="max-w-sm rounded-xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <Images className="mx-auto h-8 w-8 text-muted/60" aria-hidden />
            <p className="mt-3 font-display text-base font-bold text-navy">No photos in this album yet</p>
            <p className="mt-1 text-sm text-muted">Photos added by the academy will appear here.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setLightboxAlbum(null)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxAlbum && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={() => setLightboxAlbum(null)}
        >
          <div className="relative max-h-full w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={current.url}
              alt={current.alt_text ?? current.caption ?? "Gallery image"}
              className="max-h-[75vh] w-full rounded-xl object-contain"
            />
            {(current.caption || current.alt_text) && (
              <p className="mt-3 text-center text-sm text-white/80">{current.caption ?? current.alt_text}</p>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => setLightboxIndex((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => setLightboxIndex((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
                <p className="mt-2 text-center text-xs text-white/60">
                  {lightboxIndex + 1} / {images.length}
                </p>
              </>
            )}
            <button
              type="button"
              aria-label="Close viewer"
              onClick={() => setLightboxAlbum(null)}
              className="absolute -top-2 right-0 translate-y-[-100%] rounded-full bg-white/15 p-2 text-white hover:bg-white/25 sm:-right-2"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
