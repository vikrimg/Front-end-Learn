"use client";
// Chart SVG kecil tanpa library. Semua interaktif lewat tooltip hover.
// ponytail: cukup untuk <= 24 titik per chart. Pakai library chart bila butuh zoom/ribuan titik.
import { ReactNode, useRef, useState } from "react";

type Show = (e: React.MouseEvent, c: ReactNode) => void;
type T = { show: Show; hide: () => void };

export function Frame({ children, className = "" }: { children: (t: T) => ReactNode; className?: string }) {
  const [tip, setTip] = useState<{ x: number; y: number; c: ReactNode; flip: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const show: Show = (e, c) => {
    const r = ref.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    setTip({ x, y: e.clientY - r.top, c, flip: x > r.width * 0.6 });
  };
  return (
    <div ref={ref} className={`relative ${className}`}>
      {children({ show, hide: () => setTip(null) })}
      {tip && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg border border-white/15 bg-slate-950/95 px-3 py-2 text-sm shadow-xl backdrop-blur"
          style={{ left: tip.x, top: tip.y, transform: `translate(${tip.flip ? "calc(-100% - 14px)" : "14px"}, -50%)` }}
        >
          {tip.c}
        </div>
      )}
    </div>
  );
}

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};
const GRID = "rgba(255,255,255,0.08)";
const TXT = "#94a3b8";

function Axis({ W, H, L, T, B, R, max, fmt = (v: number) => String(v), ticks = 4 }: { W: number; H: number; L: number; T: number; B: number; R: number; max: number; fmt?: (v: number) => string; ticks?: number }) {
  return (
    <>
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const y = T + ((H - T - B) * i) / ticks;
        return (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y} y2={y} stroke={GRID} />
            <text x={L - 8} y={y + 4} textAnchor="end" fontSize="11" fill={TXT}>{fmt(max - (max * i) / ticks)}</text>
          </g>
        );
      })}
    </>
  );
}

// Bar berkelompok (mis. target vs actual per jam).
export function Grouped({ labels, series, unit = "" }: { labels: string[]; series: { name: string; color: string; data: number[] }[]; unit?: string }) {
  const W = 760, H = 270, L = 38, R = 8, T = 14, B = 28;
  const max = niceMax(Math.max(...series.flatMap((s) => s.data), 1));
  const bw = (W - L - R) / labels.length;
  const w = (bw * 0.72) / series.length;
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  return (
    <Frame className="h-full w-full">
      {(t) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" onMouseLeave={t.hide}>
          <Axis {...{ W, H, L, T, B, R, max }} />
          {labels.map((lb, i) => {
            const x0 = L + i * bw;
            return (
              <g key={lb} onMouseMove={(e) => t.show(e, <><b>{lb}:00</b>{series.map((s) => <div key={s.name} className="flex items-center gap-2"><i className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}: <b>{s.data[i]}{unit}</b></div>)}</>)}>
                <rect x={x0} y={T} width={bw} height={H - T - B} fill="transparent" />
                {series.map((s, j) => (
                  <rect key={s.name} x={x0 + bw * 0.14 + j * w} y={y(s.data[i])} width={w - 2} height={Math.max(0, H - B - y(s.data[i]))} rx="3" fill={s.color} />
                ))}
                <text x={x0 + bw / 2} y={H - 9} textAnchor="middle" fontSize="11" fill={TXT}>{lb}</text>
              </g>
            );
          })}
        </svg>
      )}
    </Frame>
  );
}

