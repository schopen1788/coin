const SYMBOL = { krw: "₩", usd: "$" };

function sigDigits(value) {
  const abs = Math.abs(value);
  if (abs >= 1000) return { maximumFractionDigits: 0 };
  if (abs >= 1) return { maximumFractionDigits: 2, minimumFractionDigits: 2 };
  return { maximumSignificantDigits: 4 };
}

export function price(value, currency = "krw") {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const opts = currency === "usd" && Math.abs(value) >= 1000
    ? { maximumFractionDigits: 2, minimumFractionDigits: 2 }
    : sigDigits(value);
  return `${SYMBOL[currency] || ""}${new Intl.NumberFormat("ko-KR", opts).format(value)}`;
}

export function compact(value, currency) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const locale = currency === "usd" ? "en-US" : "ko-KR";
  const formatted = new Intl.NumberFormat(locale, {
    notation: "compact",
    // ko-KR compacts by 만/억/조, so cap significant digits to avoid "2777.78만"
    ...(currency === "usd" ? { maximumFractionDigits: 2 } : { maximumSignificantDigits: 4 }),
  }).format(value);
  return `${currency ? SYMBOL[currency] : ""}${formatted}`;
}

export function number(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: digits }).format(value);
}

export function percent(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function trend(value) {
  if (!value) return "flat";
  return value > 0 ? "up" : "down";
}

export function date(value, withTime = false) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function stripHtml(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}
