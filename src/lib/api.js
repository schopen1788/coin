import { useEffect, useRef, useState } from "react";

const CG_BASE = "https://api.coingecko.com/api/v3";
// Optional free "demo" key from coingecko.com raises the rate limit.
const CG_KEY = import.meta.env.VITE_COINGECKO_API_KEY;

export function cg(path, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, v);
  });
  if (CG_KEY) qs.set("x_cg_demo_api_key", CG_KEY);
  const query = qs.toString();
  return `${CG_BASE}${path}${query ? `?${query}` : ""}`;
}

const cache = new Map();

async function fetchJson(url, { ttl, force, signal }) {
  const hit = cache.get(url);
  if (hit && !force && Date.now() - hit.time < ttl) return hit.data;

  let res;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    // CoinGecko drops CORS headers on 429, so a rate limit shows up as a network error.
    if (hit) return hit.data;
    throw new Error("데이터를 불러오지 못했어요. 요청 한도를 초과했을 수 있으니 잠시 후 다시 시도해주세요.");
  }
  if (!res.ok) {
    if (hit) return hit.data;
    if (res.status === 429) throw new Error("요청이 너무 많아요. 1분 정도 후에 다시 시도해주세요.");
    if (res.status === 404) throw new Error("찾을 수 없는 데이터예요.");
    throw new Error(`데이터를 불러오지 못했어요. (HTTP ${res.status})`);
  }
  const data = await res.json();
  cache.set(url, { time: Date.now(), data });
  return data;
}

/**
 * Fetches JSON with a short-lived in-memory cache.
 * Pass `null` as url to skip. `refresh` (ms) re-fetches on an interval.
 */
export function useApi(url, { ttl = 60_000, refresh } = {}) {
  const [state, setState] = useState({ url: null, data: null, error: null, loading: !!url });
  const [tick, setTick] = useState(0);
  const lastTick = useRef(0);

  useEffect(() => {
    if (!url) return undefined;
    const ctrl = new AbortController();
    const force = tick !== lastTick.current;
    lastTick.current = tick;
    setState((s) => ({ url, data: s.url === url ? s.data : null, error: null, loading: true }));
    fetchJson(url, { ttl, force, signal: ctrl.signal })
      .then((data) => setState({ url, data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== "AbortError") setState((s) => ({ ...s, error, loading: false }));
      });
    return () => ctrl.abort();
  }, [url, tick, ttl]);

  useEffect(() => {
    if (!refresh) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1);
    }, refresh);
    return () => clearInterval(id);
  }, [refresh]);

  const fresh = state.url === url;
  return {
    data: fresh ? state.data : null,
    error: fresh ? state.error : null,
    loading: fresh ? state.loading : !!url,
    reload: () => setTick((t) => t + 1),
  };
}
