import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "../../lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKeys?: string[];
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  mobileCard?: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKeys,
  searchPlaceholder = "Search…",
  pageSize = 10,
  emptyMessage = "No records found",
  mobileCard,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!query.trim() || !searchKeys?.length) return data;
    const q = query.trim().toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => {
        const v = (row as unknown as Record<string, unknown>)[k];
        return typeof v === "string" && v.toLowerCase().includes(q);
      })
    );
  }, [data, query, searchKeys]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <div className="space-y-3">
      {searchKeys && searchKeys.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="dt-search" className="sr-only">{searchPlaceholder}</label>
          <input
            id="dt-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="input pl-9"
          />
        </div>
      )}

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {pageRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-lightgray bg-white px-4 py-8 text-center text-sm text-muted">
            {emptyMessage}
          </p>
        ) : (
          pageRows.map((row) => (
            <div key={row.id} className="rounded-xl border border-lightgray bg-white p-4 shadow-card">
              {mobileCard ? mobileCard(row) : columns.map((c) => (
                <div key={c.key} className="flex justify-between gap-3 py-1 text-sm">
                  <span className="font-medium text-muted">{c.header}</span>
                  <span className="text-right">{c.render(row)}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="table-scroll hidden rounded-xl border border-lightgray bg-white shadow-card md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-lightgray bg-offwhite">
              {columns.map((c) => (
                <th key={c.key} scope="col" className="px-4 py-3 font-display text-xs font-bold uppercase tracking-wide text-muted">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted">{emptyMessage}</td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className="border-b border-lightgray/70 last:border-0 hover:bg-navy/[0.02]">
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Page {safePage + 1} of {pageCount} · {filtered.length} records
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded-lg border border-lightgray bg-white px-2.5 py-1.5 hover:bg-offwhite disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded-lg border border-lightgray bg-white px-2.5 py-1.5 hover:bg-offwhite disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
