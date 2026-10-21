import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const TERMS = [
  {
    id: "market-cap",
    term: "시가총액 (Market Cap)",
    body: "현재 가격 × 유통량. 코인의 전체 규모를 나타내며, 시세 목록은 기본적으로 시가총액 순으로 정렬됩니다. 가격이 싸다고 '저평가'된 것이 아니라, 유통량까지 함께 봐야 실제 규모를 알 수 있어요.",
  },
  {
    id: "volume",
    term: "거래량 (24h Volume)",
    body: "최근 24시간 동안 모든 거래소에서 거래된 금액의 합계. 거래량이 적은 코인은 원하는 가격에 사고팔기 어렵고, 소수의 거래로도 가격이 크게 움직일 수 있어요.",
  },
  {
    id: "supply",
    term: "유통량 · 총 공급량 · 최대 공급량",
    body: "유통량은 현재 시장에서 거래 가능한 수량, 총 공급량은 이미 발행된 전체 수량(잠긴 물량 포함), 최대 공급량은 앞으로 발행될 수 있는 상한입니다. 비트코인은 최대 2,100만 개로 정해져 있고, 이더리움처럼 상한이 없는 코인도 있어요.",
  },
  {
    id: "fdv",
    term: "완전희석가치 (FDV)",
    body: "현재 가격 × 최대(또는 총) 공급량. 모든 물량이 풀렸을 때의 시가총액입니다. 시가총액보다 FDV가 훨씬 크다면 앞으로 풀릴 물량(언락)이 많다는 뜻이라 매도 압력이 생길 수 있어요.",
  },
  {
    id: "ath",
    term: "ATH / ATL",
    body: "All-Time High(역대 최고가) / All-Time Low(역대 최저가). 현재 가격이 ATH 대비 얼마나 떨어져 있는지 보면 과거 고점과 비교한 위치를 알 수 있어요.",
  },
  {
    id: "dominance",
    term: "도미넌스",
    body: "전체 암호화폐 시가총액 중 특정 코인(주로 비트코인)이 차지하는 비중. 비트코인 도미넌스가 오르면 자금이 비트코인으로, 내리면 알트코인으로 이동하는 경향으로 해석하기도 합니다.",
  },
  {
    id: "kimchi",
    term: "김치 프리미엄",
    body: "국내 거래소의 코인 가격이 해외 거래소 평균보다 비싼 정도. 국내외 자금 이동이 자유롭지 않아 발생하며, 프리미엄이 높을 때 매수하면 프리미엄이 사라지면서 손실을 볼 수 있어요. 코인 상세 페이지의 '국내 거래소'에서 확인할 수 있습니다.",
  },
  {
    id: "fear-greed",
    term: "공포·탐욕 지수",
    body: "변동성, 거래량, SNS 반응, 검색 트렌드 등을 종합해 시장 심리를 0(극도의 공포)~100(극도의 탐욕)으로 나타낸 지수(Alternative.me 제공). '남들이 탐욕스러울 때 두려워하라'는 역발상 지표로 참고하는 경우가 많아요.",
  },
  {
    id: "trust",
    term: "거래소 신뢰도 점수",
    body: "CoinGecko가 거래소의 유동성, 보안, 거래량의 진위, API 품질 등을 평가한 점수(1~10). 거래소 마켓 목록의 '높음/보통/낮음'은 해당 거래쌍의 유동성 기반 신뢰도입니다. 낮은 곳은 가격이 왜곡됐거나 거래량이 부풀려졌을 수 있어요.",
  },
  {
    id: "stablecoin",
    term: "스테이블코인",
    body: "USDT, USDC처럼 달러 등 법정화폐 가치에 1:1로 연동되도록 설계된 코인. 해외 거래소에서는 주로 스테이블코인으로 다른 코인을 사고팝니다(예: BTC/USDT).",
  },
  {
    id: "altcoin",
    term: "알트코인",
    body: "비트코인을 제외한 모든 암호화폐를 부르는 말. 일반적으로 비트코인보다 변동성이 크고 위험도 높아요.",
  },
  {
    id: "pair",
    term: "거래쌍 (페어)",
    body: "BTC/KRW는 '원화로 비트코인을 사고판다'는 뜻. 앞이 거래 대상(base), 뒤가 결제 통화(quote)입니다.",
  },
];