// Garis/area (mis. produksi kumulatif).
export function Lines({ labels, series }: { labels: string[]; series: { name: string; color: string; data: number[]; area?: boolean }[] }) {
  const W = 760, H = 270, L = 44, R = 14, T = 14, B = 28;
  const max = niceMax(Math.max(...series.flatMap((s) => s.data), 1));
  const x = (i: number) => L + ((W - L - R) * i) / Math.max(1, labels.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  return (
    <Frame className="h-full w-full">
      {(t) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" onMouseLeave={t.hide}>
          <defs>{series.map((s, k) => <linearGradient key={k} id={`g${k}${s.color.slice(1)}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={s.color} stopOpacity=".35" /><stop offset="1" stopColor={s.color} stopOpacity="0" /></linearGradient>)}</defs>
          <Axis {...{ W, H, L, T, B, R, max }} />
          {series.map((s, k) => {
            const pts = s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
            return (
              <g key={s.name}>
                {s.area && <polygon points={`${x(0)},${H - B} ${pts} ${x(s.data.length - 1)},${H - B}`} fill={`url(#g${k}${s.color.slice(1)})`} />}
                <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />
              </g>
            );
          })}
          {labels.map((lb, i) => (
            <g key={lb} onMouseMove={(e) => t.show(e, <><b>s/d {lb}:59</b>{series.map((s) => <div key={s.name} className="flex items-center gap-2"><i className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}: <b>{s.data[i]}</b></div>)}</>)}>
              <rect x={x(i) - 20} y={T} width="40" height={H - T - B} fill="transparent" />
              {series.map((s) => <circle key={s.name} cx={x(i)} cy={y(s.data[i])} r="3.5" fill="#0b1220" stroke={s.color} strokeWidth="2" />)}
              <text x={x(i)} y={H - 9} textAnchor="middle" fontSize="11" fill={TXT}>{lb}</text>
            </g>
          ))}
        </svg>
      )}
    </Frame>
  );
}

// Bar bertumpuk per jam (utility).
export function Stacked({ labels, series, unit }: { labels: string[]; series: { name: string; color: string; data: number[] }[]; unit: string }) {
  const W = 760, H = 270, L = 38, R = 8, T = 14, B = 28;
  const totals = labels.map((_, i) => series.reduce((n, s) => n + s.data[i], 0));
  const max = niceMax(Math.max(...totals, 1));
  const bw = (W - L - R) / labels.length;
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  return (
    <Frame className="h-full w-full">
      {(t) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" onMouseLeave={t.hide}>
          <Axis {...{ W, H, L, T, B, R, max }} />
          {labels.map((lb, i) => {
            let acc = 0;
            return (
              <g key={lb} onMouseMove={(e) => t.show(e, <><b>{lb}:00</b>{series.map((s) => <div key={s.name} className="flex items-center gap-2"><i className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}: <b>{s.data[i].toFixed(1)} {unit}</b></div>)}<div className="mt-1 border-t border-white/10 pt-1">Total <b>{totals[i].toFixed(1)} {unit}</b></div></>)}>
                <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
                {series.map((s) => { const v = s.data[i]; const y1 = y(acc + v), h = y(acc) - y1; acc += v; return <rect key={s.name} x={L + i * bw + bw * 0.16} y={y1} width={bw * 0.68} height={Math.max(0, h)} fill={s.color} />; })}
                <text x={L + i * bw + bw / 2} y={H - 9} textAnchor="middle" fontSize="11" fill={TXT}>{lb}</text>
              </g>
            );
          })}
        </svg>
      )}
    </Frame>
  );
}

