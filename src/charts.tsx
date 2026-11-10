import { useEffect, useRef, useState } from "react";

type Lang = "EN" | "DE";
export type LineSeries = {
  name: string;
  /** One value (0–100 %) per x label; null = not available yet (e.g. quiz not published). */
  values: (number | null)[];
  color: string;
  shape: "circle" | "square" | "triangle";
};

/**
 * Validated categorical order (dataviz validator, light surface): blue, orange, magenta.
 * Adjacent-pair CVD ΔE ≥ 19, all ≥ 3:1 contrast. Fixed per entity, never by rank.
 */
export const conceptColors = ["#2477B3", "#D9730D", "#B8327A"] as const;
const shapes = ["circle", "square", "triangle"] as const;
export const conceptShape = (index: number) => shapes[index % shapes.length];

function Marker({ shape, x, y, color }: { shape: LineSeries["shape"]; x: number; y: number; color: string }) {
  // 2px surface ring keeps markers legible where lines cross.
  const ring = { stroke: "var(--chart-surface, #fff)", strokeWidth: 2 };
  if (shape === "square") return <rect x={x - 5} y={y - 5} width={10} height={10} rx={2} fill={color} {...ring} />;
  if (shape === "triangle")
    return <path d={`M${x} ${y - 6.5} L${x + 6} ${y + 4.5} L${x - 6} ${y + 4.5} Z`} fill={color} {...ring} />;
  return <circle cx={x} cy={y} r={5} fill={color} {...ring} />;
}

function LegendShape({ shape, color }: { shape: LineSeries["shape"]; color: string }) {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">
      <line x1="1" y1="7" x2="21" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Marker shape={shape} x={11} y={7} color={color} />
    </svg>
  );
}

