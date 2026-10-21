import { useSettings } from "../lib/settings";
import { percent, trend } from "../lib/format";

export function Change({ value, digits }) {
  const dir = trend(value);
  const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "";
  return (
    <span className={`change ${dir}`}>
      {value === null || value === undefined ? "-" : `${arrow} ${percent(Math.abs(value), digits).replace("+", "")}`}
    </span>
  );
}

export function Star({ id, name }) {
  const { favorites, toggleFavorite } = useSettings();
  const on = favorites.includes(id);
  return (
    <button
      type="button"
      className={`star ${on ? "on" : ""}`}
      aria-pressed={on}
      aria-label={on ? `${name} 관심 코인 해제` : `${name} 관심 코인 추가`}
      title={on ? "관심 코인 해제" : "관심 코인 추가"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(id);
      }}
    >
      {on ? "★" : "☆"}
    </button>
  );
}

export function Loading({ label = "불러오는 중…" }) {
  return (
    <div className="status" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="status error" role="alert">
      <p>{error?.message || "문제가 발생했어요."}</p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  );
}

export function Sparkline({ data, width = 120, height = 36 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(1)}`)
    .join(" ");
  const dir = data[data.length - 1] >= data[0] ? "up" : "down";
  return (
    <svg className={`sparkline ${dir}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
