import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cg, useApi } from "../lib/api";
import { compact, number } from "../lib/format";
import { ErrorBox, Loading } from "../components/Common";

const COUNTRY_KO = {
  "South Korea": "한국",
  "United States": "미국",
  Japan: "일본",
  "Hong Kong": "홍콩",
  Singapore: "싱가포르",
  "Cayman Islands": "케이맨 제도",
  Seychelles: "세이셸",
  "British Virgin Islands": "영국령 버진아일랜드",
  "United Kingdom": "영국",
  Malta: "몰타",
  Luxembourg: "룩셈부르크",
  Turkey: "튀르키예",
  Indonesia: "인도네시아",
  Thailand: "태국",
  Australia: "호주",
  Germany: "독일",
  Panama: "파나마",
  Bahamas: "바하마",
  "United Arab Emirates": "아랍에미리트",
  Mexico: "멕시코",
  Brazil: "브라질",
  India: "인도",
  Lithuania: "리투아니아",
  "Saint Vincent and the Grenadines": "세인트빈센트 그레나딘",
};

export default function Exchanges() {
  const [korea, setKorea] = useState(false);
  const { data, error, loading, reload } = useApi(cg("/exchanges", { per_page: 100, page: 1 }), { ttl: 10 * 60_000 });
  const { data: btc } = useApi(cg("/simple/price", { ids: "bitcoin", vs_currencies: "krw" }), { ttl: 5 * 60_000 });
  const btcKrw = btc?.bitcoin?.krw;

  const list = useMemo(
    () => (data || []).filter((e) => !korea || e.country === "South Korea"),
    [data, korea]
  );

  return (
    <>
      <section className="hero">
        <h1>암호화폐 거래소</h1>
        <p className="muted">
          CoinGecko 신뢰도 점수 기준 상위 거래소입니다. 이름을 누르면 거래소 공식 사이트로 이동해요.{" "}
          <Link to="/guide#trust">신뢰도 점수란?</Link>
        </p>
      </section>

      <section className="card table-card">
        <div className="table-toolbar">
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={!korea} onClick={() => setKorea(false)}>
              전체
            </button>
            <button type="button" role="tab" aria-selected={korea} onClick={() => setKorea(true)}>
              🇰🇷 국내 거래소
            </button>
          </div>
        </div>

        {error && !data && <ErrorBox error={error} onRetry={reload} />}
        {loading && !data && <Loading label="거래소 목록을 불러오는 중…" />}
        {data && (
          <div className="table-wrap">
            <table className="coin-table">
              <thead>
                <tr>
                  <th className="col-rank">#</th>
                  <th>거래소</th>
                  <th className="hide-sm">국가</th>
                  <th className="hide-sm">설립</th>
                  <th>신뢰도</th>
                  <th className="num">24h 거래량</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td className="col-rank muted">{e.trust_score_rank}</td>
                    <td>
                      <a className="exchange-name" href={e.url} target="_blank" rel="noopener noreferrer">
                        <img src={e.image} alt="" width="24" height="24" loading="lazy" />
                        <span>{e.name}</span>
                        <span className="muted">↗</span>
                      </a>
                    </td>
                    <td className="hide-sm">{COUNTRY_KO[e.country] || e.country || "-"}</td>
                    <td className="hide-sm">{e.year_established || "-"}</td>
                    <td>
                      <span className="score">
                        <span className="score-bar">
                          <span style={{ width: `${(e.trust_score || 0) * 10}%` }} />
                        </span>
                        {e.trust_score ?? "-"}/10
                      </span>
                    </td>
                    <td className="num">
                      {btcKrw ? compact(e.trade_volume_24h_btc * btcKrw, "krw") : `${number(e.trade_volume_24h_btc)} BTC`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <p className="empty muted">표시할 거래소가 없어요.</p>}
          </div>
        )}
      </section>
    </>
  );
}
