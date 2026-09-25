import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Film,
  Loader2,
  Pencil,
  Play,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { logAdminAction } from "../../services/admin";
import {
  deleteSiteMedia,
  fetchSiteMediaLibrary,
  MEDIA_MAX_BYTES,
  activateSiteMedia,
  SITE_MEDIA_SLOTS,
  updateSiteMedia,
  uploadSiteMedia,
  type SiteMedia,
  type SiteMediaSlot,
} from "../../services/siteMedia";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { errorMessage, formatBytes, formatDate } from "../../lib/utils";
import { PageHeader } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog, Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { EmptyState, ErrorState, LoadingState, ProgressBar } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";

const SLOT_MOOD: Record<SiteMediaSlot, string> = {
  hero_video: "text-cyan",
  genshin: "text-mint",
  wuthering: "text-cyan",
  section: "text-violet",
};

interface UploadForm {
  slot: SiteMediaSlot;
  file: File | null;
  poster: File | null;
  title: string;
  altText: string;
}

const EMPTY_UPLOAD: UploadForm = {
  slot: "hero_video",
  file: null,
  poster: null,
  title: "",
  altText: "",
};

export default function AdminMedia() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [upload, setUpload] = useState<UploadForm>(EMPTY_UPLOAD);
  const [progress, setProgress] = useState<number | null>(null);
  const [editing, setEditing] = useState<SiteMedia | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [deleting, setDeleting] = useState<SiteMedia | null>(null);

  useSeo({ title: "Background media — Arian studio", noIndex: true, description: "Manage hero and section media." });

  const libraryQuery = useQuery({
    queryKey: ["site-media-library"],
    queryFn: fetchSiteMediaLibrary,
    enabled: isSupabaseConfigured,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["site-media-library"] });
    queryClient.invalidateQueries({ queryKey: ["site-media", "hero_video"] });
  };

  const activeBySlot = useMemo(() => {
    const map = new Map<SiteMediaSlot, SiteMedia>();
    for (const row of libraryQuery.data ?? []) {
      if (row.is_active && !map.has(row.slot)) map.set(row.slot, row);
    }
    return map;
  }, [libraryQuery.data]);

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!upload.file) throw new Error("Choose a file first.");
      return uploadSiteMedia({
        file: upload.file,
        slot: upload.slot,
        title: upload.title.trim() || upload.file.name,
        altText: upload.altText.trim() || upload.title.trim() || upload.file.name,
        poster: upload.poster,
        onProgress: setProgress,
      });
    },
    onSuccess: (row) => {
      invalidate();
      setUpload(EMPTY_UPLOAD);
      setProgress(null);
      push({ title: "Media uploaded", description: `${row.title} is now active for its slot.`, variant: "success" });
      if (user) {
        void logAdminAction({
          adminUserId: user.id,
          action: "site_media.uploaded",
          entityType: "site_media",
          entityId: row.id,
          details: { slot: row.slot, kind: row.media_kind },
        });
      }
    },
    onError: (error: Error) => {
      setProgress(null);
      push({ title: "Upload failed", description: errorMessage(error), variant: "error" });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ row, title, altText }: { row: SiteMedia; title: string; altText: string }) =>
      updateSiteMedia(row.id, { title: title.trim() || row.title, alt_text: altText.trim() || row.alt_text }),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      push({ title: "Media updated", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not update", description: errorMessage(error), variant: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (row: SiteMedia) => deleteSiteMedia(row),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      push({ title: "Media deleted", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not delete", description: errorMessage(error), variant: "error" }),
  });

  const activateMutation = useMutation({
    mutationFn: (row: SiteMedia) => activateSiteMedia(row),
    onSuccess: () => {
      invalidate();
      push({ title: "Background activated", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not activate", description: errorMessage(error), variant: "error" }),
  });

  const library = libraryQuery.data ?? [];
  const selectedSlot = upload.slot;
  const slotMeta = SITE_MEDIA_SLOTS.find((slot) => slot.value === selectedSlot);
  const slotRequiresPoster = selectedSlot === "hero_video";

  const submit = () => {
    if (!upload.file) {
      push({ title: "Choose a file first", variant: "error" });
      return;
    }
    uploadMutation.mutate();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Studio"
        title="Background media"
        description="Upload the hero background loop and section visuals. Files live in Supabase Storage; the active item per slot is what the public site renders."
      />

      {!isSupabaseConfigured && (
        <div className="mb-6 rounded-2xl border border-gold/25 bg-gold/[0.07] p-4 text-sm leading-relaxed text-muted" role="status">
          <p className="font-display font-semibold text-gold">Storage is not connected yet</p>
          <p className="mt-1">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, run the migrations (the{" "}
            <code>site_media</code> table and <code>media</code> bucket are created by{" "}
            <code>20250601000200_site_media.sql</code>), then reload this page.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        {/* Upload panel */}
        <Panel className="p-6">
          <h2 className="font-display text-base font-semibold text-ink">Upload new media</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            MP4 or WebM up to {Math.round(MEDIA_MAX_BYTES / 1024 / 1024)} MB. Posters are optional but recommended
            — they show while the video loads and on slow connections.
          </p>

          <div className="mt-5 space-y-5">
            <Field label="Slot" htmlFor="media-slot">
              <select
                id="media-slot"
                className="input"
                value={upload.slot}
                onChange={(event) => setUpload({ ...upload, slot: event.target.value as SiteMediaSlot })}
              >
                {SITE_MEDIA_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </Field>
            {slotMeta && <p className="-mt-2 text-2xs text-faint">{slotMeta.hint}</p>}

            <Field label="File" htmlFor="media-file" required>
              <input
                id="media-file"
                type="file"
                accept={selectedSlot === "hero_video" ? "video/mp4,video/webm" : "image/*"}
                className="input file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-ink"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setUpload((current) => ({ ...current, file }));
                }}
              />
            </Field>
            {upload.file && (
              <p className="-mt-2 text-2xs text-faint">
                {upload.file.type || "Unknown type"} · {formatBytes(upload.file.size)}
              </p>
            )}

            {slotRequiresPoster && (
              <Field label="Poster image" htmlFor="media-poster" optionalLabel="optional but recommended">
                <input
                  id="media-poster"
                  type="file"
                  accept="image/*"
                  className="input file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-ink"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setUpload((current) => ({ ...current, poster: file }));
                  }}
                />
              </Field>
            )}

            <Field label="Title" htmlFor="media-title" hint="Shown only in this manager.">
              <input
                id="media-title"
                className="input"
                placeholder={upload.file?.name ?? "A label for this asset"}
                value={upload.title}
                onChange={(event) => setUpload({ ...upload, title: event.target.value })}
              />
            </Field>

            <Field label="Alt text" htmlFor="media-alt" hint="Describes the visual for screen readers.">
              <input
                id="media-alt"
                className="input"
                value={upload.altText}
                onChange={(event) => setUpload({ ...upload, altText: event.target.value })}
              />
            </Field>

            {typeof progress === "number" && (
              <ProgressBar
                value={progress}
                label={`${Math.round(progress)}% uploaded`}
                tone="cyan"
              />
            )}

            <Button onClick={submit} disabled={uploadMutation.isPending || !upload.file}>
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
              )}
              {uploadMutation.isPending ? "Uploading…" : "Upload and activate"}
            </Button>
          </div>
        </Panel>

        {/* Library */}
        <div>
          <h2 className="font-display text-base font-semibold text-ink">Media library</h2>
          <p className="mt-1.5 text-xs text-muted">
            {libraryQuery.isLoading
              ? "Loading…"
              : `${library.length} item${library.length === 1 ? "" : "s"} stored · ${
                  activeBySlot.size
                } of ${SITE_MEDIA_SLOTS.length} slots active`}
          </p>

          <div className="mt-4">
            {libraryQuery.isLoading ? (
              <LoadingState label="Loading media…" />
            ) : libraryQuery.isError ? (
              <ErrorState
                title="Media could not load"
                hint={errorMessage(libraryQuery.error)}
                onRetry={() => void libraryQuery.refetch()}
              />
            ) : library.length === 0 ? (
              <EmptyState
                icon={<Film className="h-5 w-5 text-faint" aria-hidden />}
                title="No background media yet"
                hint="The public site falls back to its animated gradient until something is uploaded here."
              />
            ) : (
              <ul className="space-y-3">
                {library.map((row) => {
                  const isActive = row.is_active;
                  const slotLabel = SITE_MEDIA_SLOTS.find((slot) => slot.value === row.slot)?.label ?? row.slot;
                  return (
                    <li key={row.id}>
                      <Panel className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-hairline bg-base/60">
                          {row.media_kind === "video" ? (
                            row.poster_url ? (
                              <img src={row.poster_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full items-center justify-center text-coral">
                                <Play className="h-6 w-6" aria-hidden />
                              </span>
                            )
                          ) : (
                            <img src={row.public_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-display text-sm font-semibold text-ink">{row.title}</p>
                            {isActive && <Badge tone="jade">Active</Badge>}
                            <Badge tone={row.media_kind === "video" ? "cyan" : "neutral"}>
                              {row.media_kind === "video" ? "Video" : "Image"}
                            </Badge>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-faint">
                            <span className={SLOT_MOOD[row.slot]}>{slotLabel}</span>
                            <span>{row.mime_type ?? "unknown type"}</span>
                            <span>{formatBytes(row.file_size_bytes)}</span>
                            <span>{formatDate(row.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {!isActive && (
                            <IconButton
                              label="Make active"
                              onClick={() => activateMutation.mutate(row)}
                              disabled={activateMutation.isPending}
                            >
                              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                            </IconButton>
                          )}
                          <IconButton
                            label="Edit title and alt text"
                            onClick={() => {
                              setEditing(row);
                              setEditTitle(row.title);
                              setEditAlt(row.alt_text);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </IconButton>
                          <IconButton label="Delete media" variant="danger" onClick={() => setDeleting(row)}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </IconButton>
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

      {/* Edit metadata */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit media details"
        description="Titles and alt text describe the asset inside the studio; alt text also feeds the hero image fallback."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={editMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => editing && editMutation.mutate({ row: editing, title: editTitle, altText: editAlt })}
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Title" htmlFor="edit-media-title">
            <input
              id="edit-media-title"
              className="input"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
            />
          </Field>
          <Field label="Alt text" htmlFor="edit-media-alt">
            <input
              id="edit-media-alt"
              className="input"
              value={editAlt}
              onChange={(event) => setEditAlt(event.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this media?"
        message={`"${deleting?.title ?? ""}" is removed from the library and from storage. The public site falls back to its animated gradient. This cannot be undone.`}
        confirmLabel="Delete media"
        destructive
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
