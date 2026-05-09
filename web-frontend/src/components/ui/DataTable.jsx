import { useMemo, useState, useEffect } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";

/**
 * Reusable premium data table.
 *
 * Props:
 *  - columns: Array<{
 *      key: string,                       // unique id
 *      header: string | ReactNode,
 *      accessor?: (row) => any,           // value used for sort & default cell
 *      cell?: (row) => ReactNode,         // custom cell renderer
 *      sortable?: boolean,                // default true
 *      align?: "left"|"right"|"center",   // default left
 *      width?: string,                    // CSS width (e.g. "120px")
 *      className?: string,                // extra td/th classes
 *      sticky?: boolean,                  // sticky right (e.g. Actions)
 *    }>
 *  - rows: any[]
 *  - rowKey: (row, idx) => key (default row.id ?? idx)
 *  - searchable?: boolean (default true)
 *  - searchPlaceholder?: string
 *  - searchKeys?: string[]                // accessor keys to scan; falls back to all string values
 *  - filterFn?: (row, query) => boolean   // custom filter overrides default
 *  - pageSize?: number (default 10) — set 0 to disable pagination
 *  - pageSizeOptions?: number[] (default [10, 25, 50, 100])
 *  - defaultSort?: { key: string, dir: "asc"|"desc" }
 *  - dense?: boolean
 *  - title?: ReactNode
 *  - subtitle?: ReactNode
 *  - toolbar?: ReactNode                  // custom actions shown right of search
 *  - emptyText?: string
 *  - className?: string
 */
export default function DataTable({
  columns,
  rows = [],
  rowKey,
  searchable = true,
  searchPlaceholder = "Search…",
  searchKeys,
  filterFn,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  defaultSort,
  dense = false,
  title,
  subtitle,
  toolbar,
  emptyText = "No records to display.",
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(defaultSort || null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize || rows.length || 10);

  useEffect(() => { setPage(0); }, [query, pageSize, rows.length]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    if (filterFn) return rows.filter((r) => filterFn(r, q));
    return rows.filter((r) => {
      if (searchKeys && searchKeys.length) {
        return searchKeys.some((k) => String(r?.[k] ?? "").toLowerCase().includes(q));
      }
      return Object.values(r || {}).some((v) =>
        v != null && typeof v !== "object" && String(v).toLowerCase().includes(q),
      );
    });
  }, [rows, query, searchKeys, filterFn]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const acc = col.accessor || ((r) => r?.[col.key]);
    const dir = sort.dir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const av = acc(a), bv = acc(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const an = Number(av), bn = Number(bv);
      if (!Number.isNaN(an) && !Number.isNaN(bn) && av !== "" && bv !== "") return (an - bn) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }, [filtered, sort, columns]);

  const total = sorted.length;
  const usingPagination = pageSize > 0;
  const pageCount = usingPagination ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const pageRows = usingPagination ? sorted.slice(page * pageSize, page * pageSize + pageSize) : sorted;

  const cycleSort = (col) => {
    if (col.sortable === false) return;
    setSort((cur) => {
      if (!cur || cur.key !== col.key) return { key: col.key, dir: "asc" };
      if (cur.dir === "asc") return { key: col.key, dir: "desc" };
      return null;
    });
  };

  const cellPad = dense ? "px-3 py-2" : "px-4 py-3";
  const headPad = dense ? "px-3 py-2" : "px-4 py-2.5";

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden ${className}`}>
      {(title || subtitle || searchable || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {(title || subtitle) && (
            <div className="min-w-0">
              {title && <h3 className="font-display text-base font-bold text-navy-900 truncate">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          )}
          <div className="flex items-center gap-2 sm:ml-auto">
            {searchable && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full sm:w-72 rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
                />
              </div>
            )}
            {toolbar}
          </div>
        </div>
      )}

      <div className="relative overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur">
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                const sortable = col.sortable !== false;
                const align = col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";
                return (
                  <th key={col.key}
                      style={col.width ? { width: col.width } : undefined}
                      className={`${headPad} ${align} font-semibold whitespace-nowrap ${col.sticky ? "sticky right-0 bg-slate-50/95 backdrop-blur" : ""} ${col.className || ""}`}>
                    {sortable ? (
                      <button type="button" onClick={() => cycleSort(col)}
                              className="inline-flex items-center gap-1 hover:text-navy-900 transition-colors">
                        <span>{col.header}</span>
                        {isSorted ? (
                          sort.dir === "asc"
                            ? <ArrowUp className="h-3 w-3 text-cyan-600" />
                            : <ArrowDown className="h-3 w-3 text-cyan-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-400">
                  <Inbox className="h-8 w-8 mx-auto mb-2 opacity-60" />
                  <p className="text-sm">{emptyText}</p>
                </td>
              </tr>
            ) : pageRows.map((row, idx) => {
              const k = rowKey ? rowKey(row, idx) : (row?.id ?? idx);
              return (
                <tr key={k} className="border-b border-slate-50 last:border-0 hover:bg-cyan-50/40 transition-colors">
                  {columns.map((col) => {
                    const align = col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";
                    const content = col.cell ? col.cell(row) : (col.accessor ? col.accessor(row) : row?.[col.key]);
                    return (
                      <td key={col.key}
                          className={`${cellPad} ${align} text-slate-700 ${col.sticky ? "sticky right-0 bg-white group-hover:bg-cyan-50/40" : ""} ${col.className || ""}`}>
                        {content ?? <span className="text-slate-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(usingPagination || pageSizeOptions?.length) && (
        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              {total === 0
                ? "0 results"
                : `Showing ${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total}`}
            </span>
            {pageSizeOptions?.length > 0 && (
              <label className="inline-flex items-center gap-1.5">
                <span>Rows:</span>
                <select value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40">
                  {pageSizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            )}
          </div>
          {usingPagination && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-semibold text-navy-900 tabular-nums">
                Page {page + 1} / {pageCount}
              </span>
              <button type="button" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Helpers consumers can import for consistent pills/icons */

export function StatusPill({ children, tone = "slate" }) {
  const tones = {
    slate:   "bg-slate-100  text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50   text-amber-700",
    danger:  "bg-rose-50    text-rose-700",
    info:    "bg-cyan-50    text-cyan-700",
    navy:    "bg-navy-900   text-white",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${tones[tone] || tones.slate}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        tone === "success" ? "bg-emerald-500" :
        tone === "warning" ? "bg-amber-500"   :
        tone === "danger"  ? "bg-rose-500"    :
        tone === "info"    ? "bg-cyan-500"    :
        tone === "navy"    ? "bg-cyan-300"    : "bg-slate-400"}`} />
      {children}
    </span>
  );
}

export function TableButton({ children, tone = "default", ...rest }) {
  const tones = {
    default: "border-slate-200 bg-white text-navy-900 hover:bg-slate-50",
    primary: "border-transparent bg-gradient-to-r from-navy-900 to-cyan-600 text-white hover:opacity-95 shadow-sm",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    danger:  "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    warning: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    ghost:   "border-transparent bg-transparent text-slate-600 hover:bg-slate-100",
  };
  return (
    <button type="button"
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${tones[tone] || tones.default}`}
            {...rest}>
      {children}
    </button>
  );
}
