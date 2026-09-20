import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";

export interface CrudField<T> {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox" | "date" | "url";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  colSpan?: 1 | 2;
  defaultValue?: (item: T | null) => unknown;
}

interface CrudPageProps<T extends { id: string }> {
  title: string;
  description?: string;
  entityName: string;
  queryKey: unknown[];
  fetcher: () => Promise<T[]>;
  columns: { key: string; header: string; render: (row: T) => ReactNode }[];
  mobileCard?: (row: T) => ReactNode;
  searchKeys?: string[];
  fields: CrudField<T>[];
  toPayload: (values: Record<string, unknown>, editing: T | null) => Record<string, unknown>;
  upsert: (payload: Record<string, unknown>) => Promise<unknown>;
  remove?: (id: string) => Promise<unknown>;
  extraToolbar?: ReactNode;
}

export function CrudPage<T extends { id: string }>({
  title,
  description,
  entityName,
  queryKey,
  fetcher,
  columns,
  mobileCard,
  searchKeys,
  fields,
  toPayload,
  upsert,
  remove,
  extraToolbar,
}: CrudPageProps<T>) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey, queryFn: fetcher });
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  function openCreate() {
    const initial: Record<string, unknown> = {};
    for (const f of fields) initial[f.name] = f.defaultValue ? f.defaultValue(null) : defaultFor(f.type);
    setValues(initial);
    setEditing(null);
    setCreating(true);
    setError(null);
  }

  function openEdit(item: T) {
    const initial: Record<string, unknown> = {};
    for (const f of fields) {
      const v = (item as unknown as Record<string, unknown>)[f.name];
      initial[f.name] = v ?? (f.defaultValue ? f.defaultValue(item) : defaultFor(f.type));
    }
    setValues(initial);
    setEditing(item);
    setCreating(true);
    setError(null);
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = toPayload(values, editing);
      await upsert(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setCreating(false);
    },
    onError: (e: Error) => setError(e.message || "Could not save. Please try again."),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (deleting && remove) await remove(deleting.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setDeleting(null);
    },
    onError: (e: Error) => setError(e.message || "Could not delete."),
  });

  const filtered = (data ?? []).filter((row) => {
    if (!search.trim() || !searchKeys?.length) return true;
    const q = search.toLowerCase();
    return searchKeys.some((k) => {
      const v = (row as unknown as Record<string, unknown>)[k];
      return typeof v === "string" && v.toLowerCase().includes(q);
    });
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        <div className="flex gap-2">
          {extraToolbar}
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4" aria-hidden /> Add {entityName}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? "No matches" : `No ${entityName.toLowerCase()}s yet`}
          hint={search ? "Try a different search term." : `Add your first ${entityName.toLowerCase()} to get started.`}
          action={
            !search ? (
              <Button variant="outline" size="sm" className="mt-2" onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden /> Add {entityName}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {searchKeys && searchKeys.length > 0 && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${entityName.toLowerCase()}s…`}
              aria-label={`Search ${entityName.toLowerCase()}s`}
              className="input mb-4 max-w-sm"
            />
          )}
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <div key={row.id} className="rounded-xl border border-lightgray bg-white p-4 shadow-card">
                {mobileCard ? mobileCard(row) : columns.map((c) => (
                  <div key={c.key} className="flex justify-between gap-3 py-1 text-sm">
                    <span className="text-muted">{c.header}</span>
                    <span className="text-right font-medium">{c.render(row)}</span>
                  </div>
                ))}
                <div className="mt-3 flex gap-2 border-t border-lightgray pt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(row)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                  </Button>
                  {remove && (
                    <Button variant="danger" size="sm" onClick={() => setDeleting(row)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="table-scroll hidden rounded-xl border border-lightgray bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-lightgray bg-offwhite">
                  {columns.map((c) => (
                    <th key={c.key} scope="col" className="px-4 py-3 font-display text-xs font-bold uppercase tracking-wide text-muted">
                      {c.header}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-display text-xs font-bold uppercase tracking-wide text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-lightgray/70 last:border-0 hover:bg-navy/[0.02]">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3">{c.render(row)}</td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="rounded-lg border border-lightgray p-2 text-navy hover:bg-offwhite"
                          aria-label={`Edit row`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        {remove && (
                          <button
                            type="button"
                            onClick={() => setDeleting(row)}
                            className="rounded-lg border border-error/25 p-2 text-error hover:bg-error/[0.06]"
                            aria-label="Delete row"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create/Edit modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title={`${editing ? "Edit" : "Add"} ${entityName}`} wide>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            save.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.colSpan === 2 ? "sm:col-span-2" : ""}>
                {f.type !== "checkbox" && (
                  <label htmlFor={`f-${f.name}`} className="mb-1.5 block text-sm font-semibold text-ink">
                    {f.label}
                    {f.required && " *"}
                  </label>
                )}
                {f.type === "textarea" ? (
                  <textarea
                    id={`f-${f.name}`}
                    rows={3}
                    className="input"
                    placeholder={f.placeholder}
                    value={(values[f.name] as string) ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                ) : f.type === "select" ? (
                  <select
                    id={`f-${f.name}`}
                    className="input"
                    value={(values[f.name] as string) ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      id={`f-${f.name}`}
                      type="checkbox"
                      className="h-4 w-4 rounded border-lightgray text-saffron focus:ring-saffron"
                      checked={(values[f.name] as boolean) ?? false}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked }))}
                    />
                    {f.label}
                  </label>
                ) : (
                  <input
                    id={`f-${f.name}`}
                    type={f.type ?? "text"}
                    className="input"
                    placeholder={f.placeholder}
                    value={(values[f.name] as string | number) ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        [f.name]: f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value,
                      }))
                    }
                  />
                )}
                {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
              </div>
            ))}
          </div>
          {error && <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-lightgray pt-4">
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Saving…</> : `Save ${entityName}`}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${entityName.toLowerCase()}?`}
        message={`This will permanently remove this ${entityName.toLowerCase()}. Consider archiving instead if the option is available.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => del.mutate()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function defaultFor(type?: CrudField<never>["type"]): unknown {
  switch (type) {
    case "checkbox": return false;
    case "number": return "";
    default: return "";
  }
}
