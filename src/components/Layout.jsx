import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cg, useApi } from "../lib/api";
import { useSettings } from "../lib/settings";

function useDebounced(value, delay) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function Search() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const debounced = useDebounced(query.trim(), 350);
  const navigate = useNavigate();
  const location = useLocation();
  const boxRef = useRef(null);
  const { data, loading } = useApi(debounced.length >= 2 ? cg("/search", { query: debounced }) : null, {
    ttl: 10 * 60_000,
  });
  const results = (data?.coins || []).slice(0, 8);

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [location.pathname]);

  useEffect(() => setActive(0), [debounced]);

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const onKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      navigate(`/coin/${results[active].id}`);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && debounced.length >= 2;

  return (
    <div className="search" ref={boxRef}>
      <input
        type="search"
        placeholder="코인 검색 (예: 비트코인, BTC)"
        aria-label="코인 검색"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className="search-results" role="listbox">
          {loading && !results.length && <li className="muted">검색 중…</li>}
          {!loading && !results.length && <li className="muted">검색 결과가 없어요</li>}
          {results.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === active}>
              <Link to={`/coin/${c.id}`} className={i === active ? "active" : ""} onMouseEnter={() => setActive(i)}>
                <img src={c.thumb} alt="" width="20" height="20" />
                <span>{c.name}</span>
                <span className="muted">{c.symbol}</span>
                {c.market_cap_rank && <span className="rank-badge">#{c.market_cap_rank}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Layout() {
  const { currency, setCurrency, toggleTheme } = useSettings();
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <span className="logo-mark">◎</span> Coin Web
          </Link>
          <nav className="nav">
            <NavLink to="/" end>
              시세
            </NavLink>
            <NavLink to="/exchanges">거래소</NavLink>
            <NavLink to="/guide">가이드</NavLink>
          </nav>
          <Search />
          <div className="header-tools">
            <div className="segmented" role="group" aria-label="표시 통화">
              {["krw", "usd"].map((c) => (
                <button key={c} type="button" aria-pressed={currency === c} onClick={() => setCurrency(c)}>
                  {c.toUpperCase()}
                </button>
              ))}
            </div>
            <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="다크/라이트 모드 전환" title="테마 전환">
              ◐
            </button>
          </div>
        </div>
      </header>
      <main className="container main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">
          <p>
            시세 데이터 제공:{" "}
            <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer">
              CoinGecko
            </a>{" "}
            · 공포·탐욕 지수:{" "}
            <a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noopener noreferrer">
              Alternative.me
            </a>
          </p>
          <p className="muted">
            이 사이트의 정보는 참고용이며 투자 권유가 아닙니다. 시세는 거래소마다 다를 수 있고 지연될 수 있습니다.
          </p>
        </div>
      </footer>
    </>
  );
}
