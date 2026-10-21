import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cg, useApi } from "../lib/api";
import { compact, date, number, percent, price } from "../lib/format";
import { useSettings } from "../lib/settings";
import { Change, ErrorBox, Loading, Sparkline, Star } from "../components/Common";

const PAGE_SIZE = 50;

const FNG_KO = {
  "Extreme Fear": "극도의 공포",
  Fear: "공포",
  Neutral: "중립",
  Greed: "탐욕",
  "Extreme Greed": "극도의 탐욕",
};

const COLUMNS = [
  { key: "market_cap_rank", label: "#", className: "col-rank" },
  { key: "name", label: "코인", className: "col-name" },
  { key: "current_price", label: "현재가", className: "num" },
  { key: "price_change_percentage_1h_in_currency", label: "1시간", className: "num hide-md" },
  { key: "price_change_percentage_24h_in_currency", label: "24시간", className: "num" },
  { key: "price_change_percentage_7d_in_currency", label: "7일", className: "num hide-sm" },
  { key: "total_volume", label: "거래량(24h)", className: "num hide-md" },
  { key: "market_cap", label: "시가총액", className: "num hide-sm" },
];

function GlobalStats({ currency }) {
  const { data } = useApi(cg("/global"), { ttl: 5 * 60_000 });
  const { data: fng } = useApi("https://api.alternative.me/fng/?limit=1", { ttl: 30 * 60_000 });
  const g = data?.data;
  const f = fng?.data?.[0];
  const fngValue = f ? Number(f.value) : null;

  return (
    <section className="stats-grid" aria-label="전체 시장 현황">
      <div className="card stat">
        <span className="stat-label">전체 시가총액</span>
        <strong className="stat-value">{g ? compact(g.total_market_cap[currency], currency) : "-"}</strong>
        {g && <Change value={g.market_cap_change_percentage_24h_usd} />}
      </div>
      <div className="card stat">
        <span className="stat-label">24시간 거래량</span>
        <strong className="stat-value">{g ? compact(g.total_volume[currency], currency) : "-"}</strong>
        <span className="muted small">{g ? `${number(g.active_cryptocurrencies)}개 코인 · ${number(g.markets)}개 마켓` : ""}</span>
      </div>
      <div className="card stat">
        <span className="stat-label">도미넌스</span>
        <strong className="stat-value">{g ? `BTC ${percent(g.market_cap_percentage.btc, 1).replace("+", "")}` : "-"}</strong>
        <span className="muted small">{g ? `ETH ${percent(g.market_cap_percentage.eth, 1).replace("+", "")}` : ""}</span>
      </div>
      <div className="card stat">
        <span className="stat-label">
          공포·탐욕 지수{" "}
          <Link to="/guide#fear-greed" className="help" title="공포·탐욕 지수란?">
            ?
          </Link>
        </span>
        <strong className="stat-value">
          {fngValue ?? "-"} <span className="fng-label">{f ? FNG_KO[f.value_classification] || f.value_classification : ""}</span>
        </strong>
        <div className="fng-bar" aria-hidden="true">
          {fngValue !== null && <span style={{ left: `${fngValue}%` }} />}
        </div>
      </div>
    </section>
  );
}

