// Model halaman /line. Semua angka dihitung dari event andon asli (WebSocket /ws/andon),
// sisanya (laju produksi, defect, energi) dummy deterministik: tampil sama di tiap refresh.
// ponytail: jendela tetap 9 jam terakhir. Ganti ke shift/tanggal pilihan saat ada data historis.

export const H = 3600e3;
export const SLOTS = 9;
export const RATE = 13; // unit/jam (kapasitas line)

export const CATS = ["quality", "logistic", "equipment", "process"] as const;
export type Cat = (typeof CATS)[number];
export const CAT: Record<Cat, { name: string; color: string }> = {
  quality: { name: "Quality", color: "#fb7185" },
  logistic: { name: "Logistic", color: "#fbbf24" },
  equipment: { name: "Equipment", color: "#a78bfa" },
  process: { name: "Process", color: "#38bdf8" },
};

export type Ev = { station: string; category: Cat; reason: string; operator: string; start: number; end: number | null };
export type Worker = { name: string; station: string; start: number; end: number | null };
export type Feed = { now?: number; events?: Ev[]; workers?: Worker[] };

export const STATIONS = [
  "MA-1-LH", "MA-1-RH", "MA-3-LH", "MA-3-RH", "MA-5-LH", "MA-5-RH", "MA-6-LH", "MA-7-RH", "MA-8-LH", "MA-8-RH",
  "MA-9-RH", "MA-10-LH", "MA-11-LH", "MA-11-RH", "MA-12-LH", "MA-13-RH", "MA-14-LH", "MA-15-RH", "MA-16-LH",
];

const PF = [0.96, 1.03, 0.94, 1.0, 0.9, 0.97, 1.05, 0.95, 0.98];
const rnd = (a: number, b: number) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const pad = (n: number) => String(n).padStart(2, "0");

