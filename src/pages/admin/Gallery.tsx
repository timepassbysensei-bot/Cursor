import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2 } from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { CrudPage } from "../../features/admin/CrudPage";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { Modal } from "../../components/ui/Modal";
import { adminService, mediaUpload } from "../../services/admin";
import type { GalleryAlbum } from "../../types";

export default function AdminGallery() {
  const [managing, setManaging] = useState<GalleryAlbum | null>(null);

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Photo albums shown on the public gallery page. Upload images to the Storage 'media' bucket."
      />
      <CrudPage<GalleryAlbum>
        title=""
        entityName="Album"
        queryKey={["admin", "albums"]}
        fetcher={() => adminService.albums()}
        searchKeys={["title", "category"]}
        extraToolbar={
          <span className="hidden text-xs text-muted sm:inline">Manage images inside an album via the button in each row.</span>
        }
        toPayload={(v, editing) => ({
          ...(editing ? { id: editing.id } : {}),
          title: String(v.title ?? "").trim(),
          description: v.description || null,
          category: v.category || null,
          event_date: v.event_date || null,
          cover_image_url: v.cover_image_url || null,
          display_order: Number(v.display_order ?? 0),
          status: v.status || "draft",
        })}
        upsert={(payload) => adminService.upsertAlbum(payload)}
        remove={(id) => adminService.deleteAlbum(id)}
        columns={[
          {
            key: "title",
            header: "Album",
            render: (a) => (
              <div className="flex items-center gap-3">
                <div className="h-10 w-14 overflow-hidden rounded-lg bg-offwhite">
                  {a.cover_image_url && <img src={a.cover_image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div>
                  <p className="font-semibold text-navy">{a.title}</p>
                  <p className="text-xs text-muted">{a.category ?? "—"}</p>
                </div>
              </div>
            ),
          },
          { key: "order", header: "Order", render: (a) => a.display_order },
          {
            key: "status",
            header: "Status",
            render: (a) => (
              <Badge tone={a.status === "published" ? "green" : a.status === "draft" ? "gray" : "red"}>{a.status}</Badge>
            ),
          },
        ]}
        fields={[
          { name: "title", label: "Album title", required: true, colSpan: 2 },
          { name: "description", label: "Description", type: "textarea", colSpan: 2 },
          { name: "category", label: "Category", placeholder: "e.g. Classroom, Sports, Events" },
          { name: "event_date", label: "Event date", type: "date" },
          { name: "cover_image_url", label: "Cover image URL", type: "url", colSpan: 2 },
          { name: "display_order", label: "Display order", type: "number" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ],
          },
        ]}
      />

      {/* Row-level manage buttons are injected via a second pass below */}
      <AlbumImagesManager album={managing} onClose={() => setManaging(null)} />
      <ManageButtonsSetter onManage={setManaging} albumsQ={undefined} />
    </div>
  );
}

/** Bridges the CrudPage table rows to the image manager. */
function ManageButtonsSetter({
  onManage,
}: {
  onManage: (a: GalleryAlbum) => void;
  albumsQ?: unknown;
}) {
  const albumsQ = useQuery({ queryKey: ["admin", "albums"], queryFn: () => adminService.albums() });
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useMutation({
    mutationFn: async () => undefined,
  });

  // Attach a "Images" action into each CrudPage row via a DOM-free approach:
  // render a compact album list under the CRUD table as the primary way to manage images.
  if (!mounted) {
    // one-time flag; component renders the helper list every render
    setMounted(true);
  }

  const albums = albumsQ.data ?? [];

  return (
    <div className="mt-8">
      <h2 className="font-display text-base font-bold text-navy">Manage album images</h2>
      <p className="mt-1 text-sm text-muted">Pick an album to upload photos, set captions and remove images.</p>
      {albumsQ.isLoading ? (
        <LoadingState />
      ) : albumsQ.isError ? (
        <ErrorState onRetry={() => albumsQ.refetch()} />
      ) : albums.length === 0 ? (
        <EmptyState compact title="No albums yet" hint="Create an album above first." />
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-lightgray bg-white px-4 py-3">
              <span className="truncate text-sm font-semibold text-navy">{a.title}</span>
              <Button variant="outline" size="sm" onClick={() => onManage(a)}>
                <ImagePlus className="h-4 w-4" aria-hidden /> Images
              </Button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="hidden" onClick={() => qc.invalidateQueries({ queryKey: ["admin", "albums"] })} aria-hidden tabIndex={-1} />
    </div>
  );
}

function AlbumImagesManager({
  album,
  onClose,
}: {
  album: GalleryAlbum | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imagesQ = useQuery({
    queryKey: ["admin", "gallery-images", album?.id],
    queryFn: () => adminService.images(album!.id),
    enabled: Boolean(album),
  });

  async function handleUpload(files: FileList | null) {
    if (!album || !files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setError(`${file.name} is not an image — skipped.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} is larger than 5 MB — skipped.`);
          continue;
        }
        const url = await mediaUpload.image(file, "gallery");
        await adminService.insertImage({
          album_id: album.id,
          url,
          caption: caption || null,
          alt_text: caption || album.title,
        });
      }
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["admin", "gallery-images", album.id] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const removeImage = useMutation({
    mutationFn: (id: string) => adminService.deleteImage(id),
    onSuccess: () => album && qc.invalidateQueries({ queryKey: ["admin", "gallery-images", album.id] }),
  });

  if (!album) return null;

  return (
    <Modal open onClose={onClose} title={`Images — ${album.title}`} wide>
      <div className="space-y-4">
        <div className="rounded-xl border border-lightgray bg-offwhite p-4">
          <label htmlFor="img-caption" className="mb-1.5 block text-sm font-semibold text-ink">
            Caption for next upload (optional)
          </label>
          <input
            id="img-caption"
            className="input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Morning PT session"
          />
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-lightgray bg-white px-4 py-6 text-sm font-semibold text-navy hover:border-navy/40">
            <ImagePlus className="h-5 w-5" aria-hidden />
            {uploading ? "Uploading…" : "Choose image(s) to upload"}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
          <p className="mt-2 text-xs text-muted">Images up to 5 MB each. Alt text uses the caption automatically.</p>
        </div>

        {error && <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>}

        {imagesQ.isLoading ? (
          <LoadingState />
        ) : imagesQ.data && imagesQ.data.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {imagesQ.data.map((img) => (
              <li key={img.id} className="overflow-hidden rounded-xl border border-lightgray bg-white">
                <img src={img.url} alt={img.alt_text ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="truncate text-xs text-muted">{img.caption ?? "—"}</span>
                  <button
                    type="button"
                    onClick={() => removeImage.mutate(img.id)}
                    aria-label={`Delete image ${img.caption ?? ""}`}
                    className="rounded-lg border border-error/25 p-1.5 text-error hover:bg-error/[0.06]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState compact title="No images yet" hint="Upload the first photos for this album." />
        )}
      </div>
    </Modal>
  );
}
