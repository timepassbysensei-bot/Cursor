import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { adminService, logAdminAction } from "../../services/admin";
import { extractYouTubeId, youtubeThumbnail, youtubeWatchUrl } from "../../lib/youtube";
import { GAMES, VIDEO_CATEGORIES } from "../../lib/options";
import { cn, errorMessage, formatDate } from "../../lib/utils";
import { videoSchema, type VideoFormInput } from "../../validation/schemas";
import { PageHeader } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog, Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import type { Video } from "../../types";

interface FormState {
  youtube_url: string;
  title: string;
  description: string;
  game: string;
  category: string;
  duration_text: string;
  published_at: string;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  youtube_url: "",
  title: "",
  description: "",
  game: GAMES[0],
  category: VIDEO_CATEGORIES[0],
  duration_text: "",
  published_at: new Date().toISOString().slice(0, 10),
  is_featured: false,
  is_published: true,
  sort_order: 0,
};

export default function AdminVideos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Video | null>(null);
  const [search, setSearch] = useState("");
  const [game, setGame] = useState("All");
  const [category, setCategory] = useState("All");

  useSeo({ title: "Videos — Arian studio", description: "Manage YouTube videos.", noIndex: true });

  const videosQuery = useQuery({
    queryKey: ["admin-videos"],
    queryFn: () => adminService.videos(),
    enabled: isSupabaseConfigured,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    queryClient.invalidateQueries({ queryKey: ["public-videos"] });
    queryClient.invalidateQueries({ queryKey: ["featured-video"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const save = useMutation({
    mutationFn: async (values: VideoFormInput) => {
      const youtubeId = extractYouTubeId(values.youtube_url);
      if (!youtubeId) throw new Error("That does not look like a YouTube link.");

      await adminService.upsertVideo({
        ...(editing ? { id: editing.id } : {}),
        youtube_url: youtubeWatchUrl(youtubeId),
        youtube_id: youtubeId,
        // Thumbnails come from YouTube's documented pattern; the admin never
        // has to paste an image URL.
        thumbnail_url: youtubeThumbnail(youtubeId, "hqdefault"),
        title: values.title,
        description: values.description || null,
        game: values.game || null,
        category: values.category || null,
        duration_text: values.duration_text || null,
        published_at: new Date(`${values.published_at}T12:00:00`).toISOString(),
        sort_order: values.sort_order,
        is_featured: values.is_featured,
        is_published: values.is_published,
      });

      if (editing && editing.is_featured !== values.is_featured) {
        await adminService.setFeaturedBatch(editing.id, values.is_featured);
      }

      if (user) {
        await logAdminAction({
          adminUserId: user.id,
          action: editing ? "video.updated" : "video.created",
          entityType: "videos",
          entityId: editing?.id ?? youtubeId,
          details: { title: values.title },
        });
      }
    },
    onSuccess: () => {
      invalidate();
      setForm(null);
      setEditing(null);
      push({ title: editing ? "Video updated" : "Video added", variant: "success" });
    },
    onError: (error: Error) => {
      push({ title: "Could not save the video", description: errorMessage(error), variant: "error" });
    },
  });

  const remove = useMutation({
    mutationFn: (video: Video) => adminService.deleteVideo(video.id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      push({ title: "Video deleted", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not delete", description: errorMessage(error), variant: "error" }),
  });

  const feature = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      adminService.setFeaturedBatch(id, featured),
    onSuccess: () => {
      invalidate();
      push({ title: "Featured video updated", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not update", description: errorMessage(error), variant: "error" }),
  });

  const reorder = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: -1 | 1 }) => {
      const list = videosQuery.data ?? [];
      const index = list.findIndex((video) => video.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= list.length) return;
      const reordered = [...list];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      await adminService.reorderVideos(reordered.map((video, order) => ({ id: video.id, sort_order: order })));
    },
    onSuccess: invalidate,
    onError: (error: Error) =>
      push({ title: "Could not reorder", description: errorMessage(error), variant: "error" }),
  });

  const videos = useMemo(() => videosQuery.data ?? [], [videosQuery.data]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return videos.filter((video) => {
      if (game !== "All" && video.game !== game) return false;
      if (category !== "All" && video.category !== category) return false;
      if (!needle) return true;
      return video.title.toLowerCase().includes(needle);
    });
  }, [videos, search, game, category]);

  const openCreate = () => {
    setEditing(null);
    setFieldErrors({});
    setForm({ ...EMPTY_FORM, sort_order: videos.length });
  };

  const openEdit = (video: Video) => {
    setEditing(video);
    setFieldErrors({});
    setForm({
      youtube_url: video.youtube_url || (video.youtube_id ? youtubeWatchUrl(video.youtube_id) : ""),
      title: video.title,
      description: video.description ?? "",
      game: video.game ?? "",
      category: video.category ?? "",
      duration_text: video.duration_text ?? "",
      published_at: video.published_at.slice(0, 10),
      is_featured: video.is_featured,
      is_published: video.is_published,
      sort_order: video.sort_order,
    });
  };

  const submitForm = () => {
    if (!form) return;
    const parsed = videoSchema.safeParse(form);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    save.mutate(parsed.data);
  };

  const derivedId = form ? extractYouTubeId(form.youtube_url) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Videos"
        description="Paste a YouTube link and the rest is derived: the video id and the thumbnail come straight from YouTube, so nothing needs scraping."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add video
          </Button>
        }
      />

      <Panel className="p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label htmlFor="video-search" className="label">
                Search titles
              </label>
              <input
                id="video-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input"
                placeholder="Search videos…"
              />
            </div>
            <div className="sm:w-48">
              <p className="label">Game</p>
              <select className="input" value={game} onChange={(event) => setGame(event.target.value)}>
                <option value="All">All games</option>
                {GAMES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:w-48">
              <p className="label">Category</p>
              <select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="All">All categories</option>
                {VIDEO_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-faint">
            {videosQuery.isLoading ? "Loading…" : `${filtered.length} of ${videos.length} videos`}
          </p>
        </div>
      </Panel>

      <div className="mt-6">
        {videosQuery.isLoading ? (
          <LoadingState label="Loading videos…" />
        ) : videosQuery.isError ? (
          <ErrorState title="Videos could not load" onRetry={() => void videosQuery.refetch()} />
        ) : videos.length === 0 ? (
          <EmptyState
            title="No videos yet"
            hint="Add your first YouTube link — it appears on the homepage and in the video library immediately."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add video
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No videos match" hint="Try a different search or clear the filters." />
        ) : (
          <ul className="space-y-3">
            {filtered.map((video) => {
              const index = videos.findIndex((item) => item.id === video.id);
              return (
                <li key={video.id}>
                  <Panel className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-hairline bg-base/60">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-2xs text-faint">No image</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-display text-sm font-semibold text-ink">{video.title}</p>
                        {video.is_featured && <Badge tone="violet">Featured</Badge>}
                        {!video.is_published && <Badge tone="amber">Draft</Badge>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-faint">
                        {video.game && <span className="text-blue">{video.game}</span>}
                        {video.category && <span className="text-cyan">{video.category}</span>}
                        {video.duration_text && <span>{video.duration_text}</span>}
                        <span>{formatDate(video.published_at)}</span>
                        <span>order {index + 1}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <IconButton
                        label="Move up"
                        onClick={() => reorder.mutate({ id: video.id, direction: -1 })}
                        disabled={index === 0 || reorder.isPending}
                      >
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                      </IconButton>
                      <IconButton
                        label="Move down"
                        onClick={() => reorder.mutate({ id: video.id, direction: 1 })}
                        disabled={index === videos.length - 1 || reorder.isPending}
                      >
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                      </IconButton>
                      <IconButton
                        label={video.is_featured ? "Remove featured" : "Mark as featured"}
                        onClick={() => feature.mutate({ id: video.id, featured: !video.is_featured })}
                        variant={video.is_featured ? "primary" : "secondary"}
                      >
                        <Star className={cn("h-3.5 w-3.5", video.is_featured && "fill-base")} aria-hidden />
                      </IconButton>
                      {video.youtube_id && (
                        <a
                          href={youtubeWatchUrl(video.youtube_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open on YouTube"
                          title="Open on YouTube"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-hairline text-muted transition-colors hover:border-cyan/50 hover:text-ink"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      )}
                      <IconButton label="Edit video" onClick={() => openEdit(video)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </IconButton>
                      <IconButton label="Delete video" variant="danger" onClick={() => setDeleting(video)}>
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

      {/* Add / edit */}
      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={editing ? "Edit video" : "Add a video"}
        description="Paste the YouTube link — the id and thumbnail are derived from it."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button onClick={submitForm} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {editing ? "Save changes" : "Add video"}
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-5">
            <Field
              label="YouTube link"
              htmlFor="video-url"
              error={fieldErrors.youtube_url}
              hint="watch?v=…, youtu.be/…, /shorts/… or just the 11-character id."
              required
            >
              <input
                id="video-url"
                className="input"
                placeholder="https://www.youtube.com/watch?v=…"
                value={form.youtube_url}
                onChange={(event) => setForm({ ...form, youtube_url: event.target.value })}
              />
            </Field>

            {derivedId && (
              <div className="flex items-center gap-3 rounded-xl border border-hairline bg-white/[0.02] p-3">
                <img
                  src={youtubeThumbnail(derivedId, "hqdefault")}
                  alt=""
                  className="h-14 w-24 rounded-lg border border-hairline object-cover"
                />
                <div className="min-w-0 text-xs">
                  <p className="font-medium text-ink">Video id detected</p>
                  <p className="mt-0.5 truncate font-mono text-2xs text-faint">{derivedId}</p>
                </div>
              </div>
            )}

            <Field label="Title" htmlFor="video-title" error={fieldErrors.title} required>
              <input
                id="video-title"
                className="input"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </Field>

            <Field label="Description" htmlFor="video-description" error={fieldErrors.description}>
              <textarea
                id="video-description"
                rows={3}
                className="input"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="A short line shown under the title on the site."
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Game" htmlFor="video-game" error={fieldErrors.game}>
                <select
                  id="video-game"
                  className="input"
                  value={form.game}
                  onChange={(event) => setForm({ ...form, game: event.target.value })}
                >
                  <option value="">Not set</option>
                  {GAMES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Category" htmlFor="video-category" error={fieldErrors.category}>
                <select
                  id="video-category"
                  className="input"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  <option value="">Not set</option>
                  {VIDEO_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Duration"
                htmlFor="video-duration"
                error={fieldErrors.duration_text}
                hint="mm:ss or hh:mm:ss — optional"
              >
                <input
                  id="video-duration"
                  className="input"
                  placeholder="14:05"
                  value={form.duration_text}
                  onChange={(event) => setForm({ ...form, duration_text: event.target.value })}
                />
              </Field>

              <Field label="Publish date" htmlFor="video-date" error={fieldErrors.published_at} required>
                <input
                  id="video-date"
                  type="date"
                  className="input"
                  value={form.published_at}
                  onChange={(event) => setForm({ ...form, published_at: event.target.value })}
                />
              </Field>

              <Field label="Sort order" htmlFor="video-order" error={fieldErrors.sort_order} hint="Lower shows first.">
                <input
                  id="video-order"
                  type="number"
                  min={0}
                  className="input"
                  value={form.sort_order}
                  onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-6 border-t border-hairline pt-5">
              <label className="flex items-center gap-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-hairline bg-base/60 accent-cyan"
                  checked={form.is_published}
                  onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
                />
                Published on the site
              </label>
              <label className="flex items-center gap-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-hairline bg-base/60 accent-cyan"
                  checked={form.is_featured}
                  onChange={(event) => setForm({ ...form, is_featured: event.target.checked })}
                />
                Featured on the homepage
              </label>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this video?"
        message={`"${deleting?.title ?? ""}" will be removed from the studio and from the public site. This cannot be undone.`}
        confirmLabel="Delete video"
        destructive
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