function Trending({ currency }) {
  const { data } = useApi(cg("/search/trending"), { ttl: 10 * 60_000 });
  const coins = data?.coins?.slice(0, 7) || [];
  if (!coins.length) return null;
  return (
    <section className="card trending">
      <h2 className="card-title">🔥 지금 많이 찾는 코인</h2>
      <div className="chips">
        {coins.map(({ item }) => (
          <Link key={item.id} to={`/coin/${item.id}`} className="chip">
            <img src={item.thumb} alt="" width="18" height="18" />
            <span>{item.symbol}</span>
            {item.data?.price_change_percentage_24h?.[currency] !== undefined && (
              <Change value={item.data.price_change_percentage_24h[currency]} digits={1} />
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function TopMovers({ coins, currency }) {
  const movers = useMemo(() => {
    const valid = coins.filter((c) => c.price_change_percentage_24h_in_currency !== null && c.market_cap_rank <= 200);
    const sorted = [...valid].sort(
      (a, b) => b.price_change_percentage_24h_in_currency - a.price_change_percentage_24h_in_currency
    );
    return { gainers: sorted.slice(0, 5), losers: sorted.slice(-5).reverse() };
  }, [coins]);

  if (!coins.length) return null;
  return (
    <section className="movers">
      {[
        ["📈 24시간 상승 TOP", movers.gainers],
        ["📉 24시간 하락 TOP", movers.losers],
      ].map(([title, list]) => (
        <div className="card" key={title}>
          <h2 className="card-title">{title}</h2>
          <ul className="mover-list">
            {list.map((c) => (
              <li key={c.id}>
                <Link to={`/coin/${c.id}`}>
                  <img src={c.image} alt="" width="22" height="22" />
                  <span className="mover-name">{c.name}</span>
                  <span className="muted num">{price(c.current_price, currency)}</span>
                  <Change value={c.price_change_percentage_24h_in_currency} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default function Home() {
  const { currency, favorites } = useSettings();
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState({ key: "market_cap_rank", dir: "asc" });
  const [page, setPage] = useState(0);

  const { data, error, loading, reload } = useApi(
    cg("/coins/markets", {
      vs_currency: currency,
      order: "market_cap_desc",
      per_page: 250,
      page: 1,
      sparkline: true,
      price_change_percentage: "1h,24h,7d",
    }),
    { ttl: 50_000, refresh: 60_000 }
  );
  const coins = data || [];

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    let list = tab === "fav" ? coins.filter((c) => favorites.includes(c.id)) : coins;
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    const { key, dir } = sort;
    const mul = dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "string") return av.localeCompare(bv) * mul;
      return (av - bv) * mul;
    });
  }, [coins, favorites, tab, filter, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const onSort = (key) => {
    setPage(0);
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "market_cap_rank" || key === "name" ? "asc" : "desc" }
    );
  };

  return (
    <>
      <section className="hero">
        <h1>오늘의 암호화폐 시세</h1>
        <p className="muted">
          시가총액 상위 250개 코인의 실시간 시세 · 1분마다 자동 갱신
          {data && ` · 마지막 업데이트 ${date(Date.now(), true)}`}
        </p>
      </section>

      <GlobalStats currency={currency} />
      <Trending currency={currency} />
      <TopMovers coins={coins} currency={currency} />

      <section className="card table-card">
        <div className="table-toolbar">
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "all"} onClick={() => { setTab("all"); setPage(0); }}>
              전체
            </button>
            <button type="button" role="tab" aria-selected={tab === "fav"} onClick={() => { setTab("fav"); setPage(0); }}>
              ★ 관심 코인 {favorites.length > 0 && <span className="count">{favorites.length}</span>}
            </button>
          </div>
          <input
            type="search"
            className="filter"
            placeholder="목록에서 찾기"
            aria-label="목록에서 코인 찾기"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          />
        </div>

        {error && !coins.length && <ErrorBox error={error} onRetry={reload} />}
        {loading && !coins.length && <Loading label="시세를 불러오는 중…" />}

        {coins.length > 0 && (
          <div className="table-wrap">
            <table className="coin-table">
              <thead>
                <tr>
                  <th className="col-star" aria-label="관심" />
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={col.className}
                      aria-sort={sort.key === col.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <button type="button" onClick={() => onSort(col.key)}>
                        {col.label}
                        <span className="sort-ind">{sort.key === col.key ? (sort.dir === "asc" ? "↑" : "↓") : ""}</span>
                      </button>
                    </th>
                  ))}
                  <th className="hide-md">최근 7일</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/coin/${c.id}`)}>
                    <td className="col-star">
                      <Star id={c.id} name={c.name} />
                    </td>
                    <td className="col-rank muted">{c.market_cap_rank ?? "-"}</td>
                    <td className="col-name">
                      <Link to={`/coin/${c.id}`} onClick={(e) => e.stopPropagation()}>
                        <img src={c.image} alt="" width="24" height="24" loading="lazy" />
                        <span className="coin-name">{c.name}</span>
                        <span className="coin-symbol">{c.symbol.toUpperCase()}</span>
                      </Link>
                    </td>
                    <td className="num strong">{price(c.current_price, currency)}</td>
                    <td className="num hide-md">
                      <Change value={c.price_change_percentage_1h_in_currency} />
                    </td>
                    <td className="num">
                      <Change value={c.price_change_percentage_24h_in_currency} />
                    </td>
                    <td className="num hide-sm">
                      <Change value={c.price_change_percentage_7d_in_currency} />
                    </td>
                    <td className="num hide-md">{compact(c.total_volume, currency)}</td>
                    <td className="num hide-sm">{compact(c.market_cap, currency)}</td>
                    <td className="hide-md">
                      <Sparkline data={c.sparkline_in_7d?.price} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && (
              <p className="empty muted">
                {tab === "fav" && !favorites.length
                  ? "☆ 버튼을 눌러 관심 코인을 추가해보세요."
                  : "조건에 맞는 코인이 없어요."}
              </p>
            )}
          </div>
        )}

        {pages > 1 && (
          <nav className="pager" aria-label="페이지">
            <button type="button" className="btn" disabled={current === 0} onClick={() => setPage(current - 1)}>
              ‹ 이전
            </button>
            <span className="muted">
              {current + 1} / {pages}
            </span>
            <button type="button" className="btn" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              다음 ›
            </button>
          </nav>
        )}
      </section>
    </>
  );
}
