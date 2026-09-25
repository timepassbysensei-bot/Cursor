import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { adminService, logAdminAction } from "../../services/admin";
import { removeStorageObject, uploadGalleryImage } from "../../services/uploads";
import { GALLERY_CATEGORIES } from "../../lib/options";
import { errorMessage } from "../../lib/utils";
import { galleryMetaSchema } from "../../validation/schemas";
import { PageHeader } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog, Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { MediaUploader } from "../../components/MediaUploader";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import type { GalleryItem } from "../../types";

interface MetaForm {
  title: string;
  caption: string;
  alt_text: string;
  category: string;
  is_published: boolean;
}

export default function AdminGallery() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [meta, setMeta] = useState<MetaForm | null>(null);
  const [metaErrors, setMetaErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useSeo({ title: "Gallery — Arian studio", description: "Upload and manage gallery images.", noIndex: true });

  const galleryQuery = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: () => adminService.gallery(),
    enabled: isSupabaseConfigured,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
    queryClient.invalidateQueries({ queryKey: ["public-gallery"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await uploadGalleryImage(file);
      const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 120);
      await adminService.insertGalleryItem({
        storage_path: uploaded.path,
        public_url: uploaded.publicUrl,
        title: title || "Untitled image",
        caption: null,
        // A usable alt text placeholder that still has to be replaced — the
        // editor flags it as needing a real description.
        alt_text: `Placeholder alt text — describe this image (${title || "image"})`,
        category: null,
        width: uploaded.width && uploaded.width > 0 ? uploaded.width : null,
        height: uploaded.height && uploaded.height > 0 ? uploaded.height : null,
        sort_order: (galleryQuery.data ?? []).length,
        is_published: true,
      });
      if (user) {
        await logAdminAction({
          adminUserId: user.id,
          action: "gallery.uploaded",
          entityType: "gallery_items",
          details: { file: file.name, size: uploaded.sizeBytes },
        });
      }
    },
    onSuccess: () => {
      invalidate();
      push({ title: "Image uploaded", description: "Open the editor to add a title and alt text.", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Upload failed", description: errorMessage(error), variant: "error" }),
  });

  const saveMeta = useMutation({
    mutationFn: async (values: MetaForm) => {
      if (!editing) return;
      await adminService.updateGalleryItem(editing.id, {
        title: values.title,
        caption: values.caption || null,
        alt_text: values.alt_text,
        category: values.category || null,
        is_published: values.is_published,
      });
    },
    onSuccess: () => {
      invalidate();
      setMeta(null);
      setEditing(null);
      push({ title: "Image details saved", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not save", description: errorMessage(error), variant: "error" }),
  });

  const togglePublished = useMutation({
    mutationFn: (item: GalleryItem) =>
      adminService.updateGalleryItem(item.id, { is_published: !item.is_published }),
    onSuccess: invalidate,
    onError: (error: Error) => push({ title: "Could not update", description: errorMessage(error), variant: "error" }),
  });

  const reorder = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: -1 | 1 }) => {
      const list = galleryQuery.data ?? [];
      const index = list.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= list.length) return;
      const reordered = [...list];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      await adminService.reorderGallery(reordered.map((item, order) => ({ id: item.id, sort_order: order })));
    },
    onSuccess: invalidate,
    onError: (error: Error) => push({ title: "Could not reorder", description: errorMessage(error), variant: "error" }),
  });

  const remove = useMutation({
    mutationFn: async (item: GalleryItem) => {
      await adminService.deleteGalleryItem(item.id);
      // Remove the stored file too; a failure here leaves an orphaned object
      // but must not block deleting the row.
      if (item.storage_path) {
        await removeStorageObject("gallery", item.storage_path).catch(() => undefined);
      }
      if (user) {
        await logAdminAction({
          adminUserId: user.id,
          action: "gallery.deleted",
          entityType: "gallery_items",
          entityId: item.id,
        });
      }
    },
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      push({ title: "Image deleted", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not delete", description: errorMessage(error), variant: "error" }),
  });

  const items = useMemo(() => galleryQuery.data ?? [], [galleryQuery.data]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) ||
        (item.caption ?? "").toLowerCase().includes(needle) ||
        item.alt_text.toLowerCase().includes(needle)
      );
    });
  }, [items, search, category]);

  const publishable = items.filter((item) => item.is_published).length;

  const openMeta = (item: GalleryItem) => {
    setEditing(item);
    setMetaErrors({});
    setMeta({
      title: item.title,
      caption: item.caption ?? "",
      alt_text: item.alt_text,
      category: item.category ?? "",
      is_published: item.is_published,
    });
  };

  const submitMeta = () => {
    if (!meta) return;
    const parsed = galleryMetaSchema.safeParse(meta);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
      setMetaErrors(errors);
      return;
    }
    setMetaErrors({});
    saveMeta.mutate({
      ...parsed.data,
      caption: parsed.data.caption ?? "",
      category: parsed.data.category ?? "",
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Gallery"
        description="Drop images in, then give each one a title and real alt text. Images are resized and converted in your browser before they are uploaded to Supabase Storage."
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Panel className="p-5">
          <h2 className="font-display text-base font-semibold text-ink">Upload</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Drag and drop, or choose files. Up to 12 at a time, 12 MB each before compression.
          </p>
          <div className="mt-5">
            <MediaUploader
              kind="image"
              multiple
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
              title="Drop images here"
              hint="JPG, PNG, WebP, AVIF or GIF. Large photos are downscaled to 2200px and re-encoded as WebP."
              disabled={!isSupabaseConfigured}
              onUpload={(file, onProgress) => upload.mutateAsync(file).then(() => onProgress(100))}
            />
          </div>

          {!isSupabaseConfigured && (
            <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-2xs leading-relaxed text-amber-200/90">
              Uploads need Supabase Storage. Add the Supabase keys and apply the migrations to enable them.
            </p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-hairline pt-5 text-sm">
            <div>
              <dt className="text-2xs uppercase tracking-[0.16em] text-faint">Images</dt>
              <dd className="mt-1 font-display text-lg font-semibold text-ink tabular-nums">{items.length}</dd>
            </div>
            <div>
              <dt className="text-2xs uppercase tracking-[0.16em] text-faint">Published</dt>
              <dd className="mt-1 font-display text-lg font-semibold text-ink tabular-nums">{publishable}</dd>
            </div>
          </dl>
        </Panel>

        <div>
          <Panel className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="gallery-search" className="label">
                  Search
                </label>
                <input
                  id="gallery-search"
                  type="search"
                  className="input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search titles, captions and alt text…"
                />
              </div>
              <div className="sm:w-52">
                <label htmlFor="gallery-category" className="label">
                  Category
                </label>
                <select
                  id="gallery-category"
                  className="input"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="All">All categories</option>
                  {GALLERY_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Panel>

          <div className="mt-6">
            {galleryQuery.isLoading ? (
              <LoadingState label="Loading images…" />
            ) : galleryQuery.isError ? (
              <ErrorState title="The gallery could not load" onRetry={() => void galleryQuery.refetch()} />
            ) : items.length === 0 ? (
              <EmptyState
                title="No images yet"
                hint="Upload your first image — it appears in the public gallery straight away."
              />
            ) : filtered.length === 0 ? (
              <EmptyState title="Nothing matches" hint="Try a different search or category." />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {filtered.map((item) => {
                  const index = items.findIndex((entry) => entry.id === item.id);
                  return (
                    <li key={item.id}>
                      <Panel className="overflow-hidden p-0">
                        <div className="relative aspect-[4/3] overflow-hidden bg-base/60">
                          <img
                            src={item.public_url}
                            alt={item.alt_text}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute left-2 top-2 flex gap-1.5">
                            {item.category && <Badge tone="cyan">{item.category}</Badge>}
                            {!item.is_published && <Badge tone="amber">Hidden</Badge>}
                          </div>
                        </div>

                        <div className="p-3.5">
                          <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-2xs leading-relaxed text-faint">
                            {item.alt_text}
                          </p>
                          <p className="mt-2 text-2xs text-faint">
                            order {index + 1}
                            {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <IconButton
                              label="Move up"
                              onClick={() => reorder.mutate({ id: item.id, direction: -1 })}
                              disabled={index === 0 || reorder.isPending}
                            >
                              <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                            </IconButton>
                            <IconButton
                              label="Move down"
                              onClick={() => reorder.mutate({ id: item.id, direction: 1 })}
                              disabled={index === items.length - 1 || reorder.isPending}
                            >
                              <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                            </IconButton>
                            <IconButton
                              label={item.is_published ? "Hide from the site" : "Publish on the site"}
                              onClick={() => togglePublished.mutate(item)}
                            >
                              {item.is_published ? (
                                <EyeOff className="h-3.5 w-3.5" aria-hidden />
                              ) : (
                                <Eye className="h-3.5 w-3.5" aria-hidden />
                              )}
                            </IconButton>
                            <IconButton label="Edit details" onClick={() => openMeta(item)}>
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </IconButton>
                            <IconButton label="Delete image" variant="danger" onClick={() => setDeleting(item)}>
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </IconButton>
                          </div>
                        </div>
                      </Panel>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(meta)}
        onClose={() => setMeta(null)}
        title="Image details"
        description="Alt text matters: it is what a screen reader announces, and what search engines read."
        footer={
          <>
            <Button variant="outline" onClick={() => setMeta(null)} disabled={saveMeta.isPending}>
              Cancel
            </Button>
            <Button onClick={submitMeta} disabled={saveMeta.isPending}>
              Save details
            </Button>
          </>
        }
      >
        {meta && (
          <div className="space-y-5">
            {editing && (
              <img
                src={editing.public_url}
                alt=""
                className="max-h-56 w-full rounded-xl border border-hairline object-cover"
              />
            )}

            <Field label="Title" htmlFor="meta-title" error={metaErrors.title} required>
              <input
                id="meta-title"
                className="input"
                value={meta.title}
                onChange={(event) => setMeta({ ...meta, title: event.target.value })}
              />
            </Field>

            <Field
              label="Alt text"
              htmlFor="meta-alt"
              error={metaErrors.alt_text}
              hint="Describe what is in the image, for people who cannot see it."
              required
            >
              <textarea
                id="meta-alt"
                rows={2}
                className="input"
                value={meta.alt_text}
                onChange={(event) => setMeta({ ...meta, alt_text: event.target.value })}
              />
            </Field>

            <Field label="Caption" htmlFor="meta-caption" error={metaErrors.caption}>
              <textarea
                id="meta-caption"
                rows={2}
                className="input"
                value={meta.caption}
                onChange={(event) => setMeta({ ...meta, caption: event.target.value })}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Category" htmlFor="meta-category" error={metaErrors.category}>
                <select
                  id="meta-category"
                  className="input"
                  value={meta.category}
                  onChange={(event) => setMeta({ ...meta, category: event.target.value })}
                >
                  <option value="">Not set</option>
                  {GALLERY_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="flex items-end">
                <label className="flex items-center gap-2.5 pb-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-hairline bg-base/60 accent-cyan"
                    checked={meta.is_published}
                    onChange={(event) => setMeta({ ...meta, is_published: event.target.checked })}
                  />
                  Published on the site
                </label>
              </div>
            </div>

            {editing && editing.storage_path && (
              <p className="flex items-center gap-2 border-t border-hairline pt-4 text-2xs text-faint">
                <GripVertical className="h-3 w-3" aria-hidden />
                Stored at <span className="font-mono">{editing.storage_path}</span>
              </p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this image?"
        message={`"${deleting?.title ?? ""}" will be removed from the gallery and deleted from storage. This cannot be undone.`}
        confirmLabel="Delete image"
        destructive
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
