import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cg, useApi } from "../lib/api";
import { compact, date, number, percent, price, stripHtml } from "../lib/format";
import { useSettings } from "../lib/settings";
import { Change, ErrorBox, Loading, Star } from "../components/Common";
import PriceChart from "../components/PriceChart";

const KOREAN_EXCHANGES = ["upbit", "bithumb", "coinone", "korbit", "gopax"];
const TRUST = { green: "높음", yellow: "보통", red: "낮음" };

function shortSymbol(value, fallback) {
  // DEX tickers report contract addresses instead of symbols
  if (!value) return fallback;
  return value.length > 12 ? fallback : value;
}

function Stat({ label, children, hint }) {
  return (
    <div className="kv">
      <dt>
        {label}
        {hint && (
          <Link to={`/guide#${hint}`} className="help" title="용어 설명">
            ?
          </Link>
        )}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function Converter({ symbol, rate, currency }) {
  const [coin, setCoin] = useState("1");
  const [fiat, setFiat] = useState(() => String(+(rate || 0).toFixed(2)));
  const [last, setLast] = useState("coin");

  // keep the side the user typed in fixed when the price updates
  const coinVal = last === "coin" ? coin : rate ? String(+(Number(fiat) / rate).toPrecision(8)) : "";
  const fiatVal = last === "fiat" ? fiat : rate ? String(+(Number(coin) * rate).toFixed(currency === "krw" ? 0 : 2)) : "";

  return (
    <section className="card">
      <h2 className="card-title">계산기</h2>
      <div className="converter">
        <label>
          <span>{symbol.toUpperCase()}</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={coinVal}
            onChange={(e) => {
              setCoin(e.target.value);
              setLast("coin");
            }}
          />
        </label>
        <span className="converter-eq" aria-hidden="true">
          ⇄
        </span>
        <label>
          <span>{currency.toUpperCase()}</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={fiatVal}
            onChange={(e) => {
              setFiat(e.target.value);
              setLast("fiat");
            }}
          />
        </label>
      </div>
    </section>
  );
}

function Links({ links, name }) {
  if (!links) return null;
  const clean = (arr) => (arr || []).filter(Boolean);
  const groups = [
    ["공식 웹사이트", clean(links.homepage)],
    ["백서", clean([links.whitepaper])],
    ["블록 탐색기", clean(links.blockchain_site).slice(0, 4)],
    ["포럼", clean(links.official_forum_url)],
    [
      "커뮤니티",
      clean([
        links.twitter_screen_name && `https://x.com/${links.twitter_screen_name}`,
        links.subreddit_url && links.subreddit_url !== "https://www.reddit.com" ? links.subreddit_url : null,
        links.telegram_channel_identifier && `https://t.me/${links.telegram_channel_identifier}`,
      ]),
    ],
    ["소스 코드", clean(links.repos_url?.github).slice(0, 2)],
  ].filter(([, list]) => list.length);

  if (!groups.length) return null;
  return (
    <section className="card">
      <h2 className="card-title">{name} 관련 링크</h2>
      <dl className="link-groups">
        {groups.map(([label, list]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {list.map((url) => {
                let host = url;
                try {
                  host = new URL(url).hostname.replace(/^www\./, "");
                } catch {
                  // not a valid URL; show as-is
                }
                return (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="link-pill">
                    {host} ↗
                  </a>
                );
              })}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function About({ coin }) {
  const [expanded, setExpanded] = useState(false);
  const ko = stripHtml(coin.description?.ko).trim();
  const en = stripHtml(coin.description?.en).trim();
  const text = ko || en;
  const paragraphs = text.split(/\r?\n+/).filter((p) => p.trim());
  const long = text.length > 600;
  const name = coin.localization?.ko || coin.name;

  return (
    <section className="card">
      <h2 className="card-title">{name}(이)란?</h2>
      <div className="facts">
        {coin.categories?.filter(Boolean).slice(0, 6).map((c) => (
          <span key={c} className="tag">
            {c}
          </span>
        ))}
      </div>
      <dl className="kv-grid compact-grid">
        {coin.genesis_date && <Stat label="출시일">{date(coin.genesis_date)}</Stat>}
        {coin.hashing_algorithm && <Stat label="해시 알고리즘">{coin.hashing_algorithm}</Stat>}
        {coin.sentiment_votes_up_percentage !== null && coin.sentiment_votes_up_percentage !== undefined && (
          <Stat label="커뮤니티 심리">
            <span className="change up">👍 {number(coin.sentiment_votes_up_percentage, 0)}%</span>{" "}
            <span className="change down">👎 {number(coin.sentiment_votes_down_percentage, 0)}%</span>
          </Stat>
        )}
      </dl>
      {text ? (
        <>
          {!ko && <p className="notice">한국어 설명이 없어 영어 원문을 보여드려요.</p>}
          <div className={`description ${long && !expanded ? "clamped" : ""}`}>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {long && (
            <button type="button" className="btn ghost" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "접기" : "더 보기"}
            </button>
          )}
        </>
      ) : (
        <p className="muted">등록된 설명이 없어요.</p>
      )}
    </section>
  );
}

function Markets({ id, coin, currency }) {
  const [target, setTarget] = useState("ALL");
  const { data, error, loading, reload } = useApi(
    cg(`/coins/${id}/tickers`, { include_exchange_logo: true, order: "volume_desc", depth: false }),
    { ttl: 2 * 60_000 }
  );
  const md = coin.market_data;
  const usdToCur = md.current_price[currency] / md.current_price.usd || 1;
  const symbol = coin.symbol.toUpperCase();

  const tickers = useMemo(
    () => (data?.tickers || []).filter((t) => !t.is_anomaly && !t.is_stale && t.converted_last?.usd),
    [data]
  );

  const korean = useMemo(() => {
    const seen = new Set();
    return tickers
      .filter((t) => KOREAN_EXCHANGES.includes(t.market.identifier) && t.target === "KRW")
      .filter((t) => (seen.has(t.market.identifier) ? false : seen.add(t.market.identifier)));
  }, [tickers]);

  const targets = useMemo(() => {
    const counts = {};
    tickers.forEach((t) => {
      const tg = shortSymbol(t.target, "기타");
      counts[tg] = (counts[tg] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);
  }, [tickers]);

  const list = target === "ALL" ? tickers : tickers.filter((t) => shortSymbol(t.target, "기타") === target);

  return (
    <section className="card" id="markets">
      <h2 className="card-title">{symbol} 거래소 바로가기</h2>

      {korean.length > 0 && (
        <div className="kr-exchanges">
          <h3 className="sub-title">🇰🇷 국내 거래소 (원화 마켓)</h3>
          <div className="kr-grid">
            {korean.map((t) => {
              const premium = (t.converted_last.usd / md.current_price.usd - 1) * 100;
              return (
                <a
                  key={t.market.identifier}
                  className="kr-card"
                  href={t.trade_url || `https://www.coingecko.com/ko/exchanges/${t.market.identifier}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="kr-name">
                    {t.market.logo && <img src={t.market.logo} alt="" width="20" height="20" />}
                    {t.market.name}
                  </span>
                  <strong>₩{number(t.last, t.last < 100 ? 2 : 0)}</strong>
                  <span className="muted small">
                    김치 프리미엄{" "}
                    <span className={`change ${premium >= 0 ? "up" : "down"}`}>{percent(premium)}</span>
                  </span>
                  <span className="kr-go">거래하러 가기 →</span>
                </a>
              );
            })}
          </div>
          <p className="muted small">
            김치 프리미엄 = 국내 거래소 가격이 해외 평균 가격보다 얼마나 비싼지.{" "}
            <Link to="/guide#kimchi">자세히</Link>
          </p>
        </div>
      )}

      <div className="table-toolbar">
        <h3 className="sub-title">전 세계 마켓 ({tickers.length})</h3>
        {targets.length > 1 && (
          <div className="segmented" role="group" aria-label="거래 통화 필터">
            {["ALL", ...targets].map((tg) => (
              <button key={tg} type="button" aria-pressed={target === tg} onClick={() => setTarget(tg)}>
                {tg === "ALL" ? "전체" : tg}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && !data && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <Loading label="거래소 정보를 불러오는 중…" />}
      {data && !list.length && <p className="empty muted">표시할 거래소가 없어요.</p>}
      {list.length > 0 && (
        <div className="table-wrap">
          <table className="coin-table markets-table">
            <thead>
              <tr>
                <th>거래소</th>
                <th>페어</th>
                <th className="num">가격</th>
                <th className="num hide-sm">24h 거래량</th>
                <th className="hide-sm">
                  신뢰도{" "}
                  <Link to="/guide#trust" className="help" title="신뢰도란?">
                    ?
                  </Link>
                </th>
                <th aria-label="링크" />
              </tr>
            </thead>
            <tbody>
              {list.slice(0, 60).map((t, i) => (
                <tr key={`${t.market.identifier}-${t.base}-${t.target}-${i}`}>
                  <td>
                    <span className="exchange-name">
                      {t.market.logo && <img src={t.market.logo} alt="" width="20" height="20" loading="lazy" />}
                      {t.market.name}
                    </span>
                  </td>
                  <td className="muted">
                    {shortSymbol(t.base, symbol)}/{shortSymbol(t.target, "?")}
                  </td>
                  <td className="num">{price(t.converted_last.usd * usdToCur, currency)}</td>
                  <td className="num hide-sm">{compact(t.converted_volume.usd * usdToCur, currency)}</td>
                  <td className="hide-sm">
                    <span className={`trust ${t.trust_score || "none"}`}>{TRUST[t.trust_score] || "정보 없음"}</span>
                  </td>
                  <td className="num">
                    {t.trade_url ? (
                      <a className="btn small" href={t.trade_url} target="_blank" rel="noopener noreferrer">
                        거래 ↗
                      </a>
                    ) : (
                      <a
                        className="btn small ghost"
                        href={`https://www.coingecko.com/ko/exchanges/${t.market.identifier}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        정보 ↗
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small">
        거래소 이용 전 해당 거래소의 신뢰도와 본인 국가에서의 이용 가능 여부를 꼭 확인하세요. 링크가 정확한 공식 도메인인지도
        확인하세요.
      </p>
    </section>
  );
}

export default function Coin() {
  const { id } = useParams();
  const { currency } = useSettings();
  const { data: coin, error, loading, reload } = useApi(
    cg(`/coins/${id}`, {
      localization: true,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
    }),
    { ttl: 60_000, refresh: 90_000 }
  );

  if (error && !coin) return <ErrorBox error={error} onRetry={reload} />;
  if (loading && !coin) return <Loading label="코인 정보를 불러오는 중…" />;
  if (!coin) return null;

  const md = coin.market_data;
  const name = coin.localization?.ko || coin.name;
  const cur = (obj) => obj?.[currency];
  const rangePos =
    cur(md.high_24h) > cur(md.low_24h)
      ? ((cur(md.current_price) - cur(md.low_24h)) / (cur(md.high_24h) - cur(md.low_24h))) * 100
      : 50;

  return (
    <div className="coin-page">
      <nav className="breadcrumb">
        <Link to="/">시세</Link> › <span>{name}</span>
      </nav>

      <section className="coin-head">
        <div className="coin-title">
          <img src={coin.image?.large} alt="" width="48" height="48" />
          <div>
            <h1>
              {name} <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
            </h1>
            <div className="badges">
              {coin.market_cap_rank && <span className="rank-badge">시총 #{coin.market_cap_rank}</span>}
              {name !== coin.name && <span className="muted small">{coin.name}</span>}
            </div>
          </div>
          <Star id={coin.id} name={name} />
        </div>
        <div className="coin-price">
          <strong>{price(cur(md.current_price), currency)}</strong>
          <Change value={cur(md.price_change_percentage_24h_in_currency)} />
          <div className="range" aria-label="24시간 가격 범위">
            <span className="muted small">{price(cur(md.low_24h), currency)}</span>
            <span className="range-bar">
              <span style={{ left: `${Math.min(100, Math.max(0, rangePos))}%` }} />
            </span>
            <span className="muted small">{price(cur(md.high_24h), currency)}</span>
          </div>
          <span className="muted small">24시간 최저 / 최고</span>
        </div>
        <a href="#markets" className="btn primary">
          거래소 보기 ↓
        </a>
      </section>

      <div className="coin-grid">
        <div className="coin-main">
          <PriceChart id={coin.id} currency={currency} />

          <section className="card">
            <h2 className="card-title">기간별 수익률</h2>
            <div className="returns">
              {[
                ["24시간", md.price_change_percentage_24h_in_currency],
                ["7일", md.price_change_percentage_7d_in_currency],
                ["30일", md.price_change_percentage_30d_in_currency],
                ["1년", md.price_change_percentage_1y_in_currency],
              ].map(([label, obj]) => (
                <div key={label}>
                  <span className="muted small">{label}</span>
                  <Change value={cur(obj)} />
                </div>
              ))}
            </div>
          </section>

          <About coin={coin} />
          <Markets id={coin.id} coin={coin} currency={currency} />
        </div>

        <aside className="coin-side">
          <section className="card">
            <h2 className="card-title">시장 정보</h2>
            <dl className="kv-grid">
              <Stat label="시가총액" hint="market-cap">
                {compact(cur(md.market_cap), currency)}
              </Stat>
              <Stat label="완전희석가치(FDV)" hint="fdv">
                {compact(cur(md.fully_diluted_valuation), currency)}
              </Stat>
              <Stat label="24시간 거래량" hint="volume">
                {compact(cur(md.total_volume), currency)}
              </Stat>
              <Stat label="유통량" hint="supply">
                {compact(md.circulating_supply)} {coin.symbol.toUpperCase()}
              </Stat>
              <Stat label="총 공급량">{md.total_supply ? compact(md.total_supply) : "-"}</Stat>
              <Stat label="최대 공급량">{md.max_supply ? compact(md.max_supply) : "무제한"}</Stat>
              <Stat label="역대 최고가(ATH)" hint="ath">
                {price(cur(md.ath), currency)}
                <small className="muted">
                  {date(cur(md.ath_date))} · <Change value={cur(md.ath_change_percentage)} digits={1} />
                </small>
              </Stat>
              <Stat label="역대 최저가(ATL)" hint="ath">
                {price(cur(md.atl), currency)}
                <small className="muted">
                  {date(cur(md.atl_date))} · <Change value={cur(md.atl_change_percentage)} digits={1} />
                </small>
              </Stat>
            </dl>
            {md.max_supply > 0 && md.circulating_supply > 0 && (
              <div className="supply">
                <div className="supply-bar">
                  <span style={{ width: `${Math.min(100, (md.circulating_supply / md.max_supply) * 100)}%` }} />
                </div>
                <span className="muted small">
                  최대 공급량 대비 {number((md.circulating_supply / md.max_supply) * 100, 1)}% 유통 중
                </span>
              </div>
            )}
          </section>

          <Converter key={`${coin.id}-${currency}`} symbol={coin.symbol} rate={cur(md.current_price)} currency={currency} />
          <Links links={coin.links} name={name} />
        </aside>
      </div>
      <p className="muted small">마지막 업데이트: {date(md.last_updated || coin.last_updated, true)}</p>
    </div>
  );
}