const STEPS = [
  ["거래소 선택", "국내에서는 원화 입출금이 가능한 거래소(업비트, 빗썸, 코인원, 코빗 등)를 이용합니다. 거래소 페이지에서 신뢰도를 비교해보세요."],
  ["회원가입 · 본인인증", "신분증 인증(KYC)과 거래소 제휴 은행 실명계좌 연결이 필요합니다."],
  ["보안 설정", "가입 즉시 2단계 인증(OTP)을 켜고, 다른 사이트와 다른 비밀번호를 사용하세요."],
  ["원화 입금 후 매수", "지정가(원하는 가격) 또는 시장가(현재 가격)로 주문합니다. 처음에는 잃어도 괜찮은 소액으로 시작하세요."],
  ["보관", "장기 보관이라면 개인 지갑(하드웨어 지갑 등)도 고려하세요. 시드 구문(복구 단어)은 절대 누구에게도 알려주면 안 됩니다."],
];

const SAFETY = [
  "‘원금 보장’, ‘무조건 수익’, ‘리딩방’, ‘상장 예정 코인 사전 판매’는 대부분 사기입니다.",
  "거래소·지갑 사이트는 주소창의 공식 도메인을 확인하세요. 검색 광고 링크로 위장한 피싱 사이트가 많아요.",
  "시드 구문·개인키·OTP 코드를 요구하는 사람은 운영자를 사칭한 사기꾼입니다.",
  "코인을 다른 거래소나 지갑으로 보낼 때는 네트워크(체인)와 주소를 반드시 확인하세요. 잘못 보내면 되찾기 어렵습니다.",
  "레버리지(선물) 거래는 원금 이상의 손실이 날 수 있어 초보자에게 매우 위험합니다.",
  "세금, 해외 거래소 이용 규정 등은 수시로 바뀔 수 있으니 최신 공식 안내를 확인하세요.",
];

export default function Guide() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) {
      el.scrollIntoView({ block: "start" });
      el.classList.add("flash");
      const id = setTimeout(() => el.classList.remove("flash"), 1600);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [location.hash]);

  return (
    <div className="guide">
      <section className="hero">
        <h1>코인 초보 가이드</h1>
        <p className="muted">시세 화면을 읽는 법부터 안전하게 거래하는 법까지 한 번에 정리했어요.</p>
        <nav className="chips">
          <a className="chip" href="#terms">기초 용어</a>
          <a className="chip" href="#how-to-buy">코인 사는 법</a>
          <a className="chip" href="#safety">안전 수칙</a>
          <a className="chip" href="#this-site">이 사이트 사용법</a>
        </nav>
      </section>

      <section className="card" id="terms">
        <h2 className="card-title">기초 용어</h2>
        <dl className="terms">
          {TERMS.map((t) => (
            <div key={t.id} id={t.id} className="term">
              <dt>{t.term}</dt>
              <dd>{t.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card" id="how-to-buy">
        <h2 className="card-title">코인 사는 법</h2>
        <ol className="steps">
          {STEPS.map(([title, body]) => (
            <li key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card" id="safety">
        <h2 className="card-title">⚠️ 안전 수칙</h2>
        <ul className="safety">
          {SAFETY.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="card" id="this-site">
        <h2 className="card-title">이 사이트 사용법</h2>
        <ul className="safety plain">
          <li>
            <Link to="/">시세</Link> 화면의 열 제목을 누르면 정렬, ☆를 누르면 관심 코인에 추가돼요(브라우저에 저장).
          </li>
          <li>상단의 KRW / USD 버튼으로 원화·달러 표시를 바꿀 수 있어요.</li>
          <li>코인을 누르면 차트, 설명, 시장 정보, 계산기, 거래소 바로가기 링크를 볼 수 있어요.</li>
          <li>
            한국 시장 관례에 따라 <span className="change up">상승은 빨간색</span>,{" "}
            <span className="change down">하락은 파란색</span>으로 표시합니다.
          </li>
        </ul>
      </section>
    </div>
  );
}
