"use client";

import * as React from "react";
import type { ResultType } from "@/lib/oilgas/types";

/* ============================================================
   StructureMap — 构造图 (color-filled contour map with wells/faults)
   ============================================================ */
export function StructureMap({ className = "", title = "MX区块 灯影组四段顶面构造图" }: { className?: string; title?: string }) {
  const wells = [
    { x: 90, y: 70, name: "MX12", val: "-4285m" },
    { x: 210, y: 110, name: "MX9", val: "-4312m" },
    { x: 150, y: 190, name: "MX15", val: "-4258m" },
    { x: 300, y: 160, name: "MX18", val: "-4271m" },
    { x: 250, y: 250, name: "MX21", val: "-4233m" },
  ];
  // contour ellipses to mimic structural closure (highs in red/yellow, lows in blue)
  const contours = [
    { cx: 160, cy: 170, rx: 60, ry: 44, c: "#fde68a", label: "-4250" },
    { cx: 160, cy: 172, rx: 95, ry: 72, c: "#fcd34d", label: "-4280" },
    { cx: 162, cy: 176, rx: 130, ry: 100, c: "#fb923c", label: "-4310" },
    { cx: 164, cy: 180, rx: 168, ry: 130, c: "#f87171", label: "-4340" },
    { cx: 166, cy: 184, rx: 205, ry: 160, c: "#60a5fa", label: "-4370" },
  ];
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className="text-[11px] text-muted-foreground">等值线距 30m · 比例尺 1:50000</span>
      </div>
      <div className="relative rounded-lg border border-border bg-card overflow-hidden">
        <svg viewBox="0 0 380 320" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="grid-sm" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="oklch(0.92 0.01 240)" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="ocean" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#eff6ff" />
              <stop offset="100%" stopColor="#dbeafe" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="380" height="320" fill="url(#ocean)" />
          <rect x="0" y="0" width="380" height="320" fill="url(#grid-sm)" />
          {/* contours */}
          {contours.map((c, i) => (
            <g key={i}>
              <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={c.c} fillOpacity="0.55" stroke={c.c} strokeWidth="1" />
              <text x={c.cx + c.rx - 4} y={c.cy} fontSize="9" fill="#1e3a8a" textAnchor="end">{c.label}</text>
            </g>
          ))}
          {/* fault line (dashed red) */}
          <path d="M 30 30 Q 120 80 200 60 T 360 100" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="7 4" />
          <text x="280" y="55" fontSize="10" fill="#dc2626" fontWeight="600">F1 断层</text>
          <path d="M 60 280 Q 160 240 260 270 T 360 250" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="7 4" />
          <text x="80" y="300" fontSize="10" fill="#dc2626" fontWeight="600">F2 断层</text>
          {/* wells */}
          {wells.map((w) => (
            <g key={w.name}>
              <circle cx={w.x} cy={w.y} r="5" fill="#fff" stroke="#1e3a8a" strokeWidth="2" />
              <circle cx={w.x} cy={w.y} r="1.5" fill="#1e3a8a" />
              <line x1={w.x} y1={w.y - 5} x2={w.x} y2={w.y - 14} stroke="#1e3a8a" strokeWidth="1.5" />
              <text x={w.x + 8} y={w.y + 3} fontSize="10" fontWeight="700" fill="#1e3a8a">{w.name}</text>
              <text x={w.x + 8} y={w.y + 14} fontSize="9" fill="#475569">{w.val}</text>
            </g>
          ))}
          {/* north arrow */}
          <g transform="translate(345,285)">
            <polygon points="0,-12 5,0 0,-4 -5,0" fill="#1e3a8a" />
            <text x="0" y="14" fontSize="10" fontWeight="700" fill="#1e3a8a" textAnchor="middle">N</text>
          </g>
          {/* colorbar */}
          <g transform="translate(20,20)">
            {["#60a5fa", "#f87171", "#fb923c", "#fcd34d", "#fde68a"].map((c, i) => (
              <rect key={i} x="0" y={i * 9} width="10" height="9" fill={c} />
            ))}
            <text x="14" y="8" fontSize="8" fill="#475569">-4370</text>
            <text x="14" y="48" fontSize="8" fill="#475569">-4250</text>
            <text x="0" y="-3" fontSize="8" fill="#475569">深度(m)</text>
          </g>
        </svg>
      </div>
      <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-white border-2 border-blue-900 inline-block" />评价井</span>
        <span className="inline-flex items-center gap-1"><span className="w-4 h-0.5 bg-red-600 inline-block" style={{ borderTop: "2px dashed #dc2626" }} />断层</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-300 inline-block" />构造高</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />构造低</span>
      </div>
    </div>
  );
}

