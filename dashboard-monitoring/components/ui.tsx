"use client";
import { ReactNode, useMemo, useState } from "react";

export function Panel({ title, sub, right, children, className = "" }: { title: string; sub?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex min-h-0 flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg shadow-black/20 backdrop-blur ${className}`}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-wide text-slate-100">{title}</h2>
          {sub && <p className="text-sm text-slate-400">{sub}</p>}
        </div>
        {right}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function Stat({ label, value, tone = "text-slate-100", sub }: { label: string; value: ReactNode; tone?: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3">
      <div className="text-sm text-slate-400">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function Pill({ color, children, pulse }: { color: string; children: ReactNode; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: color + "26", color }}>
      <i className={`h-1.5 w-1.5 rounded-full ${pulse ? "animate-pulse" : ""}`} style={{ background: color }} />
      {children}
    </span>
  );
}

export type Col<T> = { h: string; cell: (r: T) => ReactNode; val?: (r: T) => string | number; right?: boolean };

// Tabel interaktif: klik header = urut, kotak cari, paging.
export function DataTable<T>({ cols, rows, per = 6, rowKey, rowClass }: { cols: Col<T>[]; rows: T[]; per?: number; rowKey: (r: T) => string | number; rowClass?: (r: T) => string }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ i: number; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    let r = k ? rows.filter((x) => cols.some((c) => c.val && String(c.val(x)).toLowerCase().includes(k))) : rows;
    const s = sort && cols[sort.i].val;
    if (s) r = [...r].sort((a, b) => (s(a) > s(b) ? 1 : s(a) < s(b) ? -1 : 0) * sort!.dir);
    return r;
  }, [rows, q, sort, cols]);

  const pages = Math.max(1, Math.ceil(list.length / per));
  const p = Math.min(page, pages - 1);
  const view = list.slice(p * per, p * per + per);

  return (
    <div className="flex flex-col gap-3">
      <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Cari…" className="w-full max-w-xs rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-400" />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
              {cols.map((c, i) => (
                <th key={c.h} className={`py-2 pr-4 font-semibold ${c.right ? "text-right" : ""}`}>
                  {c.val ? (
                    <button onClick={() => { setSort(sort?.i === i ? { i, dir: (sort.dir * -1) as 1 | -1 } : { i, dir: 1 }); setPage(0); }} className="inline-flex items-center gap-1 uppercase hover:text-teal-300">
                      {c.h}<span className="text-[10px]">{sort?.i === i ? (sort.dir === 1 ? "▲" : "▼") : "⇅"}</span>
                    </button>
                  ) : c.h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={rowKey(r)} className={`border-b border-white/5 transition-colors hover:bg-white/5 ${rowClass?.(r) ?? ""}`}>
                {cols.map((c) => <td key={c.h} className={`py-2.5 pr-4 ${c.right ? "text-right tabular-nums" : ""}`}>{c.cell(r)}</td>)}
              </tr>
            ))}
            {!view.length && <tr><td colSpan={cols.length} className="py-8 text-center text-slate-500">Belum ada data</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{list.length ? `${p * per + 1}–${Math.min(list.length, p * per + per)} dari ${list.length}` : "0 data"}</span>
        <span className="flex items-center gap-2">
          <button disabled={p === 0} onClick={() => setPage(p - 1)} className="rounded-full bg-white/5 px-3 py-1 hover:bg-white/10 disabled:opacity-30">‹</button>
          <span className="tabular-nums">{p + 1} / {pages}</span>
          <button disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="rounded-full bg-white/5 px-3 py-1 hover:bg-white/10 disabled:opacity-30">›</button>
        </span>
      </div>
    </div>
  );
}
