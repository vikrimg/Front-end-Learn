"use client";
import { useEffect, useMemo, useState } from "react";
import { useWSData } from "@/hooks/dataHandler";
import { CAT, CATS, Cat, Ev, H, RATE, STATIONS, Worker, computeLine, dmyhm, dur, hms, mmss } from "@/lib/line";
import { Grouped, Lines, Pareto, Ring, Stacked, Waterfall, Frame } from "@/components/charts";
import { Col, DataTable, Panel, Pill, Stat } from "@/components/ui";

const TABS = ["Production", "Downtime", "Quality", "Utility", "Process Engineering"] as const;
type Tab = (typeof TABS)[number];
const GREEN = "#34d399";
const num = (v: number, d = 0) => v.toLocaleString("id-ID", { maximumFractionDigits: d, minimumFractionDigits: d });
const pct = (v: number) => `${num(v * 100)}%`;

export default function LineDetail() {
  const { data, connected } = useWSData();
  const [tab, setTab] = useState<Tab>("Production");
  const [station, setStation] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const ready = Array.isArray(data.events);
  const L = useMemo(() => {
    if (!ready) return null;
    const keep = <T extends { station: string }>(a: T[]) => (station ? a.filter((x) => x.station === station) : a);
    return computeLine({ now: data.now, events: keep<Ev>(data.events), workers: keep<Worker>(data.workers ?? []) });
  }, [data, ready, station]);

  const k = L?.kpi;
  const live = L?.evs.filter((e) => e.live) ?? [];

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,#12304a_0%,#0a1220_55%,#070b14_100%)] text-slate-100">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-6 border-b border-white/10 px-8 py-4">
        <div className="flex items-center gap-5">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-teal-300 to-sky-500 text-xl font-black text-slate-900">A</div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">Line Detail <span className="text-teal-300">Realtime</span></h1>
            <p className="text-sm text-slate-400">LINE-MAINASSY · Daily · 9 jam terakhir</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            Station
            <select value={station} onChange={(e) => setStation(e.target.value)} className="rounded-full border border-white/10 bg-slate-900 px-4 py-1.5 text-slate-100 outline-none focus:border-teal-400">
              <option value="">Semua</option>
              {STATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <Pill color={connected ? GREEN : "#f87171"} pulse={connected}>{connected ? "Live" : "Terputus"}</Pill>
          <div className="text-right tabular-nums">
            <div className="text-2xl font-bold">{now ? hms(now.getTime()) : "--:--:--"}</div>
            <div className="text-sm text-slate-400">{now ? now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}</div>
          </div>
        </div>
      </header>

      {!L || !k ? (
        <div className="grid flex-1 place-items-center text-xl text-slate-400">{connected ? "Menunggu data…" : "Menghubungkan ke Node-RED…"}</div>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-8 py-5">
          {/* Banner andon aktif */}
          {live.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-3">
              <Pill color="#f87171" pulse>ANDON AKTIF</Pill>
              {live.map((e) => (
                <span key={e.station + e.start} className="text-sm"><b style={{ color: CAT[e.category as Cat].color }}>{CAT[e.category as Cat].name}</b> · {e.station} · {e.reason} · <b className="tabular-nums">{mmss(e.t - e.start)}</b></span>
              ))}
            </div>
          )}

          {/* KPI */}
          <div className="grid shrink-0 grid-cols-5 gap-4">
            <Kpi label="OEE" value={pct(k.oee)} ring={k.oee} color="#2dd4bf" />
            <Kpi label="Production Target" value={num(L.tot.target)} sub={`Actual ${num(L.tot.actual)}`} ring={L.tot.target ? L.tot.actual / L.tot.target : 0} color="#38bdf8" />
            <Kpi label="Availability" value={pct(k.avail)} ring={k.avail} color="#34d399" />
            <Kpi label="Performance" value={pct(k.perf)} ring={Math.min(1, k.perf)} color="#fbbf24" />
            <Kpi label="Quality" value={pct(k.qual)} ring={k.qual} color="#a78bfa" />
          </div>

          {/* Tab */}
          <nav className="flex shrink-0 gap-2 rounded-full border border-white/10 bg-slate-900/60 p-1.5">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-full px-4 py-2.5 text-base font-semibold transition ${tab === t ? "bg-gradient-to-r from-teal-400 to-sky-500 text-slate-900 shadow-lg shadow-teal-500/30" : "text-slate-300 hover:bg-white/5"}`}>{t}</button>
            ))}
          </nav>

          {tab === "Production" && <Production L={L} />}
          {tab === "Downtime" && <Downtime L={L} />}
          {tab === "Quality" && <Quality L={L} />}
          {tab === "Utility" && <Utility L={L} />}
          {tab === "Process Engineering" && <Process L={L} />}
        </main>
      )}
    </div>
  );
}

type Model = NonNullable<ReturnType<typeof computeLine>>;

function Kpi({ label, value, sub, ring, color }: { label: string; value: string; sub?: string; ring: number; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 shadow-lg shadow-black/20">
      <div>
        <div className="text-sm uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-4xl font-bold tabular-nums" style={{ color }}>{value}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
      <Ring value={ring} color={color} />
    </div>
  );
}

/* ---------- Production ---------- */
function Production({ L }: { L: Model }) {
  const span = L.now - L.w0;
  const labels = L.slots.map((s) => s.label);
  const workers: Col<Worker>[] = [
    { h: "Operator", cell: (r) => <b>{r.name}</b>, val: (r) => r.name },
    { h: "Status", cell: (r) => (r.end ? <Pill color="#94a3b8">Logout</Pill> : <Pill color={GREEN} pulse>Active</Pill>), val: (r) => (r.end ? 1 : 0) },
    { h: "Sign in at", cell: (r) => <span className="tabular-nums">{dmyhm(r.start)}</span>, val: (r) => r.start },
    { h: "Station", cell: (r) => r.station, val: (r) => r.station },
  ];
  return (
    <div className="grid grid-cols-12 gap-4">
      <Panel title="Production Timeline" sub="Status line selama 9 jam terakhir" className="col-span-12">
        <Frame className="w-full">
          {(t) => (
            <div className="relative h-12 w-full overflow-hidden rounded-xl bg-emerald-500/70" onMouseLeave={t.hide}>
              {L.evs.map((e) => (
                <div key={e.station + e.start} className="absolute inset-y-0 cursor-pointer transition hover:brightness-125" style={{ left: `${((e.s - L.w0) / span) * 100}%`, width: `${Math.max(0.25, ((e.t - e.s) / span) * 100)}%`, background: CAT[e.category as Cat].color }}
                  onMouseMove={(ev) => t.show(ev, <><b style={{ color: CAT[e.category as Cat].color }}>{CAT[e.category as Cat].name}</b> · {e.station}<div>{e.reason}</div><div>{hms(e.start)} · {mmss(e.t - e.s)}{e.live ? " (berjalan)" : ""}</div></>)} />
              ))}
            </div>
          )}
        </Frame>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
          <Legend color="#10b981b3" text="Running" />
          {CATS.map((c) => <Legend key={c} color={CAT[c].color} text={`${CAT[c].name} (Unplanned)`} />)}
          <span className="ml-auto text-slate-400">Running <b className="text-emerald-300">{dur(L.tot.run)}</b> · Downtime <b className="text-red-300">{dur(L.tot.dt)}</b></span>
        </div>
      </Panel>

      <Panel title="Target vs Actual per Jam" sub={`Target ${num(L.tot.target)} · Actual ${num(L.tot.actual)}`} className="col-span-7 h-[360px]">
        <Grouped labels={labels} series={[{ name: "Target", color: "#475569", data: L.slots.map((s) => s.target) }, { name: "Actual", color: "#2dd4bf", data: L.slots.map((s) => s.actual) }]} />
      </Panel>
      <Panel title="Production History" sub="Akumulasi target dan actual" className="col-span-5 h-[360px]">
        <Lines labels={labels} series={[{ name: "Target", color: "#94a3b8", data: L.cum.map((c) => c.target) }, { name: "Actual", color: "#2dd4bf", data: L.cum.map((c) => c.actual), area: true }]} />
      </Panel>

      <Panel title="Duty Worker" sub="Operator yang login di tablet andon" className="col-span-12">
        <DataTable cols={workers} rows={L.workers} per={6} rowKey={(r) => r.name + r.start} />
      </Panel>
    </div>
  );
}

const Legend = ({ color, text }: { color: string; text: string }) => (
  <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded" style={{ background: color }} />{text}</span>
);

/* ---------- Downtime ---------- */
function Downtime({ L }: { L: Model }) {
  const w = L.wf, t = L.tot;
  const ideal = (t.run / H) * RATE;
  const log: Col<(typeof L.evs)[number]>[] = [
    { h: "Mulai", cell: (r) => <span className="tabular-nums">{dmyhm(r.start)}</span>, val: (r) => r.start },
    { h: "Kategori", cell: (r) => <Pill color={CAT[r.category as Cat].color}>{CAT[r.category as Cat].name}</Pill>, val: (r) => r.category },
    { h: "Station", cell: (r) => r.station, val: (r) => r.station },
    { h: "Alasan", cell: (r) => r.reason, val: (r) => r.reason },
    { h: "Operator", cell: (r) => r.operator, val: (r) => r.operator },
    { h: "Durasi", cell: (r) => (r.live ? <span className="text-red-300">{mmss(r.t - r.start)} ●</span> : mmss(r.t - r.start)), val: (r) => r.t - r.start, right: true },
  ];
  return (
    <div className="grid grid-cols-12 gap-4">
      <Panel title="Event Waterfall" sub="Dari total waktu ke waktu operasi bersih (jam)" className="col-span-7 h-[380px]">
        <Waterfall unit="jam" steps={[
          { label: "Total Time", value: w.total, kind: "total", color: "#38bdf8" },
          { label: "Planned Downtime", value: w.planned, kind: "down", color: "#94a3b8" },
          { label: "Scheduled Time", value: w.sched, kind: "total", color: "#38bdf8" },
          { label: "Unplanned Downtime", value: w.unplanned, kind: "down", color: "#f87171" },
          { label: "Operating Time", value: w.oper, kind: "total", color: "#34d399" },
          { label: "Performance Loss", value: w.loss, kind: "down", color: "#fb923c" },
          { label: "Net Operating", value: w.net, kind: "total", color: "#2dd4bf" },
        ]} />
      </Panel>
      <Panel title="Pareto Downtime" sub="Alasan terbesar, urut durasi" className="col-span-5 h-[380px]" right={<Stat label="Total downtime" value={dur(t.dt)} tone="text-red-300" sub={`${L.evs.length} kejadian`} />}>
        <Pareto fmt={mmss} items={L.pareto.map((p) => ({ label: p.label, value: p.ms, color: CAT[p.cat].color }))} />
      </Panel>

      <Panel title="Production Time" className="col-span-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Running" value={dur(t.run)} tone="text-emerald-300" />
          <Stat label="Unplanned Downtime" value={dur(t.dt)} tone="text-red-300" />
          <Stat label="Planned Downtime" value="00h 00m 00s" />
          <Stat label="Idle Time" value="00h 00m 00s" />
        </div>
      </Panel>
      <Panel title="Production Total" className="col-span-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Assy In" value={num(t.actual + t.rej + 2)} />
          <Stat label="Assy Out" value={num(t.actual)} tone="text-teal-300" />
          <Stat label="Defect & Reject" value={num(t.rej)} tone="text-red-300" />
          <Stat label="Theoretical Max" value={num(Math.round((t.el / H) * RATE))} />
        </div>
      </Panel>
      <Panel title="Production Summary" className="col-span-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Production Target" value={num(t.target)} />
          <Stat label="Quality Rate" value={pct(L.kpi.qual)} tone="text-violet-300" />
          <Stat label="Target Cycle Time" value={`${num(60 / RATE, 1)} mnt`} />
          <Stat label="Actual Cycle Time" value={`${num(t.actual ? t.run / 60e3 / t.actual : 0, 1)} mnt`} sub={`Ideal ${num(ideal, 0)} unit`} />
        </div>
      </Panel>

      <Panel title="Downtime per Kategori" className="col-span-12">
        <div className="grid grid-cols-4 gap-4">
          {CATS.map((c) => (
            <div key={c} className="rounded-xl border-l-4 bg-white/5 px-5 py-4" style={{ borderColor: CAT[c].color }}>
              <div className="text-sm text-slate-400">{CAT[c].name}</div>
              <div className="text-3xl font-bold tabular-nums" style={{ color: CAT[c].color }}>{mmss(L.byCat[c])}</div>
              <div className="text-xs text-slate-500">{L.evs.filter((e) => e.category === c).length} kejadian</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Log Andon" sub="Data langsung dari tablet andon" className="col-span-12">
        <DataTable cols={log} rows={[...L.evs].reverse()} per={8} rowKey={(r) => r.station + r.start} />
      </Panel>
    </div>
  );
}

/* ---------- Quality ---------- */
function Quality({ L }: { L: Model }) {
  const [wc, setWc] = useState("");
  const rows = L.defects.filter((d) => !wc || d.wc === wc);
  const top = rows.slice(0, 10);
  const cols: Col<(typeof rows)[number]>[] = [
    { h: "No.", cell: (r) => r.no, val: (r) => r.no },
    { h: "Workcenter", cell: (r) => <Pill color="#38bdf8">{r.wc}</Pill>, val: (r) => r.wc },
    { h: "Defect", cell: (r) => r.name, val: (r) => r.name },
    { h: "Product Family", cell: (r) => r.family, val: (r) => r.family },
    { h: "Severity", cell: (r) => r.sev, val: (r) => r.sev },
    { h: "Count", cell: (r) => <b>{r.count}</b>, val: (r) => r.count, right: true },
  ];
  return (
    <div className="grid grid-cols-12 gap-4">
      <Panel title="Defect per Unit (DPU)" sub="Klik workcenter untuk memfilter" className="col-span-8">
        <div className="grid grid-cols-6 gap-3">
          {L.dpu.map((d) => (
            <button key={d.wc} onClick={() => setWc(wc === d.wc ? "" : d.wc)} className={`rounded-xl border px-4 py-4 text-left transition ${wc === d.wc ? "border-teal-400 bg-teal-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
              <div className="text-sm text-slate-400">{d.wc}</div>
              <div className="text-3xl font-bold tabular-nums text-rose-300">{d.dpu.toFixed(2)}</div>
              <div className="text-xs text-slate-500">{d.n} defect</div>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="OK Ratio" className="col-span-2">
        <div className="flex flex-col items-center gap-2">
          <Ring value={L.kpi.qual} color="#a78bfa" size={110} />
          <b className="text-2xl text-violet-300">{pct(L.kpi.qual)}</b>
        </div>
      </Panel>
      <Panel title="Inspected SKUs" className="col-span-2">
        <Stat label="Alva CervoX LFP 2026" value={num(L.tot.actual)} tone="text-teal-300" sub="unit diinspeksi" />
      </Panel>
      <Panel title="Top 10 Defect" sub={wc ? `Workcenter: ${wc}` : "Semua workcenter"} className="col-span-6 h-[400px]">
        <Pareto fmt={(v) => String(Math.round(v))} items={top.map((d) => ({ label: d.name, value: d.count, color: d.name.startsWith("Andon") ? CAT.quality.color : "#38bdf8" }))} />
      </Panel>
      <Panel title="Detail Defect" sub="Baris merah muda berasal dari andon Quality" className="col-span-6">
        <DataTable cols={cols} rows={rows} per={7} rowKey={(r) => r.name} rowClass={(r) => (r.name.startsWith("Andon") ? "bg-rose-500/10" : "")} />
      </Panel>
    </div>
  );
}

/* ---------- Utility ---------- */
function Utility({ L }: { L: Model }) {
  const total = L.utilTot.reduce((n, a) => n + a.kwh, 0);
  return (
    <div className="grid grid-cols-12 gap-4">
      <Panel title="Konsumsi Energi per Jam" sub="kWh · area Production turun saat line berhenti" className="col-span-8 h-[380px]">
        <Stacked unit="kWh" labels={L.slots.map((s) => s.label)} series={L.areas.map((a, j) => ({ name: a.k, color: a.color, data: L.util.map((r) => r[j]) }))} />
      </Panel>
      <Panel title="Total Energi" className="col-span-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Stat label="Total" value={`${num(total, 0)} kWh`} tone="text-teal-300" sub={`${num(L.tot.actual ? total / L.tot.actual : 0, 1)} kWh per unit`} /></div>
          {L.utilTot.map((a) => <Stat key={a.k} label={a.k} value={`${num(a.kwh, 0)} kWh`} tone="" sub={pct(a.kwh / total)} />)}
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Process Engineering ---------- */
function Process({ L }: { L: Model }) {
  const [sel, setSel] = useState("");
  const s = L.stations.find((x) => x.code === sel);
  const avg = L.stations.reduce((n, x) => n + x.ct, 0) / L.stations.length;
  const cols: Col<NonNullable<typeof s>["events"][number]>[] = [
    { h: "Mulai", cell: (r) => dmyhm(r.start), val: (r) => r.start },
    { h: "Kategori", cell: (r) => <Pill color={CAT[r.category as Cat].color}>{CAT[r.category as Cat].name}</Pill>, val: (r) => r.category },
    { h: "Alasan", cell: (r) => r.reason, val: (r) => r.reason },
    { h: "Durasi", cell: (r) => mmss(r.t - r.start), val: (r) => r.t - r.start, right: true },
  ];
  return (
    <div className="grid grid-cols-12 gap-4">
      <Panel title="Status Station" sub={`Cycle time rata-rata ${num(avg)} detik · klik station untuk detail`} className="col-span-8">
        <div className="grid grid-cols-5 gap-3">
          {L.stations.map((x) => {
            const c = x.live ? CAT[x.live.category as Cat].color : GREEN;
            return (
              <button key={x.code} onClick={() => setSel(sel === x.code ? "" : x.code)} className={`rounded-xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${sel === x.code ? "border-teal-400" : "border-white/10"} ${x.live ? "animate-pulse" : ""}`} style={{ background: c + "1f" }}>
                <div className="flex items-center justify-between"><b>{x.code}</b><i className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /></div>
                <div className="text-xs" style={{ color: c }}>{x.live ? `ANDON ${CAT[x.live.category as Cat].name}` : "Running"}</div>
                <div className="mt-1 text-xs text-slate-400">CT {x.ct}s · {x.n}× andon</div>
              </button>
            );
          })}
        </div>
      </Panel>
      <Panel title={s ? `Detail ${s.code}` : "Detail Station"} sub={s ? `${s.n} andon · total ${mmss(s.ms)}` : "Pilih station di sebelah kiri"} className="col-span-4">
        {s ? <DataTable cols={cols} rows={[...s.events].reverse()} per={6} rowKey={(r) => String(r.start)} /> : <div className="grid h-48 place-items-center text-slate-500">Belum ada station dipilih</div>}
      </Panel>
    </div>
  );
}
