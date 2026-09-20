import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, Loader2, Upload } from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Card, Badge } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { fetchTeacherBatches, uploadResourceFile } from "../../services/staff";
import { formatDate } from "../../lib/utils";

interface ResourceRow {
  id: string;
  title: string;
  description: string | null;
  url: string;
  kind: string;
  batch_id: string | null;
  created_at: string;
}

export default function TeacherResources() {
  const { profile } = useAuth();
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState("link");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const batchesQ = useQuery({
    queryKey: ["teacher", "batches", profile?.id],
    queryFn: () => fetchTeacherBatches(profile!.role, profile!.id),
    enabled: Boolean(profile),
  });

  useEffect(() => {
    if (!batchId && batchesQ.data && batchesQ.data.length > 0) setBatchId(batchesQ.data[0].id);
  }, [batchesQ.data, batchId]);

  const resourcesQ = useQuery({
    queryKey: ["teacher", "resources", batchId],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("resources")
        .select("*")
        .eq("batch_id", batchId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (err) throw err;
      return (data ?? []) as ResourceRow[];
    },
    enabled: Boolean(batchId),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Enter a title");
    if (!url.trim()) return setError("Provide a link or upload a file first");
    setBusy(true);
    try {
      const { error: err } = await supabase.from("resources").insert({
        title: title.trim(),
        url: url.trim(),
        kind,
        batch_id: batchId,
        visibility: "students",
        uploaded_by: profile?.id,
      });
      if (err) throw err;
      setTitle(""); setUrl("");
      setMessage("Shared with the batch ✓");
      setTimeout(() => setMessage(null), 2500);
      resourcesQ.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share the resource.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const publicUrl = await uploadResourceFile(file, "resources");
      setUrl(publicUrl);
      setKind(file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "note");
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (batchesQ.isLoading) return <LoadingState />;
  if (batchesQ.isError) return <ErrorState onRetry={() => batchesQ.refetch()} />;
  const batches = batchesQ.data ?? [];

  return (
    <div>
      <PageHeader
        title="Resources"
        description="Share notes, PDFs, videos or links with a batch. Students see these in their Resources page."
      />

      {batches.length === 0 ? (
        <EmptyState icon={<FolderOpen className="h-8 w-8 text-muted/60" aria-hidden />} title="No batches assigned" hint="The office assigns batches to teachers." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-4 max-w-sm">
              <label htmlFor="res-batch" className="mb-1.5 block text-sm font-semibold text-ink">Batch</label>
              <select id="res-batch" className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {resourcesQ.isLoading ? (
              <LoadingState />
            ) : resourcesQ.isError ? (
              <ErrorState onRetry={() => resourcesQ.refetch()} />
            ) : !resourcesQ.data || resourcesQ.data.length === 0 ? (
              <EmptyState
                icon={<FolderOpen className="h-8 w-8 text-muted/60" aria-hidden />}
                title="Nothing shared yet"
                hint="Use the form to share the first resource with this batch."
              />
            ) : (
              <ul className="space-y-3">
                {resourcesQ.data.map((r) => (
                  <Card as="li" key={r.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">{r.title}</p>
                      <p className="text-xs text-muted">{formatDate(r.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="navy">{r.kind}</Badge>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-saffron underline">
                        Open
                      </a>
                    </div>
                  </Card>
                ))}
              </ul>
            )}
          </div>

          <Card className="h-fit p-5">
            <h2 className="font-display text-base font-bold text-navy">Share a resource</h2>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="res-title" className="mb-1.5 block text-sm font-semibold text-ink">Title *</label>
                <input id="res-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label htmlFor="res-file" className="mb-1.5 block text-sm font-semibold text-ink">Upload file</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-lightgray px-4 py-4 text-sm font-semibold text-navy hover:border-navy/40">
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Uploading…</> : <><Upload className="h-4 w-4" aria-hidden /> Choose file</>}
                  <input
                    ref={fileRef}
                    id="res-file"
                    type="file"
                    className="sr-only"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </label>
              </div>
              <div>
                <label htmlFor="res-url" className="mb-1.5 block text-sm font-semibold text-ink">Or paste a link *</label>
                <input id="res-url" type="url" className="input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
              <div>
                <label htmlFor="res-kind" className="mb-1.5 block text-sm font-semibold text-ink">Type</label>
                <select id="res-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="link">Link</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="note">Note</option>
                </select>
              </div>
              {message && <p role="status" className="rounded-lg border border-green-success/25 bg-green-success/[0.06] px-4 py-3 text-sm text-green-success">{message}</p>}
              {error && <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy || uploading}>
                {busy ? "Sharing…" : "Share with Batch"}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