// Pareto: bar (durasi) + garis kumulatif % di sumbu kanan.
export function Pareto({ items, fmt }: { items: { label: string; value: number; color: string }[]; fmt: (v: number) => string }) {
  const W = 760, H = 300, L = 54, R = 46, T = 16, B = 74;
  const total = items.reduce((n, i) => n + i.value, 0) || 1;
  const max = niceMax(Math.max(...items.map((i) => i.value), 1));
  const bw = (W - L - R) / Math.max(items.length, 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const yp = (p: number) => T + (H - T - B) * (1 - p);
  let acc = 0;
  const cum = items.map((i) => (acc += i.value) / total);
  return (
    <Frame className="h-full w-full">
      {(t) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" onMouseLeave={t.hide}>
          <Axis {...{ W, H, L, T, B, R, max, fmt }} />
          {[0, 0.25, 0.5, 0.75, 1].map((p) => <text key={p} x={W - R + 8} y={yp(p) + 4} fontSize="11" fill="#fbbf24">{p * 100}%</text>)}
          {items.map((it, i) => (
            <g key={it.label} onMouseMove={(e) => t.show(e, <><b>{it.label}</b><div>Durasi: <b>{fmt(it.value)}</b></div><div>Kumulatif: <b>{(cum[i] * 100).toFixed(1)}%</b></div></>)}>
              <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
              <rect x={L + i * bw + bw * 0.18} y={y(it.value)} width={bw * 0.64} height={Math.max(0, H - B - y(it.value))} rx="4" fill={it.color} />
              <text transform={`translate(${L + i * bw + bw / 2},${H - B + 12}) rotate(-28)`} textAnchor="end" fontSize="11" fill={TXT}>{it.label.length > 22 ? it.label.slice(0, 21) + "…" : it.label}</text>
            </g>
          ))}
          <polyline fill="none" stroke="#fbbf24" strokeWidth="2.5" points={cum.map((p, i) => `${L + i * bw + bw / 2},${yp(p)}`).join(" ")} />
          {cum.map((p, i) => <circle key={i} cx={L + i * bw + bw / 2} cy={yp(p)} r="3.5" fill="#0b1220" stroke="#fbbf24" strokeWidth="2" />)}
        </svg>
      )}
    </Frame>
  );
}

// Waterfall: urutan langkah, tiap langkah naik (total) atau turun (pengurang), diakhiri subtotal.
export function Waterfall({ steps, unit }: { steps: { label: string; value: number; kind: "total" | "down"; color: string }[]; unit: string }) {
  const W = 760, H = 290, L = 44, R = 8, T = 16, B = 46;
  const max = niceMax(steps[0]?.value ?? 1);
  const bw = (W - L - R) / steps.length;
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  let level = 0;
  return (
    <Frame className="h-full w-full">
      {(t) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" onMouseLeave={t.hide}>
          <Axis {...{ W, H, L, T, B, R, max, fmt: (v) => v.toFixed(v < 10 ? 1 : 0) }} />
          {steps.map((s, i) => {
            const top = s.kind === "total" ? s.value : level;
            const bot = s.kind === "total" ? 0 : level - s.value;
            if (s.kind === "total") level = s.value; else level -= s.value;
            const x = L + i * bw + bw * 0.16;
            return (
              <g key={s.label} onMouseMove={(e) => t.show(e, <><b>{s.label}</b><div>{s.kind === "down" ? "−" : ""}{s.value.toFixed(2)} {unit}</div></>)}>
                <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
                <rect x={x} y={y(top)} width={bw * 0.68} height={Math.max(2, y(bot) - y(top))} rx="4" fill={s.color} />
                <text x={x + bw * 0.34} y={y(top) - 6} textAnchor="middle" fontSize="11" fill="#e2e8f0">{s.value.toFixed(1)}</text>
                <text x={L + i * bw + bw / 2} y={H - 22} textAnchor="middle" fontSize="10.5" fill={TXT}>{s.label.split(" ")[0]}</text>
                <text x={L + i * bw + bw / 2} y={H - 9} textAnchor="middle" fontSize="10.5" fill={TXT}>{s.label.split(" ").slice(1).join(" ")}</text>
              </g>
            );
          })}
        </svg>
      )}
    </Frame>
  );
}

// Cincin persen (KPI).
export function Ring({ value, color, size = 84 }: { value: number; color: string; size?: number }) {
  const r = 34, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox="0 0 84 84" className="-rotate-90">
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="9" />
      <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * p} ${c}`} style={{ transition: "stroke-dasharray .8s ease" }} />
    </svg>
  );
}