/** Line chart for change over time (percent scale 0–100), with legend, end labels, tooltip and table view. */
export function LineChart({
  series,
  xLabels,
  language,
  title,
  pendingNote,
  fontSize = 14,
}: {
  series: LineSeries[];
  xLabels: string[];
  language: Lang;
  title: string;
  /** Shown under x labels whose values are all null (e.g. "being checked"). */
  pendingNote?: string;
  fontSize?: number;
}) {
  const t = (en: string, de: string) => (language === "DE" ? de : en);
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const update = () => setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Drawn in real pixels so text sizes stay exact at any card width.
  const height = Math.round(fontSize * 15);
  const labelSpace = Math.min(Math.round(fontSize * 11.5), Math.round(width * 0.32));
  const pad = { top: fontSize, right: labelSpace, bottom: fontSize * 3.2, left: fontSize * 3 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const x = (i: number) => pad.left + (xLabels.length === 1 ? plotW / 2 : (plotW * i) / (xLabels.length - 1));
  const y = (v: number) => pad.top + plotH - (plotH * v) / 100;
  const pending = xLabels.map((_, i) => series.every((s) => s.values[i] === null));

  // End labels: last known value of each series, pushed apart so they never collide.
  const ends = series
    .map((s) => {
      const lastIndex = s.values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop() ?? 0;
      return { s, lastIndex, value: s.values[lastIndex] ?? 0, y: y(s.values[lastIndex] ?? 0) };
    })
    .sort((a, b) => a.y - b.y);
  const gap = fontSize * 2.4;
  ends.forEach((e, i) => {
    if (i > 0 && e.y - ends[i - 1].y < gap) e.y = ends[i - 1].y + gap;
  });
  const overflow = ends.length ? ends[ends.length - 1].y - (pad.top + plotH) : 0;
  if (overflow > 0) ends.forEach((e) => (e.y -= overflow));

  const tooltipLeft = active === null ? 0 : Math.min(Math.max(x(active) - 90, 0), width - 190);

  return (
    <figure className="line-chart" style={{ ["--chart-font" as string]: `${fontSize}px` }}>
      <div className="line-chart-legend" aria-hidden={table}>
        {series.map((s) => (
          <span key={s.name}>
            <LegendShape shape={s.shape} color={s.color} />
            {s.name}
          </span>
        ))}
        <button type="button" className="chart-table-toggle" onClick={() => setTable(!table)} aria-pressed={table}>
          {table ? t("Show as chart", "Als Diagramm zeigen") : t("Show as table", "Als Tabelle zeigen")}
        </button>
      </div>
      {table ? (
        <table className="chart-table">
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">{t("Topic", "Thema")}</th>
              {xLabels.map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.name}>
                <th scope="row">{s.name}</th>
                {s.values.map((v, i) => (
                  <td key={i}>{v === null ? (pendingNote ?? "—") : `${v}%`}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="line-chart-plot" ref={wrap} onMouseLeave={() => setActive(null)}>
          <svg width={width} height={height} role="img" aria-label={title}>
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={tick}>
                <line x1={pad.left} x2={pad.left + plotW} y1={y(tick)} y2={y(tick)} className="chart-grid" />
                <text x={pad.left - 8} y={y(tick)} dy="0.35em" textAnchor="end" className="chart-axis">
                  {tick}%
                </text>
              </g>
            ))}
            {xLabels.map((label, i) => (
              <g key={label}>
                <text x={x(i)} y={pad.top + plotH + fontSize * 1.5} textAnchor="middle" className="chart-axis">
                  {label}
                </text>
                {pending[i] && pendingNote && (
                  <text x={x(i)} y={pad.top + plotH + fontSize * 2.8} textAnchor="middle" className="chart-axis muted">
                    {pendingNote}
                  </text>
                )}
              </g>
            ))}
            {active !== null && (
              <line x1={x(active)} x2={x(active)} y1={pad.top} y2={pad.top + plotH} className="chart-crosshair" />
            )}
            {series.map((s) => {
              const points = s.values
                .map((v, i) => (v === null ? null : `${x(i)},${y(v)}`))
                .filter(Boolean)
                .join(" ");
              return (
                <g key={s.name}>
                  <polyline points={points} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                  {s.values.map((v, i) => (v === null ? null : <Marker key={i} shape={s.shape} x={x(i)} y={y(v)} color={s.color} />))}
                </g>
              );
            })}
            {ends.map((e) => (
              <text key={e.s.name} x={x(e.lastIndex) + 12} y={e.y} dy="0.35em" className="chart-end-label">
                <tspan className="chart-end-value">{e.value}%</tspan>
                <tspan x={x(e.lastIndex) + 12} dy={fontSize * 1.1} className="chart-end-name">
                  {e.s.name.length > 22 ? `${e.s.name.slice(0, 21)}…` : e.s.name}
                </tspan>
              </text>
            ))}
            {/* Hit columns: larger than the marks, also reachable by keyboard. */}
            {xLabels.map((label, i) => (
              <rect
                key={label}
                x={x(i) - Math.max(18, plotW / (xLabels.length * 2))}
                y={pad.top}
                width={Math.max(36, plotW / xLabels.length)}
                height={plotH}
                fill="transparent"
                tabIndex={pending[i] ? -1 : 0}
                aria-label={`${label}: ${series.map((s) => `${s.name} ${s.values[i] === null ? "—" : `${s.values[i]}%`}`).join(", ")}`}
                onMouseEnter={() => setActive(pending[i] ? null : i)}
                onFocus={() => setActive(pending[i] ? null : i)}
                onBlur={() => setActive(null)}
              />
            ))}
          </svg>
          {active !== null && (
            <div className="chart-tooltip" style={{ left: tooltipLeft }} role="status">
              <strong>{xLabels[active]}</strong>
              {series.map((s) => (
                <span key={s.name}>
                  <LegendShape shape={s.shape} color={s.color} />
                  {s.name}: <b>{s.values[active] === null ? "—" : `${s.values[active]}%`}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </figure>
  );
}
