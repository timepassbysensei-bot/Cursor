import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Music4, Pause, Play, Trash2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { adminService, logAdminAction } from "../../services/admin";
import { removeStorageObject, uploadAudioTrack } from "../../services/uploads";
import { audioMetaSchema } from "../../validation/schemas";
import { errorMessage, formatBytes, formatDate } from "../../lib/utils";
import { PageHeader } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog, Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { MediaUploader } from "../../components/MediaUploader";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import type { AudioTrack } from "../../types";

export default function AdminAudio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [pending, setPending] = useState<{
    storage_path: string;
    public_url: string;
    file_size_bytes: number;
    title: string;
    artist: string;
  } | null>(null);
  const [metaErrors, setMetaErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<AudioTrack | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  useSeo({ title: "Audio — Arian studio", description: "Upload and manage background music.", noIndex: true });

  const tracksQuery = useQuery({
    queryKey: ["admin-audio"],
    queryFn: () => adminService.audioTracks(),
    enabled: isSupabaseConfigured,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-audio"] });
    queryClient.invalidateQueries({ queryKey: ["audio-track"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await uploadAudioTrack(file);
      setPending({
        storage_path: uploaded.path,
        public_url: uploaded.publicUrl,
        file_size_bytes: uploaded.sizeBytes,
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        artist: "",
      });
    },
    onError: (error: Error) => push({ title: "Upload failed", description: errorMessage(error), variant: "error" }),
  });

  const saveMeta = useMutation({
    mutationFn: async () => {
      if (!pending) return;
      await adminService.insertAudioTrack({
        storage_path: pending.storage_path,
        public_url: pending.public_url,
        title: pending.title,
        artist: pending.artist || null,
        file_size_bytes: pending.file_size_bytes,
      });
      if (user) {
        await logAdminAction({
          adminUserId: user.id,
          action: "audio.uploaded",
          entityType: "audio_tracks",
          details: { title: pending.title },
        });
      }
    },
    onSuccess: () => {
      invalidate();
      setPending(null);
      push({
        title: "Track uploaded",
        description: "Set it as the active track to hear it on the site.",
        variant: "success",
      });
    },
    onError: (error: Error) =>
      push({ title: "Could not save the track", description: errorMessage(error), variant: "error" }),
  });

  const setActive = useMutation({
    mutationFn: (id: string) => adminService.setActiveTrack(id),
    onSuccess: () => {
      invalidate();
      push({ title: "Active track updated", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not set the active track", description: errorMessage(error), variant: "error" }),
  });

  const clearActive = useMutation({
    mutationFn: () => adminService.clearActiveTrack(),
    onSuccess: () => {
      invalidate();
      push({ title: "Background music turned off", variant: "success" });
    },
    onError: (error: Error) => push({ title: "Could not update", description: errorMessage(error), variant: "error" }),
  });

  const remove = useMutation({
    mutationFn: async (track: AudioTrack) => {
      await adminService.deleteAudioTrack(track.id);
      if (track.storage_path) await removeStorageObject("audio", track.storage_path).catch(() => undefined);
      if (user) {
        await logAdminAction({
          adminUserId: user.id,
          action: "audio.deleted",
          entityType: "audio_tracks",
          entityId: track.id,
        });
      }
    },
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      push({ title: "Track deleted", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not delete", description: errorMessage(error), variant: "error" }),
  });

  const tracks = tracksQuery.data ?? [];
  const activeTrack = tracks.find((track) => track.is_active) ?? null;

  const submitMeta = () => {
    if (!pending) return;
    const parsed = audioMetaSchema.safeParse({ title: pending.title, artist: pending.artist });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
      setMetaErrors(errors);
      return;
    }
    setMetaErrors({});
    saveMeta.mutate();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Audio"
        description="An optional background track for the public site. It never autoplays and starts muted — visitors opt in by pressing play."
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Panel className="p-5">
          <h2 className="font-display text-base font-semibold text-ink">Upload a track</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            MP3, WAV or OGG up to 25 MB. Upload only music you own or have permission to use.
          </p>
          <div className="mt-5">
            <MediaUploader
              kind="audio"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,.mp3"
              title="Drop an MP3 here"
              hint="One track at a time. The file is uploaded exactly as it is — no transcoding."
              disabled={!isSupabaseConfigured}
              onUpload={(file, onProgress) => upload.mutateAsync(file).then(() => onProgress(100))}
            />
          </div>

          <div className="mt-6 rounded-xl border border-hairline bg-white/[0.02] p-4">
            <p className="text-xs font-semibold text-ink">Rights notice</p>
            <p className="mt-1.5 text-2xs leading-relaxed text-faint">
              The player is public. Only upload music Arian owns or is licensed to use, and keep the credit line
              accurate — the artist field is shown under the track title.
            </p>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-ink">Library</h2>
            {activeTrack && (
              <Button variant="ghost" size="sm" onClick={() => clearActive.mutate()} disabled={clearActive.isPending}>
                Turn music off
              </Button>
            )}
          </div>

          <div className="mt-5">
            {tracksQuery.isLoading ? (
              <LoadingState label="Loading tracks…" />
            ) : tracksQuery.isError ? (
              <ErrorState title="Tracks could not load" onRetry={() => void tracksQuery.refetch()} />
            ) : tracks.length === 0 ? (
              <EmptyState
                icon={<Music4 className="h-5 w-5 text-faint" aria-hidden />}
                title="No tracks uploaded"
                hint="Upload an MP3 and set it active to add the optional player to the site."
              />
            ) : (
              <ul className="space-y-3">
                {tracks.map((track) => (
                  <li key={track.id}>
                    <div className="rounded-xl border border-hairline bg-white/[0.02] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-ink">{track.title}</p>
                            {track.is_active && (
                              <Badge tone="jade" icon={<CheckCircle2 className="h-3 w-3" aria-hidden />}>
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-2xs text-faint">
                            {track.artist ? `${track.artist} · ` : ""}
                            {formatBytes(track.file_size_bytes)} · {formatDate(track.created_at)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <IconButton
                            label={previewing === track.id ? "Stop preview" : "Preview track"}
                            onClick={() => setPreviewing(previewing === track.id ? null : track.id)}
                          >
                            {previewing === track.id ? (
                              <Pause className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <Play className="h-3.5 w-3.5" aria-hidden />
                            )}
                          </IconButton>
                          {!track.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActive.mutate(track.id)}
                              disabled={setActive.isPending}
                            >
                              Set active
                            </Button>
                          )}
                          <IconButton label="Delete track" variant="danger" onClick={() => setDeleting(track)}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </IconButton>
                        </div>
                      </div>

                      {previewing === track.id && (
                        <audio
                          controls
                          autoPlay
                          src={track.public_url}
                          className="mt-3 w-full"
                          aria-label={`Preview ${track.title}`}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>

      <Modal
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        title="Track details"
        description="This is what visitors see in the player."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPending(null)} disabled={saveMeta.isPending}>
              Discard upload
            </Button>
            <Button onClick={submitMeta} disabled={saveMeta.isPending}>
              Save track
            </Button>
          </>
        }
      >
        {pending && (
          <div className="space-y-5">
            <audio controls src={pending.public_url} className="w-full" aria-label="Preview of the uploaded track" />

            <Field label="Track title" htmlFor="audio-title" error={metaErrors.title} required>
              <input
                id="audio-title"
                className="input"
                value={pending.title}
                onChange={(event) => setPending({ ...pending, title: event.target.value })}
              />
            </Field>

            <Field
              label="Artist / credit"
              htmlFor="audio-artist"
              error={metaErrors.artist}
              hint="Shown under the title. Leave blank only if the track has no credit."
            >
              <input
                id="audio-artist"
                className="input"
                value={pending.artist}
                onChange={(event) => setPending({ ...pending, artist: event.target.value })}
              />
            </Field>

            <p className="text-2xs text-faint">{formatBytes(pending.file_size_bytes)}</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this track?"
        message={`"${deleting?.title ?? ""}" will be removed from the library and deleted from storage. If it is the active track, the site's music player disappears.`}
        confirmLabel="Delete track"
        destructive
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