export const dur = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1e3));
  return `${pad(Math.floor(s / 3600))}h ${pad(Math.floor((s % 3600) / 60))}m ${pad(s % 60)}s`;
};
export const mmss = (ms: number) => { const s = Math.max(0, Math.round(ms / 1e3)); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };
export const hms = (t: number) => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
export const dmyhm = (t: number) => { const d = new Date(t); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${hms(t)}`; };

const WCS = ["Main Assy", "Fit Finish", "Pre Dyno", "Dyno", "HLA", "Running"];
// [workcenter, defect, family, severity, temuan per 9 jam]
const DEF: [string, string, string, string, number][] = [
  ["Running", "Brake Assy CBS Tek-tek noise (Fr Caliper)", "N3", "-", 6],
  ["Pre Dyno", "Lock Assy Manual Key Switch Seat Long Stroke", "N3", "-", 5],
  ["Fit Finish", "Front Disc Brake Rust", "N3", "-", 4],
  ["Fit Finish", "Passenger Footpeg Right Abnormal Function", "CERVO", "-", 3],
  ["Fit Finish", "Battery Pack Lid P2.5 to Tunnel Cover P2.5 Gap-Above", "CERVO", "C", 3],
  ["Running", "Battery Locking Upper to Luggage Box Touching FR Area", "N3", "C", 2],
  ["HLA", "Horn Abnormal Sound", "N3", "-", 2],
  ["Fit Finish", "Footrest Platform Right Misassembled", "CERVO", "-", 2],
  ["Fit Finish", "Passenger Footpeg Left Abnormal Function", "CERVO", "-", 2],
  ["Fit Finish", "Helmet Trunk to Tail Light Cover Flush", "CERVO", "C", 2],
  ["Dyno", "Throttle Response Delay", "N3", "-", 1],
];

const AREAS = [
  { k: "Production", base: 46, color: "#2dd4bf" },
  { k: "Facility", base: 28, color: "#38bdf8" },
  { k: "Logistic", base: 11, color: "#fbbf24" },
  { k: "Office", base: 14, color: "#a78bfa" },
];

export function computeLine(f: Feed) {
  const now = f.now ?? Date.now();
  const d0 = new Date(now); d0.setMinutes(0, 0, 0);
  const w0 = d0.getTime() - (SLOTS - 1) * H;

  // event dipotong ke jendela waktu
  const evs = (f.events ?? [])
    .map((e) => ({ ...e, live: e.end == null, end: e.end ?? now }))
    .map((e) => ({ ...e, s: Math.max(e.start, w0), t: Math.min(e.end, now) }))
    .filter((e) => e.t > e.s)
    .sort((a, b) => a.s - b.s);

  // line berhenti = gabungan semua event (tumpang tindih tidak dihitung dobel)
  const stops: [number, number][] = [];
  for (const e of evs) {
    const l = stops[stops.length - 1];
    if (l && e.s <= l[1]) l[1] = Math.max(l[1], e.t); else stops.push([e.s, e.t]);
  }
  const over = (a: number, b: number) => stops.reduce((n, [s, t]) => n + Math.max(0, Math.min(t, b) - Math.max(s, a)), 0);

  const slots = Array.from({ length: SLOTS }, (_, i) => {
    const a = w0 + i * H, b = Math.min(a + H, now);
    const el = Math.max(0, b - a), dt = over(a, b), run = el - dt;
    const target = Math.round((RATE * el) / H);
    const actual = Math.round((run / H) * RATE * PF[i]);
    const qEv = evs.filter((e) => e.category === "quality" && e.start >= a && e.start < a + H).length;
    const rej = Math.min(actual, Math.round(actual * (0.01 + 0.03 * rnd(i, 2))) + qEv * 2);
    return { label: pad(new Date(a).getHours()), a, el, dt, run, target, actual, rej };
  });

  const sum = (k: "el" | "dt" | "run" | "target" | "actual" | "rej") => slots.reduce((n, s) => n + s[k], 0);
  const tot = { el: sum("el"), dt: sum("dt"), run: sum("run"), target: sum("target"), actual: sum("actual"), rej: sum("rej") };
  const avail = tot.el ? tot.run / tot.el : 0;
  const ideal = (tot.run / H) * RATE;
  const perf = ideal ? Math.min(1.5, tot.actual / ideal) : 0;
  const qual = tot.actual ? (tot.actual - tot.rej) / tot.actual : 0;
  const kpi = { oee: avail * perf * qual, avail, perf, qual };

  // Pareto downtime per alasan
  const pm = new Map<string, { label: string; cat: Cat; ms: number; n: number }>();
  for (const e of evs) {
    const p = pm.get(e.reason) ?? { label: e.reason, cat: e.category, ms: 0, n: 0 };
    p.ms += e.t - e.s; p.n++; pm.set(e.reason, p);
  }
  const pareto = [...pm.values()].sort((a, b) => b.ms - a.ms);
  const byCat = Object.fromEntries(CATS.map((c) => [c, evs.filter((e) => e.category === c).reduce((n, e) => n + e.t - e.s, 0)])) as Record<Cat, number>;

  // waterfall (jam)
  const oper = tot.run / H, net = Math.min(oper, tot.actual / RATE);
  const wf = { total: tot.el / H, planned: 0, sched: tot.el / H, unplanned: tot.dt / H, oper, loss: oper - net, net };

  // history kumulatif
  let ct = 0, ca = 0;
  const cum = slots.map((s) => ({ label: s.label, target: (ct += s.target), actual: (ca += s.actual) }));

  // quality
  const frac = tot.el / (SLOTS * H);
  const andon = new Map<string, number>();
  for (const e of evs) if (e.category === "quality") andon.set(e.reason, (andon.get(e.reason) ?? 0) + 2);
  const defects = [
    ...DEF.map(([wc, name, family, sev, r]) => ({ wc, name, family, sev, count: Math.round(r * frac) })),
    ...[...andon].map(([reason, count]) => ({ wc: "Main Assy", name: `Andon Quality: ${reason}`, family: "-", sev: "-", count })),
  ].filter((x) => x.count > 0).sort((a, b) => b.count - a.count).map((x, i) => ({ ...x, no: i + 1 }));
  const dpu = WCS.map((wc) => {
    const n = defects.filter((x) => x.wc === wc).reduce((s, x) => s + x.count, 0);
    return { wc, n, dpu: tot.actual ? n / tot.actual : 0 };
  });

  // utility (kWh): produksi turun saat line berhenti
  const util = slots.map((s, i) => AREAS.map((A, j) => {
    let v = A.base * (0.9 + 0.2 * rnd(i, j + 5)) * (s.el / H);
    if (j === 0) v *= 0.35 + 0.65 * (s.el ? s.run / s.el : 0);
    return +v.toFixed(1);
  }));
  const utilTot = AREAS.map((A, j) => ({ ...A, kwh: util.reduce((n, r) => n + r[j], 0) }));

  // process: status tiap station
  const stations = STATIONS.map((code, i) => {
    const mine = evs.filter((e) => e.station === code);
    const live = [...mine].reverse().find((e) => e.live) ?? null;
    return { code, ct: Math.round(276 * (0.9 + 0.2 * rnd(i, 9))), live, n: mine.length, ms: mine.reduce((n, e) => n + e.t - e.s, 0), events: mine };
  });

  return { now, w0, slots, tot, kpi, evs, pareto, byCat, wf, cum, defects, dpu, util, utilTot, areas: AREAS, stations, workers: [...(f.workers ?? [])].sort((a, b) => b.start - a.start) };
}
export type Line = ReturnType<typeof computeLine>;
