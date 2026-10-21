import { useMemo, useState } from "react";
import { cg, useApi } from "../lib/api";
import { date, percent, price } from "../lib/format";
import { ErrorBox, Loading } from "./Common";

const RANGES = [
  { label: "1일", days: 1 },
  { label: "7일", days: 7 },
  { label: "30일", days: 30 },
  { label: "90일", days: 90 },
  { label: "1년", days: 365 },
];

const W = 800;
const H = 280;

export default function PriceChart({ id, currency }) {
  const [days, setDays] = useState(7);
  const [hover, setHover] = useState(null);
  const { data, error, loading, reload } = useApi(
    cg(`/coins/${id}/market_chart`, { vs_currency: currency, days }),
    { ttl: 5 * 60_000 }
  );

  const chart = useMemo(() => {
    const prices = data?.prices;
    if (!prices || prices.length < 2) return null;
    const values = prices.map((p) => p[1]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.08 || max * 0.01 || 1;
    const lo = min - pad;
    const hi = max + pad;
    const t0 = prices[0][0];
    const t1 = prices[prices.length - 1][0];
    const x = (t) => ((t - t0) / (t1 - t0 || 1)) * W;
    const y = (v) => H - ((v - lo) / (hi - lo)) * H;
    const line = prices.map(([t, v], i) => `${i ? "L" : "M"}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join("");
    const first = values[0];
    const last = values[values.length - 1];
    return {
      prices,
      line,
      area: `${line}L${W},${H}L0,${H}Z`,
      min,
      max,
      x,
      y,
      change: ((last - first) / first) * 100,
      up: last >= first,
    };
  }, [data]);

  const onMove = (e) => {
    if (!chart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(ratio * (chart.prices.length - 1));
    setHover(idx);
  };

  const point = chart && hover !== null ? chart.prices[hover] : null;

  return (
    <section className="card chart-card">
      <div className="chart-head">
        <div>
          <h2 className="card-title">가격 차트</h2>
          {chart && (
            <p className="muted small">
              기간 변동 <span className={`change ${chart.up ? "up" : "down"}`}>{percent(chart.change)}</span> · 최고{" "}
              {price(chart.max, currency)} · 최저 {price(chart.min, currency)}
            </p>
          )}
        </div>
        <div className="segmented" role="group" aria-label="차트 기간">
          {RANGES.map((r) => (
            <button key={r.days} type="button" aria-pressed={days === r.days} onClick={() => setDays(r.days)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-body">
        {error && !chart && <ErrorBox error={error} onRetry={reload} />}
        {loading && !chart && <Loading />}
        {chart && (
          <div className="chart-plot" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={chart.up ? "up" : "down"} role="img" aria-label="가격 차트">
              <defs>
                <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={chart.area} fill="url(#chartFill)" />
              <path d={chart.line} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              {point && (
                <line
                  x1={chart.x(point[0])}
                  x2={chart.x(point[0])}
                  y1="0"
                  y2={H}
                  className="crosshair"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
            {point && (
              <>
                <span
                  className="chart-dot"
                  style={{ left: `${(chart.x(point[0]) / W) * 100}%`, top: `${(chart.y(point[1]) / H) * 100}%` }}
                />
                <div
                  className="chart-tip"
                  style={{
                    left: `${(chart.x(point[0]) / W) * 100}%`,
                    transform: `translateX(${chart.x(point[0]) > W / 2 ? "-105%" : "5%"})`,
                  }}
                >
                  <strong>{price(point[1], currency)}</strong>
                  <span>{date(point[0], true)}</span>
                </div>
              </>
            )}
            <div className="chart-axis">
              <span>{date(chart.prices[0][0], days <= 1)}</span>
              <span>{date(chart.prices[chart.prices.length - 1][0], days <= 1)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