/* ============================================================
   SeismicSection — 地震剖面 (black/white wiggle traces)
   ============================================================ */
export function SeismicSection({ className = "", title = "Inline 1250 过MX12井 地震剖面" }: { className?: string; title?: string }) {
  const traces = React.useMemo(() => {
    const arr: { x: number; amps: number[] }[] = [];
    const N = 70;
    const samples = 80;
    for (let i = 0; i < N; i++) {
      const amps: number[] = [];
      const x = i;
      for (let s = 0; s < samples; s++) {
        const t = s / samples;
        // synthetic reflectivity: horizons + noise
        const h1 = Math.exp(-Math.pow((t - 0.32) * 22, 2)) * (Math.sin(i * 0.4) > 0 ? 1 : -1);
        const h2 = Math.exp(-Math.pow((t - 0.5) * 18, 2)) * 0.8 * Math.sin(i * 0.3 + 1);
        const h3 = Math.exp(-Math.pow((t - 0.68) * 26, 2)) * 0.7;
        const fault = i > 38 && i < 44 ? (t - 0.5) * 0.6 : 0;
        const noise = (Math.sin(i * 1.7 + s * 0.9) + Math.cos(i * 0.6 - s * 1.3)) * 0.08;
        amps.push(h1 + h2 + h3 + fault + noise);
      }
      arr.push({ x, amps });
    }
    return arr;
  }, []);

  const W = 760;
  const H = 320;
  const dx = W / traces.length;
  const amp = 14; // px per amplitude unit
  const top = 24;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className="text-[11px] text-muted-foreground">采样 2ms · 频带 8-60Hz</span>
      </div>
      <div className="relative rounded-lg border border-border bg-slate-900 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {/* depth grid */}
          {Array.from({ length: 9 }).map((_, i) => {
            const y = top + (i / 8) * (H - top - 16);
            return (
              <g key={i}>
                <line x1="0" y1={y} x2={W} y2={y} stroke="#1e293b" strokeWidth="0.5" />
                <text x="4" y={y - 2} fontSize="9" fill="#94a3b8">{3000 + i * 250}ms</text>
              </g>
            );
          })}
          {/* wiggle traces (variable area: positive filled) */}
          {traces.map((tr, i) => {
            const cx = i * dx + dx / 2;
            let d = `M ${cx} ${top}`;
            tr.amps.forEach((a, s) => {
              const y = top + (s / (tr.amps.length - 1)) * (H - top - 16);
              d += ` L ${cx - a * amp} ${y}`;
            });
            const path = <path d={d} fill="none" stroke="#e2e8f0" strokeWidth="0.8" />;
            // variable area fills (positive lobes)
            const fills: React.ReactNode[] = [];
            for (let s = 1; s < tr.amps.length - 1; s++) {
              if (tr.amps[s] > 0.18) {
                const y0 = top + ((s - 1) / (tr.amps.length - 1)) * (H - top - 16);
                const y1 = top + ((s + 1) / (tr.amps.length - 1)) * (H - top - 16);
                fills.push(
                  <path
                    key={`${i}-${s}`}
                    d={`M ${cx} ${y0} L ${cx - tr.amps[s] * amp} ${top + (s / (tr.amps.length - 1)) * (H - top - 16)} L ${cx} ${y1} Z`}
                    fill="#f8fafc"
                    fillOpacity="0.9"
                  />
                );
              }
            }
            return (
              <g key={i}>
                {fills}
                {path}
              </g>
            );
          })}
          {/* horizon picks */}
          <path d={`M 0 ${top + 0.32 * (H - top - 16)} ${traces.map((_, i) => `L ${i * dx + dx / 2} ${top + (0.32 + (i > 38 && i < 44 ? (i - 41) * 0.01 : 0)) * (H - top - 16)}`).join(" ")}`}
            fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x={W - 90} y={top + 0.32 * (H - top - 16) - 4} fontSize="10" fill="#fbbf24">灯四段顶</text>
          <path d={`M 0 ${top + 0.68 * (H - top - 16)} ${traces.map((_, i) => `L ${i * dx + dx / 2} ${top + 0.68 * (H - top - 16)}`).join(" ")}`}
            fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x={W - 90} y={top + 0.68 * (H - top - 16) + 12} fontSize="10" fill="#34d399">灯四段底</text>
          {/* well tie */}
          <line x1={8 * dx + dx / 2} y1={top} x2={8 * dx + dx / 2} y2={H - 16} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
          <text x={8 * dx + dx / 2 + 4} y={top + 10} fontSize="10" fill="#38bdf8" fontWeight="700">MX12</text>
          {/* fault annotation */}
          <line x1={41 * dx + dx / 2} y1={top} x2={41 * dx + dx / 2} y2={H - 16} stroke="#ef4444" strokeWidth="1.2" />
          <text x={41 * dx + dx / 2 + 4} y={H - 4} fontSize="10" fill="#ef4444" fontWeight="700">F1</text>
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-3 py-1 text-[10px] text-slate-400 bg-slate-900/60">
          <span>CDP 1100</span><span>CDP 1250</span><span>CDP 1400</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CompositeLog — 综合柱状图 (multi-track well log)
   ============================================================ */
export function CompositeLog({ className = "", title = "MX12井 灯影组四段 测井综合解释图" }: { className?: string; title?: string }) {
  // generate synthetic log data
  const data = React.useMemo(() => {
    const N = 90;
    const top = 3200;
    const base = 4600;
    const rows: {
      depth: number; gr: number; sp: number; rt: number; ac: number; den: number; cnl: number;
      vsh: number; phi: number; sw: number; k: number; lith: string; facies: string;
    }[] = [];
    for (let i = 0; i < N; i++) {
      const depth = top + (i / (N - 1)) * (base - top);
      const t = i / N;
      // lithology zones
      let lith = "灰岩";
      let facies = "浅滩相";
      if (t < 0.18) { lith = "泥岩"; facies = "深水陆棚"; }
      else if (t < 0.32) { lith = "灰岩"; facies = "开闘台地"; }
      else if (t < 0.45) { lith = "白云岩"; facies = "颗粒滩"; }
      else if (t < 0.55) { lith = "砂屑岩"; facies = "礁滩"; }
      else if (t < 0.7) { lith = "白云岩"; facies = "颗粒滩"; }
      else if (t < 0.85) { lith = "灰岩"; facies = "开闘台地"; }
      else { lith = "膏盐岩"; facies = "蒸发台地"; }
      const gr = lith === "泥岩" ? 90 + Math.sin(t * 30) * 12 : 20 + Math.sin(t * 20) * 10 + Math.random() * 5;
      const sp = lith === "泥岩" ? -20 : -60 + Math.sin(t * 14) * 8;
      const rt = lith === "白云岩" ? 200 + Math.sin(t * 18) * 120 : 30 + Math.sin(t * 10) * 20;
      const ac = lith === "泥岩" ? 90 : 55 + Math.sin(t * 12) * 6;
      const den = lith === "白云岩" ? 2.82 : lith === "膏盐岩" ? 2.95 : 2.7 + Math.sin(t) * 0.03;
      const cnl = lith === "泥岩" ? 22 : 4 + Math.sin(t * 9) * 3;
      const vsh = (gr - 15) / (110 - 15);
      const phi = Math.max(1, 4 + Math.sin(t * 16) * 3 + (lith === "白云岩" ? 2 : 0));
      const sw = lith === "泥岩" ? 0.9 : Math.max(0.1, 0.5 - Math.sin(t * 13) * 0.3);
      const k = Math.pow(phi / 3, 3) * (1 - sw) * 8;
      rows.push({ depth, gr, sp, rt, ac, den, cnl, vsh: vsh * 100, phi, sw: sw * 100, k, lith, facies });
    }
    return rows;
  }, []);

  const H = 560;
  const trackW = 64;
  const gap = 6;
  const left = 46;
  const top = 26;
  const plotH = H - top - 30;
  const yFor = (i: number) => top + (i / (data.length - 1)) * plotH;

  const lithColor: Record<string, string> = {
    "泥岩": "#78716c",
    "灰岩": "#60a5fa",
    "白云岩": "#5eead4",
    "砂屑岩": "#fcd34d",
    "膏盐岩": "#fda4af",
  };

  const tracks = [
    { name: "GR", unit: "gAPI", min: 0, max: 150, color: "#16a34a", key: "gr" as const, log: false },
    { name: "SP", unit: "mV", min: -100, max: 20, color: "#0891b2", key: "sp" as const, log: false },
    { name: "RT", unit: "Ω·m", min: 1, max: 1000, color: "#dc2626", key: "rt" as const, log: true },
    { name: "AC", unit: "μs/ft", min: 40, max: 100, color: "#7c3aed", key: "ac" as const, log: false },
    { name: "DEN", unit: "g/cc", min: 2.4, max: 3.0, color: "#ea580c", key: "den" as const, log: false },
    { name: "CNL", unit: "%", min: 0, max: 30, color: "#0d9488", key: "cnl" as const, log: false },
  ];

  const valFor = (v: number, t: typeof tracks[number]) => {
    if (t.log) {
      const lo = Math.log10(t.min), hi = Math.log10(t.max);
      return left + 0 * trackW + ((Math.log10(Math.max(t.min, v)) - lo) / (hi - lo)) * trackW;
    }
    return ((v - t.min) / (t.max - t.min)) * trackW;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className="text-[11px] text-muted-foreground">井段 3200-4600m · 曲线 6 条</span>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-x-auto scroll-thin">
        <svg viewBox={`0 0 ${left + tracks.length * (trackW + gap) + 90} ${H}`} className="w-full h-auto block min-w-[640px]">
          {/* depth axis */}
          <rect x="0" y="0" width={left + tracks.length * (trackW + gap) + 90} height={H} fill="#fff" />
          <rect x="0" y={top} width={left} height={plotH} fill="#f8fafc" stroke="#cbd5e1" />
          <text x={left / 2} y={16} fontSize="10" fontWeight="700" fill="#334155" textAnchor="middle">深度(m)</text>
          {data.filter((_, i) => i % 10 === 0).map((r, idx) => {
            const i = idx * 10;
            return (
              <g key={i}>
                <line x1={left - 4} y1={yFor(i)} x2={left} y2={yFor(i)} stroke="#334155" />
                <text x={left - 6} y={yFor(i) + 3} fontSize="9" fill="#334155" textAnchor="end">{Math.round(r.depth)}</text>
              </g>
            );
          })}

          {/* tracks */}
          {tracks.map((t, ti) => {
            const tx = left + ti * (trackW + gap);
            return (
              <g key={t.name}>
                <rect x={tx} y={top} width={trackW} height={plotH} fill="#fff" stroke="#cbd5e1" />
                <text x={tx + trackW / 2} y={16} fontSize="10" fontWeight="700" fill={t.color} textAnchor="middle">{t.name}</text>
                <text x={tx + trackW / 2} y={top - 4} fontSize="8" fill="#64748b" textAnchor="middle">{t.unit}</text>
                {/* gridlines */}
                {[0, 0.5, 1].map((g) => (
                  <line key={g} x1={tx + g * trackW} y1={top} x2={tx + g * trackW} y2={top + plotH} stroke="#e2e8f0" strokeWidth="0.5" />
                ))}
                {/* curve */}
                <polyline
                  fill="none"
                  stroke={t.color}
                  strokeWidth="1.2"
                  points={data.map((r, i) => `${tx + valFor(r[t.key], t)},${yFor(i)}`).join(" ")}
                />
              </g>
            );
          })}

          {/* lithology column */}
          {(() => {
            const lx = left + tracks.length * (trackW + gap);
            return (
              <g>
                <rect x={lx} y={top} width={42} height={plotH} fill="#fff" stroke="#cbd5e1" />
                <text x={lx + 21} y={16} fontSize="10" fontWeight="700" fill="#334155" textAnchor="middle">岩性</text>
                {data.map((r, i) => {
                  if (i === data.length - 1) return null;
                  return (
                    <rect
                      key={i}
                      x={lx + 1}
                      y={yFor(i)}
                      width={40}
                      height={yFor(i + 1) - yFor(i) + 1}
                      fill={lithColor[r.lith]}
                      stroke={lithColor[r.lith]}
                    />
                  );
                })}
                {/* facies labels */}
                {(() => {
                  const groups: { start: number; end: number; lith: string; facies: string }[] = [];
                  data.forEach((r, i) => {
                    const last = groups[groups.length - 1];
                    if (last && last.lith === r.lith && last.facies === r.facies) last.end = i;
                    else groups.push({ start: i, end: i, lith: r.lith, facies: r.facies });
                  });
                  return groups.map((g, idx) => {
                    const midY = (yFor(g.start) + yFor(g.end)) / 2;
                    return (
                      <text key={idx} x={lx + 21} y={midY + 3} fontSize="7.5" fill="#0f172a" textAnchor="middle" fontWeight="600">
                        {g.facies}
                      </text>
                    );
                  });
                })()}
              </g>
            );
          })()}

          {/* interpretation column */}
          {(() => {
            const ix = left + tracks.length * (trackW + gap) + 48;
            return (
              <g>
                <rect x={ix} y={top} width={40} height={plotH} fill="#fff" stroke="#cbd5e1" />
                <text x={ix + 20} y={16} fontSize="10" fontWeight="700" fill="#334155" textAnchor="middle">解释</text>
                {data.map((r, i) => {
                  if (i === data.length - 1) return null;
                  let color = "#e2e8f0", label = "";
                  if (r.sw < 45 && r.phi > 5 && r.lith !== "泥岩") { color = "#16a34a"; label = "气层"; }
                  else if (r.sw < 60 && r.phi > 4 && r.lith !== "泥岩") { color = "#84cc16"; label = "差气层"; }
                  else if (r.lith !== "泥岩" && r.lith !== "膏盐岩") { color = "#cbd5e1"; label = "干层"; }
                  if (!label) return null;
                  return (
                    <g key={i}>
                      <rect x={ix + 1} y={yFor(i)} width={38} height={yFor(i + 1) - yFor(i) + 1} fill={color} />
                      {yFor(i + 1) - yFor(i) > 10 && (
                        <text x={ix + 20} y={(yFor(i) + yFor(i + 1)) / 2 + 3} fontSize="7" fill="#fff" textAnchor="middle" fontWeight="700">{label}</text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </svg>
      </div>
      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: "#16a34a" }} />气层</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: "#84cc16" }} />差气层</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: "#cbd5e1" }} />干层</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: "#5eead4" }} />白云岩</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: "#fcd34d" }} />砂屑岩</span>
      </div>
    </div>
  );
}

/* ============================================================
   ResultTable — 储层参数表
   ============================================================ */
export function ResultTable({ className = "" }: { className?: string }) {
  const rows = [
    { well: "MX12", top: 4280, base: 4295, thick: 15, phi: 6.8, k: 3.2, sw: 38, lith: "白云岩", interp: "气层", conf: 0.92 },
    { well: "MX12", top: 4310, base: 4322, thick: 12, phi: 4.1, k: 0.6, sw: 58, lith: "白云岩", interp: "差气层", conf: 0.81 },
    { well: "MX12", top: 4420, base: 4438, thick: 18, phi: 7.4, k: 8.1, sw: 31, lith: "砂屑岩", interp: "气层", conf: 0.95 },
    { well: "MX9", top: 4255, base: 4270, thick: 15, phi: 5.6, k: 1.4, sw: 49, lith: "白云岩", interp: "差气层", conf: 0.78 },
    { well: "MX9", top: 4380, base: 4401, thick: 21, phi: 8.2, k: 11.3, sw: 26, lith: "白云岩", interp: "气层", conf: 0.94 },
    { well: "MX15", top: 4290, base: 4306, thick: 16, phi: 6.1, k: 2.3, sw: 44, lith: "白云岩", interp: "气层", conf: 0.88 },
    { well: "MX15", top: 4365, base: 4380, thick: 15, phi: 3.9, k: 0.4, sw: 67, lith: "灰岩", interp: "干层", conf: 0.83 },
    { well: "MX18", top: 4271, base: 4289, thick: 18, phi: 7.0, k: 4.5, sw: 35, lith: "砂屑岩", interp: "气层", conf: 0.90 },
  ];
  const confColor = (c: number) => c >= 0.9 ? "text-emerald-600" : c >= 0.85 ? "text-amber-600" : "text-orange-600";
  return (
    <div className={className}>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">井名</th>
                <th className="px-3 py-2 text-right font-semibold">顶深(m)</th>
                <th className="px-3 py-2 text-right font-semibold">底深(m)</th>
                <th className="px-3 py-2 text-right font-semibold">厚度(m)</th>
                <th className="px-3 py-2 text-right font-semibold">孔隙度(%)</th>
                <th className="px-3 py-2 text-right font-semibold">渗透率(mD)</th>
                <th className="px-3 py-2 text-right font-semibold">含水饱(%)</th>
                <th className="px-3 py-2 text-left font-semibold">岩性</th>
                <th className="px-3 py-2 text-left font-semibold">解释</th>
                <th className="px-3 py-2 text-right font-semibold">置信度</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border hover:bg-muted/40">
                  <td className="px-3 py-2 font-medium text-foreground">{r.well}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.top}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.base}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.thick}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.phi.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.k.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.sw}</td>
                  <td className="px-3 py-2">{r.lith}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${r.interp === "气层" ? "bg-emerald-100 text-emerald-700" : r.interp === "差气层" ? "bg-lime-100 text-lime-700" : "bg-slate-100 text-slate-600"}`}>
                      {r.interp}
                    </span>
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums font-medium ${confColor(r.conf)}`}>{r.conf.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ResultViewer — dispatcher based on resultType
   ============================================================ */
export function ResultViewer({ type, className }: { type: ResultType; className?: string }) {
  switch (type) {
    case "structure-map":
      return <StructureMap className={className} />;
    case "seismic-section":
      return <SeismicSection className={className} />;
    case "composite-log":
      return <CompositeLog className={className} />;
    case "data-table":
      return <ResultTable className={className} />;
    case "report":
      return <ReportView className={className} />;
    default:
      return null;
  }
}

function ReportView({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          </span>
          <div>
            <h4 className="text-sm font-semibold text-foreground">区域特征向量输出报告</h4>
            <p className="text-[11px] text-muted-foreground">MX 区块灯影组四段 · 5 口井 · 64 维特征</p>
          </div>
        </div>
        <div className="space-y-2 text-xs leading-relaxed text-foreground/90">
          <p><b>1. 储层参数统计：</b>孔隙度均值 5.6%（区间 3.2-8.7%），渗透率均值 2.8mD，含气饱和度均值 47%。MX12、MX18 井物性最优，MX15 井灰岩段物性较差。</p>
          <p><b>2. 裂缝孔洞特征：</b>共识别裂缝发育段 12 段，孔洞发育段 7 段，缝洞复合型储层 9 段。缝洞发育区与构造高部位、断裂带吻合度高。</p>
          <p><b>3. 含气性评价：</b>评价气层 14 段、差气层 8 段、干层 23 段，与试气吻合率 87%。MX12 井 4280-4295m 段评价为差气层，建议复核。</p>
          <p><b>4. 区域特征向量：</b>已输出 5 口井 64 维特征向量（岩相比例、储层厚度、物性参数、含气性指标），反馈至地质认识智能体用于区域沉积模式构建。</p>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div className="rounded-md bg-primary/5 p-2"><div className="text-[10px] text-muted-foreground">气层厚度</div><div className="text-sm font-bold text-primary">186 m</div></div>
          <div className="rounded-md bg-emerald-500/5 p-2"><div className="text-[10px] text-muted-foreground">吻合率</div><div className="text-sm font-bold text-emerald-600">87%</div></div>
          <div className="rounded-md bg-amber-500/5 p-2"><div className="text-[10px] text-muted-foreground">置信度均值</div><div className="text-sm font-bold text-amber-600">0.91</div></div>
        </div>
      </div>
    </div>
  );
}
